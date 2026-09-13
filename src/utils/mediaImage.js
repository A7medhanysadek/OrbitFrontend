// src/utils/mediaImage.js
// Provides robust loading of images and thumbnails served via ngrok or media server,
// bypassing ngrok free-tier HTML warning pages (ERR_NGROK_6024) via blob streaming.

export const BASE_PATH = import.meta.env.BASE_URL || './';
export const ORBIT_LOGO = BASE_PATH.endsWith('/') ? `${BASE_PATH}Orbit_logo.png` : `${BASE_PATH}/Orbit_logo.png`;
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

  const isNgrok = originalUrl.includes('ngrok-free.dev') || originalUrl.includes('ngrok.io');
  const isLocalhost = originalUrl.includes('localhost:') || originalUrl.includes('127.0.0.1:');

  // External CDNs (Cloudinary, ImgBB, etc.) can be loaded directly
  if (!isNgrok && !isLocalhost) {
    imgElement.src = originalUrl;
    imgElement.onerror = () => {
      imgElement.onerror = null;
      imgElement.src = fallback;
    };
    return;
  }

  // Check in-memory cache
  if (blobCache.has(originalUrl)) {
    imgElement.src = blobCache.get(originalUrl);
    return;
  }

  // Show fallback while downloading
  imgElement.src = fallback;

  // Resolve relative/localhost to ngrok if on HTTPS
  let targetUrl = originalUrl;
  if (window.location.protocol === 'https:' && targetUrl.startsWith('http://localhost:8080/')) {
    targetUrl = targetUrl.replace('http://localhost:8080/', 'https://unwound-overlook-boat.ngrok-free.dev/');
  }

  try {
    const res = await fetch(targetUrl, {
      headers: { 'ngrok-skip-browser-warning': 'true' }
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const blob = await res.blob();
    // Verify it's actually an image
    if (blob.type.includes('html') || blob.type === 'text/plain') {
      throw new Error(`Invalid image mime type: ${blob.type}`);
    }

    const objectUrl = URL.createObjectURL(blob);
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
