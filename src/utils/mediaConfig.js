import { API_BASE, apiClient } from '../api/client.js';

let cachedConfig = null;
let fetchPromise = null;

const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';

export const DEFAULT_LOCAL_CLIPS = isHttps ? 'https://localhost:8443/clips' : 'http://localhost:8080/clips';
export const DEFAULT_LOCAL_RECORDINGS = isHttps ? 'https://localhost:8443/recordings' : 'http://localhost:8080/recordings';
export const DEFAULT_LOCAL_HLS = isHttps ? 'https://localhost:8443/hls' : 'http://localhost:8080/hls';
export const DEFAULT_LOCAL_RTMP = 'rtmp://localhost:1935/live';

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

purgeLegacyStorage();

/**
 * Initialize / fetch the media server configuration from the backend config endpoint.
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
        let hls = cfg.effectiveHlsBaseUrl || cfg.hlsBaseUrl || DEFAULT_LOCAL_HLS;
        let clips = cfg.clipsBaseUrl || (cfg.hlsBaseUrl ? cfg.hlsBaseUrl.replace(/\/hls\/?$/, '/clips') : DEFAULT_LOCAL_CLIPS);
        let recordings = cfg.recordingsBaseUrl || (cfg.hlsBaseUrl ? cfg.hlsBaseUrl.replace(/\/hls\/?$/, '/recordings') : DEFAULT_LOCAL_RECORDINGS);

        // When running on HTTPS, upgrade http://localhost:8080 to https://localhost:8443 automatically
        if (isHttps) {
          hls = hls.replace('http://localhost:8080', 'https://localhost:8443').replace('http://127.0.0.1:8080', 'https://localhost:8443');
          clips = clips.replace('http://localhost:8080', 'https://localhost:8443').replace('http://127.0.0.1:8080', 'https://localhost:8443');
          recordings = recordings.replace('http://localhost:8080', 'https://localhost:8443').replace('http://127.0.0.1:8080', 'https://localhost:8443');
        }

        cachedConfig = {
          _fetchedFromServer: true,
          isConfigured: !!cfg.isConfigured,
          isCustomConfigured: !!cfg.isCustomConfigured,
          rtmpUrl: cfg.effectiveRtmpUrl || cfg.rtmpUrl || DEFAULT_LOCAL_RTMP,
          hlsBaseUrl: hls,
          clipsBaseUrl: clips,
          recordingsBaseUrl: recordings,
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

function upgradeLocalUrlForHttps(url) {
  if (!url) return '';
  if (isHttps) {
    return url
      .replace('http://localhost:8080', 'https://localhost:8443')
      .replace('http://127.0.0.1:8080', 'https://localhost:8443');
  }
  return url;
}

/**
 * Get active clips base URL (respects manual localStorage override if set and valid).
 */
export function getClipsBaseUrl() {
  if (typeof window !== 'undefined' && window.localStorage) {
    const override = localStorage.getItem('orbit_clips_base');
    if (override && !LEGACY_DEAD_HOSTS.some(d => override.includes(d))) {
      return upgradeLocalUrlForHttps(override.replace(/\/+$/, ''));
    }
  }
  const cfg = getMediaConfig();
  const base = cfg.clipsBaseUrl || DEFAULT_LOCAL_CLIPS;
  return upgradeLocalUrlForHttps(base.replace(/\/+$/, ''));
}

/**
 * Get active recordings base URL (respects manual localStorage override if set and valid).
 */
export function getRecordingsBaseUrl() {
  if (typeof window !== 'undefined' && window.localStorage) {
    const override = localStorage.getItem('orbit_recordings_base');
    if (override && !LEGACY_DEAD_HOSTS.some(d => override.includes(d))) {
      return upgradeLocalUrlForHttps(override.replace(/\/+$/, ''));
    }
  }
  const cfg = getMediaConfig();
  const base = cfg.recordingsBaseUrl || DEFAULT_LOCAL_RECORDINGS;
  return upgradeLocalUrlForHttps(base.replace(/\/+$/, ''));
}

/**
 * Get active HLS base URL (respects manual localStorage override if set and valid).
 */
export function getHlsBaseUrl() {
  if (typeof window !== 'undefined' && window.localStorage) {
    const override = localStorage.getItem('orbit_hls_base');
    if (override && !LEGACY_DEAD_HOSTS.some(d => override.includes(d))) {
      return upgradeLocalUrlForHttps(override.replace(/\/+$/, ''));
    }
  }
  const cfg = getMediaConfig();
  const base = cfg.hlsBaseUrl || DEFAULT_LOCAL_HLS;
  return upgradeLocalUrlForHttps(base.replace(/\/+$/, ''));
}

/**
 * Checks whether the given media URL will be blocked by browser Mixed Content policies.
 * Note: https://localhost:8443 is HTTPS, so it is NOT mixed content.
 */
export function isMixedContentMedia(url) {
  if (!url) return false;
  if (!isHttps) return false;
  return url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1');
}

/**
 * Resolves any media URL (clip, thumbnail, or VOD recording) to use the
 * active media server base URL from the backend config endpoint.
 *
 * Automatically upgrades plaintext http://localhost:8080 to https://localhost:8443
 * when Orbit is loaded over HTTPS.
 *
 * @param {string|null} rawUrl
 * @returns {string}
 */
export function resolveMediaUrl(rawUrl) {
  if (!rawUrl) return '';
  let url = rawUrl.trim();

  // Upgrade local media URLs on HTTPS pages
  if (isHttps) {
    url = url
      .replace('http://localhost:8080', 'https://localhost:8443')
      .replace('http://127.0.0.1:8080', 'https://localhost:8443');
  }

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
  if (isHttps && url.startsWith('http://') && !url.includes('localhost') && !url.includes('127.0.0.1')) {
    url = url.replace('http://', 'https://');
  }

  return url;
}
