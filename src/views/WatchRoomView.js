import { store } from '../state/store.js';
import { streamApi } from '../api/stream.js';
import { channelApi } from '../api/channel.js';
import { clipApi } from '../api/clip.js';
import { chatApi } from '../api/chat.js';
import { moderationApi } from '../api/moderation.js';
import { Icons } from '../components/CosmicIcons.js';
import { API_BASE, getAuthToken, getCurrentUser } from '../api/client.js';
import * as signalR from '@microsoft/signalr';

let chatConnection = null;
let activeHls = null;
let currentStreamId = null;
let currentChannelId = null;
let offlinePollTimer = null;
let manifestRetryTimer = null;
let hideControlsTimer = null;
let playerControlsState = {
  isYt: false,
  isPlaying: true,
  isMuted: false,
  volume: 1
};

function sendYtCommand(func, args = []) {
  const ytFrame = document.getElementById('youtube-player-frame');
  if (ytFrame && ytFrame.contentWindow) {
    ytFrame.contentWindow.postMessage(JSON.stringify({
      event: 'command',
      func: func,
      args: args
    }), '*');
  }
}

function updatePlayerControlsUI() {
  const playIcon = document.getElementById('orbit-play-icon');
  const muteIcon = document.getElementById('orbit-volume-icon');
  const volSlider = document.getElementById('orbit-ctrl-vol-slider');

  if (playIcon) {
    playIcon.textContent = playerControlsState.isPlaying ? '⏸' : '▶';
  }
  if (muteIcon) {
    muteIcon.textContent = playerControlsState.isMuted || playerControlsState.volume === 0 ? '🔇' : (playerControlsState.volume < 0.5 ? '🔉' : '🔊');
  }
  if (volSlider) {
    volSlider.value = playerControlsState.isMuted ? 0 : playerControlsState.volume;
  }
}

function resetHideControlsTimer() {
  const controls = document.getElementById('orbit-player-controls');
  if (!controls) return;
  controls.style.opacity = '1';
  if (hideControlsTimer) clearTimeout(hideControlsTimer);
  if (playerControlsState.isPlaying) {
    hideControlsTimer = setTimeout(() => {
      if (controls && playerControlsState.isPlaying) {
        controls.style.opacity = '0';
      }
    }, 2500);
  }
}

