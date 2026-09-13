import mpegts from 'mpegts.js';
import { Icons } from './CosmicIcons.js';
import { vodApi } from '../api/vod.js';
import { store } from '../state/store.js';

let activePlayer = null;
let activeModal = null;

export async function openVodPlayerModal(vod) {
  closeVodPlayerModal();

  const vodId = vod.id || vod.streamId;
  let vodDetails = vod;
  let chatMessages = [];

  // Create Modal DOM
  const modal = document.createElement('div');
  modal.id = 'vod-player-modal';
  modal.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: rgba(4, 7, 18, 0.88);
    backdrop-filter: blur(12px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    animation: fadeIn 0.2s ease-out;
  `;

  modal.innerHTML = `
    <div style="
      background: var(--color-space-panel, #0f1424);
      border: 1px solid rgba(0, 242, 254, 0.25);
      border-radius: 16px;
      width: 100%;
      max-width: 1100px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7);
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
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="color: var(--color-cyan-neon, #00f2fe); font-size: 18px;">${Icons.play}</span>
          <h3 id="vod-modal-title" style="margin: 0; font-size: 16px; font-weight: 700; color: var(--color-text, #fff);">
            ${vod.title || 'Broadcast Replay'}
          </h3>
          <span id="vod-modal-format" style="
            font-size: 11px;
            padding: 2px 8px;
            border-radius: 4px;
            background: rgba(0, 242, 254, 0.12);
            color: var(--color-cyan-neon, #00f2fe);
            font-weight: 600;
          ">VOD</span>
        </div>
        <button id="vod-modal-close" class="btn btn-ghost btn-sm" style="padding: 6px 10px; border-radius: 8px;">
          ${Icons.x}
        </button>
      </div>

      <!-- Modal Body (Player + Chat Replay) -->
      <div style="display: flex; flex: 1; min-height: 0; flex-direction: row; background: #000;">
        <!-- Left: Video Area -->
        <div style="flex: 1; display: flex; flex-direction: column; background: #000; position: relative; min-width: 0;">
          <div style="position: relative; width: 100%; aspect-ratio: 16/9; background: #000; display: flex; align-items: center; justify-content: center;">
            <video id="vod-video" controls playsinline style="width: 100%; height: 100%; max-height: 55vh; background: #000;"></video>
            <div id="vod-loading-spinner" style="position: absolute; display: flex; flex-direction: column; align-items: center; gap: 10px; color: var(--color-cyan-neon, #00f2fe);">
              <div class="spinner"></div>
              <span style="font-size: 13px;">Loading video recording...</span>
            </div>
            <div id="vod-error-box" style="display: none; position: absolute; inset: 0; background: rgba(10,12,20,0.95); flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 20px; text-align: center;">
              <div style="font-size: 36px; color: #ef4444;">&#9888;</div>
              <h4 style="margin: 0; color: #fff;">Playback Failed</h4>
              <p id="vod-error-msg" style="margin: 0; color: var(--color-text-muted, #888); font-size: 13px; max-width: 400px;"></p>
              <a id="vod-direct-link" href="#" target="_blank" class="btn btn-cyan btn-sm" style="margin-top: 8px;">
                ${Icons.play} Open Video in VLC / New Tab
              </a>
            </div>
          </div>

          <!-- Video Info Sub-bar -->
          <div style="padding: 14px 20px; background: var(--color-space-panel, #0f1424); border-top: 1px solid rgba(255, 255, 255, 0.05); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
            <div>
              <div style="font-size: 14px; font-weight: 600; color: var(--color-text, #fff);" id="vod-info-streamer">
                ${vod.streamerName || vod.channelName || 'Broadcaster'}
              </div>
              <div style="font-size: 12px; color: var(--color-text-muted, #888);" id="vod-info-meta">
                ${vod.duration ? `Duration: ${vod.duration} &bull; ` : ''}${vod.rewatchCount || 0} views
              </div>
            </div>
            <div style="display: flex; gap: 8px;">
              <a id="vod-download-btn" href="#" target="_blank" class="btn btn-outline btn-sm" download>
                ${Icons.download} Download
              </a>
            </div>
          </div>
        </div>

        <!-- Right: Synchronized Chat Replay -->
        <div id="vod-chat-panel" style="width: 320px; border-left: 1px solid rgba(255, 255, 255, 0.08); display: flex; flex-direction: column; background: rgba(18, 22, 38, 0.95);">
          <div style="padding: 12px 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 13px; font-weight: 700; color: var(--color-text, #fff); display: flex; align-items: center; gap: 6px;">
              ${Icons.emoji} Chat Replay
            </span>
            <span id="vod-chat-count" style="font-size: 11px; color: var(--color-text-muted, #888);">0 messages</span>
          </div>
          <div id="vod-chat-messages" style="flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 10px; font-size: 13px;">
            <div style="color: var(--color-text-muted, #888); text-align: center; margin-top: 40px;">
              Loading chat messages...
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  activeModal = modal;

  // Close handlers
  const closeBtn = modal.querySelector('#vod-modal-close');
  closeBtn?.addEventListener('click', closeVodPlayerModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeVodPlayerModal();
  });
  const handleKeydown = (e) => {
    if (e.key === 'Escape') {
      closeVodPlayerModal();
      window.removeEventListener('keydown', handleKeydown);
    }
  };
  window.addEventListener('keydown', handleKeydown);

  // Load full VOD details + chat if ID is present
  if (vodId) {
    try {
      const full = await vodApi.getVodWithChat(vodId);
      if (full) {
        vodDetails = { ...vod, ...full };
        if (Array.isArray(full.chatMessages)) {
          chatMessages = full.chatMessages;
          const countEl = modal.querySelector('#vod-chat-count');
          if (countEl) countEl.textContent = `${chatMessages.length} messages`;
        }
      }
      // Record view asynchronously
      vodApi.recordView(vodId).catch(() => {});
    } catch (e) {
      console.warn('[VodPlayer] Could not fetch extended VOD details', e);
    }
  }

  // Update UI with resolved details
  const titleEl = modal.querySelector('#vod-modal-title');
  if (titleEl && vodDetails.title) titleEl.textContent = vodDetails.title;

  const streamerEl = modal.querySelector('#vod-info-streamer');
  if (streamerEl) streamerEl.textContent = vodDetails.streamerName || vodDetails.channelName || 'Broadcaster';

  const metaEl = modal.querySelector('#vod-info-meta');
  if (metaEl) {
    metaEl.innerHTML = `${vodDetails.duration ? `Duration: ${vodDetails.duration} &bull; ` : ''}${vodDetails.rewatchCount || 0} views`;
  }

  const rawUrl = vodDetails.vodUrl || vodDetails.url || vod.vodUrl || vod.url;
  const directLink = modal.querySelector('#vod-direct-link');
  const downloadBtn = modal.querySelector('#vod-download-btn');
  if (directLink && rawUrl) directLink.href = rawUrl;
  if (downloadBtn && rawUrl) downloadBtn.href = rawUrl;

  const video = modal.querySelector('#vod-video');
  const spinner = modal.querySelector('#vod-loading-spinner');
  const errorBox = modal.querySelector('#vod-error-box');
  const errorMsg = modal.querySelector('#vod-error-msg');
  const formatBadge = modal.querySelector('#vod-modal-format');

  if (!rawUrl) {
    if (spinner) spinner.style.display = 'none';
    if (errorBox) {
      errorBox.style.display = 'flex';
      if (errorMsg) errorMsg.textContent = 'No recording video URL was found for this broadcast session.';
    }
    return;
  }

  const isFlv = rawUrl.toLowerCase().includes('.flv');
  const isMp4 = rawUrl.toLowerCase().includes('.mp4');
  if (formatBadge) formatBadge.textContent = isFlv ? 'FLV STREAM' : (isMp4 ? 'MP4 VIDEO' : 'VOD');

  // Initialize playback
  try {
    if (isFlv && mpegts.isSupported()) {
      // Use mpegts.js for FLV video decoding with ngrok-skip-browser-warning
      const flvPlayer = mpegts.createPlayer({
        type: 'flv',
        url: rawUrl,
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
        console.error('[VodPlayer] mpegts error:', errType, errDetail);
        if (spinner) spinner.style.display = 'none';
        if (errorBox) {
          errorBox.style.display = 'flex';
          if (errorMsg) errorMsg.textContent = `FLV playback failed (${errType}: ${errDetail}). You can open the raw stream in VLC player.`;
        }
      });

      video.addEventListener('canplay', () => {
        if (spinner) spinner.style.display = 'none';
      }, { once: true });

      flvPlayer.play().catch(() => {});
    } else {
      // For MP4 or direct browser video:
      // When accessed through ngrok, if native video tag fails, we notify with direct VLC button
      if (spinner) spinner.style.display = 'none';
      video.src = rawUrl;
      video.load();
      video.play().catch(() => {});

      video.addEventListener('error', () => {
        if (errorBox) {
          errorBox.style.display = 'flex';
          if (errorMsg) {
            errorMsg.textContent = isFlv
              ? 'Your browser does not support native FLV playback and mpegts MSE is unavailable. Please play in VLC.'
              : 'Video could not be decoded or was blocked by the browser. You can play directly in VLC.';
          }
        }
      });
    }
  } catch (err) {
    console.error('[VodPlayer] Initialization error:', err);
    if (spinner) spinner.style.display = 'none';
    if (errorBox) {
      errorBox.style.display = 'flex';
      if (errorMsg) errorMsg.textContent = err.message || 'Failed to initialize player.';
    }
  }

  // Synchronized Chat Replay
  const chatContainer = modal.querySelector('#vod-chat-messages');
  if (chatContainer) {
    if (!chatMessages || chatMessages.length === 0) {
      chatContainer.innerHTML = '<div style="color:var(--color-text-muted,#888);text-align:center;margin-top:40px;">No saved chat messages for this broadcast.</div>';
    } else {
      let renderedOffset = -1;
      video.addEventListener('timeupdate', () => {
        const currentSec = Math.floor(video.currentTime);
        if (currentSec === renderedOffset) return;
        renderedOffset = currentSec;

        const visibleMessages = chatMessages.filter(m => (m.streamOffsetSeconds || 0) <= currentSec);
        if (visibleMessages.length === 0) {
          chatContainer.innerHTML = '<div style="color:var(--color-text-muted,#888);text-align:center;margin-top:40px;">Chat will appear as the broadcast progresses...</div>';
          return;
        }

        chatContainer.innerHTML = visibleMessages.map(m => `
          <div style="display:flex;align-items:flex-start;gap:8px;line-height:1.4;">
            <span style="color:var(--color-cyan-neon,#00f2fe);font-size:11px;opacity:0.7;font-family:monospace;white-space:nowrap;margin-top:1px;">
              ${formatTimestamp(m.streamOffsetSeconds || 0)}
            </span>
            <div style="word-break:break-word;">
              <span style="font-weight:600;color:var(--color-text,#fff);margin-right:6px;">${m.senderName || 'Viewer'}:</span>
              <span style="color:rgba(255,255,255,0.85);">${escapeHtml(m.content || '')}</span>
            </div>
          </div>
        `).join('');

        chatContainer.scrollTop = chatContainer.scrollHeight;
      });
    }
  }
}

export function closeVodPlayerModal() {
  if (activePlayer) {
    try {
      activePlayer.pause();
      activePlayer.unload();
      activePlayer.detachMediaElement();
      activePlayer.destroy();
    } catch (_) {}
    activePlayer = null;
  }

  if (activeModal) {
    const video = activeModal.querySelector('video');
    if (video) {
      try { video.pause(); video.src = ''; } catch (_) {}
    }
    activeModal.remove();
    activeModal = null;
  }
}

function formatTimestamp(seconds) {
  const s = Math.floor(seconds);
  const m = Math.floor(s / 60);
  const remS = s % 60;
  return `${m}:${remS < 10 ? '0' : ''}${remS}`;
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
