import { store } from '../state/store.js';
import { streamApi } from '../api/stream.js';
import { channelApi } from '../api/channel.js';
import { clipApi } from '../api/clip.js';
import { Icons } from '../components/CosmicIcons.js';
import { API_BASE, getAuthToken } from '../api/client.js';
import * as signalR from '@microsoft/signalr';

let chatConnection = null;

export function renderWatchRoomView() {
  const stream = store.getState().activeStream;
  const title = stream?.title || 'Loading...';
  return `
    <div style="display:flex;gap:0;margin:-24px;min-height:calc(100vh - var(--topbar-height));">
      <!-- Video + Info -->
      <div style="flex:1;display:flex;flex-direction:column;">
        <div class="player-wrapper" id="player-container" style="border-radius:0;aspect-ratio:16/9;background:#000;">
          <video id="stream-video" style="width:100%;height:100%;" autoplay></video>
          <div id="player-offline" class="hidden" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:var(--bg-gradient-card);flex-direction:column;gap:12px;">
            <div style="font-size:48px;">&#128752;</div>
            <h3 style="font-family:var(--font-display);color:var(--color-cyan-neon);">Stream Offline</h3>
          </div>
        </div>
        <div style="padding:20px;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;">
            <div>
              <h2 style="font-size:20px;font-weight:700;margin-bottom:4px;" id="watch-title">${title}</h2>
              <div style="display:flex;gap:12px;align-items:center;" id="watch-meta">
                <span class="badge-live">LIVE</span>
                <span class="text-muted" id="watch-viewers">${Icons.eye} ${stream?.viewerCount || 0} viewers</span>
                <span class="badge-category">${stream?.categoryName || 'General'}</span>
              </div>
            </div>
            <div style="display:flex;gap:8px;">
              <button id="watch-clip-btn" class="btn btn-outline btn-sm">${Icons.clip} Clip</button>
              <button id="watch-follow-btn" class="btn btn-cyan btn-sm follow-btn not-following">${Icons.follow} Follow</button>
            </div>
          </div>
          <div id="watch-channel-info" style="display:flex;align-items:center;gap:14px;padding:16px;background:var(--color-space-panel);border-radius:var(--radius-card);border:1px solid rgba(0,174,189,0.12);cursor:pointer;">
            <div style="width:50px;height:50px;border-radius:50%;background:linear-gradient(135deg,var(--color-cyan-primary),var(--color-cyan-neon));display:flex;align-items:center;justify-content:center;font-weight:700;font-size:20px;color:#000;overflow:hidden;" id="watch-avatar">${(stream?.streamerName || 'S')[0].toUpperCase()}</div>
            <div style="flex:1;">
              <div style="font-weight:600;font-size:16px;display:flex;align-items:center;gap:6px;" id="watch-streamer">${stream?.streamerName || 'Streamer'} ${Icons.checkCircle}</div>
              <div style="font-size:13px;color:var(--color-text-muted);" id="watch-desc"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Chat Panel -->
      <div class="chat-panel" style="width:var(--chat-width);flex-shrink:0;">
        <div class="chat-header">
          <span>Stream Chat</span>
          <span style="font-size:12px;color:var(--color-text-muted);" id="chat-status">Connecting...</span>
        </div>
        <div class="chat-messages" id="chat-messages"></div>
        <div class="chat-input-area">
          <input type="text" id="chat-input" placeholder="Send a message..." />
          <button id="chat-send">${Icons.send}</button>
        </div>
      </div>
    </div>
  `;
}

export function setupWatchRoomEvents() {
  const params = store.getState().viewParams;
  const streamId = params?.streamId;
  const stream = store.getState().activeStream;

  // Load stream details
  if (streamId && !stream) {
    streamApi.getStreamById(streamId).then(s => {
      store.setActiveStream(s);
      updateStreamUI(s);
    }).catch(() => {});
  } else if (stream) {
    updateStreamUI(stream);
  }

  // Init HLS player
  initPlayer(stream);

  // Init SignalR chat
  initChat(stream?.channelId, streamId);

  // Follow button
  const followBtn = document.getElementById('watch-follow-btn');
  if (followBtn && stream) {
    const isFollowing = store.isFollowing(stream.channelId);
    followBtn.className = `btn btn-sm follow-btn ${isFollowing ? 'following' : 'not-following'}`;
    followBtn.innerHTML = isFollowing ? `${Icons.followFilled} Following` : `${Icons.follow} Follow`;
    followBtn.addEventListener('click', () => {
      if (store.isFollowing(stream.channelId)) {
        store.unfollowChannel(stream.channelId);
        followBtn.className = 'btn btn-sm follow-btn not-following';
        followBtn.innerHTML = `${Icons.follow} Follow`;
      } else {
        store.followChannel(stream.channelId, stream.streamerName || stream.channelName);
        followBtn.className = 'btn btn-sm follow-btn following';
        followBtn.innerHTML = `${Icons.followFilled} Following`;
        store.showToast(`Following ${stream.streamerName}!`, 'success');
      }
    });
  }

  // Clip button
  document.getElementById('watch-clip-btn')?.addEventListener('click', () => {
    if (!streamId) return;
    store.openModal('slice', { streamId, channelId: stream?.channelId });
    showSliceModal(streamId, stream?.channelId);
  });

  // Channel info click
  document.getElementById('watch-channel-info')?.addEventListener('click', () => {
    if (stream?.channelId) store.navigate('channel', { channelId: stream.channelId });
  });

  // Chat send
  const chatInput = document.getElementById('chat-input');
  const chatSend = document.getElementById('chat-send');
  if (chatInput && chatSend) {
    const sendMsg = () => {
      const msg = chatInput.value.trim();
      if (!msg || !chatConnection) return;
      chatConnection.invoke('SendMessage', msg).catch(e => console.error('Send failed', e));
      chatInput.value = '';
    };
    chatSend.addEventListener('click', sendMsg);
    chatInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendMsg(); });
  }
}

