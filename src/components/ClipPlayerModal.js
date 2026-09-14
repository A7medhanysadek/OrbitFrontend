import mpegts from 'mpegts.js';
import { Icons } from './CosmicIcons.js';
import { clipApi } from '../api/clip.js';
import { store } from '../state/store.js';
import { getSessionId } from '../utils/session.js';
import { resolveMediaUrl, getClipsBaseUrl, getRecordingsBaseUrl, fetchMediaConfig, isMixedContentMedia } from '../utils/mediaConfig.js';

let activePlayer = null;
let activeModal = null;
let activeBlobUrl = null;

export { resolveMediaUrl, getClipsBaseUrl, getRecordingsBaseUrl };

export async function openClipPlayerModal(clip, onClipDeleted = null) {
  closeClipPlayerModal();

  if (!clip) return;
  const user = store.getState().currentUser;
  const isAdmin = user?.roles?.includes?.('Admin');
  const isOwner = user && (user.userId === clip.creatorId || user.id === clip.creatorId);

  // Record view asynchronously with session deduplication
  if (clip.id) {
    clipApi.recordView(clip.id, getSessionId()).catch(() => {});
  }

  // Ensure latest media config from server
  await fetchMediaConfig().catch(() => {});

  const rawUrl = clip.videoUrl || clip.url || '';
  let resolvedUrl = resolveMediaUrl(rawUrl);
  const isFlv = resolvedUrl.toLowerCase().includes('.flv');
  const isMp4 = resolvedUrl.toLowerCase().includes('.mp4');
  const isHttpsPage = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const isLocalMedia = resolvedUrl.startsWith('http://localhost') || resolvedUrl.startsWith('http://127.0.0.1');
  const isMixedContent = isHttpsPage && isLocalMedia;

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
        <video id="clip-video" controls playsinline style="width: 100%; height: 100%; max-height: 60vh; background: #000; object-fit: contain;"></video>
        
        <!-- Loading Spinner -->
        <div id="clip-loading-spinner" style="position: absolute; display: flex; flex-direction: column; align-items: center; gap: 12px; color: var(--color-cyan-neon, #00f2fe);">
          <div class="spinner"></div>
          <span style="font-size: 13px; font-weight: 500; text-shadow: 0 2px 8px rgba(0,0,0,0.8);">Loading clip stream...</span>
        </div>

        <!-- Error / Info State Overlay -->
        <div id="clip-error-box" style="display: none; position: absolute; inset: 0; background: rgba(10, 12, 22, 0.96); flex-direction: column; align-items: center; justify-content: center; gap: 14px; padding: 24px; text-align: center; overflow-y: auto;">
          <div id="clip-error-icon" style="font-size: 40px; color: #ef4444;">&#9888;</div>
          <h4 id="clip-error-title" style="margin: 0; color: #fff; font-size: 17px; font-weight: 700;">Clip Stream Unavailable</h4>
          <div id="clip-error-msg" style="margin: 0; color: var(--color-text-muted, #888); font-size: 13px; max-width: 520px; line-height: 1.5;">
            The clip media file could not be loaded or the streaming server is offline.
          </div>
          <div style="display: flex; gap: 10px; margin-top: 8px; flex-wrap: wrap; justify-content: center;">
            <a id="clip-direct-link" href="${resolvedUrl || '#'}" target="_blank" class="btn btn-cyan btn-sm">
              ${Icons.play} Open in VLC / New Tab
            </a>
            <button id="clip-copy-url-btn" class="btn btn-outline btn-sm">
              ${Icons.share} Copy Media URL
            </button>
            <a id="clip-download-btn" href="${resolvedUrl || '#'}" download class="btn btn-outline btn-sm">
              ${Icons.download} Download File
            </a>
            <button id="clip-retry-btn" class="btn btn-ghost btn-sm">
              ${Icons.refresh} Refresh & Retry
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
            overflow: hidden;
            flex-shrink: 0;
          ">
            ${clip.creatorProfilePictureUrl
              ? `<img src="${clip.creatorProfilePictureUrl}" style="width:100%;height:100%;object-fit:cover;" />`
              : (clip.creatorName || clip.creatorUsername || 'C')[0].toUpperCase()}
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
          <a id="clip-download-footer-btn" href="${resolvedUrl || '#'}" download class="btn btn-outline btn-sm">
            ${Icons.download} Download
          </a>
          <button id="clip-share-btn" class="btn btn-ghost btn-sm">
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
  const errorTitle = modal.querySelector('#clip-error-title');
  const errorMsg = modal.querySelector('#clip-error-msg');
  const errorIcon = modal.querySelector('#clip-error-icon');
  const retryBtn = modal.querySelector('#clip-retry-btn');
  const copyUrlBtn = modal.querySelector('#clip-copy-url-btn');

  // Copy media URL
  copyUrlBtn?.addEventListener('click', () => {
    if (resolvedUrl) {
      navigator.clipboard?.writeText(resolvedUrl).then(() => {
        store.showToast('Media URL copied to clipboard for VLC / external player!', 'success');
      }).catch(() => {
        store.showToast('Media URL: ' + resolvedUrl, 'info');
      });
    }
  });

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
        if (store.getState().currentView === 'clips') {
          store.navigate('clips');
        }
      }
    } catch (err) {
      store.showToast(err.message || 'Failed to delete clip', 'error');
    }
  });

  // Retry
  retryBtn?.addEventListener('click', async () => {
    if (errorBox) errorBox.style.display = 'none';
    if (spinner) spinner.style.display = 'flex';
    await fetchMediaConfig(true).catch(() => {});
    resolvedUrl = resolveMediaUrl(rawUrl);
    const directLink = modal.querySelector('#clip-direct-link');
    const downloadBtn = modal.querySelector('#clip-download-btn');
    const footerDownload = modal.querySelector('#clip-download-footer-btn');
    if (directLink) directLink.href = resolvedUrl || '#';
    if (downloadBtn) downloadBtn.href = resolvedUrl || '#';
    if (footerDownload) footerDownload.href = resolvedUrl || '#';
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

    // Check for Browser Mixed-Content Restriction
    if (isMixedContent) {
      if (spinner) spinner.style.display = 'none';
      if (errorBox) {
        errorBox.style.display = 'flex';
        if (errorIcon) {
          errorIcon.innerHTML = '&#128274;';
          errorIcon.style.color = 'var(--color-cyan-neon, #00f2fe)';
        }
        if (errorTitle) {
          errorTitle.textContent = 'Browser Mixed-Content Restriction';
        }
        if (errorMsg) {
          errorMsg.innerHTML = `
            <div style="text-align: left; background: rgba(255,255,255,0.04); border-radius: 8px; padding: 14px; margin-top: 4px; font-size: 13px; line-height: 1.6;">
              <p style="margin: 0 0 10px; color: #eee;">
                You are viewing Orbit over <strong>HTTPS</strong> (<code style="color:var(--color-cyan-neon,#00f2fe);">${window.location.host}</code>), but your media server is configured to local <strong>HTTP</strong> (<code style="color:var(--color-cyan-neon,#00f2fe);">${escapeHtml(resolvedUrl.substring(0, resolvedUrl.indexOf('/clips') + 6) || resolvedUrl)}</code>). Modern browsers block plaintext HTTP media requests inside HTTPS pages.
              </p>
              <div style="display: flex; flex-direction: column; gap: 8px; color: #ccc; font-size: 12px;">
                <div>&#128640; <strong>Recommended for Local Testing:</strong> Run the frontend locally (<code style="color:var(--color-cyan-neon,#00f2fe);">npm run dev</code> at <code style="color:var(--color-cyan-neon,#00f2fe);">http://localhost:5173</code>). It connects to your live MonsterASP backend with zero mixed-content restrictions!</div>
                <div>&#127760; <strong>For Online Playback:</strong> Set an HTTPS tunnel (e.g. ngrok HTTPS URL) in <strong>Admin &rarr; Media Server</strong> settings.</div>
                <div>&#127911; <strong>External Player:</strong> You can open or stream this clip directly in VLC player or download it below.</div>
              </div>
            </div>
          `;
        }
      }
      return;
    }

    try {
      if (isFlv && mpegts.isSupported()) {
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
