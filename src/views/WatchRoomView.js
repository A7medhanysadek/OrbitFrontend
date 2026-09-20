import { store } from '../state/store.js';
import { streamApi } from '../api/stream.js';
import { channelApi } from '../api/channel.js';
import { clipApi } from '../api/clip.js';
import { chatApi } from '../api/chat.js';
import { moderationApi } from '../api/moderation.js';
import { Icons } from '../components/CosmicIcons.js';
import { API_BASE, getAuthToken, getCurrentUser } from '../api/client.js';
import { OrbitEmotes, getEmoteSvg, getAllPresets, renderEmoteVisual } from '../components/OrbitEmotes.js';
import * as signalR from '@microsoft/signalr';

// Active channel emotes dynamically loaded for the current stream's channel
let activeChannelEmotes = [];
let isEmotesOnlyMode = false;

function updateEmotesOnlyUI(enabled) {
  isEmotesOnlyMode = enabled;
  const btn = document.getElementById('chat-emotes-only-toggle');
  const input = document.getElementById('chat-input');
  if (btn) {
    if (enabled) {
      btn.style.background = 'rgba(0,242,254,0.2)';
      btn.style.borderColor = 'var(--color-cyan-neon, #00f2fe)';
      btn.style.color = 'var(--color-cyan-neon, #00f2fe)';
      btn.style.boxShadow = '0 0 10px rgba(0,242,254,0.3)';
      btn.title = 'Emotes Only Mode: ON — Click to disable';
    } else {
      btn.style.background = 'rgba(255,255,255,0.06)';
      btn.style.borderColor = 'rgba(255,255,255,0.12)';
      btn.style.color = 'var(--color-text-muted)';
      btn.style.boxShadow = 'none';
      btn.title = 'Toggle Emotes Only Mode';
    }
  }
  if (input) {
    input.setAttribute('data-placeholder', enabled ? '🎭 Emotes Only: click 😊 or emotes to chat...' : 'Type a message... (e.g. :code:)');
  }
}

function parseChatContent(text) {
  if (!text) return '';
  let parsed = escapeHtml(text);
  if (!Array.isArray(activeChannelEmotes) || activeChannelEmotes.length === 0) {
    return parsed;
  }

  for (const emote of activeChannelEmotes) {
    const shortcode = `:${emote.name}:`;
    if (parsed.includes(shortcode)) {
      const visualHtml = renderEmoteVisual(emote, 22);
      const emoteHtml = `<span class="orbit-chat-emote" title="${shortcode}" style="display:inline-flex;vertical-align:middle;margin:-2px 2px 0 2px;">${visualHtml}</span>`;
      parsed = parsed.replaceAll(shortcode, emoteHtml);
    }
  }
  return parsed;
}

function getRoleBadge(msg, senderName) {
  const activeS = store.getState().activeStream;
  const isBroadcaster = activeS && (
    senderName === activeS.streamerName ||
    senderName === activeS.channelName ||
    senderName === activeS.channel?.ownerUsername
  );
  const badge = String(msg?.senderBadge || msg?.SenderBadge || '');
  const role = String(msg?.senderRole || msg?.SenderRole || '').toLowerCase();

  if (isBroadcaster || badge.includes('👑') || role === 'broadcaster' || role === 'streamer') {
    return `<span class="chat-role-badge badge-broadcaster" title="Broadcaster" style="background:linear-gradient(135deg,#FFD700,#FFA500);color:#000;font-size:10px;font-weight:800;padding:2px 5px;border-radius:4px;display:inline-flex;align-items:center;gap:2px;box-shadow:0 0 6px rgba(255,215,0,0.5);margin-right:4px;">👑 HOST</span>`;
  }
  if (badge.includes('🛡️') || role === 'moderator' || role === 'mod') {
    return `<span class="chat-role-badge badge-mod" title="Moderator" style="background:linear-gradient(135deg,#10B981,#059669);color:#fff;font-size:10px;font-weight:800;padding:2px 5px;border-radius:4px;display:inline-flex;align-items:center;gap:2px;box-shadow:0 0 6px rgba(16,185,129,0.4);margin-right:4px;">🛡️ MOD</span>`;
  }
  if (badge.includes('⚡') || role === 'admin') {
    return `<span class="chat-role-badge badge-admin" title="Orbit Admin" style="background:linear-gradient(135deg,#7928CA,#4C1D95);color:#fff;font-size:10px;font-weight:800;padding:2px 5px;border-radius:4px;display:inline-flex;align-items:center;gap:2px;box-shadow:0 0 6px rgba(121,40,202,0.4);margin-right:4px;">⚡ ADMIN</span>`;
  }
  if (badge.includes('💎') || role === 'vip') {
    return `<span class="chat-role-badge badge-vip" title="VIP" style="background:linear-gradient(135deg,#00f2fe,#00AEBD);color:#000;font-size:10px;font-weight:800;padding:2px 5px;border-radius:4px;display:inline-flex;align-items:center;gap:2px;box-shadow:0 0 6px rgba(0,242,254,0.4);margin-right:4px;">💎 VIP</span>`;
  }
  if (badge) {
    return `<span style="font-size:11px;margin-right:4px;">${escapeHtml(badge)}</span>`;
  }
  return '';
}

function getSenderColor(isBroadcaster, role) {
  const r = String(role || '').toLowerCase();
  if (isBroadcaster) return '#FFD700';
  if (r === 'moderator' || r === 'mod') return '#10B981';
  if (r === 'admin') return '#c084fc';
  return 'var(--color-cyan-neon, #00f2fe)';
}

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
    } catch (_) { }
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
  video.play().catch(() => { });
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

export function checkModerationPrivileges(user, stream) {
  if (!user) return false;
  const roles = Array.isArray(user.roles) ? user.roles : (user.role ? [user.role] : []);
  if (roles.some(r => /^(admin|moderator|mod|streamer)$/i.test(r))) return true;
  if (user.isAdmin || user.isModerator) return true;
  if (stream) {
    const uName = user.username?.toLowerCase() || '';
    if (uName && (
      uName === stream.streamerName?.toLowerCase() ||
      uName === stream.channelName?.toLowerCase() ||
      uName === stream.channel?.ownerUsername?.toLowerCase()
    )) return true;
    if (user.id && (user.id === stream.userId || user.id === stream.streamerId || user.id === stream.channel?.ownerId)) return true;
    if (user.channelId && (user.channelId === stream.channelId || user.channelId === stream.channel?.id)) return true;
  }
  return false;
}

