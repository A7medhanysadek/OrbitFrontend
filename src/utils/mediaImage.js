// src/utils/mediaImage.js
// Provides robust loading of images and thumbnails served via ngrok or media server,
// bypassing ngrok free-tier HTML warning pages (ERR_NGROK_6024) via blob streaming.

import { resolveMediaUrl } from './mediaConfig.js';

export const BASE_PATH = import.meta.env.BASE_URL || './';
export const ORBIT_LOGO = BASE_PATH.endsWith('/') ? `${BASE_PATH}orbit-logo-blue.png` : `${BASE_PATH}/orbit-logo-blue.png`;
export const DEFAULT_BANNER = BASE_PATH.endsWith('/') ? `${BASE_PATH}cosmic_orbit_banner.png` : `${BASE_PATH}/cosmic_orbit_banner.png`;

const blobCache = new Map();

/**
 * Loads an image from a URL into an HTMLImageElement.
 * If the URL is hosted on ngrok or localhost, it fetches the image with
 * the 'ngrok-skip-browser-warning' header, converts to a blob ObjectURL,
 * caches it, and sets img.src.
 *
 * @param {HTMLImageElement} imgElement
 * @param {string|null} originalUrl
 * @param {string} [fallback]
 */
export async function loadMediaImage(imgElement, originalUrl, fallback = DEFAULT_BANNER) {
  if (!imgElement) return;

  if (!originalUrl) {
    imgElement.src = fallback;
    return;
  }

  // If already blob: or data: URL, set directly
  if (originalUrl.startsWith('blob:') || originalUrl.startsWith('data:')) {
    imgElement.src = originalUrl;
    return;
  }

  // Resolve media server / clips / recordings URLs dynamically
  const targetUrl = resolveMediaUrl(originalUrl);
  const isNgrok = targetUrl.includes('ngrok-free.dev') || targetUrl.includes('ngrok.io');
  const isLocalhost = targetUrl.includes('localhost:') || targetUrl.includes('127.0.0.1:');

  // External CDNs (YouTube, Cloudinary, ImgBB, etc.) can be loaded directly
  if (targetUrl.includes('img.youtube.com') || targetUrl.includes('ytimg.com')) {
    imgElement.referrerPolicy = 'no-referrer';
    imgElement.src = targetUrl;
    imgElement.onerror = () => {
      imgElement.onerror = null;
      imgElement.src = fallback;
    };
    return;
  }

  if (!isNgrok && !isLocalhost && !targetUrl.includes('/clips/') && !targetUrl.includes('/recordings/') && !targetUrl.includes('/hls/')) {
    imgElement.src = targetUrl;
    imgElement.onerror = () => {
      imgElement.onerror = null;
      imgElement.src = fallback;
    };
    return;
  }

  // If on HTTPS page and targetUrl is plaintext http://localhost, browser blocks it due to Mixed Content
  const isHttpsPage = typeof window !== 'undefined' && window.location.protocol === 'https:';
  if (isHttpsPage && isLocalhost && targetUrl.startsWith('http://')) {
    imgElement.src = fallback;
    return;
  }

  // Check in-memory cache
  if (blobCache.has(targetUrl)) {
    imgElement.src = blobCache.get(targetUrl);
    return;
  }
  if (blobCache.has(originalUrl)) {
    imgElement.src = blobCache.get(originalUrl);
    return;
  }

  // Show fallback while downloading
  imgElement.src = fallback;

  try {
    const fetchOptions = {};
    if (isNgrok) {
      fetchOptions.headers = { 'ngrok-skip-browser-warning': 'true' };
    }
    const res = await fetch(targetUrl, fetchOptions);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const rawBlob = await res.blob();
    // Verify it's not HTML error page
    if (rawBlob.type.includes('html')) {
      throw new Error(`Invalid image mime type: ${rawBlob.type}`);
    }

    const finalBlob = (rawBlob.type === 'text/plain' || rawBlob.type === 'application/octet-stream') && targetUrl.match(/\.(jpg|jpeg|png|webp)/i)
      ? new Blob([rawBlob], { type: 'image/jpeg' })
      : rawBlob;

    const objectUrl = URL.createObjectURL(finalBlob);
    blobCache.set(originalUrl, objectUrl);
    blobCache.set(targetUrl, objectUrl);
    imgElement.src = objectUrl;
  } catch (err) {
    console.warn(`[MediaImage] Failed to load thumbnail: ${targetUrl}`, err.message);
    imgElement.src = fallback;
  }
}

/**
 * Finds all img elements with [data-thumb-src] inside a container and loads them.
 *
 * @param {HTMLElement|Document} container
 * @param {string} [fallback]
 */
export function attachMediaImages(container = document, fallback = DEFAULT_BANNER) {
  if (!container) return;
  const images = container.querySelectorAll('img[data-thumb-src]');
  images.forEach(img => {
    const src = img.getAttribute('data-thumb-src');
    loadMediaImage(img, src, fallback);
  });
}
