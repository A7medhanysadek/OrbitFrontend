import mpegts from 'mpegts.js';
import { Icons } from './CosmicIcons.js';
import { clipApi } from '../api/clip.js';
import { store } from '../state/store.js';

let activePlayer = null;
let activeModal = null;
let activeBlobUrl = null;

// Media base URLs for ngrok & fallback public streaming
export const NGROK_CLIPS_BASE = 'https://unwound-overlook-boat.ngrok-free.dev/clips';
export const NGROK_RECORDINGS_BASE = 'https://unwound-overlook-boat.ngrok-free.dev/recordings';

/**
 * Resolves a media URL, ensuring that on HTTPS hosts (like GitHub Pages)
 * insecure HTTP/localhost URLs are rewritten to the active public HTTPS ngrok tunnel.
 */
export function resolveMediaUrl(rawUrl) {
  if (!rawUrl) return '';
  let url = rawUrl.trim();
  const isHttpsPage = typeof window !== 'undefined' && window.location.protocol === 'https:';

  // Override via localStorage if configured during development
  const customMediaBase = typeof window !== 'undefined' && localStorage.getItem('orbit_clips_base');
  const targetClipsBase = customMediaBase || NGROK_CLIPS_BASE;

  if (url.includes('/clips/')) {
    const fileName = url.substring(url.lastIndexOf('/clips/') + 7);
    if (isHttpsPage || url.includes('localhost') || url.startsWith('http://')) {
      return `${targetClipsBase}/${fileName}`;
    }
  } else if (url.includes('/recordings/')) {
    const fileName = url.substring(url.lastIndexOf('/recordings/') + 12);
    if (isHttpsPage || url.includes('localhost') || url.startsWith('http://')) {
      return `${NGROK_RECORDINGS_BASE}/${fileName}`;
    }
  }

  // Prevent mixed content on HTTPS
  if (isHttpsPage && url.startsWith('http://') && !url.includes('localhost')) {
    url = url.replace('http://', 'https://');
  }

  return url;
}