function formatDvrTime(seconds) {
  if (isNaN(seconds) || seconds < 0) seconds = 0;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function updateDvrTimeline() {
  const video = document.getElementById('stream-video');
  if (!video || playerControlsState.isYt) return;
  if (!video.seekable || video.seekable.length === 0) return;

  const seekStart = video.seekable.start(0);
  const seekEnd = video.seekable.end(0);
  const duration = Math.max(1, seekEnd - seekStart);
  const current = Math.min(seekEnd, Math.max(seekStart, video.currentTime));

  const progressPct = Math.max(0, Math.min(100, ((current - seekStart) / duration) * 100));
  const progressEl = document.getElementById('orbit-dvr-progress');
  const handleEl = document.getElementById('orbit-dvr-handle');
  const liveBadge = document.getElementById('orbit-ctrl-live-badge');
  const liveDot = document.getElementById('orbit-live-dot');
  const liveText = document.getElementById('orbit-live-text');
  const timeDisplay = document.getElementById('orbit-dvr-time-display');

  if (progressEl) progressEl.style.width = `${progressPct}%`;
  if (handleEl) handleEl.style.left = `${progressPct}%`;

  // Update buffered bar
  const bufferedEl = document.getElementById('orbit-dvr-buffered');
  if (bufferedEl && video.buffered && video.buffered.length > 0) {
    try {
      const bufEnd = video.buffered.end(video.buffered.length - 1);
      const bufPct = Math.max(0, Math.min(100, ((bufEnd - seekStart) / duration) * 100));
      bufferedEl.style.width = `${bufPct}%`;
    } catch (_) {}
  }

  const diffFromLive = Math.round(seekEnd - current);
  if (diffFromLive <= 5) {
    // AT LIVE EDGE
    if (liveBadge) {
      liveBadge.title = 'You are currently at the live edge (L)';
      liveBadge.style.background = 'rgba(255, 20, 0, 0.2)';
      liveBadge.style.borderColor = 'rgba(255, 20, 0, 0.5)';
      liveBadge.style.color = '#ff3b30';
    }
    if (liveDot) {
      liveDot.style.background = '#ff3b30';
      liveDot.style.boxShadow = '0 0 8px #ff3b30';
      liveDot.style.animation = 'pulseLive 1.5s infinite';
    }
    if (liveText) liveText.textContent = 'LIVE';
    if (timeDisplay) timeDisplay.textContent = 'LIVE';
  } else {
    // BEHIND LIVE (REWOUND DVR)
    if (liveBadge) {
      liveBadge.title = 'Rewound broadcast — Click to jump back to LIVE (L)';
      liveBadge.style.background = 'rgba(255, 180, 0, 0.2)';
      liveBadge.style.borderColor = 'rgba(255, 180, 0, 0.6)';
      liveBadge.style.color = '#ffb400';
    }
    if (liveDot) {
      liveDot.style.background = '#ffb400';
      liveDot.style.boxShadow = '0 0 8px #ffb400';
      liveDot.style.animation = 'none';
    }
    if (liveText) liveText.textContent = `⟲ LIVE (-${formatDvrTime(diffFromLive)})`;
    if (timeDisplay) timeDisplay.textContent = `-${formatDvrTime(diffFromLive)}`;
  }
}

function jumpToLive() {
  const video = document.getElementById('stream-video');
  if (!video || !video.seekable || video.seekable.length === 0) return;
  const seekEnd = video.seekable.end(0);
  video.currentTime = Math.max(0, seekEnd - 0.5);
  video.play().catch(() => {});
  updateDvrTimeline();
  store.showToast('Synced to Live broadcast', 'info');
}

function seekRelative(seconds) {
  const video = document.getElementById('stream-video');
  if (!video || !video.seekable || video.seekable.length === 0) return;
  const seekStart = video.seekable.start(0);
  const seekEnd = video.seekable.end(0);
  const target = Math.max(seekStart, Math.min(seekEnd - 0.5, video.currentTime + seconds));
  video.currentTime = target;
  updateDvrTimeline();
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderWatchRoomView() {
  const stream = store.getState().activeStream;
  const currentUser = getCurrentUser();
  const title = stream?.title || 'Loading...';

  return `
    <div style="display:flex;gap:0;margin:-24px;min-height:calc(100vh - var(--topbar-height));">
      <!-- Video + Info Column -->
      <div style="flex:1;display:flex;flex-direction:column;overflow-y:auto;min-width:0;">
        <div class="player-wrapper" id="player-container" style="position:relative;border-radius:0;aspect-ratio:16/9;background:#000;overflow:hidden;">
          <video id="stream-video" style="width:100%;height:100%;background:#000;" autoplay playsinline></video>

          <!-- Authentic Orbit Stream Controls Overlay (Kick & Twitch style with Live DVR) -->
          <div id="orbit-player-controls" class="orbit-player-controls-overlay" style="position:absolute;inset:0;pointer-events:none;display:flex;flex-direction:column;justify-content:flex-end;z-index:10;opacity:0;transition:opacity 0.25s ease;">
            <!-- DVR Scrubber Bar Area -->
            <div id="orbit-dvr-scrubber-area" style="pointer-events:auto;position:relative;width:100%;height:18px;display:flex;align-items:center;cursor:pointer;padding:0 16px;box-sizing:border-box;">
              <!-- Scrubber Track Background -->
              <div id="orbit-dvr-track" style="position:relative;width:100%;height:5px;background:rgba(255,255,255,0.22);border-radius:3px;overflow:visible;">
                <!-- Buffered Range Fill -->
                <div id="orbit-dvr-buffered" style="position:absolute;left:0;top:0;height:100%;width:0%;background:rgba(255,255,255,0.35);border-radius:3px;pointer-events:none;"></div>
                <!-- Progress Fill (Cyan Neon Gradient) -->
                <div id="orbit-dvr-progress" style="position:absolute;left:0;top:0;height:100%;width:100%;background:linear-gradient(90deg, #00f2fe, #00aebd);border-radius:3px;pointer-events:none;"></div>
                <!-- Scrubber Handle / Thumb -->
                <div id="orbit-dvr-handle" style="position:absolute;top:50%;left:100%;transform:translate(-50%, -50%);width:13px;height:13px;border-radius:50%;background:#fff;box-shadow:0 0 10px rgba(0,242,254,0.9);pointer-events:none;"></div>
              </div>
              <!-- Floating Hover Timestamp Preview Tooltip -->
              <div id="orbit-dvr-tooltip" style="display:none;position:absolute;bottom:24px;transform:translateX(-50%);background:rgba(4,7,18,0.95);border:1px solid rgba(0,242,254,0.4);border-radius:6px;padding:3px 8px;font-size:11px;font-weight:700;color:#fff;pointer-events:none;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,0.5);z-index:20;">--:--</div>
            </div>

            <!-- Controls Bottom Bar -->
            <div style="pointer-events:auto;background:linear-gradient(180deg, transparent 0%, rgba(4,7,18,0.85) 40%, rgba(4,7,18,0.96) 100%);padding:10px 20px 14px;display:flex;align-items:center;justify-content:space-between;gap:16px;">
              <!-- Left: Play/Pause, Rewind -10s, Forward +10s, Live Badge, Time Display, Volume -->
              <div style="display:flex;align-items:center;gap:10px;">
                <button id="orbit-ctrl-play" title="Play/Pause (Space)" class="orbit-ctrl-btn">
                  <span id="orbit-play-icon" style="font-size:18px;">⏸</span>
                </button>

                <button id="orbit-ctrl-rewind-10" title="Rewind 10 seconds (Left Arrow)" class="orbit-ctrl-btn" style="font-size:11px;font-weight:700;padding:4px 8px;border-radius:6px;border:1px solid rgba(255,255,255,0.15);">
                  ⟲ 10s
                </button>

                <button id="orbit-ctrl-forward-10" title="Forward 10 seconds (Right Arrow)" class="orbit-ctrl-btn" style="font-size:11px;font-weight:700;padding:4px 8px;border-radius:6px;border:1px solid rgba(255,255,255,0.15);">
                  10s ⟳
                </button>

                <!-- Clickable Live Badge: clicking syncs directly to live edge -->
                <button id="orbit-ctrl-live-badge" title="Click to jump to live broadcast (L)" style="display:flex;align-items:center;gap:6px;padding:4px 10px;border-radius:6px;background:rgba(255,20,0,0.2);border:1px solid rgba(255,20,0,0.5);font-size:11px;font-weight:700;color:#ff3b30;letter-spacing:0.05em;cursor:pointer;transition:all 0.2s ease;">
                  <span id="orbit-live-dot" style="width:7px;height:7px;border-radius:50%;background:#ff3b30;display:inline-block;box-shadow:0 0 8px #ff3b30;animation:pulseLive 1.5s infinite;"></span>
                  <span id="orbit-live-text">LIVE</span>
                </button>

                <!-- Time display (e.g. -01:45 behind live, or LIVE) -->
                <div id="orbit-dvr-time-display" style="font-size:12px;font-weight:600;color:var(--color-text-muted,#aaa);font-variant-numeric:tabular-nums;min-width:55px;">
                  LIVE
                </div>

                <div class="orbit-volume-group" style="display:flex;align-items:center;gap:6px;margin-left:4px;">
                  <button id="orbit-ctrl-mute" title="Mute/Unmute (M)" class="orbit-ctrl-btn">
                    <span id="orbit-volume-icon" style="font-size:16px;">🔊</span>
                  </button>
                  <input type="range" id="orbit-ctrl-vol-slider" min="0" max="1" step="0.05" value="1" style="width:70px;height:4px;accent-color:var(--color-cyan-primary,#00aebd);cursor:pointer;" />
                </div>
              </div>

              <!-- Right: Options, PiP, Theater & Fullscreen -->
              <div style="display:flex;align-items:center;gap:8px;">
                <span id="orbit-ctrl-quality" style="font-size:10px;font-weight:700;color:var(--color-cyan-neon,#00f2fe);background:rgba(0,221,238,0.12);border:1px solid rgba(0,221,238,0.3);padding:2px 7px;border-radius:4px;letter-spacing:0.04em;" title="Quality: 1080p60 Ultra-Low Latency">1080p60</span>
                <button id="orbit-ctrl-pip" title="Picture-in-Picture (P)" class="orbit-ctrl-btn">
                  <span style="font-size:15px;">🗔</span>
                </button>
                <button id="orbit-ctrl-theater" title="Theater Mode (T)" class="orbit-ctrl-btn">
                  <span id="orbit-theater-icon" style="font-size:15px;">⬚</span>
                </button>
                <button id="orbit-ctrl-fullscreen" title="Fullscreen (F)" class="orbit-ctrl-btn">
                  <span id="orbit-fullscreen-icon" style="font-size:16px;">⛶</span>
                </button>
              </div>
            </div>
          </div>

          <button id="player-unmute-btn" style="display:none;position:absolute;bottom:70px;left:20px;z-index:11;background:rgba(4,7,18,0.9);border:1px solid rgba(0,242,254,0.5);color:var(--color-cyan-neon,#00f2fe);border-radius:8px;padding:8px 14px;font-size:13px;font-weight:600;cursor:pointer;align-items:center;gap:6px;backdrop-filter:blur(6px);box-shadow:0 0 16px rgba(0,242,254,0.3);">
            ${Icons.volume} Click to Unmute
          </button>
          
          <div id="player-offline" class="hidden" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:var(--bg-gradient-card);flex-direction:column;gap:12px;z-index:5;">
            <div style="font-size:48px;">&#128752;</div>
            <h3 style="font-family:var(--font-display);color:var(--color-cyan-neon,#00f2fe);">Stream Offline</h3>
            <p style="color:var(--color-text-muted);font-size:13px;margin:0;">The broadcaster is not currently streaming.</p>
          </div>
        </div>

        <div style="padding:20px;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;flex-wrap:wrap;gap:12px;">
            <div>
              <h2 style="font-size:20px;font-weight:700;margin:0 0 6px;" id="watch-title">${escapeHtml(title)}</h2>
              <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;" id="watch-meta">
                <span class="badge-live">LIVE</span>
                <span class="text-muted" id="watch-viewers">${Icons.eye} <span id="viewer-count-num">${stream?.viewerCount || 0}</span> viewers</span>
                <span class="badge-category">${escapeHtml(stream?.categoryName || 'General')}</span>
              </div>
            </div>
            <div style="display:flex;gap:8px;align-items:center;">
              <button id="watch-clip-btn" class="btn btn-outline btn-sm">${Icons.clip} Clip</button>
              <button id="watch-follow-btn" class="btn btn-cyan btn-sm follow-btn not-following">${Icons.follow} Follow</button>
            </div>
          </div>

          <div id="watch-channel-info" style="display:flex;align-items:center;gap:14px;padding:16px;background:var(--color-space-panel);border-radius:var(--radius-card);border:1px solid rgba(0,174,189,0.12);cursor:pointer;">
            <div style="width:50px;height:50px;border-radius:50%;background:linear-gradient(135deg,var(--color-cyan-primary),var(--color-cyan-neon));display:flex;align-items:center;justify-content:center;font-weight:700;font-size:20px;color:#000;overflow:hidden;" id="watch-avatar">${(stream?.streamerName || 'S')[0].toUpperCase()}</div>
            <div style="flex:1;overflow:hidden;">
              <div style="font-weight:600;font-size:16px;display:flex;align-items:center;gap:6px;" id="watch-streamer">
                <span>${escapeHtml(stream?.streamerName || 'Streamer')}</span> ${Icons.checkCircle}
              </div>
              <div style="font-size:13px;color:var(--color-text-muted);" id="watch-desc">Click to visit channel profile</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Chat Panel -->
      <div class="chat-panel" style="width:var(--chat-width, 340px);flex-shrink:0;display:flex;flex-direction:column;border-left:1px solid rgba(255,255,255,0.08);background:var(--color-space-panel, #0f1424);height:calc(100vh - var(--topbar-height));position:relative;">
        <div class="chat-header" style="padding:14px 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,0.08);">
          <div style="display:flex;align-items:center;gap:8px;font-weight:700;font-size:14px;color:#fff;">
            <span>Stream Chat</span>
          </div>
          <span style="font-size:11px;font-weight:600;color:var(--color-text-muted);" id="chat-status">Connecting...</span>
        </div>

        <div class="chat-messages" id="chat-messages" style="flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:6px;scroll-behavior:smooth;"></div>

        <!-- Floating scroll-to-bottom indicator -->
        <button id="chat-scroll-bottom" style="display:none;position:absolute;bottom:70px;left:50%;transform:translateX(-50%);background:rgba(0,242,254,0.9);color:#000;font-size:11px;font-weight:700;border:none;border-radius:20px;padding:4px 12px;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.5);z-index:5;">
          &darr; New Messages
        </button>

        <div class="chat-input-area" style="padding:12px;border-top:1px solid rgba(255,255,255,0.08);background:rgba(0,0,0,0.2);">
          ${currentUser ? `
            <div style="display:flex;gap:8px;">
              <input type="text" id="chat-input" placeholder="Send a message..." maxlength="500" class="input-dark" style="flex:1;height:38px;padding:0 12px;font-size:13px;border-radius:8px;" />
              <button id="chat-send" class="btn btn-cyan btn-sm" style="height:38px;padding:0 14px;border-radius:8px;">
                ${Icons.send}
              </button>
            </div>
          ` : `
            <button id="chat-login-btn" class="btn btn-cyan btn-sm" style="width:100%;height:38px;font-weight:600;border-radius:8px;justify-content:center;">
              Log in to Chat
            </button>
          `}
        </div>
      </div>
    </div>
  `;
}

export function setupWatchRoomEvents() {
  const params = store.getState().viewParams;
  const streamId = params?.streamId;
  const stream = store.getState().activeStream;

  // Cleanup old connections & timers if switching rooms
  if (chatConnection) {
    if (currentStreamId) chatConnection.invoke('LeaveStream', currentStreamId).catch(() => {});
    chatConnection.stop().catch(() => {});
    chatConnection = null;
  }
  if (activeHls) {
    activeHls.destroy();
    activeHls = null;
  }
  if (offlinePollTimer) {
    clearInterval(offlinePollTimer);
    offlinePollTimer = null;
  }
  if (manifestRetryTimer) {
    clearTimeout(manifestRetryTimer);
    manifestRetryTimer = null;
  }
  const oldYt = document.getElementById('youtube-player-frame');
  if (oldYt) oldYt.remove();

  const onStreamReady = (s) => {
    if (!s) return;
    currentStreamId = s.id;
    currentChannelId = s.channelId;
    store.state.activeStream = s;
    updateStreamUI(s);
    initPlayer(s);
    initChat(s.channelId, s.id);
    setupFollowBtn(s);
  };

  if (streamId) {
    const sIdNum = parseInt(streamId);
    if (!stream || stream.id !== sIdNum) {
      streamApi.getStreamById(streamId).then(s => {
        onStreamReady(s);
      }).catch(err => {
        console.warn('Could not load stream details:', err);
        if (stream) {
          onStreamReady(stream);
        } else {
          document.getElementById('player-offline')?.classList.remove('hidden');
        }
      });
    } else {
      onStreamReady(stream);
    }
  } else if (stream) {
    onStreamReady(stream);
  }

  // Clip button
  document.getElementById('watch-clip-btn')?.addEventListener('click', () => {
    const activeS = store.getState().activeStream;
    const sid = streamId || activeS?.id;
    if (!sid) return;
    const user = getCurrentUser();
    if (!user) {
      store.showToast('Please log in to create a clip', 'info');
      store.navigate('login');
      return;
    }
    if (activeS?.isSimulated || (activeS?.hlsUrl && (activeS.hlsUrl.includes('youtube.com') || activeS.hlsUrl.includes('youtu.be')))) {
      store.showToast('Live clipping is available for native broadcasts. YouTube simulated streams do not record on the media server.', 'warning');
      return;
    }
    store.openModal('slice', { streamId: sid, channelId: activeS?.channelId });
    showSliceModal(sid, activeS?.channelId);
  });

  // Authentic Orbit Player Controls wiring
  const playBtn = document.getElementById('orbit-ctrl-play');
  const muteBtn = document.getElementById('orbit-ctrl-mute');
  const volSlider = document.getElementById('orbit-ctrl-vol-slider');
  const fsBtn = document.getElementById('orbit-ctrl-fullscreen');
  const playerContainer = document.getElementById('player-container');
  const videoEl = document.getElementById('stream-video');

  const togglePlay = () => {
    if (playerControlsState.isPlaying) {
      if (playerControlsState.isYt) {
        sendYtCommand('pauseVideo');
      } else if (videoEl) {
        videoEl.pause();
      }
      playerControlsState.isPlaying = false;
    } else {
      if (playerControlsState.isYt) {
        sendYtCommand('playVideo');
      } else if (videoEl) {
        videoEl.play().catch(() => {});
      }
      playerControlsState.isPlaying = true;
    }
    updatePlayerControlsUI();
    resetHideControlsTimer();
  };
  playBtn?.addEventListener('click', togglePlay);

  const toggleMute = () => {
    if (playerControlsState.isMuted) {
      playerControlsState.isMuted = false;
      const targetVol = playerControlsState.volume || 1;
      if (playerControlsState.isYt) {
        sendYtCommand('unMute');
        sendYtCommand('setVolume', [Math.round(targetVol * 100)]);
      } else if (videoEl) {
        videoEl.muted = false;
        videoEl.volume = targetVol;
      }
    } else {
      playerControlsState.isMuted = true;
      if (playerControlsState.isYt) {
        sendYtCommand('mute');
      } else if (videoEl) {
        videoEl.muted = true;
      }
    }
    updatePlayerControlsUI();
    resetHideControlsTimer();
  };
  muteBtn?.addEventListener('click', toggleMute);

  volSlider?.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    playerControlsState.volume = val;
    if (val === 0) {
      playerControlsState.isMuted = true;
      if (playerControlsState.isYt) {
        sendYtCommand('mute');
      } else if (videoEl) {
        videoEl.muted = true;
      }
    } else {
      playerControlsState.isMuted = false;
      if (playerControlsState.isYt) {
        sendYtCommand('unMute');
        sendYtCommand('setVolume', [Math.round(val * 100)]);
      } else if (videoEl) {
        videoEl.muted = false;
        videoEl.volume = val;
      }
    }
    updatePlayerControlsUI();
    resetHideControlsTimer();
  });

  fsBtn?.addEventListener('click', () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else if (playerContainer) {
      playerContainer.requestFullscreen().catch(() => {});
    }
  });

  // Theater Mode
  let isTheater = false;
  const theaterBtn = document.getElementById('orbit-ctrl-theater');
  const toggleTheater = () => {
    isTheater = !isTheater;
    if (playerContainer) {
      if (isTheater) {
        playerContainer.style.maxHeight = 'calc(100vh - 120px)';
        playerContainer.style.height = 'calc(100vh - 120px)';
        theaterBtn?.classList.add('active');
        store.showToast('Theater mode enabled (T)', 'info');
      } else {
        playerContainer.style.maxHeight = '';
        playerContainer.style.height = '';
        theaterBtn?.classList.remove('active');
      }
    }
  };
  theaterBtn?.addEventListener('click', toggleTheater);

  // Picture-in-Picture
  const pipBtn = document.getElementById('orbit-ctrl-pip');
  const togglePip = async () => {
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture().catch(() => {});
    } else if (videoEl && videoEl.requestPictureInPicture) {
      try {
        await videoEl.requestPictureInPicture();
      } catch (err) {
        store.showToast('Picture-in-Picture not available for this stream', 'info');
      }
    }
  };
  pipBtn?.addEventListener('click', togglePip);

  // DVR Rewind / Forward / Live edge sync buttons
  document.getElementById('orbit-ctrl-rewind-10')?.addEventListener('click', (e) => {
    e.stopPropagation();
    seekRelative(-10);
    resetHideControlsTimer();
  });

  document.getElementById('orbit-ctrl-forward-10')?.addEventListener('click', (e) => {
    e.stopPropagation();
    seekRelative(10);
    resetHideControlsTimer();
  });

  document.getElementById('orbit-ctrl-live-badge')?.addEventListener('click', (e) => {
    e.stopPropagation();
    jumpToLive();
    resetHideControlsTimer();
  });

  // DVR Timeline Scrubber & Tooltip wiring
  const scrubberArea = document.getElementById('orbit-dvr-scrubber-area');
  const dvrTooltip = document.getElementById('orbit-dvr-tooltip');
  let isScrubbing = false;

  const seekFromEvent = (e) => {
    if (!videoEl || !videoEl.seekable || videoEl.seekable.length === 0) return;
    const rect = scrubberArea.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const seekStart = videoEl.seekable.start(0);
    const seekEnd = videoEl.seekable.end(0);
    const target = seekStart + pct * (seekEnd - seekStart);
    videoEl.currentTime = Math.min(seekEnd - 0.5, target);
    updateDvrTimeline();
  };

  scrubberArea?.addEventListener('mousedown', (e) => {
    isScrubbing = true;
    seekFromEvent(e);
  });

  window.addEventListener('mousemove', (e) => {
    if (isScrubbing) {
      seekFromEvent(e);
    }
  });

  window.addEventListener('mouseup', () => {
    if (isScrubbing) {
      isScrubbing = false;
      resetHideControlsTimer();
    }
  });

  scrubberArea?.addEventListener('mousemove', (e) => {
    if (!videoEl || !videoEl.seekable || videoEl.seekable.length === 0) return;
    const rect = scrubberArea.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const seekStart = videoEl.seekable.start(0);
    const seekEnd = videoEl.seekable.end(0);
    const target = seekStart + pct * (seekEnd - seekStart);
    const diffFromLive = Math.round(seekEnd - target);

    if (dvrTooltip) {
      dvrTooltip.style.display = 'block';
      dvrTooltip.style.left = `${pct * 100}%`;
      dvrTooltip.textContent = diffFromLive <= 5 ? 'LIVE' : `-${formatDvrTime(diffFromLive)}`;
    }
  });

  scrubberArea?.addEventListener('mouseleave', () => {
    if (dvrTooltip) dvrTooltip.style.display = 'none';
  });

  // Keyboard controls for streaming (Kick & Twitch standard)
  const handleWatchKeydown = (e) => {
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) {
      return;
    }
    if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      togglePlay();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      seekRelative(-10);
      resetHideControlsTimer();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      seekRelative(10);
      resetHideControlsTimer();
    } else if (e.key === 'l' || e.key === 'L') {
      e.preventDefault();
      jumpToLive();
      resetHideControlsTimer();
    } else if (e.key === 'm' || e.key === 'M') {
      e.preventDefault();
      toggleMute();
    } else if (e.key === 'f' || e.key === 'F') {
      e.preventDefault();
      fsBtn?.click();
    } else if (e.key === 't' || e.key === 'T') {
      e.preventDefault();
      toggleTheater();
    } else if (e.key === 'p' || e.key === 'P') {
      e.preventDefault();
      togglePip();
    }
  };
  window.addEventListener('keydown', handleWatchKeydown);

  playerContainer?.addEventListener('mousemove', resetHideControlsTimer);
  playerContainer?.addEventListener('mouseenter', resetHideControlsTimer);
  playerContainer?.addEventListener('mouseleave', () => {
    const controls = document.getElementById('orbit-player-controls');
    if (controls && playerControlsState.isPlaying) {
      controls.style.opacity = '0';
    }
  });

  // Channel visit
  document.getElementById('watch-channel-info')?.addEventListener('click', () => {
    const activeS = store.getState().activeStream;
    if (activeS?.channelId) store.navigate('channel', { channelId: activeS.channelId });
  });

  // Guest login button
  document.getElementById('chat-login-btn')?.addEventListener('click', () => {
    store.navigate('login');
  });

  // Chat send
  const chatInput = document.getElementById('chat-input');
  const chatSend = document.getElementById('chat-send');
  if (chatInput && chatSend) {
    const sendMsg = async () => {
      const msg = chatInput.value.trim();
      const sid = currentStreamId || parseInt(streamId);
      if (!msg || !chatConnection || !sid) return;

      try {
        await chatConnection.invoke('SendMessage', sid, msg);
        chatInput.value = '';
      } catch (e) {
        store.showToast(e.message || 'Failed to send message', 'error');
      }
    };
    chatSend.addEventListener('click', sendMsg);
    chatInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendMsg(); });
  }
}

