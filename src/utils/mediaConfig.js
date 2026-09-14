import { API_BASE, apiClient } from '../api/client.js';

let cachedConfig = null;
let fetchPromise = null;

const DEFAULT_LOCAL_CLIPS = 'http://localhost:8080/clips';
const DEFAULT_LOCAL_RECORDINGS = 'http://localhost:8080/recordings';
const DEFAULT_LOCAL_HLS = 'http://localhost:8080/hls';
const DEFAULT_LOCAL_RTMP = 'rtmp://localhost:1935/live';

const LEGACY_DEAD_HOSTS = ['unwound-overlook-boat.ngrok-free.dev'];

function purgeLegacyStorage() {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const cfgStr = localStorage.getItem('orbit_media_config');
    if (cfgStr) {
      for (const dead of LEGACY_DEAD_HOSTS) {
        if (cfgStr.includes(dead)) {
          localStorage.removeItem('orbit_media_config');
          break;
        }
      }
    }
    for (const key of ['orbit_clips_base', 'orbit_recordings_base', 'orbit_hls_base', 'orbit_rtmp_url']) {
      const val = localStorage.getItem(key);
      if (val) {
        for (const dead of LEGACY_DEAD_HOSTS) {
          if (val.includes(dead)) {
            localStorage.removeItem(key);
            break;
          }
        }
      }
    }
  } catch (e) {}
}

// Purge legacy storage immediately on module evaluation
purgeLegacyStorage();

/**
 * Initialize / fetch the media server configuration from the backend config endpoint.
 * Always fetches from the server on startup so updates on the server are picked up immediately.
 */
export async function fetchMediaConfig(forceRefresh = false) {
  if (cachedConfig && cachedConfig._fetchedFromServer && !forceRefresh) {
    return cachedConfig;
  }
  if (fetchPromise && !forceRefresh) {
    return fetchPromise;
  }

  fetchPromise = (async () => {
    try {
      const cfg = await apiClient('/api/Stream/server/config');
      if (cfg) {
        cachedConfig = {
          _fetchedFromServer: true,
          isConfigured: !!cfg.isConfigured,
          isCustomConfigured: !!cfg.isCustomConfigured,
          rtmpUrl: cfg.effectiveRtmpUrl || cfg.rtmpUrl || DEFAULT_LOCAL_RTMP,
          hlsBaseUrl: cfg.effectiveHlsBaseUrl || cfg.hlsBaseUrl || DEFAULT_LOCAL_HLS,
          clipsBaseUrl: cfg.clipsBaseUrl || (cfg.hlsBaseUrl ? cfg.hlsBaseUrl.replace(/\/hls\/?$/, '/clips') : DEFAULT_LOCAL_CLIPS),
          recordingsBaseUrl: cfg.recordingsBaseUrl || (cfg.hlsBaseUrl ? cfg.hlsBaseUrl.replace(/\/hls\/?$/, '/recordings') : DEFAULT_LOCAL_RECORDINGS),
          message: cfg.message || ''
        };

        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('orbit_media_config', JSON.stringify(cachedConfig));
        }
        return cachedConfig;
      }
    } catch (err) {
      console.warn('[mediaConfig] Could not fetch server config, using fallback/cache:', err.message);
    } finally {
      fetchPromise = null;
    }

    // Attempt localStorage cache if valid and not legacy
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = localStorage.getItem('orbit_media_config');
        if (stored) {
          let containsLegacy = false;
          for (const dead of LEGACY_DEAD_HOSTS) {
            if (stored.includes(dead)) { containsLegacy = true; break; }
          }
          if (!containsLegacy) {
            cachedConfig = JSON.parse(stored);
            return cachedConfig;
          }
        }
      } catch (e) {}
    }

    // Default local fallback
    cachedConfig = {
      _fetchedFromServer: false,
      isConfigured: false,
      isCustomConfigured: false,
      rtmpUrl: DEFAULT_LOCAL_RTMP,
      hlsBaseUrl: DEFAULT_LOCAL_HLS,
      clipsBaseUrl: DEFAULT_LOCAL_CLIPS,
      recordingsBaseUrl: DEFAULT_LOCAL_RECORDINGS,
      message: 'Fallback local config'
    };
    return cachedConfig;
  })();

  return fetchPromise;
}

