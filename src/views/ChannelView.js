import { store } from '../state/store.js';
import { channelApi } from '../api/channel.js';
import { clipApi } from '../api/clip.js';
import { vodApi } from '../api/vod.js';
import { Icons } from '../components/CosmicIcons.js';
import { openClipPlayerModal } from './ClipsFeedView.js';
import { openVodPlayerModal } from '../components/VodPlayerModal.js';

let activeTab = 'vods';

export function renderChannelView() {
  return `
    <div>
      <div class="channel-banner" id="ch-banner"><div class="channel-banner-overlay"></div></div>
      <div class="channel-profile" id="ch-profile">
        <div class="channel-avatar" id="ch-avatar"></div>
        <div class="channel-meta">
          <h1 id="ch-name">Loading...</h1>
          <p class="channel-desc" id="ch-desc"></p>
        </div>
        <div class="channel-actions">
          <button id="ch-follow-btn" class="btn btn-cyan btn-sm">${Icons.follow} Follow</button>
        </div>
      </div>

      <!-- Social Links -->
      <div id="ch-social" style="display:flex;gap:10px;margin:16px 0;padding-left:124px;"></div>

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
    document.getElementById('ch-name').innerHTML = `${ch.name || ch.channelName || 'Channel'} ${Icons.checkCircle}`;
    document.getElementById('ch-desc').textContent = ch.description || '';
    const banner = document.getElementById('ch-banner');
    if (ch.coverPhotoUrl && banner) banner.style.background = `url(${ch.coverPhotoUrl}) center/cover`;
    const avatar = document.getElementById('ch-avatar');
    if (avatar) avatar.innerHTML = ch.profilePhotoUrl ? `<img src="${ch.profilePhotoUrl}" />` : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:36px;font-weight:700;color:#000;background:linear-gradient(135deg,#00AEBD,#00DDEE);">${(ch.name || 'C')[0].toUpperCase()}</div>`;

    // Follow
    const followBtn = document.getElementById('ch-follow-btn');
    if (followBtn) {
      const isF = store.isFollowing(channelId);
      followBtn.className = `btn btn-sm follow-btn ${isF ? 'following' : 'not-following'}`;
      followBtn.innerHTML = isF ? `${Icons.followFilled} Following` : `${Icons.follow} Follow`;
      followBtn.addEventListener('click', () => {
        if (store.isFollowing(channelId)) { store.unfollowChannel(channelId); followBtn.className = 'btn btn-sm follow-btn not-following'; followBtn.innerHTML = `${Icons.follow} Follow`; }
        else { store.followChannel(channelId, ch.name || ch.channelName); followBtn.className = 'btn btn-sm follow-btn following'; followBtn.innerHTML = `${Icons.followFilled} Following`; store.showToast(`Following ${ch.name}!`, 'success'); }
      });
    }

    // Social links
    try {
      const links = await channelApi.getSocialLinks(channelId);
      const social = document.getElementById('ch-social');
      if (social && links) {
        const entries = Object.entries(links).filter(([k, v]) => v && k !== 'channelId');
        social.innerHTML = entries.map(([k, v]) => `<a href="${v}" target="_blank" class="btn btn-ghost btn-sm" style="gap:4px;">${Icons.link} ${k}</a>`).join('');
      }
    } catch (e) {}

    loadTabContent(channelId);
  } catch (e) { store.showToast('Failed to load channel', 'error'); }
}

async function loadTabContent(channelId) {
  const container = document.getElementById('ch-tab-content');
  if (!container) return;
  container.innerHTML = '<div class="spinner"></div>';

  if (activeTab === 'vods') {
    try {
      const vods = await vodApi.getChannelVods(channelId);
      if (!vods?.length) { container.innerHTML = '<div class="empty-state"><div class="empty-icon">&#128249;</div><h3>No Saved VODs</h3><p>This channel has no saved broadcasts yet.</p></div>'; return; }
      container.innerHTML = `<div class="streams-grid">${vods.map(v => `
        <div class="card vod-card hover-lift" data-vod-id="${v.id || v.streamId}">
          <div class="vod-thumb">
            <img src="${v.thumbnailUrl || '/cosmic_orbit_banner.png'}" alt="${v.title}" onerror="this.onerror=null;this.src='/cosmic_orbit_banner.png';" />
            <span class="vod-duration">${v.duration || ''}</span>
          </div>
          <div class="vod-info">
            <div class="vod-title">${v.title || 'Untitled VOD'}</div>
            <div class="vod-meta">${v.rewatchCount || 0} views &middot; ${v.chatMessageCount || 0} messages</div>
          </div>
        </div>
      `).join('')}</div>`;

      container.querySelectorAll('.vod-card').forEach(card => {
        card.addEventListener('click', () => {
          const vid = parseInt(card.dataset.vodId);
          const target = vods.find(x => (x.id === vid || x.streamId === vid));
          if (target) {
            openVodPlayerModal(target);
          }
        });
      });
    } catch (e) { container.innerHTML = '<p class="text-muted text-center">Failed to load VODs</p>'; }
  } else if (activeTab === 'clips') {
    try {
      const clips = await clipApi.getChannelClips(channelId);
      if (!clips?.length) { container.innerHTML = '<div class="empty-state"><div class="empty-icon">&#127916;</div><h3>No Clips Yet</h3><p>No clips have been created for this channel.</p></div>'; return; }
      container.innerHTML = `<div class="clips-grid">${clips.map(c => `
        <div class="card clip-card hover-lift" data-clip-id="${c.id}">
          <div class="clip-thumb">
            <img src="${c.thumbnailUrl || '/cosmic_orbit_banner.png'}" alt="${c.title || 'Clip'}" onerror="this.onerror=null;this.src='/cosmic_orbit_banner.png';" />
            <span class="clip-views">${Icons.eye} ${c.viewCount || 0}</span>
          </div>
          <div class="clip-info">
            <div class="clip-title">${c.title || 'Untitled'}</div>
            <div class="clip-meta">by ${c.creatorName || c.creatorUsername || 'Unknown'}</div>
          </div>
        </div>
      `).join('')}</div><div id="clip-modal-root"></div>`;
      container.querySelectorAll('.clip-card').forEach(card => {
        card.addEventListener('click', () => {
          const clipId = parseInt(card.dataset.clipId);
          const clip = clips.find(x => x.id === clipId);
          if (clip) openClipPlayerModal(clip);
        });
      });
    } catch (e) { container.innerHTML = '<p class="text-muted text-center">Failed to load clips</p>'; }
  } else if (activeTab === 'about') {
    container.innerHTML = `<div class="card" style="padding:24px;"><p style="color:var(--color-text-muted);">Channel details and statistics coming soon.</p></div>`;
  }
}