function setupFollowBtn(stream) {
  const followBtn = document.getElementById('watch-follow-btn');
  if (!followBtn || !stream?.channelId) return;

  const isFollowing = store.isFollowing(stream.channelId);
  followBtn.className = `btn btn-sm follow-btn ${isFollowing ? 'following' : 'not-following'}`;
  followBtn.innerHTML = isFollowing ? `${Icons.followFilled} Following` : `${Icons.follow} Follow`;
  followBtn.onclick = async () => {
    followBtn.disabled = true;
    const chName = stream.streamerName || stream.channelName || 'Streamer';
    const nowFollowing = await store.toggleFollow(stream.channelId, chName);
    followBtn.className = `btn btn-sm follow-btn ${nowFollowing ? 'following' : 'not-following'}`;
    followBtn.innerHTML = nowFollowing ? `${Icons.followFilled} Following` : `${Icons.follow} Follow`;
    store.showToast(nowFollowing ? `Following ${chName}!` : `Unfollowed ${chName}`, 'info');
    followBtn.disabled = false;
  };
}



function updateStreamUI(stream) {
  const titleEl = document.getElementById('watch-title');
  if (titleEl) titleEl.textContent = stream.title || 'Untitled Stream';

  const viewersEl = document.getElementById('viewer-count-num');
  if (viewersEl) viewersEl.textContent = stream.viewerCount || 0;

  const streamerEl = document.getElementById('watch-streamer');
  if (streamerEl) streamerEl.innerHTML = `<span>${escapeHtml(stream.streamerName || stream.channelName || 'Streamer')}</span> ${Icons.checkCircle}`;

  const avatarEl = document.getElementById('watch-avatar');
  if (avatarEl) {
    if (stream.thumbnailUrl && stream.thumbnailUrl.startsWith('http')) {
      avatarEl.innerHTML = `<img src="${stream.thumbnailUrl}" style="width:100%;height:100%;object-fit:cover;" />`;
    } else {
      avatarEl.textContent = (stream.streamerName || 'S')[0].toUpperCase();
    }
  }
}

