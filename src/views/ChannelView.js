import { store } from '../state/store.js';
import { channelApi } from '../api/channel.js';
import { clipApi } from '../api/clip.js';
import { vodApi } from '../api/vod.js';
import { streamApi } from '../api/stream.js';
import { Icons } from '../components/CosmicIcons.js';
import { openClipPlayerModal } from './ClipsFeedView.js';
import { openVodPlayerModal } from '../components/VodPlayerModal.js';
import { DEFAULT_BANNER, attachMediaImages } from '../utils/mediaImage.js';

import { resolveMediaUrl } from '../utils/mediaConfig.js';

let activeTab = 'vods';
let currentChannelData = null;
let activeChannelHls = null;

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderChannelView() {
  return `
    <div>
      <!-- Kick/Twitch Style Live Stream Hero (Embedded Player when Channel is Live) -->
      <div id="ch-live-hero-container" style="display:none;margin-bottom:24px;border-radius:16px;overflow:hidden;background:rgba(4,7,18,0.96);border:1px solid rgba(255,59,48,0.4);box-shadow:0 8px 32px rgba(255,59,48,0.22);position:relative;">
        <div id="ch-hero-player-wrapper" style="position:relative;width:100%;aspect-ratio:16/9;max-height:560px;background:#000;display:flex;align-items:center;justify-content:center;overflow:hidden;">
          <video id="ch-live-video" style="width:100%;height:100%;object-fit:contain;background:#000;" playsinline autoplay muted></video>

          <!-- Top Overlay: Badges and Action Controls -->
          <div style="position:absolute;top:14px;left:14px;right:14px;display:flex;align-items:center;justify-content:space-between;gap:12px;z-index:6;pointer-events:none;">
            <div style="display:flex;align-items:center;gap:8px;pointer-events:auto;flex-wrap:wrap;">
              <span class="badge-live" style="display:inline-flex;align-items:center;gap:6px;font-size:12px;padding:5px 12px;box-shadow:0 0 16px rgba(255,59,48,0.7);letter-spacing:0.05em;font-weight:800;">
                <span class="cosmic-beacon" style="width:8px;height:8px;background:#fff;"></span> LIVE NOW
              </span>
              <span id="ch-hero-viewers-badge" style="background:rgba(0,0,0,0.75);backdrop-filter:blur(8px);color:#eee;font-size:12px;font-weight:700;padding:5px 12px;border-radius:20px;border:1px solid rgba(255,255,255,0.15);display:inline-flex;align-items:center;gap:6px;">
                👥 <span id="ch-hero-viewers">1 viewer</span>
              </span>
              <span id="ch-hero-category-badge" style="background:rgba(0,242,254,0.15);color:var(--color-cyan-neon,#00f2fe);border:1px solid rgba(0,242,254,0.35);font-size:12px;font-weight:700;padding:5px 12px;border-radius:20px;">
                Gaming
              </span>
            </div>

            <div style="display:flex;align-items:center;gap:10px;pointer-events:auto;">
              <button id="ch-hero-unmute-btn" class="btn btn-sm" style="background:rgba(0,0,0,0.75);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.25);color:#fff;font-size:12px;font-weight:700;padding:6px 14px;border-radius:20px;cursor:pointer;">
                🔊 Unmute
              </button>
              <button id="ch-hero-watch-room-btn" class="btn btn-sm" style="background:linear-gradient(135deg, #00f2fe, #00aebd);color:#040712;font-weight:800;border:none;padding:6px 16px;border-radius:20px;box-shadow:0 0 18px rgba(0,242,254,0.4);cursor:pointer;">
                💬 Watch Room & Chat
              </button>
              <button id="ch-hero-fullscreen-btn" class="btn btn-ghost btn-sm" title="Fullscreen" style="color:#fff;padding:6px 10px;border-radius:8px;">
                ⛶
              </button>
            </div>
          </div>

          <!-- Bottom Stream Title Overlay -->
          <div style="position:absolute;bottom:0;left:0;right:0;padding:28px 20px 14px;background:linear-gradient(180deg, transparent 0%, rgba(4,7,18,0.92) 100%);display:flex;align-items:center;justify-content:space-between;gap:16px;z-index:5;">
            <div>
              <h2 id="ch-hero-title" style="margin:0;font-size:18px;font-weight:800;color:#fff;text-shadow:0 2px 8px rgba(0,0,0,0.8);">Stream Title</h2>
              <div id="ch-hero-meta" style="font-size:12px;color:var(--color-text-muted,#aaa);margin-top:4px;">Broadcasting live on Orbit</div>
            </div>
          </div>
        </div>
      </div>

      <div class="channel-banner" id="ch-banner"><div class="channel-banner-overlay"></div></div>
      <div class="channel-profile" id="ch-profile">
        <div class="channel-avatar" id="ch-avatar"></div>
        <div class="channel-meta">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <h1 id="ch-name" style="margin:0;">Loading...</h1>
            <span id="ch-live-badge" style="display:none;" class="badge-live" data-channel-live="true"></span>
            <span id="ch-followers" class="badge" style="background:rgba(0,242,254,0.12);color:var(--color-cyan-neon,#00f2fe);border:1px solid rgba(0,242,254,0.25);font-size:12px;font-weight:600;padding:3px 10px;border-radius:20px;">0 followers</span>
          </div>
          <p class="channel-desc" id="ch-desc" style="margin-top:6px;"></p>
        </div>
        <div class="channel-actions" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <button id="ch-watch-live-btn" class="btn btn-sm" style="display:none;gap:6px;font-weight:700;background:linear-gradient(135deg,#e53e3e,#f56565);color:#fff;border:none;box-shadow:0 0 16px rgba(229,62,62,0.4);animation:live-glow 2s ease-in-out infinite alternate;">${Icons.play} Watch Live</button>
          <button id="ch-follow-btn" class="btn btn-cyan btn-sm">${Icons.follow} Follow</button>
        </div>
      </div>

      <!-- Social Links -->
      <div id="ch-social" style="display:flex;gap:10px;margin:16px 0;padding-left:124px;flex-wrap:wrap;"></div>

      <!-- Tabs -->
      <div class="tabs" style="margin-top:16px;">
        <button class="tab-btn ${activeTab === 'vods' ? 'active' : ''}" data-tab="vods">Saved VODs</button>
        <button class="tab-btn ${activeTab === 'clips' ? 'active' : ''}" data-tab="clips">Top Clips</button>
        <button class="tab-btn ${activeTab === 'about' ? 'active' : ''}" data-tab="about">About</button>
      </div>

      <div id="ch-tab-content">
        <div class="spinner"></div>
      </div>
    </div>
  `;
}