function updateStreamUI(s) {
  const title = document.getElementById('watch-title');
  const streamer = document.getElementById('watch-streamer');
  if (title) title.textContent = s.title;
  if (streamer) streamer.innerHTML = `${s.streamerName || 'Streamer'} ${Icons.checkCircle}`;
}

async function initPlayer(stream) {
  if (!stream?.hlsUrl) return;
  const video = document.getElementById('stream-video');
  if (!video) return;
  try {
    const Hls = (await import('hls.js')).default;
    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(stream.hlsUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) document.getElementById('player-offline')?.classList.remove('hidden');
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = stream.hlsUrl;
    }
  } catch (e) { console.warn('HLS init failed', e); }
}

async function initChat(channelId, streamId) {
  const statusEl = document.getElementById('chat-status');
  const messagesEl = document.getElementById('chat-messages');
  if (!channelId || !messagesEl) return;

  try {
    const token = getAuthToken();
    chatConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE}/hubs/stream-chat`, { accessTokenFactory: () => token })
      .withAutomaticReconnect()
      .build();

    chatConnection.on('ReceiveMessage', (msg) => {
      const div = document.createElement('div');
      div.className = 'chat-msg';
      div.innerHTML = `<span class="chat-user" style="color:${msg.color || '#00AEBD'};">${msg.username}:</span> <span class="chat-text">${escapeHtml(msg.content)}</span>`;
      messagesEl.appendChild(div);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    });

    chatConnection.on('SystemMessage', (msg) => {
      const div = document.createElement('div');
      div.className = 'chat-msg';
      div.innerHTML = `<span style="color:var(--color-text-muted);font-style:italic;">${msg}</span>`;
      messagesEl.appendChild(div);
    });

    await chatConnection.start();
    await chatConnection.invoke('JoinChannel', channelId);
    if (statusEl) { statusEl.textContent = 'Connected'; statusEl.style.color = 'var(--color-success)'; }
  } catch (e) {
    console.warn('Chat connection failed', e);
    if (statusEl) { statusEl.textContent = 'Disconnected'; statusEl.style.color = 'var(--color-error)'; }
  }
}

function showSliceModal(streamId, channelId) {
  const root = document.getElementById('modal-root');
  if (!root) return;
  root.innerHTML = `
    <div class="modal-overlay" id="slice-overlay">
      <div class="modal-content">
        <h3>${Icons.clip} Create Clip</h3>
        <div class="form-group">
          <label style="color:var(--color-text-muted);">Title</label>
          <input class="input-dark" id="slice-title" placeholder="Clip title" />
        </div>
        <div class="form-group">
          <label style="color:var(--color-text-muted);">Duration (seconds, max 300)</label>
          <input class="input-dark" type="number" id="slice-duration" value="60" min="10" max="300" />
        </div>
        <div style="display:flex;gap:10px;margin-top:20px;">
          <button id="slice-confirm" class="btn btn-cyan btn-full">Create Clip</button>
          <button id="slice-cancel" class="btn btn-ghost">Cancel</button>
        </div>
      </div>
    </div>
  `;
  document.getElementById('slice-cancel')?.addEventListener('click', () => { root.innerHTML = ''; store.closeModal(); });
  document.getElementById('slice-overlay')?.addEventListener('click', (e) => { if (e.target.id === 'slice-overlay') { root.innerHTML = ''; store.closeModal(); } });
  document.getElementById('slice-confirm')?.addEventListener('click', async () => {
    const btn = document.getElementById('slice-confirm');
    btn.disabled = true; btn.textContent = 'Creating...';
    try {
      await clipApi.slice({ streamId, channelId, title: document.getElementById('slice-title').value || 'Untitled Clip', durationSeconds: parseInt(document.getElementById('slice-duration').value) || 60 });
      store.showToast('Clip created!', 'success');
      root.innerHTML = ''; store.closeModal();
    } catch (e) { store.showToast(e.message || 'Clip failed', 'error'); btn.disabled = false; btn.textContent = 'Create Clip'; }
  });
}

function escapeHtml(str) { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; }