export function renderWatchRoomView() {
  const stream = store.getState().activeStream;
  const currentUser = getCurrentUser();
  const title = stream?.title || 'Loading...';
  const isModOrStreamer = checkModerationPrivileges(currentUser, stream);

  return `
    <div id="watch-room-root" class="watch-room-root watch-layout" style="display:flex;gap:0;margin:-24px;height:calc(100vh - var(--topbar-height));max-height:calc(100vh - var(--topbar-height));overflow:hidden;">
      <!-- Video + Info Column -->
      <div class="watch-main" style="flex:1;display:flex;flex-direction:column;overflow-y:auto;height:100%;min-width:0;">
        <div class="player-wrapper player-container" id="player-container" style="position:relative;border-radius:0;aspect-ratio:16/9;background:#000;overflow:hidden;">
          <video id="stream-video" style="width:100%;height:100%;background:#000;" autoplay playsinline></video>

          <!-- Interaction Shield: Captures 100% of mouse/hover interactions so YouTube iframe never shows hover options -->
          <div id="orbit-player-shield" style="position:absolute;inset:0;z-index:4;cursor:pointer;background:rgba(0,0,0,0.001);pointer-events:auto;"></div>

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
            <div style="width:50px;height:50px;border-radius:50%;background:linear-gradient(135deg,var(--color-cyan-primary),var(--color-cyan-neon));display:flex;align-items:center;justify-content:center;font-weight:700;font-size:20px;color:#000;overflow:hidden;flex-shrink:0;" id="watch-avatar">
              ${(stream?.profilePictureUrl || stream?.channelPhotoUrl) ? `<img src="${stream.profilePictureUrl || stream.channelPhotoUrl}" style="width:100%;height:100%;object-fit:cover;" />` : (stream?.streamerName || stream?.channelName || 'S')[0].toUpperCase()}
            </div>
            <div style="flex:1;overflow:hidden;">
              <div style="font-weight:600;font-size:16px;display:flex;align-items:center;gap:6px;" id="watch-streamer">
                <span>${escapeHtml(stream?.streamerName || 'Streamer')}</span> ${Icons.checkCircle}
              </div>
              <div style="font-size:13px;color:var(--color-text-muted);" id="watch-desc">Click to visit channel profile</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Enhanced Kick/Twitch Style Stream Chat Panel -->
      <div class="chat-panel watch-chat-sidebar" style="width:var(--chat-width, 340px);flex-shrink:0;display:flex;flex-direction:column;border-left:1px solid rgba(255,255,255,0.08);background:var(--color-space-panel, #0f1424);height:100%;max-height:100%;overflow:hidden;position:relative;">
        <div class="chat-header" style="height:48px;min-height:48px;max-height:48px;flex-shrink:0;box-sizing:border-box;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,0.08);background:rgba(4,7,18,0.4);">
          <div style="display:flex;align-items:center;gap:8px;font-weight:700;font-size:14px;color:var(--color-text-primary,#fff);">
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--color-cyan-neon);box-shadow:0 0 8px var(--color-cyan-neon);"></span>
            <span>Stream Chat</span>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            ${isModOrStreamer ? `
              <button id="chat-emotes-only-toggle" title="Toggle Emotes Only Mode (Moderator)" style="display:flex;align-items:center;gap:4px;padding:3px 8px;border-radius:6px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:var(--color-text-muted);font-size:10px;font-weight:700;cursor:pointer;transition:all 0.2s;text-transform:uppercase;letter-spacing:0.03em;">
                <span style="font-size:12px;">🎭</span> Emotes Only
              </button>
            ` : ''}
            <span style="font-size:11px;font-weight:600;color:var(--color-text-muted);" id="chat-status">Connecting...</span>
          </div>
        </div>

        <!-- Floating Moderation Popover (Twitch/Kick style) -->
        <div id="chat-mod-popover" style="display:none;position:absolute;z-index:30;background:rgba(12,16,28,0.98);border:1px solid rgba(0,242,254,0.35);border-radius:10px;padding:12px;box-shadow:0 12px 36px rgba(0,0,0,0.8);backdrop-filter:blur(16px);min-width:220px;animation:fade-in 0.15s ease-out;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,0.08);">
            <div style="display:flex;align-items:center;gap:6px;">
              <span id="mod-popover-badge" style="font-size:13px;" title="Viewer">👤</span>
              <span id="mod-popover-username" style="font-size:12px;font-weight:700;color:var(--color-cyan-neon);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:140px;">User</span>
            </div>
            <button id="chat-mod-popover-close" style="background:none;border:none;color:var(--color-text-muted);cursor:pointer;font-size:14px;padding:2px 6px;">✕</button>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px;">
            <button id="mod-act-hire" class="btn btn-sm" style="justify-content:flex-start;gap:8px;background:rgba(0,242,254,0.12);color:var(--color-cyan-neon);border:1px solid rgba(0,242,254,0.3);padding:6px 10px;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;width:100%;transition:all 0.15s;">
              🛡️ Hire as Moderator
            </button>
            <button id="mod-act-view-channel" class="btn btn-sm" style="justify-content:flex-start;gap:8px;background:rgba(255,255,255,0.06);color:var(--color-text-primary,#fff);border:1px solid rgba(255,255,255,0.12);padding:6px 10px;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;width:100%;transition:all 0.15s;">
              🪐 View Channel Profile
            </button>
            <button id="mod-act-delete" class="btn btn-sm" style="justify-content:flex-start;gap:8px;background:rgba(255,255,255,0.06);color:#fca5a5;border:1px solid rgba(255,255,255,0.12);padding:6px 10px;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;width:100%;transition:all 0.15s;">
              🗑️ Delete Message
            </button>
            <button id="mod-act-timeout" class="btn btn-sm" style="justify-content:flex-start;gap:8px;background:rgba(245,158,11,0.15);color:#fbbf24;border:1px solid rgba(245,158,11,0.35);padding:6px 10px;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;width:100%;transition:all 0.15s;">
              ⏱️ Timeout User (5m)
            </button>
            <button id="mod-act-ban" class="btn btn-sm" style="justify-content:flex-start;gap:8px;background:rgba(239,68,68,0.18);color:#f87171;border:1px solid rgba(239,68,68,0.4);padding:6px 10px;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;width:100%;transition:all 0.15s;">
              🚫 Ban from Channel
            </button>
          </div>
        </div>

        <div class="chat-messages" id="chat-messages" style="flex:1 1 0%;min-height:0;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:4px;scroll-behavior:smooth;">
          <div class="chat-guidelines-banner" style="background:rgba(0,242,254,0.06);border:1px solid rgba(0,242,254,0.18);border-radius:8px;padding:10px 12px;margin-bottom:8px;font-size:12px;color:var(--color-text-muted);display:flex;align-items:flex-start;gap:8px;">
            <span style="font-size:16px;">🚀</span>
            <div style="flex:1;line-height:1.4;">
              <strong style="color:var(--color-text-primary,#fff);display:block;margin-bottom:2px;font-size:12px;">Welcome to Orbit Chat!</strong>
              Be respectful, support the broadcaster, and have fun.
            </div>
          </div>
        </div>

        <!-- Floating scroll-to-bottom indicator -->
        <button id="chat-scroll-bottom" style="display:none;position:absolute;bottom:110px;left:50%;transform:translateX(-50%);background:rgba(0,242,254,0.95);color:#000;font-size:11px;font-weight:700;border:none;border-radius:20px;padding:5px 14px;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,0.6);z-index:10;">
          ↓ New Messages
        </button>

        <!-- Quick Reactions Bar (Bound exclusively to Channel Emotes) -->
        <div class="chat-quick-reactions" id="chat-quick-reactions" style="height:38px;min-height:38px;max-height:38px;flex-shrink:0;box-sizing:border-box;display:flex;align-items:center;gap:6px;padding:6px 12px;background:rgba(0,0,0,0.25);border-top:1px solid rgba(255,255,255,0.06);overflow-x:auto;">
          <span style="font-size:10px;font-weight:700;color:var(--color-text-muted);letter-spacing:0.04em;text-transform:uppercase;margin-right:2px;white-space:nowrap;">React:</span>
          <div id="chat-quick-reactions-pills" style="display:inline-flex;align-items:center;gap:6px;overflow-x:auto;">
            <span style="font-size:11px;color:var(--color-text-muted);font-style:italic;">Loading channel emotes...</span>
          </div>
        </div>

        <!-- Channel Emote Picker Popover -->
        <div id="chat-emote-picker" style="display:none;position:absolute;bottom:100px;right:12px;left:12px;background:rgba(12,16,28,0.96);border:1px solid rgba(0,242,254,0.3);border-radius:10px;padding:12px;box-shadow:0 12px 36px rgba(0,0,0,0.6);backdrop-filter:blur(16px);z-index:20;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,0.08);">
            <span style="font-size:12px;font-weight:700;color:var(--color-cyan-neon);display:flex;align-items:center;gap:6px;">
              <span>✨</span> Channel Emotes
            </span>
            <button id="chat-emote-picker-close" style="background:none;border:none;color:var(--color-text-muted);cursor:pointer;font-size:14px;">✕</button>
          </div>
          <div id="chat-emote-picker-grid" style="display:grid;grid-template-columns:repeat(4, 1fr);gap:8px;max-height:160px;overflow-y:auto;padding:4px;">
            <div style="grid-column:1/-1;text-align:center;padding:16px 8px;font-size:11px;color:var(--color-text-muted);">
              Loading emotes...
            </div>
          </div>
        </div>

        <!-- Real-Time Emote Autocomplete Popover -->
        <div id="chat-autocomplete-popover" style="display:none;position:absolute;bottom:75px;left:12px;right:12px;max-height:160px;background:rgba(12,16,28,0.98);border:1px solid rgba(0,242,254,0.35);border-radius:10px;padding:6px;overflow-y:auto;box-shadow:0 8px 30px rgba(0,0,0,0.7);z-index:25;backdrop-filter:blur(16px);"></div>

        <!-- Real-Time Emote Logo Visualizer Strip (Floating overlay above input) -->
        <div id="chat-emote-visualizer" style="display:none;position:absolute;bottom:68px;left:12px;right:12px;z-index:20;padding:6px 12px;background:rgba(12,16,28,0.95);border:1px solid rgba(0,242,254,0.3);border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,0.6);backdrop-filter:blur(12px);align-items:center;gap:8px;overflow-x:auto;">
          <span style="font-size:10px;font-weight:700;color:var(--color-cyan-neon);text-transform:uppercase;letter-spacing:0.04em;white-space:nowrap;display:flex;align-items:center;gap:4px;">
            <span>✨</span> Active Emotes:
          </span>
          <div id="chat-emote-visualizer-items" style="display:flex;align-items:center;gap:6px;flex-wrap:nowrap;"></div>
        </div>

        <div class="chat-input-area" style="height:60px;min-height:60px;max-height:60px;flex-shrink:0;box-sizing:border-box;padding:10px 12px;border-top:1px solid rgba(255,255,255,0.08);background:rgba(0,0,0,0.25);display:flex;align-items:center;">
          ${currentUser ? `
            <div style="width:100%;display:flex;gap:6px;align-items:center;position:relative;">
              <div id="chat-input" contenteditable="true" role="textbox" aria-multiline="false" spellcheck="false" data-placeholder="Type a message... (e.g. :code:)" class="input-dark chat-rich-input" style="flex:1 1 0%;min-width:0;width:0;height:40px;min-height:40px;max-height:40px;overflow-x:auto;overflow-y:hidden;white-space:nowrap;word-break:normal;padding:8px 12px;font-size:13px;border-radius:8px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);outline:none;line-height:22px;box-sizing:border-box;"></div>
              <button id="chat-emote-btn" type="button" title="Channel Emotes" style="width:38px;height:38px;border-radius:8px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:var(--color-cyan-neon);display:flex;align-items:center;justify-content:center;font-size:18px;cursor:pointer;transition:all 0.15s;flex-shrink:0;">
                😊
              </button>
              <button id="chat-send" class="btn btn-cyan btn-sm" style="height:38px;padding:0 14px;border-radius:8px;flex-shrink:0;">
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
    if (currentStreamId) chatConnection.invoke('LeaveStream', currentStreamId).catch(() => { });
    chatConnection.stop().catch(() => { });
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
    loadChannelEmotes(s.channelId);

    if (s.channelId) {
      channelApi.getById(s.channelId).then(ch => {
        if (!ch) return;
        const photo = ch.profilePhotoUrl || ch.ownerProfilePictureUrl;
        const avatarEl = document.getElementById('watch-avatar');
        if (avatarEl && photo && photo.startsWith('http')) {
          avatarEl.innerHTML = `<img src="${photo}" style="width:100%;height:100%;object-fit:cover;" />`;
        }
        const descEl = document.getElementById('watch-desc');
        if (descEl && ch.description) {
          descEl.textContent = ch.description;
        }
      }).catch(err => console.warn('Could not load channel details for watch room:', err));
    }
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
        videoEl.play().catch(() => { });
      }
      playerControlsState.isPlaying = true;
    }
    updatePlayerControlsUI();
    resetHideControlsTimer();
  };
  playBtn?.addEventListener('click', togglePlay);

  const shieldEl = document.getElementById('orbit-player-shield');
  shieldEl?.addEventListener('click', togglePlay);
  shieldEl?.addEventListener('dblclick', () => fsBtn?.click());
  shieldEl?.addEventListener('mousemove', resetHideControlsTimer);

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
      document.exitFullscreen().catch(() => { });
    } else if (playerContainer) {
      playerContainer.requestFullscreen().catch(() => { });
    }
  });

  // Theater Mode (Twitch/Kick style)
  let isTheater = false;
  const theaterBtn = document.getElementById('orbit-ctrl-theater');
  const toggleTheater = () => {
    isTheater = !isTheater;
    const watchRoot = document.getElementById('watch-room-root') || playerContainer?.closest('.watch-room-root');
    const appSidebar = document.getElementById('app-sidebar') || document.querySelector('.app-sidebar');
    const appMain = document.querySelector('.app-main');

    if (isTheater) {
      document.body.classList.add('theater-active');
      watchRoot?.classList.add('watch-theater-mode');
      if (appSidebar) appSidebar.classList.add('collapsed');
      if (appMain) appMain.classList.add('sidebar-collapsed');
      theaterBtn?.classList.add('active');
      store.showToast('Theater mode enabled (T)', 'info');
    } else {
      document.body.classList.remove('theater-active');
      watchRoot?.classList.remove('watch-theater-mode');
      if (!store.getState().sidebarCollapsed) {
        if (appSidebar) appSidebar.classList.remove('collapsed');
        if (appMain) appMain.classList.remove('sidebar-collapsed');
      }
      theaterBtn?.classList.remove('active');
      store.showToast('Theater mode disabled (T)', 'info');
    }
  };
  theaterBtn?.addEventListener('click', toggleTheater);

  // Auto-exit theater mode if navigating away
  window.addEventListener('hashchange', () => {
    document.body.classList.remove('theater-active');
  }, { once: true });

  // Picture-in-Picture
  const pipBtn = document.getElementById('orbit-ctrl-pip');
  const togglePip = async () => {
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture().catch(() => { });
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
    } else if (e.key === 'Escape') {
      if (isTheater) {
        e.preventDefault();
        toggleTheater();
      }
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

  // Chat send & WhatsApp-style inline emote replacement
  const chatInput = document.getElementById('chat-input');
  const chatSend = document.getElementById('chat-send');
  const autocompletePopover = document.getElementById('chat-autocomplete-popover');
  const visualizerEl = document.getElementById('chat-emote-visualizer');
  const visualizerItems = document.getElementById('chat-emote-visualizer-items');

  // Extract plain text string with :shortcode: from the contenteditable input
  function getRawChatInputText() {
    if (!chatInput) return '';
    let text = '';
    const walk = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.classList && node.classList.contains('chat-inline-emote')) {
          const code = node.getAttribute('data-code');
          if (code) {
            text += code;
            return;
          }
        }
        if (node.tagName === 'BR') {
          text += '\n';
        } else {
          for (let child = node.firstChild; child; child = child.nextSibling) {
            walk(child);
          }
        }
      }
    };
    walk(chatInput);
    return text.trim();
  }

  // Insert an inline visual emote badge into the contenteditable chat-input
  function insertEmoteIntoInput(emote) {
    if (!chatInput || !emote) return;

    const shortcode = `:${emote.name}:`;
    const span = document.createElement('span');
    span.className = 'chat-inline-emote';
    span.contentEditable = 'false';
    span.setAttribute('data-code', shortcode);
    span.setAttribute('data-name', emote.name);
    span.title = shortcode;
    span.innerHTML = `${renderEmoteVisual(emote, 20)}`;

    const space = document.createTextNode(' ');

    chatInput.focus();
    const sel = window.getSelection();

    if (sel && sel.rangeCount > 0) {
      let range = sel.getRangeAt(0);
      if (!chatInput.contains(range.commonAncestorContainer)) {
        range = document.createRange();
        range.selectNodeContents(chatInput);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }

      // Check if we are auto-completing an existing partial :query
      if (range.startContainer && range.startContainer.nodeType === Node.TEXT_NODE) {
        const textBefore = range.startContainer.textContent.substring(0, range.startOffset);
        const match = textBefore.match(/:([a-zA-Z0-9_]*)$/);
        if (match) {
          range.setStart(range.startContainer, range.startOffset - match[0].length);
          range.deleteContents();
        }
      }

      range.insertNode(space);
      range.insertNode(span);
      range.setStartAfter(space);
      range.setEndAfter(space);
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      chatInput.appendChild(span);
      chatInput.appendChild(space);
    }

    if (autocompletePopover) autocompletePopover.style.display = 'none';
    updateEmoteVisualizer();
  }

  // Live typing: scans contenteditable text for :code: and replaces with visual badge inline
  function processInlineEmoteShortcodes() {
    if (!chatInput) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    let textNodes = [];
    const collectTextNodes = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        textNodes.push(node);
      } else if (node.nodeType === Node.ELEMENT_NODE && !node.classList.contains('chat-inline-emote')) {
        for (let child = node.firstChild; child; child = child.nextSibling) {
          collectTextNodes(child);
        }
      }
    };
    collectTextNodes(chatInput);

    let replacedAny = false;
    for (const node of textNodes) {
      const text = node.textContent;
      const regex = /:([a-zA-Z0-9_]+):/g;
      let match;
      while ((match = regex.exec(text)) !== null) {
        const fullCode = match[0];
        const emoteName = match[1];
        const emote = activeChannelEmotes.find(e => e.name.toLowerCase() === emoteName.toLowerCase());
        if (emote) {
          const index = match.index;
          const before = text.substring(0, index);
          const after = text.substring(index + fullCode.length);

          const span = document.createElement('span');
          span.className = 'chat-inline-emote';
          span.contentEditable = 'false';
          span.setAttribute('data-code', fullCode);
          span.setAttribute('data-name', emote.name);
          span.title = fullCode;
          span.innerHTML = `${renderEmoteVisual(emote, 20)}`;

          const parent = node.parentNode;
          if (before) parent.insertBefore(document.createTextNode(before), node);
          parent.insertBefore(span, node);
          const afterNode = document.createTextNode(after || ' ');
          parent.insertBefore(afterNode, node);
          parent.removeChild(node);

          // Place cursor after replacement
          const newRange = document.createRange();
          newRange.setStart(afterNode, after ? 0 : 1);
          newRange.collapse(true);
          sel.removeAllRanges();
          sel.addRange(newRange);

          replacedAny = true;
          break;
        }
      }
      if (replacedAny) break;
    }
  }

  // Update the live visualizer strip below chat
  function updateEmoteVisualizer() {
    const raw = getRawChatInputText();
    if (!raw || !activeChannelEmotes.length) {
      if (visualizerEl) visualizerEl.style.display = 'none';
      return;
    }

    const detected = [];
    for (const emote of activeChannelEmotes) {
      const shortcode = `:${emote.name}:`;
      if (raw.includes(shortcode) && !detected.some(d => d.name === emote.name)) {
        detected.push(emote);
      }
    }

    if (detected.length === 0) {
      if (visualizerEl) visualizerEl.style.display = 'none';
      return;
    }

    if (visualizerEl && visualizerItems) {
      visualizerItems.innerHTML = detected.map(e => `
        <span class="visualizer-emote-chip" style="display:inline-flex;align-items:center;gap:4px;padding:2px 6px;border-radius:6px;background:rgba(0,242,254,0.12);border:1px solid rgba(0,242,254,0.3);font-size:11px;color:var(--color-cyan-neon);cursor:pointer;" title=":${escapeHtml(e.name)}:">
          <span style="width:18px;height:18px;display:inline-flex;align-items:center;justify-content:center;">${renderEmoteVisual(e, 18)}</span>
          <span style="font-weight:600;">:${escapeHtml(e.name)}:</span>
        </span>
      `).join('');
      visualizerEl.style.display = 'flex';
    }
  }

  // Real-time autocomplete suggestions when user types :name
  function handleAutocomplete() {
    if (!chatInput || !autocompletePopover) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      autocompletePopover.style.display = 'none';
      return;
    }

    const range = sel.getRangeAt(0);
    if (!range.startContainer || range.startContainer.nodeType !== Node.TEXT_NODE) {
      autocompletePopover.style.display = 'none';
      return;
    }

    const textBefore = range.startContainer.textContent.substring(0, range.startOffset);
    const match = textBefore.match(/:([a-zA-Z0-9_]*)$/);

    if (!match) {
      autocompletePopover.style.display = 'none';
      return;
    }

    const query = match[1].toLowerCase();
    const matches = activeChannelEmotes.filter(e => e.name.toLowerCase().startsWith(query)).slice(0, 6);

    if (matches.length === 0) {
      autocompletePopover.style.display = 'none';
      return;
    }

    autocompletePopover.innerHTML = `
      <div style="font-size:10px;font-weight:700;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:0.04em;padding:4px 8px 6px;border-bottom:1px solid rgba(255,255,255,0.06);display:flex;justify-content:space-between;">
        <span>Matching Emotes</span>
        <span style="color:var(--color-cyan-neon);font-size:9px;">Tab or Click to insert</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:2px;margin-top:4px;">
        ${matches.map((e, idx) => `
          <div class="chat-autocomplete-item" data-name="${escapeHtml(e.name)}" data-code=":${escapeHtml(e.name)}:" style="display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:6px;cursor:pointer;background:${idx === 0 ? 'rgba(0,242,254,0.12)' : 'transparent'};">
            <span style="width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center;">${renderEmoteVisual(e, 20)}</span>
            <span style="font-weight:700;font-size:12px;color:var(--color-text-primary,#fff);">:${escapeHtml(e.name)}:</span>
          </div>
        `).join('')}
      </div>
    `;
    autocompletePopover.style.display = 'block';

    autocompletePopover.querySelectorAll('.chat-autocomplete-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        const emoteName = item.dataset.name;
        const targetEmote = activeChannelEmotes.find(em => em.name.toLowerCase() === emoteName.toLowerCase());
        if (targetEmote) {
          insertEmoteIntoInput(targetEmote);
        }
      });
    });
  }

  if (chatInput && chatSend) {
    const sendMsg = async () => {
      const msg = getRawChatInputText();
      const sid = currentStreamId || parseInt(streamId);
      if (!msg || !chatConnection || !sid) return;

      const currentUser = getCurrentUser();
      const activeS = store.getState().activeStream;
      const isMod = checkModerationPrivileges(currentUser, activeS);

      // Emotes Only enforcement: check the message only has emote shortcodes
      if (isEmotesOnlyMode && !isMod) {
        const textOnly = msg.replace(/:[a-zA-Z0-9_]+:/g, '').trim();
        if (textOnly.length > 0) {
          store.showToast('🎭 Emotes Only mode is active — only emotes can be sent!', 'warning');
          return;
        }
      }

      try {
        await chatConnection.invoke('SendMessage', sid, msg);
        chatInput.innerHTML = '';
        if (visualizerEl) visualizerEl.style.display = 'none';
        if (autocompletePopover) autocompletePopover.style.display = 'none';
      } catch (e) {
        store.showToast(e.message || 'Failed to send message', 'error');
      }
    };

    chatSend.addEventListener('click', sendMsg);

    chatInput.addEventListener('input', () => {
      processInlineEmoteShortcodes();
      updateEmoteVisualizer();
      handleAutocomplete();
    });

    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (autocompletePopover && autocompletePopover.style.display !== 'none') {
          const first = autocompletePopover.querySelector('.chat-autocomplete-item');
          if (first) {
            const emoteName = first.dataset.name;
            const targetEmote = activeChannelEmotes.find(em => em.name.toLowerCase() === emoteName.toLowerCase());
            if (targetEmote) {
              insertEmoteIntoInput(targetEmote);
              return;
            }
          }
        }
        sendMsg();
      } else if (e.key === 'Tab') {
        if (autocompletePopover && autocompletePopover.style.display !== 'none') {
          const first = autocompletePopover.querySelector('.chat-autocomplete-item');
          if (first) {
            e.preventDefault();
            const emoteName = first.dataset.name;
            const targetEmote = activeChannelEmotes.find(em => em.name.toLowerCase() === emoteName.toLowerCase());
            if (targetEmote) {
              insertEmoteIntoInput(targetEmote);
            }
          }
        }
      } else if (e.key === 'Escape') {
        if (autocompletePopover) autocompletePopover.style.display = 'none';
      }
    });

    // Paste plain single-line text only
    chatInput.addEventListener('paste', (e) => {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData('text/plain').replace(/[\r\n]+/g, ' ');
      document.execCommand('insertText', false, text);
    });
  }

  // Emote Picker Popover wiring
  const emoteBtn = document.getElementById('chat-emote-btn');
  const emotePicker = document.getElementById('chat-emote-picker');
  const emotePickerClose = document.getElementById('chat-emote-picker-close');

  if (emoteBtn && emotePicker) {
    emoteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = emotePicker.style.display === 'none' || !emotePicker.style.display;
      emotePicker.style.display = isHidden ? 'block' : 'none';
      if (autocompletePopover) autocompletePopover.style.display = 'none';
    });
    emotePickerClose?.addEventListener('click', (e) => {
      e.stopPropagation();
      emotePicker.style.display = 'none';
    });
  }

  // Delegated click handler on #chat-emote-picker for emote selection
  if (emotePicker) {
    emotePicker.addEventListener('click', (e) => {
      const btn = e.target.closest('.chat-emote-select-btn');
      if (!btn) return;
      e.stopPropagation();
      e.preventDefault();

      emotePicker.style.display = 'none';

      const code = btn.dataset.code;
      const name = btn.dataset.name;
      const emote = activeChannelEmotes.find(em => (name && em.name.toLowerCase() === name.toLowerCase()) || `:${em.name}:` === code);
      if (emote) {
        insertEmoteIntoInput(emote);
      }
    });
  }

  // Close menus on outside click
  document.addEventListener('click', (e) => {
    if (emotePicker && !emotePicker.contains(e.target) && e.target !== emoteBtn) {
      emotePicker.style.display = 'none';
    }
    if (autocompletePopover && !autocompletePopover.contains(e.target) && e.target !== chatInput) {
      autocompletePopover.style.display = 'none';
    }
  });

  // Global loader & UI binder for Channel Emotes in Watch Room
  async function loadChannelEmotes(channelId) {
    if (!channelId) {
      activeChannelEmotes = [];
      renderChannelEmotesUI();
      return;
    }

    try {
      const res = await channelApi.getEmojis(channelId);
      if (Array.isArray(res) && res.length > 0) {
        activeChannelEmotes = res;
      } else {
        const local = localStorage.getItem(`orbit_channel_emotes_${channelId}`);
        if (local) {
          try { activeChannelEmotes = JSON.parse(local) || []; } catch (_) { activeChannelEmotes = []; }
        } else {
          activeChannelEmotes = [];
        }
      }
    } catch (_) {
      const local = localStorage.getItem(`orbit_channel_emotes_${channelId}`);
      if (local) {
        try { activeChannelEmotes = JSON.parse(local) || []; } catch (_) { activeChannelEmotes = []; }
      } else {
        activeChannelEmotes = [];
      }
    }

    renderChannelEmotesUI();
  }
  window.loadChannelEmotes = loadChannelEmotes;

  function renderChannelEmotesUI() {
    // 1. Quick reactions bar: ONLY channel emotes
    const pillsContainer = document.getElementById('chat-quick-reactions-pills');
    if (pillsContainer) {
      if (!activeChannelEmotes || activeChannelEmotes.length === 0) {
        pillsContainer.innerHTML = '<span style="font-size:11px;color:var(--color-text-muted);font-style:italic;">No channel emotes assigned</span>';
      } else {
        pillsContainer.innerHTML = activeChannelEmotes.slice(0, 6).map(e => `
          <button class="chat-quick-pill" data-emote=":${escapeHtml(e.name)}:" title=":${escapeHtml(e.name)}:" style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:14px;background:rgba(0,242,254,0.08);border:1px solid rgba(0,242,254,0.25);color:var(--color-cyan-neon);font-size:11px;font-weight:600;cursor:pointer;flex-shrink:0;transition:all 0.15s;">
            <span style="width:16px;height:16px;display:inline-flex;align-items:center;justify-content:center;">${renderEmoteVisual(e, 16)}</span> ${escapeHtml(e.name)}
          </button>
        `).join('');

        pillsContainer.querySelectorAll('.chat-quick-pill').forEach(btn => {
          btn.addEventListener('click', async () => {
            const emoteCode = btn.dataset.emote;
            const user = getCurrentUser();
            if (!user) {
              store.showToast('Please log in to chat', 'info');
              store.navigate('login');
              return;
            }
            const sid = currentStreamId || parseInt(streamId);
            if (chatConnection && sid && emoteCode) {
              try {
                await chatConnection.invoke('SendMessage', sid, emoteCode);
              } catch (err) {
                store.showToast(err.message || 'Failed to send reaction', 'error');
              }
            }
          });
        });
      }
    }

    // 2. Emote Picker Popover: ONLY channel emotes
    const pickerGrid = document.getElementById('chat-emote-picker-grid');
    if (pickerGrid) {
      if (!activeChannelEmotes || activeChannelEmotes.length === 0) {
        pickerGrid.innerHTML = `
          <div style="grid-column:1/-1;text-align:center;padding:24px 8px;font-size:12px;color:var(--color-text-muted);">
            <div style="font-size:24px;margin-bottom:6px;">🪐</div>
            This channel doesn't have custom emotes assigned yet.
          </div>
        `;
      } else {
        pickerGrid.innerHTML = activeChannelEmotes.map(e => `
          <button type="button" class="chat-emote-select-btn" data-name="${escapeHtml(e.name)}" data-code=":${escapeHtml(e.name)}:" title=":${escapeHtml(e.name)}:" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:8px 4px;border-radius:6px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);cursor:pointer;transition:all 0.15s;">
            <span style="width:28px;height:28px;display:inline-flex;align-items:center;justify-content:center;pointer-events:none;">${renderEmoteVisual(e, 26)}</span>
            <span style="font-size:10px;color:var(--color-text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%;pointer-events:none;">:${escapeHtml(e.name)}:</span>
          </button>
        `).join('');

        pickerGrid.querySelectorAll('.chat-emote-select-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            if (emotePicker) emotePicker.style.display = 'none';
            const code = btn.dataset.code;
            const name = btn.dataset.name;
            const emote = activeChannelEmotes.find(em => (name && em.name.toLowerCase() === name.toLowerCase()) || `:${em.name}:` === code);
            if (emote) {
              insertEmoteIntoInput(emote);
            }
          });
        });
      }
    }
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
    const avatarPic = stream.profilePictureUrl || stream.channelPhotoUrl || stream.profilePhotoUrl;
    if (avatarPic && avatarPic.startsWith('http')) {
      avatarEl.innerHTML = `<img src="${avatarPic}" style="width:100%;height:100%;object-fit:cover;" />`;
    } else {
      avatarEl.textContent = (stream.streamerName || stream.channelName || 'S')[0].toUpperCase();
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
        } catch (_) { }
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
        ytFrame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
        ytFrame.allowFullscreen = true;
        document.getElementById('player-container')?.appendChild(ytFrame);
      }
      // Crop native YouTube top title/share and bottom watermark outside the player viewport
      ytFrame.style.cssText = 'position:absolute;top:-60px;left:0;width:100%;height:calc(100% + 120px);border:none;z-index:2;pointer-events:none;';
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
        video.play().catch(() => { });
      });
    }
  } catch (e) {
    console.warn('[WatchRoom] HLS init failed', e);
    offlineEl?.classList.remove('hidden');
  }
}

