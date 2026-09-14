import { API_BASE, apiClient } from '../api/client.js';

let cachedConfig = null;
let fetchPromise = null;

const DEFAULT_LOCAL_CLIPS = 'http://localhost:8080/clips';
const DEFAULT_LOCAL_RECORDINGS = 'http://localhost:8080/recordings';
const DEFAULT_LOCAL_HLS = 'http://localhost:8080/hls';
const DEFAULT_LOCAL_RTMP = 'rtmp://localhost:1935/live';

/**
 * Initialize / fetch the media server configuration from the backend config endpoint.
 * Results are cached in memory and in localStorage.
 */
export async function fetchMediaConfig(forceRefresh = false) {
  if (cachedConfig && !forceRefresh) {
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
          isConfigured: !!cfg.isConfigured,
          isCustomConfigured: !!cfg.isCustomConfigured,
          rtmpUrl: cfg.effectiveRtmpUrl || cfg.rtmpUrl || DEFAULT_LOCAL_RTMP,
          hlsBaseUrl: cfg.effectiveHlsBaseUrl || cfg.hlsBaseUrl || DEFAULT_LOCAL_HLS,
          clipsBaseUrl: cfg.clipsBaseUrl || (cfg.hlsBaseUrl ? cfg.hlsBaseUrl.replace('/hls', '/clips') : DEFAULT_LOCAL_CLIPS),
          recordingsBaseUrl: cfg.recordingsBaseUrl || (cfg.hlsBaseUrl ? cfg.hlsBaseUrl.replace('/hls', '/recordings') : DEFAULT_LOCAL_RECORDINGS),
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

    // Attempt localStorage cache
    if (!cachedConfig && typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = localStorage.getItem('orbit_media_config');
        if (stored) {
          cachedConfig = JSON.parse(stored);
          return cachedConfig;
        }
      } catch (e) {}
    }

    // Default fallback
    cachedConfig = {
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
        cachedConfig = JSON.parse(stored);
        return cachedConfig;
      }
    } catch (e) {}
  }

  return {
    isConfigured: false,
    isCustomConfigured: false,
    rtmpUrl: DEFAULT_LOCAL_RTMP,
    hlsBaseUrl: DEFAULT_LOCAL_HLS,
    clipsBaseUrl: DEFAULT_LOCAL_CLIPS,
    recordingsBaseUrl: DEFAULT_LOCAL_RECORDINGS
  };
}

/**
 * Get active clips base URL (respects manual localStorage override if set).
 */
export function getClipsBaseUrl() {
  if (typeof window !== 'undefined' && window.localStorage) {
    const override = localStorage.getItem('orbit_clips_base');
    if (override) return override.replace(/\/+$/, '');
  }
  const cfg = getMediaConfig();
  return (cfg.clipsBaseUrl || DEFAULT_LOCAL_CLIPS).replace(/\/+$/, '');
}

/**
 * Get active recordings base URL (respects manual localStorage override if set).
 */
export function getRecordingsBaseUrl() {
  if (typeof window !== 'undefined' && window.localStorage) {
    const override = localStorage.getItem('orbit_recordings_base');
    if (override) return override.replace(/\/+$/, '');
  }
  const cfg = getMediaConfig();
  return (cfg.recordingsBaseUrl || DEFAULT_LOCAL_RECORDINGS).replace(/\/+$/, '');
}

/**
 * Get active HLS base URL (respects manual localStorage override if set).
 */
export function getHlsBaseUrl() {
  if (typeof window !== 'undefined' && window.localStorage) {
    const override = localStorage.getItem('orbit_hls_base');
    if (override) return override.replace(/\/+$/, '');
  }
  const cfg = getMediaConfig();
  return (cfg.hlsBaseUrl || DEFAULT_LOCAL_HLS).replace(/\/+$/, '');
}

/**
 * Resolves any media URL (clip, thumbnail, or VOD recording) to use the
 * active media server base URL from the config endpoint.
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

  // Handle localhost:8080 URLs when page is served over HTTPS
  if (isHttpsPage && url.startsWith('http://localhost:8080/')) {
    const path = url.replace('http://localhost:8080/', '');
    const mediaHost = clipsBase.substring(0, clipsBase.lastIndexOf('/')) || clipsBase;
    return `${mediaHost}/${path}`;
  }

  // Prevent mixed content warnings on HTTPS pages
  if (isHttpsPage && url.startsWith('http://') && !url.includes('localhost') && !url.includes('127.0.0.1')) {
    url = url.replace('http://', 'https://');
  }

  return url;
}