export async function openClipPlayerModal(clip, onClipDeleted = null) {
  closeClipPlayerModal();

  if (!clip) return;
  const user = store.getState().currentUser;
  const isAdmin = user?.roles?.includes?.('Admin');
  const isOwner = user && (user.userId === clip.creatorId || user.id === clip.creatorId);

  // Record view asynchronously
  if (clip.id) {
    clipApi.recordView(clip.id).catch(() => {});
  }

  const rawUrl = clip.videoUrl || clip.url || '';
  const resolvedUrl = resolveMediaUrl(rawUrl);
  const isFlv = resolvedUrl.toLowerCase().includes('.flv');
  const isMp4 = resolvedUrl.toLowerCase().includes('.mp4');

  // Create Modal DOM
  const modal = document.createElement('div');
  modal.id = 'clip-player-modal';
  modal.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: rgba(4, 7, 18, 0.88);
    backdrop-filter: blur(14px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    animation: fadeIn 0.2s ease-out;
  `;

  modal.innerHTML = `
    <div style="
      background: var(--color-space-panel, #0f1424);
      border: 1px solid rgba(0, 242, 254, 0.3);
      border-radius: 16px;
      width: 100%;
      max-width: 960px;
      max-height: 92vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 242, 254, 0.12);
      overflow: hidden;
    ">
      <!-- Modal Header -->
      <div style="
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      ">
        <div style="display: flex; align-items: center; gap: 10px; overflow: hidden;">
          <span style="color: var(--color-cyan-neon, #00f2fe); font-size: 18px; display: flex; align-items: center;">
            ${Icons.clip}
          </span>
          <h3 id="clip-modal-title" style="
            margin: 0;
            font-size: 16px;
            font-weight: 700;
            color: var(--color-text, #fff);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          ">
            ${escapeHtml(clip.title || 'Highlight Clip')}
          </h3>
          <span id="clip-modal-format" style="
            font-size: 11px;
            padding: 2px 8px;
            border-radius: 4px;
            background: rgba(0, 242, 254, 0.15);
            color: var(--color-cyan-neon, #00f2fe);
            font-weight: 700;
            letter-spacing: 0.05em;
            flex-shrink: 0;
          ">${isFlv ? 'FLV STREAM' : (isMp4 ? 'MP4 CLIP' : 'CLIP')}</span>
        </div>
        <button id="clip-modal-close" class="btn btn-ghost btn-sm" style="padding: 6px 10px; border-radius: 8px;" title="Close (Esc)">
          ${Icons.x}
        </button>
      </div>

      <!-- Modal Body (Video Player) -->
      <div style="position: relative; width: 100%; aspect-ratio: 16/9; background: #000; display: flex; align-items: center; justify-content: center; overflow: hidden;">
        <video id="clip-video" controls autoplay playsinline style="width: 100%; height: 100%; max-height: 60vh; background: #000; object-fit: contain;"></video>
        
        <!-- Loading Spinner -->
        <div id="clip-loading-spinner" style="position: absolute; display: flex; flex-direction: column; align-items: center; gap: 12px; color: var(--color-cyan-neon, #00f2fe);">
          <div class="spinner"></div>
          <span style="font-size: 13px; font-weight: 500; text-shadow: 0 2px 8px rgba(0,0,0,0.8);">Loading clip stream...</span>
        </div>

        <!-- Error State Overlay -->
        <div id="clip-error-box" style="display: none; position: absolute; inset: 0; background: rgba(10, 12, 22, 0.96); flex-direction: column; align-items: center; justify-content: center; gap: 14px; padding: 24px; text-align: center;">
          <div style="font-size: 40px; color: #ef4444;">&#9888;</div>
          <h4 style="margin: 0; color: #fff; font-size: 17px; font-weight: 700;">Clip Stream Unavailable</h4>
          <p id="clip-error-msg" style="margin: 0; color: var(--color-text-muted, #888); font-size: 13px; max-width: 460px; line-height: 1.5;">
            The clip media file could not be loaded or the streaming server tunnel is offline.
          </p>
          <div style="display: flex; gap: 10px; margin-top: 6px; flex-wrap: wrap; justify-content: center;">
            <a id="clip-direct-link" href="${resolvedUrl || '#'}" target="_blank" class="btn btn-cyan btn-sm">
              ${Icons.play} Open in VLC / New Tab
            </a>
            <button id="clip-retry-btn" class="btn btn-outline btn-sm">
              ${Icons.refresh} Retry
            </button>
          </div>
        </div>
      </div>

      <!-- Video Info & Actions Footer -->
      <div style="padding: 16px 20px; background: var(--color-space-panel, #0f1424); border-top: 1px solid rgba(255, 255, 255, 0.08); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
        <!-- Left: Creator & Channel details -->
        <div style="display: flex; align-items: center; gap: 12px; min-width: 0;">
          <div style="
            width: 42px;
            height: 42px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--color-cyan-primary, #00AEBD), var(--color-cyan-neon, #00f2fe));
            display: flex;
            align-items: center;
            justify-content: center;
            color: #000;
            font-weight: 700;
            font-size: 16px;
            flex-shrink: 0;
            overflow: hidden;
          ">
            ${clip.creatorProfilePictureUrl ? `<img src="${clip.creatorProfilePictureUrl}" style="width:100%;height:100%;object-fit:cover;" />` : (clip.creatorName || clip.channelName || 'C')[0].toUpperCase()}
          </div>
          <div style="min-width: 0;">
            <div style="font-size: 14px; font-weight: 600; color: #fff; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
              <span>Clipped by <strong style="color: var(--color-cyan-neon, #00f2fe);">${escapeHtml(clip.creatorName || clip.creatorUsername || 'Streamer')}</strong></span>
              ${clip.channelName ? `<span style="color: var(--color-text-muted, #888);">&bull; Channel: <strong style="color: #fff;">${escapeHtml(clip.channelName)}</strong></span>` : ''}
            </div>
            <div style="font-size: 12px; color: var(--color-text-muted, #888); margin-top: 3px; display: flex; align-items: center; gap: 8px;">
              <span>${Icons.eye} ${(clip.viewCount || 0) + 1} views</span>
              ${clip.durationSeconds ? `<span>&bull; ${Math.round(clip.durationSeconds)}s</span>` : ''}
              ${clip.categoryName ? `<span class="badge-category" style="font-size: 10px; padding: 1px 7px;">${escapeHtml(clip.categoryName)}</span>` : ''}
            </div>
          </div>
        </div>

        <!-- Right: Action Buttons -->
        <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
          ${clip.channelId ? `
            <button id="clip-visit-channel" class="btn btn-cyan btn-sm">
              ${Icons.rocket} Visit Channel
            </button>
          ` : ''}
          <a id="clip-download-btn" href="${resolvedUrl || '#'}" target="_blank" class="btn btn-outline btn-sm" download title="Download Clip">
            ${Icons.download} Download
          </a>
          <button id="clip-share-btn" class="btn btn-ghost btn-sm" title="Copy Clip URL">
            ${Icons.share} Share
          </button>
          ${(isAdmin || isOwner) ? `
            <button id="clip-delete-btn" class="btn btn-danger btn-sm" title="Delete Clip">
              ${Icons.trash} Delete
            </button>
          ` : ''}
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  activeModal = modal;

  // Close handlers
  const closeBtn = modal.querySelector('#clip-modal-close');
  closeBtn?.addEventListener('click', closeClipPlayerModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeClipPlayerModal();
  });

  const handleKeydown = (e) => {
    if (e.key === 'Escape') {
      closeClipPlayerModal();
      window.removeEventListener('keydown', handleKeydown);
    }
  };
  window.addEventListener('keydown', handleKeydown);

  // Video and Overlay elements
  const video = modal.querySelector('#clip-video');
  const spinner = modal.querySelector('#clip-loading-spinner');
  const errorBox = modal.querySelector('#clip-error-box');
  const errorMsg = modal.querySelector('#clip-error-msg');
  const retryBtn = modal.querySelector('#clip-retry-btn');

  // Channel visit
  modal.querySelector('#clip-visit-channel')?.addEventListener('click', () => {
    closeClipPlayerModal();
    if (clip.channelId) store.navigate('channel', { channelId: clip.channelId });
  });

  // Share
  modal.querySelector('#clip-share-btn')?.addEventListener('click', () => {
    const shareUrl = resolvedUrl || window.location.href;
    navigator.clipboard?.writeText(shareUrl).then(() => {
      store.showToast('Clip URL copied to clipboard!', 'success');
    }).catch(() => {
      store.showToast('Clip URL: ' + shareUrl, 'info');
    });
  });

  // Delete
  modal.querySelector('#clip-delete-btn')?.addEventListener('click', async () => {
    if (!confirm('Are you sure you want to delete this clip?')) return;
    try {
      await clipApi.delete(clip.id);
      store.showToast('Clip deleted successfully', 'info');
      closeClipPlayerModal();
      if (typeof onClipDeleted === 'function') {
        onClipDeleted(clip.id);
      } else {
        // Reload current view if in clips feed
        if (store.getState().currentView === 'clips') {
          store.navigate('clips');
        }
      }
    } catch (err) {
      store.showToast(err.message || 'Failed to delete clip', 'error');
    }
  });

  // Retry
  retryBtn?.addEventListener('click', () => {
    if (errorBox) errorBox.style.display = 'none';
    if (spinner) spinner.style.display = 'flex';
    initPlayback();
  });

  // Initialize playback
  async function initPlayback() {
    if (!resolvedUrl) {
      if (spinner) spinner.style.display = 'none';
      if (errorBox) {
        errorBox.style.display = 'flex';
        if (errorMsg) errorMsg.textContent = 'No clip video URL was found for this highlight.';
      }
      return;
    }

    try {
      if (isFlv && mpegts.isSupported()) {
        // FLV with mpegts.js & ngrok headers
        const flvPlayer = mpegts.createPlayer({
          type: 'flv',
          url: resolvedUrl,
          isLive: false,
          cors: true
        }, {
          headers: {
            'ngrok-skip-browser-warning': 'true'
          },
          enableWorker: true,
          lazyLoadMaxDuration: 180,
          seekType: 'range'
        });

        flvPlayer.attachMediaElement(video);
        flvPlayer.load();
        activePlayer = flvPlayer;

        flvPlayer.on(mpegts.Events.ERROR, (errType, errDetail) => {
          console.error('[ClipPlayer] mpegts error:', errType, errDetail);
          if (spinner) spinner.style.display = 'none';
          if (errorBox) {
            errorBox.style.display = 'flex';
            if (errorMsg) errorMsg.textContent = `FLV playback error (${errType}: ${errDetail}). You can open the raw clip in VLC.`;
          }
        });

        video.addEventListener('canplay', () => {
          if (spinner) spinner.style.display = 'none';
        }, { once: true });

        flvPlayer.play().catch(() => {});
      } else {
        // MP4 playback
        // If served from an ngrok tunnel, fetch as blob with ngrok-skip-browser-warning
        // to avoid the ngrok HTML interstitial warning page that breaks native <video>
        const isNgrok = resolvedUrl.includes('ngrok');

        if (isNgrok) {
          try {
            const res = await fetch(resolvedUrl, {
              headers: {
                'ngrok-skip-browser-warning': 'true'
              }
            });

            if (!res.ok) {
              throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }

            const blob = await res.blob();
            activeBlobUrl = URL.createObjectURL(blob);
            video.src = activeBlobUrl;
            video.load();

            video.addEventListener('canplay', () => {
              if (spinner) spinner.style.display = 'none';
            }, { once: true });

            video.play().catch(() => {});
          } catch (fetchErr) {
            console.warn('[ClipPlayer] Blob fetch failed, falling back to direct src:', fetchErr);
            // Fall back to direct video.src
            video.src = resolvedUrl;
            video.load();
            video.play().catch(() => {});
          }
        } else {
          video.src = resolvedUrl;
          video.load();
          video.addEventListener('canplay', () => {
            if (spinner) spinner.style.display = 'none';
          }, { once: true });
          video.play().catch(() => {});
        }

        video.addEventListener('error', (e) => {
          console.error('[ClipPlayer] Video element error:', e);
          if (spinner) spinner.style.display = 'none';
          if (errorBox) {
            errorBox.style.display = 'flex';
            if (errorMsg) {
              errorMsg.textContent = 'Clip could not be decoded or was blocked by the browser. You can play directly in VLC.';
            }
          }
        });
      }
    } catch (err) {
      console.error('[ClipPlayer] Initialization error:', err);
      if (spinner) spinner.style.display = 'none';
      if (errorBox) {
        errorBox.style.display = 'flex';
        if (errorMsg) errorMsg.textContent = err.message || 'Failed to initialize player.';
      }
    }
  }

  initPlayback();
}

export function closeClipPlayerModal() {
  if (activePlayer) {
    try {
      activePlayer.pause();
      activePlayer.unload();
      activePlayer.detachMediaElement();
      activePlayer.destroy();
    } catch (e) {}
    activePlayer = null;
  }

  if (activeBlobUrl) {
    try {
      URL.revokeObjectURL(activeBlobUrl);
    } catch (e) {}
    activeBlobUrl = null;
  }

  if (activeModal) {
    const video = activeModal.querySelector('video');
    if (video) {
      try {
        video.pause();
        video.removeAttribute('src');
        video.load();
      } catch (e) {}
    }
    activeModal.remove();
    activeModal = null;
  }

  const existing = document.getElementById('clip-player-modal');
  if (existing) existing.remove();
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