async function navigateToUserChannel(username) {
  if (!username) return;
  try {
    const results = await channelApi.search(username);
    const list = Array.isArray(results) ? results : (results?.items || results?.channels || []);
    const match = list.find(c => (c.channelName || c.streamerName || c.name || '').toLowerCase() === username.toLowerCase()) || list[0];
    if (match && match.id) {
      store.navigate('channel', { channelId: match.id });
      return;
    }
  } catch (e) {
    console.warn('Channel lookup failed:', e);
  }
  store.showToast(`No channel found for ${username}`, 'info');
}

async function initChat(channelId, streamId) {
  const statusEl = document.getElementById('chat-status');
  const messagesEl = document.getElementById('chat-messages');
  const scrollBottomBtn = document.getElementById('chat-scroll-bottom');
  if (!streamId || !messagesEl) return;

  const currentUser = getCurrentUser();
  const activeS = store.getState().activeStream;
  const isModOrStreamer = checkModerationPrivileges(currentUser, activeS);
  const chId = channelId || activeS?.channelId || activeS?.channel?.id;
  const userRoles = Array.isArray(currentUser?.roles) ? currentUser.roles : (currentUser?.role ? [currentUser.role] : []);
  const isBroadcaster = Boolean(activeS && currentUser && (
    currentUser.username?.toLowerCase() === activeS.streamerName?.toLowerCase() ||
    currentUser.username?.toLowerCase() === activeS.channelName?.toLowerCase() ||
    currentUser.username?.toLowerCase() === activeS.channel?.ownerUsername?.toLowerCase() ||
    currentUser.id === activeS.userId ||
    currentUser.channelId === activeS.channelId
  ));

  // Ensure Emotes Only toggle button exists if user has moderation privileges
  let emotesOnlyBtn = document.getElementById('chat-emotes-only-toggle');
  if (isModOrStreamer && !emotesOnlyBtn && statusEl) {
    emotesOnlyBtn = document.createElement('button');
    emotesOnlyBtn.id = 'chat-emotes-only-toggle';
    emotesOnlyBtn.title = 'Toggle Emotes Only Mode (Moderator)';
    emotesOnlyBtn.style.cssText = 'display:flex;align-items:center;gap:4px;padding:3px 8px;border-radius:6px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:var(--color-text-muted);font-size:10px;font-weight:700;cursor:pointer;transition:all 0.2s;text-transform:uppercase;letter-spacing:0.03em;';
    emotesOnlyBtn.innerHTML = '<span style="font-size:12px;">🎭</span> Emotes Only';
    statusEl.parentNode?.insertBefore(emotesOnlyBtn, statusEl);
  }

  if (emotesOnlyBtn) {
    emotesOnlyBtn.onclick = async () => {
      const targetState = !isEmotesOnlyMode;
      try {
        if (chatConnection) {
          await chatConnection.invoke('SetEmotesOnly', streamId, targetState);
        }
        updateEmotesOnlyUI(targetState);
        store.showToast(targetState ? '🎭 Emotes Only mode enabled' : 'Emotes Only mode disabled', 'info');
      } catch (err) {
        store.showToast(err.message || 'Failed to update chat mode', 'error');
      }
    };
  }

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

  // Moderation Popover on Username Click (Twitch / Kick standard)
  const modPopover = document.getElementById('chat-mod-popover');
  const modPopoverUser = document.getElementById('mod-popover-username');
  const modPopoverBadge = document.getElementById('mod-popover-badge');
  const modPopoverClose = document.getElementById('chat-mod-popover-close');
  const modActHire = document.getElementById('mod-act-hire');
  const modActViewChannel = document.getElementById('mod-act-view-channel');
  const modActDel = document.getElementById('mod-act-delete');
  const modActTimeout = document.getElementById('mod-act-timeout');
  const modActBan = document.getElementById('mod-act-ban');

  let activeModTarget = { username: '', msgId: null };

  messagesEl.addEventListener('click', (e) => {
    // 1. Avatar link clicked: navigate directly to chatter's channel
    const avatarLink = e.target.closest('.chat-avatar-link');
    if (avatarLink) {
      e.stopPropagation();
      const uname = avatarLink.dataset.username;
      if (uname) navigateToUserChannel(uname);
      return;
    }

    // 2. Chatter username clicked
    const userEl = e.target.closest('.chat-user');
    if (!userEl) return;

    e.stopPropagation();
    const uname = userEl.dataset.username;
    const mid = userEl.dataset.msgId ? parseInt(userEl.dataset.msgId) : null;
    if (!uname) return;

    if (!isModOrStreamer) {
      // Normal viewer clicking username: navigate to their channel
      navigateToUserChannel(uname);
      return;
    }

    // Don't show mod popover on oneself
    if (currentUser && uname.toLowerCase() === currentUser.username?.toLowerCase()) {
      navigateToUserChannel(uname);
      return;
    }

    activeModTarget = { username: uname, msgId: mid };
    if (modPopoverUser) modPopoverUser.textContent = uname;
    if (modActDel) modActDel.style.display = mid ? 'flex' : 'none';

    // Inspect user's actual role/badges in chat
    const parentMsg = userEl.closest('.chat-msg') || userEl.parentElement;
    const activeS = store.getState().activeStream;
    const isTargetBroadcaster = Boolean(parentMsg?.querySelector('.badge-broadcaster')) || (activeS && (
      uname.toLowerCase() === activeS.streamerName?.toLowerCase() ||
      uname.toLowerCase() === activeS.channelName?.toLowerCase() ||
      uname.toLowerCase() === activeS.channel?.ownerUsername?.toLowerCase()
    ));
    const isTargetMod = Boolean(parentMsg?.querySelector('.badge-mod'));
    const isTargetAdmin = Boolean(parentMsg?.querySelector('.badge-admin'));
    const isTargetVip = Boolean(parentMsg?.querySelector('.badge-vip'));

    if (modPopoverBadge) {
      if (isTargetBroadcaster) {
        modPopoverBadge.textContent = '👑';
        modPopoverBadge.title = 'Broadcaster';
      } else if (isTargetMod) {
        modPopoverBadge.textContent = '🛡️';
        modPopoverBadge.title = 'Moderator';
      } else if (isTargetAdmin) {
        modPopoverBadge.textContent = '⚡';
        modPopoverBadge.title = 'Admin';
      } else if (isTargetVip) {
        modPopoverBadge.textContent = '💎';
        modPopoverBadge.title = 'VIP';
      } else {
        modPopoverBadge.textContent = '👤';
        modPopoverBadge.title = 'Viewer';
      }
    }

    // Show "Hire as Moderator" / "Dismiss Moderator" only if broadcaster or admin
    const canHire = isBroadcaster || userRoles.some(r => /^admin$/i.test(r)) || currentUser?.isAdmin;
    if (modActHire) {
      if (!canHire || isTargetBroadcaster) {
        modActHire.style.display = 'none';
      } else if (isTargetMod) {
        modActHire.style.display = 'flex';
        modActHire.dataset.action = 'dismiss';
        modActHire.innerHTML = '🚫 Dismiss Moderator';
        modActHire.style.background = 'rgba(239,68,68,0.12)';
        modActHire.style.borderColor = 'rgba(239,68,68,0.3)';
        modActHire.style.color = '#f87171';
      } else {
        modActHire.style.display = 'flex';
        modActHire.dataset.action = 'hire';
        modActHire.innerHTML = '🛡️ Hire as Moderator';
        modActHire.style.background = 'rgba(0,242,254,0.12)';
        modActHire.style.borderColor = 'rgba(0,242,254,0.3)';
        modActHire.style.color = 'var(--color-cyan-neon)';
      }
    }

    if (modPopover) {
      const chatPanel = messagesEl.closest('.chat-panel');
      if (chatPanel) {
        const panelRect = chatPanel.getBoundingClientRect();
        const userRect = userEl.getBoundingClientRect();

        let top = userRect.bottom - panelRect.top + 4;
        if (top + 230 > panelRect.height) {
          top = Math.max(10, userRect.top - panelRect.top - 220);
        }
        modPopover.style.top = `${top}px`;
        modPopover.style.left = '16px';
        modPopover.style.right = '16px';
        modPopover.style.width = 'auto';
        modPopover.style.display = 'block';
      }
    }
  });

  modPopoverClose?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (modPopover) modPopover.style.display = 'none';
  });

  modActHire?.addEventListener('click', async (e) => {
    e.stopPropagation();
    const uname = activeModTarget.username;
    if (!uname) return;
    const action = modActHire.dataset.action || 'hire';

    if (action === 'dismiss') {
      if (!confirm(`Remove ${uname} from channel moderators?`)) return;
      try {
        await channelApi.removeModerator(uname);
        store.showToast(`Removed ${uname} from moderators`, 'info');
      } catch (err) {
        store.showToast(err.message || 'Failed to remove moderator', 'error');
      }
    } else {
      if (!confirm(`Hire ${uname} as a channel moderator?`)) return;
      try {
        await channelApi.hireModerator(uname);
        store.showToast(`🛡️ ${uname} has been hired as a channel moderator!`, 'success');
      } catch (err) {
        store.showToast(err.message || 'Failed to hire moderator', 'error');
      }
    }
    if (modPopover) modPopover.style.display = 'none';
  });

  modActViewChannel?.addEventListener('click', (e) => {
    e.stopPropagation();
    const uname = activeModTarget.username;
    if (modPopover) modPopover.style.display = 'none';
    if (uname) navigateToUserChannel(uname);
  });

  modActDel?.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (!activeModTarget.msgId) return;
    if (!confirm(`Delete message #${activeModTarget.msgId}?`)) return;
    try {
      if (chatConnection) {
        await chatConnection.invoke('DeleteMessage', streamId, activeModTarget.msgId);
      } else if (chId) {
        await moderationApi.deleteMessage(chId, activeModTarget.msgId);
      }
      store.showToast('Message deleted', 'info');
    } catch (err) {
      store.showToast(err.message || 'Failed to delete message', 'error');
    }
    if (modPopover) modPopover.style.display = 'none';
  });

  modActTimeout?.addEventListener('click', async (e) => {
    e.stopPropagation();
    const uname = activeModTarget.username;
    if (!uname || !chId) return;
    if (!confirm(`Timeout ${uname} for 5 minutes?`)) return;
    try {
      await moderationApi.timeoutUser(chId, { username: uname, durationSeconds: 300, reason: 'Chat violation' });
      store.showToast(`${uname} timed out for 5 minutes`, 'info');
    } catch (err) {
      store.showToast(err.message || 'Failed to timeout user', 'error');
    }
    if (modPopover) modPopover.style.display = 'none';
  });

  modActBan?.addEventListener('click', async (e) => {
    e.stopPropagation();
    const uname = activeModTarget.username;
    if (!uname || !chId) return;
    if (!confirm(`Permanently ban ${uname} from this channel's chat?`)) return;
    try {
      await moderationApi.banUser(chId, { username: uname, reason: 'Chat violation' });
      store.showToast(`${uname} banned from chat`, 'info');
    } catch (err) {
      store.showToast(err.message || 'Failed to ban user', 'error');
    }
    if (modPopover) modPopover.style.display = 'none';
  });

  document.addEventListener('click', (e) => {
    if (modPopover && !modPopover.contains(e.target)) {
      modPopover.style.display = 'none';
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

    chatConnection.on('EmotesOnlyToggled', (enabled) => {
      updateEmotesOnlyUI(enabled);
      const div = document.createElement('div');
      div.style.cssText = 'color:var(--color-cyan-neon);font-style:italic;font-size:11px;padding:4px 8px;background:rgba(0,242,254,0.08);border-radius:4px;text-align:center;margin:4px 0;';
      div.textContent = enabled ? '🎭 Moderator enabled Emotes-Only chat mode' : '🎭 Moderator disabled Emotes-Only chat mode';
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
  const content = msg.content || msg.Content || '';
  const mid = msg.id || msg.Id;
  const sentAt = msg.sentAt || msg.SentAt;
  const timeStr = sentAt ? new Date(sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  const parsedContent = parseChatContent(content);
  const senderAvatar = msg.senderAvatarUrl || msg.SenderAvatarUrl || msg.profilePictureUrl || msg.avatarUrl || null;
  const senderInitial = (sender[0] || 'U').toUpperCase();

  const activeS = store.getState().activeStream;
  const isBroadcaster = Boolean(activeS && (
    sender === activeS.streamerName ||
    sender === activeS.channelName ||
    sender === activeS.channel?.ownerUsername
  ));
  const roleBadge = getRoleBadge(msg, sender);
  const senderColor = getSenderColor(isBroadcaster, msg.senderRole || msg.SenderRole);

  const avatarHtml = senderAvatar
    ? `<img src="${escapeHtml(senderAvatar)}" style="width:100%;height:100%;object-fit:cover;display:block;" />`
    : `<span style="font-size:10px;font-weight:700;color:var(--color-cyan-neon);">${escapeHtml(senderInitial)}</span>`;

  return `
    <div class="chat-msg chat-msg-animate" data-msg-id="${mid || ''}" style="display:flex;align-items:flex-start;justify-content:space-between;padding:5px 8px;border-radius:6px;gap:6px;transition:background 0.15s ease;">
      <div style="flex:1;word-break:break-word;font-size:13px;line-height:1.5;display:flex;align-items:center;flex-wrap:wrap;gap:4px;">
        <span style="font-size:10px;color:var(--color-text-muted);margin-right:2px;opacity:0.65;font-variant-numeric:tabular-nums;">${timeStr}</span>
        <span class="chat-avatar-link" data-username="${escapeHtml(sender)}" style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;overflow:hidden;background:rgba(0,242,254,0.15);border:1px solid rgba(0,242,254,0.3);vertical-align:middle;cursor:pointer;flex-shrink:0;margin-right:2px;" title="View ${escapeHtml(sender)}'s channel">
          ${avatarHtml}
        </span>
        ${roleBadge}
        <span class="chat-user" data-username="${escapeHtml(sender)}" data-msg-id="${mid || ''}" style="font-weight:700;color:${senderColor};margin-right:4px;cursor:pointer;" title="${isModOrStreamer ? 'Moderator: click for actions' : 'Click to view channel'}">${escapeHtml(sender)}:</span>
        <span class="chat-text" style="color:var(--color-text-primary,#e2e8f0);">${parsedContent}</span>
      </div>
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