export function setupChannelEvents() {
  const params = store.getState().viewParams;
  const channelId = params?.channelId;
  if (!channelId) return;

  // Clean up any lingering HLS player from previous view
  if (activeChannelHls) {
    try { activeChannelHls.destroy(); } catch (_) {}
    activeChannelHls = null;
  }

  loadChannel(channelId);

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadTabContent(channelId);
    });
  });
}

async function loadChannel(channelId) {
  try {
    const ch = await channelApi.getById(channelId);
    currentChannelData = ch;

    const chName = ch.name || ch.channelName || 'Channel';
    const nameEl = document.getElementById('ch-name');
    if (nameEl) nameEl.innerHTML = `${escapeHtml(chName)} ${Icons.checkCircle}`;

    // ── Live Indicator & Embedded Live Hero Player (Kick/Twitch Style) ──
    const liveBadge = document.getElementById('ch-live-badge');
    const watchLiveBtn = document.getElementById('ch-watch-live-btn');
    const heroContainer = document.getElementById('ch-live-hero-container');
    const avatar = document.getElementById('ch-avatar');

    if (ch.isLive) {
      if (liveBadge) {
        liveBadge.style.display = 'inline-flex';
        liveBadge.innerHTML = `<span class="cosmic-beacon" style="width:8px;height:8px;"></span> LIVE`;
        liveBadge.style.cssText += 'display:inline-flex;align-items:center;gap:6px;font-size:12px;padding:4px 12px;animation:live-glow 2s ease-in-out infinite alternate;';
      }

      // Add Twitch/Kick glowing red live ring around avatar
      if (avatar) {
        avatar.style.border = '3px solid #ff3b30';
        avatar.style.boxShadow = '0 0 18px rgba(255, 59, 48, 0.75)';
      }

      // Fetch active stream to embed live hero player
      try {
        const streams = await streamApi.getLiveStreams().catch(() => []);
        const activeStream = streams.find(s => s.channelId === parseInt(channelId));

        if (activeStream && heroContainer) {
          heroContainer.style.display = 'block';

          // Update Hero Metadata
          const heroTitle = document.getElementById('ch-hero-title');
          if (heroTitle) heroTitle.textContent = activeStream.title || `${chName}'s Live Broadcast`;

          const heroCategory = document.getElementById('ch-hero-category-badge');
          if (heroCategory) {
            heroCategory.textContent = activeStream.category?.name || activeStream.categoryName || 'Live Stream';
          }

          const heroViewers = document.getElementById('ch-hero-viewers');
          if (heroViewers) {
            const count = activeStream.peakViewers || activeStream.viewers || 1;
            heroViewers.textContent = `${count} viewer${count === 1 ? '' : 's'}`;
          }

          const heroMeta = document.getElementById('ch-hero-meta');
          if (heroMeta && activeStream.startedAt) {
            const minAgo = Math.max(1, Math.round((Date.now() - new Date(activeStream.startedAt).getTime()) / 60000));
            heroMeta.textContent = `Streaming for ${minAgo} min • ${activeStream.category?.name || 'General'}`;
          }

          // Wire Watch Room & Chat button
          const goToWatchBtn = document.getElementById('ch-hero-watch-room-btn');
          if (goToWatchBtn) {
            goToWatchBtn.onclick = () => {
              store.setActiveStream(activeStream);
              store.navigate('watch', { streamId: activeStream.id });
            };
          }

          if (watchLiveBtn) {
            watchLiveBtn.style.display = 'inline-flex';
            watchLiveBtn.onclick = () => {
              store.setActiveStream(activeStream);
              store.navigate('watch', { streamId: activeStream.id });
            };
          }

          // Wire Video Element & HLS
          const video = document.getElementById('ch-live-video');
          const unmuteBtn = document.getElementById('ch-hero-unmute-btn');
          const fullscreenBtn = document.getElementById('ch-hero-fullscreen-btn');
          const heroWrapper = document.getElementById('ch-hero-player-wrapper');

          if (unmuteBtn && video) {
            unmuteBtn.onclick = () => {
              video.muted = !video.muted;
              unmuteBtn.textContent = video.muted ? '🔊 Unmute' : '🔇 Mute';
            };
          }

          if (fullscreenBtn && heroWrapper) {
            fullscreenBtn.onclick = () => {
              if (!document.fullscreenElement) {
                heroWrapper.requestFullscreen().catch(() => {});
              } else {
                document.exitFullscreen().catch(() => {});
              }
            };
          }

          // Check for simulated stream (YouTube embed)
          const isYouTube = activeStream.recordingFileName?.includes('youtube.com') ||
                            activeStream.recordingFileName?.includes('youtu.be') ||
                            activeStream.hlsUrl?.includes('youtube.com') ||
                            activeStream.title?.toLowerCase().includes('space') ||
                            activeStream.title?.toLowerCase().includes('nasa');

          if (isYouTube && heroWrapper) {
            if (video) video.style.display = 'none';
            let ytId = 'live_stream';
            const ytMatch = (activeStream.recordingFileName || activeStream.hlsUrl || '').match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
            if (ytMatch) ytId = ytMatch[1];

            const ytFrame = document.createElement('iframe');
            ytFrame.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:none;';
            ytFrame.src = `https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&controls=1&modestbranding=1`;
            ytFrame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
            ytFrame.allowFullscreen = true;
            heroWrapper.appendChild(ytFrame);
          } else if (video) {
            video.style.display = 'block';
            let hlsSource = activeStream.hlsUrl || `${resolveMediaUrl(activeStream.hlsUrl || '')}`;
            if (!hlsSource.includes('.m3u8')) {
              hlsSource = `https://localhost:8443/hls/${ch.streamKey || activeStream.streamKey}.m3u8`;
            }
            if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
              hlsSource = hlsSource.replace('http://localhost:8080', 'https://localhost:8443').replace('http://127.0.0.1:8080', 'https://localhost:8443');
            }

            try {
              const Hls = (await import('hls.js')).default;
              if (Hls.isSupported()) {
                if (activeChannelHls) activeChannelHls.destroy();
                const hls = new Hls({
                  xhrSetup: (xhr) => { xhr.setRequestHeader('ngrok-skip-browser-warning', 'true'); },
                  enableWorker: true,
                  lowLatencyMode: true
                });
                activeChannelHls = hls;
                hls.loadSource(hlsSource);
                hls.attachMedia(video);
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                  video.play().catch(() => {});
                });
              } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = hlsSource;
                video.play().catch(() => {});
              }
            } catch (hlsErr) {
              console.warn('[ChannelView] Could not initialize HLS hero player:', hlsErr.message);
            }
          }
        }
      } catch (streamErr) {
        console.warn('[ChannelView] Could not load active stream for channel:', streamErr.message);
      }
    } else {
      if (liveBadge) liveBadge.style.display = 'none';
      if (watchLiveBtn) watchLiveBtn.style.display = 'none';
      if (heroContainer) heroContainer.style.display = 'none';
      if (avatar) {
        avatar.style.border = '';
        avatar.style.boxShadow = '';
      }
      if (activeChannelHls) {
        try { activeChannelHls.destroy(); } catch (_) {}
        activeChannelHls = null;
      }
    }

    const descEl = document.getElementById('ch-desc');
    if (descEl) descEl.textContent = ch.description || '';

    const followersEl = document.getElementById('ch-followers');
    if (followersEl) followersEl.textContent = `${ch.followerCount || 0} followers`;

    const banner = document.getElementById('ch-banner');
    if (ch.coverPhotoUrl && banner) banner.style.background = `url(${ch.coverPhotoUrl}) center/cover`;

    if (avatar) {
      avatar.innerHTML = ch.profilePhotoUrl
        ? `<img src="${ch.profilePhotoUrl}" alt="${escapeHtml(chName)}" />`
        : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:36px;font-weight:700;color:#000;background:linear-gradient(135deg,#00AEBD,#00DDEE);">${escapeHtml(chName)[0].toUpperCase()}</div>`;
    }

    // Follow Button
    const followBtn = document.getElementById('ch-follow-btn');
    if (followBtn) {
      const isF = store.isFollowing(channelId);
      followBtn.className = `btn btn-sm follow-btn ${isF ? 'following' : 'not-following'}`;
      followBtn.innerHTML = isF ? `${Icons.followFilled} Following` : `${Icons.follow} Follow`;
      followBtn.onclick = async () => {
        followBtn.disabled = true;
        const nowFollowing = await store.toggleFollow(channelId, chName);
        followBtn.className = `btn btn-sm follow-btn ${nowFollowing ? 'following' : 'not-following'}`;
        followBtn.innerHTML = nowFollowing ? `${Icons.followFilled} Following` : `${Icons.follow} Follow`;

        const delta = nowFollowing ? 1 : -1;
        ch.followerCount = Math.max(0, (ch.followerCount || 0) + delta);
        if (followersEl) followersEl.textContent = `${ch.followerCount} followers`;
        store.showToast(nowFollowing ? `Following ${chName}!` : `Unfollowed ${chName}`, 'info');
        followBtn.disabled = false;
      };
    }

    // Social links under avatar
    const social = document.getElementById('ch-social');
    if (social) {
      const links = Array.isArray(ch.socialLinks) ? ch.socialLinks : [];
      if (links.length > 0) {
        social.innerHTML = links.map(l => `
          <a href="${escapeHtml(l.url)}" target="_blank" rel="noopener noreferrer" class="btn btn-ghost btn-sm" style="gap:6px;border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:4px 12px;font-size:12px;">
            ${Icons.link} <span style="text-transform:capitalize;">${escapeHtml(l.platform)}</span>
          </a>
        `).join('');
      } else {
        social.innerHTML = '';
      }
    }

    loadTabContent(channelId);
  } catch (e) {
    store.showToast('Failed to load channel', 'error');
  }
}