async function initPlayer(stream) {
  const offlineEl = document.getElementById('player-offline');

  if (!stream?.hlsUrl) {
    if (offlineEl) {
      offlineEl.classList.remove('hidden');
      const p = offlineEl.querySelector('p');
      const currentUser = getCurrentUser();
      const isOwner = currentUser && stream && (
        stream.streamerId === currentUser.id ||
        stream.streamerName === currentUser.fullName ||
        stream.channelId === currentUser.channelId
      );
      if (p) {
        p.textContent = isOwner
          ? 'Stream session ready. Click "Start Streaming" in OBS to go live.'
          : 'The broadcaster is not currently streaming.';
      }
    }

    // Auto-poll for stream starting in the background
    if (stream?.id && !offlinePollTimer) {
      offlinePollTimer = setInterval(async () => {
        try {
          const fresh = await streamApi.getStreamById(stream.id);
          if (fresh && fresh.isLive && fresh.hlsUrl) {
            clearInterval(offlinePollTimer);
            offlinePollTimer = null;
            store.state.activeStream = fresh;
            updateStreamUI(fresh);
            initPlayer(fresh);
          }
        } catch (_) {}
      }, 3000);
    }
    return;
  }

  if (offlinePollTimer) {
    clearInterval(offlinePollTimer);
    offlinePollTimer = null;
  }

  // Check for simulated YouTube live broadcast
  const ytUrl = stream?.youtubeUrl || (stream?.hlsUrl && (stream.hlsUrl.includes('youtube.com') || stream.hlsUrl.includes('youtu.be')) ? stream.hlsUrl : null);
  if (stream?.isSimulated || ytUrl) {
    const match = ytUrl ? ytUrl.match(/(?:v=|\/live\/|\/embed\/|youtu\.be\/|\/v\/)([^?&/]+)/) : null;
    const videoId = match ? match[1] : null;
    if (videoId) {
      if (activeHls) {
        activeHls.destroy();
        activeHls = null;
      }
      const vid = document.getElementById('stream-video');
      if (vid) {
        vid.pause();
        vid.style.display = 'none';
      }
      const unmuteBtn = document.getElementById('player-unmute-btn');
      if (unmuteBtn) unmuteBtn.style.display = 'none';
      offlineEl?.classList.add('hidden');

      let ytFrame = document.getElementById('youtube-player-frame');
      if (!ytFrame) {
        ytFrame = document.createElement('iframe');
        ytFrame.id = 'youtube-player-frame';
        ytFrame.style.cssText = 'width:100%;height:100%;border:none;position:absolute;inset:0;z-index:2;pointer-events:none;';
        ytFrame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
        ytFrame.allowFullscreen = true;
        document.getElementById('player-container')?.appendChild(ytFrame);
      }
      // Authentic Orbit embed: hide YouTube controls, annotations, related videos, keyboard shortcuts, branding
      const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
      ytFrame.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&fs=0&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(currentOrigin)}`;
      ytFrame.style.display = 'block';

      playerControlsState.isYt = true;
      playerControlsState.isPlaying = true;
      playerControlsState.isMuted = false;
      updatePlayerControlsUI();
      resetHideControlsTimer();
      return;
    }
  }

  // Not YouTube simulated: clean up any existing iframe and restore video element
  const oldYt = document.getElementById('youtube-player-frame');
  if (oldYt) {
    oldYt.remove();
  }

  let hlsSource = stream.hlsUrl;
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    hlsSource = hlsSource
      .replace('http://localhost:8080', 'https://localhost:8443')
      .replace('http://127.0.0.1:8080', 'https://localhost:8443');
  }

  const video = document.getElementById('stream-video');
  if (!video) return;
  video.style.display = 'block';

  if (activeHls) {
    activeHls.destroy();
    activeHls = null;
  }

  const unmuteBtn = document.getElementById('player-unmute-btn');

  video.muted = true;
  video.playsInline = true;

  if (unmuteBtn) {
    unmuteBtn.style.display = 'flex';
    unmuteBtn.onclick = () => {
      video.muted = false;
      unmuteBtn.style.display = 'none';
    };
  }

  try {
    const Hls = (await import('hls.js')).default;
    if (Hls.isSupported()) {
      const hls = new Hls({
        xhrSetup: (xhr) => {
          xhr.setRequestHeader('ngrok-skip-browser-warning', 'true');
        },
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 14400,
        liveBackBufferLength: 14400,
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 10,
        manifestLoadingMaxRetry: 10,
        manifestLoadingRetryDelay: 1500
      });

      activeHls = hls;
      hls.loadSource(hlsSource);
      hls.attachMedia(video);

      video.ontimeupdate = updateDvrTimeline;
      video.onprogress = updateDvrTimeline;
      video.onseeking = updateDvrTimeline;
      video.onseeked = updateDvrTimeline;

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        offlineEl?.classList.add('hidden');
        playerControlsState.isYt = false;
        playerControlsState.isPlaying = true;
        playerControlsState.isMuted = video.muted;
        updatePlayerControlsUI();
        resetHideControlsTimer();
        video.play().catch(e => {
          console.warn('[WatchRoom] Autoplay blocked, click video or unmute to play', e);
        });
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          console.warn('[WatchRoom] HLS fatal error:', data.type, data.details);
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              // Give NGINX 2 seconds before retrying manifest while initial chunk is written
              if (manifestRetryTimer) clearTimeout(manifestRetryTimer);
              manifestRetryTimer = setTimeout(() => {
                if (activeHls) {
                  activeHls.startLoad();
                }
              }, 2000);
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              offlineEl?.classList.remove('hidden');
              hls.destroy();
              activeHls = null;
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = hlsSource;
      video.addEventListener('loadedmetadata', () => {
        offlineEl?.classList.add('hidden');
        video.play().catch(() => {});
      });
    }
  } catch (e) {
    console.warn('[WatchRoom] HLS init failed', e);
    offlineEl?.classList.remove('hidden');
  }
}

async function initChat(channelId, streamId) {
  const statusEl = document.getElementById('chat-status');
  const messagesEl = document.getElementById('chat-messages');
  const scrollBottomBtn = document.getElementById('chat-scroll-bottom');
  if (!streamId || !messagesEl) return;

  const currentUser = getCurrentUser();
  const isModOrStreamer = currentUser && (
    currentUser.roles?.includes('Admin') ||
    currentUser.roles?.includes('Moderator') ||
    currentUser.roles?.includes('Streamer')
  );

  // Load chat history from REST API
  try {
    const history = await chatApi.getStreamChat(streamId);
    if (Array.isArray(history)) {
      messagesEl.innerHTML = history.map(m => createMessageHtml(m, isModOrStreamer)).join('');
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
  } catch (e) {
    console.warn('Could not load chat history:', e);
  }

  // Smart scroll handling
  let isAtBottom = true;
  messagesEl.addEventListener('scroll', () => {
    isAtBottom = messagesEl.scrollHeight - messagesEl.clientHeight <= messagesEl.scrollTop + 60;
    if (scrollBottomBtn) {
      scrollBottomBtn.style.display = isAtBottom ? 'none' : 'block';
    }
  });

  scrollBottomBtn?.addEventListener('click', () => {
    messagesEl.scrollTop = messagesEl.scrollHeight;
    scrollBottomBtn.style.display = 'none';
  });

  // Attach mod action delegation
  messagesEl.addEventListener('click', async (e) => {
    const delBtn = e.target.closest('.btn-del-msg');
    if (delBtn) {
      const mid = parseInt(delBtn.dataset.msgId);
      if (!confirm('Delete this message?')) return;
      try {
        if (chatConnection) {
          await chatConnection.invoke('DeleteMessage', streamId, mid);
        } else {
          await moderationApi.deleteMessage(channelId, mid);
        }
        store.showToast('Message deleted', 'info');
      } catch (err) {
        store.showToast(err.message || 'Failed to delete message', 'error');
      }
      return;
    }

    const timeoutBtn = e.target.closest('.btn-timeout-user');
    if (timeoutBtn) {
      const uname = timeoutBtn.dataset.username;
      if (!confirm(`Timeout ${uname} for 5 minutes?`)) return;
      try {
        await moderationApi.timeoutUser(channelId, { username: uname, durationSeconds: 300, reason: 'Chat violation' });
        store.showToast(`${uname} timed out for 5 minutes`, 'info');
      } catch (err) {
        store.showToast(err.message || 'Failed to timeout user', 'error');
      }
      return;
    }

    const banBtn = e.target.closest('.btn-ban-user');
    if (banBtn) {
      const uname = banBtn.dataset.username;
      if (!confirm(`Permanently ban ${uname} from this channel's chat?`)) return;
      try {
        await moderationApi.banUser(channelId, { username: uname, reason: 'Chat violation' });
        store.showToast(`${uname} banned from chat`, 'info');
      } catch (err) {
        store.showToast(err.message || 'Failed to ban user', 'error');
      }
    }
  });

  // SignalR connection setup
  try {
    const token = getAuthToken();
    chatConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE}/hubs/stream-chat`, {
        accessTokenFactory: () => token || ''
      })
      .withAutomaticReconnect()
      .build();

    chatConnection.on('ReceiveMessage', (msg) => {
      const div = document.createElement('div');
      div.innerHTML = createMessageHtml(msg, isModOrStreamer);
      const child = div.firstElementChild;
      if (child) messagesEl.appendChild(child);

      if (isAtBottom) {
        messagesEl.scrollTop = messagesEl.scrollHeight;
      } else if (scrollBottomBtn) {
        scrollBottomBtn.style.display = 'block';
      }
    });

    chatConnection.on('MessageDeleted', (messageId) => {
      const target = messagesEl.querySelector(`[data-msg-id="${messageId}"]`);
      if (target) {
        target.innerHTML = `<span style="color:var(--color-text-muted);font-style:italic;font-size:12px;opacity:0.7;">&lt;message deleted by moderator&gt;</span>`;
      }
    });

    chatConnection.on('ViewerCountUpdate', (sid, count) => {
      if (sid === streamId) {
        const viewersNum = document.getElementById('viewer-count-num');
        if (viewersNum) viewersNum.textContent = count;
      }
    });

    chatConnection.on('StreamUpdated', (data) => {
      if (data && data.streamId === streamId) {
        const titleEl = document.getElementById('watch-title');
        if (titleEl && data.title) titleEl.textContent = data.title;
        const catBadge = document.querySelector('#watch-meta .badge-category');
        if (catBadge && data.categoryName) catBadge.textContent = data.categoryName;
      }
    });

    chatConnection.on('UserTimedOut', (username, durationSeconds) => {
      const div = document.createElement('div');
      div.style.cssText = 'color:#f59e0b;font-style:italic;font-size:11px;padding:3px 8px;background:rgba(245,158,11,0.08);border-radius:4px;';
      div.textContent = `⏳ ${username} was timed out (${durationSeconds}s)`;
      messagesEl.appendChild(div);
      if (isAtBottom) messagesEl.scrollTop = messagesEl.scrollHeight;
    });

    chatConnection.on('UserBanned', (username) => {
      const div = document.createElement('div');
      div.style.cssText = 'color:#ef4444;font-style:italic;font-size:11px;padding:3px 8px;background:rgba(239,68,68,0.08);border-radius:4px;';
      div.textContent = `🚫 ${username} was banned from chat`;
      messagesEl.appendChild(div);
      if (isAtBottom) messagesEl.scrollTop = messagesEl.scrollHeight;
    });

    chatConnection.on('Error', (errorMsg) => {
      store.showToast(errorMsg, 'error');
    });

    chatConnection.onreconnecting((err) => {
      console.warn('[Chat] SignalR reconnecting:', err);
      if (statusEl) {
        statusEl.textContent = 'Reconnecting...';
        statusEl.style.color = '#f59e0b';
      }
    });

    chatConnection.onreconnected(() => {
      console.log('[Chat] SignalR reconnected');
      if (statusEl) {
        statusEl.textContent = 'Connected';
        statusEl.style.color = 'var(--color-success, #10b981)';
      }
      chatConnection.invoke('JoinStream', streamId).catch(console.warn);
    });

    chatConnection.onclose((err) => {
      console.warn('[Chat] SignalR connection closed:', err);
      if (statusEl) {
        statusEl.textContent = 'Disconnected';
        statusEl.style.color = 'var(--color-error, #ef4444)';
      }
    });

    // Real-time broadcast when the streamer starts or restarts OBS
    chatConnection.on('StreamStarted', (data) => {
      console.log('[WatchRoom] SignalR StreamStarted received:', data);
      if (data && (data.streamId === streamId || !streamId)) {
        if (offlinePollTimer) {
          clearInterval(offlinePollTimer);
          offlinePollTimer = null;
        }
        const activeS = store.getState().activeStream || {};
        const updated = {
          ...activeS,
          ...data,
          isLive: true,
          hlsUrl: data.hlsUrl || activeS.hlsUrl
        };
        store.state.activeStream = updated;
        updateStreamUI(updated);
        initPlayer(updated);
        store.showToast('The stream is now LIVE!', 'success');
      }
    });

    chatConnection.on('StreamEnded', (sid) => {
      if (sid === streamId) {
        if (activeHls) { activeHls.destroy(); activeHls = null; }
        document.getElementById('player-offline')?.classList.remove('hidden');
        const meta = document.getElementById('watch-meta');
        const badge = meta?.querySelector('.badge-live');
        if (badge) badge.style.display = 'none';
        store.showToast('Live stream has ended.', 'info');
      }
    });

    await chatConnection.start();
    await chatConnection.invoke('JoinStream', streamId);
    if (statusEl) {
      statusEl.textContent = 'Connected';
      statusEl.style.color = 'var(--color-success, #10b981)';
    }
  } catch (e) {
    console.warn('Chat connection failed:', e);
    if (statusEl) {
      statusEl.textContent = 'Disconnected';
      statusEl.style.color = 'var(--color-error, #ef4444)';
    }
  }
}

function createMessageHtml(msg, isModOrStreamer) {
  const sender = msg.senderName || msg.SenderName || msg.username || 'Viewer';
  const badge = msg.senderBadge || msg.SenderBadge;
  const content = msg.content || msg.Content || '';
  const mid = msg.id || msg.Id;
  const sentAt = msg.sentAt || msg.SentAt;
  const timeStr = sentAt ? new Date(sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  return `
    <div class="chat-msg chat-msg-animate" data-msg-id="${mid || ''}" style="display:flex;align-items:flex-start;justify-content:space-between;padding:4px 6px;border-radius:6px;gap:6px;">
      <div style="flex:1;word-break:break-word;font-size:13px;line-height:1.4;">
        <span style="font-size:10px;color:var(--color-text-muted);margin-right:4px;opacity:0.6;">${timeStr}</span>
        ${badge ? `<span style="font-size:12px;margin-right:4px;">${badge}</span>` : ''}
        <span class="chat-user" style="font-weight:700;color:var(--color-cyan-neon,#00f2fe);margin-right:4px;">${escapeHtml(sender)}:</span>
        <span class="chat-text" style="color:var(--color-text,#fff);">${escapeHtml(content)}</span>
      </div>
      ${isModOrStreamer && mid ? `
        <div class="chat-msg-actions" style="display:flex;gap:2px;opacity:0.4;transition:opacity 0.2s;" onmouseenter="this.style.opacity=1" onmouseleave="this.style.opacity=0.4">
          <button class="btn btn-ghost btn-del-msg" data-msg-id="${mid}" title="Delete" style="padding:2px 4px;font-size:10px;color:#ef4444;border:none;background:none;cursor:pointer;">
            ${Icons.trash}
          </button>
          <button class="btn btn-ghost btn-timeout-user" data-username="${escapeHtml(sender)}" title="Timeout (5m)" style="padding:2px 4px;font-size:10px;color:#f59e0b;border:none;background:none;cursor:pointer;">
            ⏱
          </button>
          <button class="btn btn-ghost btn-ban-user" data-username="${escapeHtml(sender)}" title="Ban" style="padding:2px 4px;font-size:10px;color:#ef4444;border:none;background:none;cursor:pointer;">
            🚫
          </button>
        </div>
      ` : ''}
    </div>
  `;
}

function showSliceModal(streamId, channelId) {
  const root = document.getElementById('modal-root') || document.body;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'slice-overlay';
  overlay.innerHTML = `
    <div class="modal-content" style="max-width:440px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h3 style="margin:0;font-size:18px;">${Icons.clip} Create Highlight Clip</h3>
        <button id="slice-close-x" style="background:none;border:none;color:#fff;font-size:20px;cursor:pointer;">&times;</button>
      </div>
      <div class="form-group" style="margin-bottom:14px;">
        <label style="color:var(--color-text-muted);font-size:12px;font-weight:600;">Clip Title</label>
        <input class="input-dark" id="slice-title" placeholder="Epic play or funny moment" style="margin-top:4px;" />
      </div>
      <div class="form-group" style="margin-bottom:20px;">
        <label style="color:var(--color-text-muted);font-size:12px;font-weight:600;">Duration (seconds, max 300)</label>
        <input class="input-dark" type="number" id="slice-duration" value="60" min="10" max="300" style="margin-top:4px;" />
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end;">
        <button id="slice-cancel" class="btn btn-ghost btn-sm">Cancel</button>
        <button id="slice-confirm" class="btn btn-cyan btn-sm">Create Clip</button>
      </div>
    </div>
  `;

  root.appendChild(overlay);

  const close = () => { overlay.remove(); store.closeModal(); };
  overlay.querySelector('#slice-close-x')?.addEventListener('click', close);
  overlay.querySelector('#slice-cancel')?.addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  overlay.querySelector('#slice-confirm')?.addEventListener('click', async () => {
    const btn = overlay.querySelector('#slice-confirm');
    btn.disabled = true;
    btn.textContent = 'Generating...';
    try {
      const activeS = store.getState().activeStream;
      const sIdNum = parseInt(streamId) || activeS?.id;
      const chIdNum = channelId ? parseInt(channelId) : (activeS?.channelId || activeS?.channel?.id);
      const streamKey = activeS?.channel?.streamKey || activeS?.streamKey || '';
      const isLive = activeS?.isLive ?? true;
      const recordingFileName = activeS?.recordingFileName || activeS?.videoUrl || null;
      const categoryId = activeS?.categoryId || activeS?.category?.id || null;

      await clipApi.slice({
        streamId: sIdNum,
        liveStreamId: sIdNum,
        channelId: chIdNum,
        streamKey,
        isLive,
        recordingFileName,
        categoryId,
        title: overlay.querySelector('#slice-title').value.trim() || 'Untitled Clip',
        durationSeconds: parseInt(overlay.querySelector('#slice-duration').value) || 60
      });
      store.showToast('Clip created successfully!', 'success');
      close();
    } catch (e) {
      store.showToast(e.message || 'Failed to create clip', 'error');
      btn.disabled = false;
      btn.textContent = 'Create Clip';
    }
  });
}