/**
 * Synchronous getter for current media configuration.
 */
export function getMediaConfig() {
  if (cachedConfig) return cachedConfig;

  // Try synchronous retrieval from localStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = localStorage.getItem('orbit_media_config');
      if (stored) {
        let containsLegacy = false;
        for (const dead of LEGACY_DEAD_HOSTS) {
          if (stored.includes(dead)) { containsLegacy = true; break; }
        }
        if (!containsLegacy) {
          cachedConfig = JSON.parse(stored);
          return cachedConfig;
        }
      }
    } catch (e) {}
  }

  return {
    _fetchedFromServer: false,
    isConfigured: false,
    isCustomConfigured: false,
    rtmpUrl: DEFAULT_LOCAL_RTMP,
    hlsBaseUrl: DEFAULT_LOCAL_HLS,
    clipsBaseUrl: DEFAULT_LOCAL_CLIPS,
    recordingsBaseUrl: DEFAULT_LOCAL_RECORDINGS
  };
}

/**
 * Get active clips base URL (respects manual localStorage override if set and valid).
 */
export function getClipsBaseUrl() {
  if (typeof window !== 'undefined' && window.localStorage) {
    const override = localStorage.getItem('orbit_clips_base');
    if (override && !LEGACY_DEAD_HOSTS.some(d => override.includes(d))) {
      return override.replace(/\/+$/, '');
    }
  }
  const cfg = getMediaConfig();
  return (cfg.clipsBaseUrl || DEFAULT_LOCAL_CLIPS).replace(/\/+$/, '');
}

/**
 * Get active recordings base URL (respects manual localStorage override if set and valid).
 */
export function getRecordingsBaseUrl() {
  if (typeof window !== 'undefined' && window.localStorage) {
    const override = localStorage.getItem('orbit_recordings_base');
    if (override && !LEGACY_DEAD_HOSTS.some(d => override.includes(d))) {
      return override.replace(/\/+$/, '');
    }
  }
  const cfg = getMediaConfig();
  return (cfg.recordingsBaseUrl || DEFAULT_LOCAL_RECORDINGS).replace(/\/+$/, '');
}

/**
 * Get active HLS base URL (respects manual localStorage override if set and valid).
 */
export function getHlsBaseUrl() {
  if (typeof window !== 'undefined' && window.localStorage) {
    const override = localStorage.getItem('orbit_hls_base');
    if (override && !LEGACY_DEAD_HOSTS.some(d => override.includes(d))) {
      return override.replace(/\/+$/, '');
    }
  }
  const cfg = getMediaConfig();
  return (cfg.hlsBaseUrl || DEFAULT_LOCAL_HLS).replace(/\/+$/, '');
}

/**
 * Checks whether the given media URL will be blocked by browser Mixed Content policies.
 */
export function isMixedContentMedia(url) {
  if (!url) return false;
  const isHttpsPage = typeof window !== 'undefined' && window.location.protocol === 'https:';
  if (!isHttpsPage) return false;
  return url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1');
}

/**
 * Resolves any media URL (clip, thumbnail, or VOD recording) to use the
 * active media server base URL from the backend config endpoint.
 *
 * @param {string|null} rawUrl
 * @returns {string}
 */
export function resolveMediaUrl(rawUrl) {
  if (!rawUrl) return '';
  let url = rawUrl.trim();
  const isHttpsPage = typeof window !== 'undefined' && window.location.protocol === 'https:';

  const clipsBase = getClipsBaseUrl();
  const recordingsBase = getRecordingsBaseUrl();

  if (url.includes('/clips/')) {
    const fileName = url.substring(url.lastIndexOf('/clips/') + 7);
    if (fileName) {
      return `${clipsBase}/${fileName}`;
    }
  } else if (url.includes('/recordings/')) {
    const fileName = url.substring(url.lastIndexOf('/recordings/') + 12);
    if (fileName) {
      return `${recordingsBase}/${fileName}`;
    }
  }

  // Prevent mixed content warnings on HTTPS pages for remote domains (e.g. CDNs)
  if (isHttpsPage && url.startsWith('http://') && !url.includes('localhost') && !url.includes('127.0.0.1')) {
    url = url.replace('http://', 'https://');
  }

  return url;
}