async function loadTabContent(channelId) {
  const container = document.getElementById('ch-tab-content');
  if (!container) return;
  container.innerHTML = '<div class="spinner"></div>';

  if (activeTab === 'vods') {
    try {
      const vods = await vodApi.getChannelVods(channelId);
      if (!vods || !vods.length) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">&#128249;</div>
            <h3>No Saved VODs</h3>
            <p>This channel has no saved broadcasts yet.</p>
          </div>`;
        return;
      }
      container.innerHTML = `<div class="streams-grid">${vods.map(v => `
        <div class="card vod-card hover-lift" data-vod-id="${v.id || v.streamId}">
          <div class="vod-thumb">
            <img src="${DEFAULT_BANNER}" data-thumb-src="${v.thumbnailUrl || ''}" alt="${escapeHtml(v.title || 'VOD')}" />
            <span class="vod-duration">${v.duration || ''}</span>
          </div>
          <div class="vod-info">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:4px;">
              <div class="vod-title" style="margin:0;">${escapeHtml(v.title || 'Untitled VOD')}</div>
              ${v.categoryName ? `<span class="badge-category" style="font-size:10px;padding:1px 6px;">${escapeHtml(v.categoryName)}</span>` : ''}
            </div>
            <div class="vod-meta" style="display:flex;gap:10px;align-items:center;">
              <span>${v.rewatchCount || 0} views</span>
              <span>&bull;</span>
              <span>${v.chatMessageCount || 0} messages</span>
            </div>
          </div>
        </div>
      `).join('')}</div>`;
      attachMediaImages(container);

      container.querySelectorAll('.vod-card').forEach(card => {
        card.addEventListener('click', () => {
          const vid = parseInt(card.dataset.vodId);
          const target = vods.find(x => (x.id === vid || x.streamId === vid));
          if (target) {
            openVodPlayerModal(target);
          }
        });
      });
    } catch (e) {
      container.innerHTML = '<p class="text-muted text-center">Failed to load VODs</p>';
    }
  } else if (activeTab === 'clips') {
    try {
      const clips = await clipApi.getChannelClips(channelId);
      if (!clips || !clips.length) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">&#127916;</div>
            <h3>No Clips Yet</h3>
            <p>No clips have been created for this channel.</p>
          </div>`;
        return;
      }
      container.innerHTML = `<div class="clips-grid">${clips.map(c => `
        <div class="card clip-card hover-lift" data-clip-id="${c.id}">
          <div class="clip-thumb">
            <img src="${DEFAULT_BANNER}" data-thumb-src="${c.thumbnailUrl || ''}" alt="${escapeHtml(c.title || 'Clip')}" />
            <span class="clip-views">${Icons.eye} ${c.viewCount || 0}</span>
          </div>
          <div class="clip-info">
            <div class="clip-title">${escapeHtml(c.title || 'Untitled')}</div>
            <div class="clip-meta">by ${escapeHtml(c.creatorName || c.creatorUsername || 'Unknown')}</div>
          </div>
        </div>
      `).join('')}</div><div id="clip-modal-root"></div>`;
      attachMediaImages(container);
      container.querySelectorAll('.clip-card').forEach(card => {
        card.addEventListener('click', () => {
          const clipId = parseInt(card.dataset.clipId);
          const clip = clips.find(x => x.id === clipId);
          if (clip) openClipPlayerModal(clip);
        });
      });
    } catch (e) {
      container.innerHTML = '<p class="text-muted text-center">Failed to load clips</p>';
    }
  } else if (activeTab === 'about') {
    const ch = currentChannelData || {};
    const links = Array.isArray(ch.socialLinks) ? ch.socialLinks : [];

    container.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:20px;max-width:900px;">
        <!-- Bio Card -->
        <div class="card" style="padding:24px;border-radius:16px;">
          <h3 style="margin:0 0 12px;font-size:18px;font-weight:700;color:#fff;">About ${escapeHtml(ch.channelName || ch.name || 'Channel')}</h3>
          <p style="margin:0;color:var(--color-text-muted,#888);line-height:1.6;font-size:14px;white-space:pre-line;">
            ${escapeHtml(ch.description || 'This channel has not added a description yet.')}
          </p>
          <div style="display:flex;gap:24px;margin-top:20px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.06);flex-wrap:wrap;">
            <div>
              <div style="font-size:11px;text-transform:uppercase;color:var(--color-text-muted,#888);font-weight:700;letter-spacing:0.05em;">Followers</div>
              <div style="font-size:18px;font-weight:700;color:#fff;margin-top:2px;">${ch.followerCount || 0}</div>
            </div>
            <div>
              <div style="font-size:11px;text-transform:uppercase;color:var(--color-text-muted,#888);font-weight:700;letter-spacing:0.05em;">Joined</div>
              <div style="font-size:18px;font-weight:700;color:#fff;margin-top:2px;">${ch.createdAt ? new Date(ch.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short' }) : 'Recent'}</div>
            </div>
            <div>
              <div style="font-size:11px;text-transform:uppercase;color:var(--color-text-muted,#888);font-weight:700;letter-spacing:0.05em;">VOD Archives</div>
              <div style="font-size:18px;font-weight:700;color:${ch.saveStreams ? 'var(--color-cyan-neon,#00f2fe)' : 'var(--color-text-muted,#888)'};margin-top:2px;">
                ${ch.saveStreams ? 'Enabled' : 'Disabled'}
              </div>
            </div>
          </div>
        </div>

        <!-- Donation Section -->
        <div class="card" style="padding:24px;background:linear-gradient(135deg,rgba(16,22,42,0.9),rgba(10,14,28,0.9));border:1px solid rgba(0,242,254,0.25);border-radius:16px;">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;">
            <div style="display:flex;align-items:center;gap:14px;flex:1;min-width:260px;">
              <div style="width:48px;height:48px;border-radius:14px;background:rgba(0,242,254,0.15);display:flex;align-items:center;justify-content:center;color:var(--color-cyan-neon,#00f2fe);font-size:24px;flex-shrink:0;">
                &#128176;
              </div>
              <div>
                <h3 style="margin:0;font-size:17px;font-weight:700;color:#fff;">Support & Donations</h3>
                <p style="margin:4px 0 0;font-size:13px;color:var(--color-text-muted,#888);line-height:1.4;">
                  ${escapeHtml(ch.donationMessage || 'Support the streamer and help keep the stream going!')}
                </p>
              </div>
            </div>
            ${ch.donationUrl ? `
              <a href="${escapeHtml(ch.donationUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-cyan" style="gap:8px;font-weight:700;padding:10px 22px;border-radius:10px;">
                ${Icons.play} Tip / Donate
              </a>
            ` : `
              <span style="font-size:13px;color:var(--color-text-muted);font-style:italic;padding:8px 12px;background:rgba(255,255,255,0.04);border-radius:8px;">No donation link configured</span>
            `}
          </div>
        </div>

        <!-- Social Media Links -->
        ${links.length > 0 ? `
          <div class="card" style="padding:24px;border-radius:16px;">
            <h3 style="margin:0 0 16px;font-size:17px;font-weight:700;color:#fff;">Social Links</h3>
            <div style="display:flex;gap:12px;flex-wrap:wrap;">
              ${links.map(l => `
                <a href="${escapeHtml(l.url)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline" style="gap:8px;padding:8px 16px;border-radius:10px;text-transform:capitalize;">
                  ${Icons.link} ${escapeHtml(l.platform)}
                </a>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }
}