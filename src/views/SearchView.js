import { store } from '../state/store.js';
import { categoryApi } from '../api/category.js';
import { channelApi } from '../api/channel.js';
import { streamApi } from '../api/stream.js';
import { clipApi } from '../api/clip.js';
import { Icons } from '../components/CosmicIcons.js';
import { openClipPlayerModal } from './ClipsFeedView.js';

let searchFilter = 'all'; // 'all', 'channels', 'categories', 'streams', 'clips'
let lastResults = { channels: [], categories: [], streams: [], clips: [] };

export function renderSearchView() {
  const query = store.getState().viewParams?.query || '';
  return `<div>
    <div style="margin-bottom:24px;">
      <div style="display:flex;gap:12px;max-width:700px;align-items:center;">
        <div class="search-bar" style="flex:1;height:48px;">
          ${Icons.search}
          <input type="text" id="search-input" placeholder="Search channels, categories, streams, clips..." value="${escapeHtml(query)}" autofocus style="font-size:16px;" />
        </div>
        <button id="search-submit-btn" class="btn btn-cyan btn-sm" style="height:48px;padding:0 24px;">Search</button>
      </div>
      <!-- Filter pills -->
      <div style="display:flex;gap:8px;margin-top:16px;overflow-x:auto;" id="search-filter-pills">
        <button class="cat-pill ${searchFilter==='all'?'active':''}" data-filter="all" style="padding:6px 16px;border-radius:20px;font-size:13px;font-weight:600;background:${searchFilter==='all'?'var(--color-cyan-primary)':'var(--color-space-slate)'};color:${searchFilter==='all'?'#000':'#fff'};border:1px solid var(--color-cyan-border);cursor:pointer;">All Results</button>
        <button class="cat-pill ${searchFilter==='channels'?'active':''}" data-filter="channels" style="padding:6px 16px;border-radius:20px;font-size:13px;font-weight:600;background:${searchFilter==='channels'?'var(--color-cyan-primary)':'var(--color-space-slate)'};color:${searchFilter==='channels'?'#000':'#fff'};border:1px solid var(--color-cyan-border);cursor:pointer;">Channels</button>
        <button class="cat-pill ${searchFilter==='categories'?'active':''}" data-filter="categories" style="padding:6px 16px;border-radius:20px;font-size:13px;font-weight:600;background:${searchFilter==='categories'?'var(--color-cyan-primary)':'var(--color-space-slate)'};color:${searchFilter==='categories'?'#000':'#fff'};border:1px solid var(--color-cyan-border);cursor:pointer;">Categories</button>
        <button class="cat-pill ${searchFilter==='streams'?'active':''}" data-filter="streams" style="padding:6px 16px;border-radius:20px;font-size:13px;font-weight:600;background:${searchFilter==='streams'?'var(--color-cyan-primary)':'var(--color-space-slate)'};color:${searchFilter==='streams'?'#000':'#fff'};border:1px solid var(--color-cyan-border);cursor:pointer;">Live Streams</button>
        <button class="cat-pill ${searchFilter==='clips'?'active':''}" data-filter="clips" style="padding:6px 16px;border-radius:20px;font-size:13px;font-weight:600;background:${searchFilter==='clips'?'var(--color-cyan-primary)':'var(--color-space-slate)'};color:${searchFilter==='clips'?'#000':'#fff'};border:1px solid var(--color-cyan-border);cursor:pointer;">Clips</button>
      </div>
    </div>
    <div id="search-results"></div>
    <div id="clip-modal-root"></div>
  </div>`;
}

export function setupSearchEvents() {
  const input = document.getElementById('search-input');
  const btn = document.getElementById('search-submit-btn');
  const query = store.getState().viewParams?.query;

  if (query) doSearch(query);

  let timeout;
  input?.addEventListener('input', () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      const q = input.value.trim();
      if (q) doSearch(q);
    }, 350);
  });

  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      clearTimeout(timeout);
      const q = input.value.trim();
      if (q) doSearch(q);
    }
  });

  btn?.addEventListener('click', () => {
    const q = input?.value?.trim();
    if (q) doSearch(q);
  });

  document.querySelectorAll('#search-filter-pills [data-filter]').forEach(pill => {
    pill.addEventListener('click', () => {
      searchFilter = pill.dataset.filter;
      document.querySelectorAll('#search-filter-pills [data-filter]').forEach(p => {
        const active = p.dataset.filter === searchFilter;
        p.style.background = active ? 'var(--color-cyan-primary)' : 'var(--color-space-slate)';
        p.style.color = active ? '#000' : '#fff';
      });
      renderResults(input?.value?.trim() || query || '');
    });
  });
}

async function doSearch(q) {
  const container = document.getElementById('search-results');
  if (!container) return;
  container.innerHTML = '<div class="spinner"></div>';

  try {
    const [channelsRes, catsRes, streamsRes, clipsRes] = await Promise.allSettled([
      channelApi.search(q),
      categoryApi.search(q),
      streamApi.getLiveStreams(),
      clipApi.getTop(30)
    ]);

    let channels = channelsRes.status === 'fulfilled' && Array.isArray(channelsRes.value) ? channelsRes.value : [];
    let categories = catsRes.status === 'fulfilled' && Array.isArray(catsRes.value) ? catsRes.value : [];

    // Filter live streams matching query
    const allStreams = streamsRes.status === 'fulfilled' && Array.isArray(streamsRes.value) ? streamsRes.value : [];
    const streams = allStreams.filter(s =>
      (s.title && s.title.toLowerCase().includes(q.toLowerCase())) ||
      (s.streamerName && s.streamerName.toLowerCase().includes(q.toLowerCase())) ||
      (s.categoryName && s.categoryName.toLowerCase().includes(q.toLowerCase()))
    );

    // If channel search API returned empty (e.g., if endpoint not yet deployed), derive matching channels from streams
    if (!channels.length && allStreams.length) {
      const seen = new Set();
      channels = allStreams
        .filter(s => (s.channelName && s.channelName.toLowerCase().includes(q.toLowerCase())) ||
                     (s.streamerName && s.streamerName.toLowerCase().includes(q.toLowerCase())))
        .filter(s => {
          if (seen.has(s.channelId)) return false;
          seen.add(s.channelId);
          return true;
        })
        .map(s => ({
          id: s.channelId,
          channelName: s.channelName || s.streamerName,
          description: `Live streamer in ${s.categoryName || 'Orbit'}`,
          profilePhotoUrl: s.profilePictureUrl,
          ownerUsername: s.streamerName,
          isLive: true,
          viewerCount: s.viewerCount || 0,
          categoryName: s.categoryName
        }));
    }

    // Filter clips matching query
    const allClips = clipsRes.status === 'fulfilled' && Array.isArray(clipsRes.value) ? clipsRes.value : [];
    const clips = allClips.filter(c =>
      (c.title && c.title.toLowerCase().includes(q.toLowerCase())) ||
      (c.creatorName && c.creatorName.toLowerCase().includes(q.toLowerCase())) ||
      (c.channelName && c.channelName.toLowerCase().includes(q.toLowerCase()))
    );

    lastResults = { channels, categories, streams, clips };
    renderResults(q);
  } catch (e) {
    container.innerHTML = '<p class="text-muted">Search failed. Please try again.</p>';
  }
}

function renderResults(q) {
  const container = document.getElementById('search-results');
  if (!container) return;

  const { channels, categories, streams, clips } = lastResults;
  const showChannels = (searchFilter === 'all' || searchFilter === 'channels') && channels.length > 0;
  const showCats = (searchFilter === 'all' || searchFilter === 'categories') && categories.length > 0;
  const showStreams = (searchFilter === 'all' || searchFilter === 'streams') && streams.length > 0;
  const showClips = (searchFilter === 'all' || searchFilter === 'clips') && clips.length > 0;

  const totalFound = (searchFilter === 'all' ? (channels.length + categories.length + streams.length + clips.length) :
                     searchFilter === 'channels' ? channels.length :
                     searchFilter === 'categories' ? categories.length :
                     searchFilter === 'streams' ? streams.length : clips.length);

  if (totalFound === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">&#128269;</div>
        <h3>No Results for "${escapeHtml(q)}"</h3>
        <p>No matching ${searchFilter === 'all' ? 'channels, categories, or broadcasts' : searchFilter} found. Try searching with different keywords.</p>
      </div>`;
    return;
  }

  let html = '';

  // 1. CHANNELS SECTION
  if (showChannels) {
    html += `
      <div style="margin-bottom:32px;">
        <div class="section-title">${Icons.video} Streamer Channels (${channels.length})</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(320px, 1fr));gap:16px;">
          ${channels.map(ch => `
            <div class="channel-search-card" data-channel-id="${ch.id}">
              <div class="channel-search-avatar">
                ${ch.profilePhotoUrl ? `<img src="${ch.profilePhotoUrl}" alt="${escapeHtml(ch.channelName)}" onerror="this.src='/Orbit_logo.png';" />` : (ch.channelName || 'C')[0].toUpperCase()}
              </div>
              <div style="flex:1;overflow:hidden;">
                <div style="display:flex;align-items:center;gap:6px;">
                  <span style="font-weight:700;color:#fff;font-size:15px;" class="truncate">${escapeHtml(ch.channelName)}</span>
                  ${Icons.checkCircle}
                  ${ch.isLive ? '<span class="badge-live" style="margin-left:auto;">LIVE</span>' : ''}
                </div>
                <div style="font-size:12px;color:var(--color-cyan-primary);margin-top:2px;">@${escapeHtml(ch.ownerUsername || 'streamer')}</div>
                <div style="font-size:12px;color:var(--color-text-muted);margin-top:4px;" class="truncate">${escapeHtml(ch.description || 'Broadcasting live on Orbit')}</div>
              </div>
              <button class="btn btn-outline btn-sm btn-view-channel" data-cid="${ch.id}" style="flex-shrink:0;">View</button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // 2. LIVE STREAMS SECTION
  if (showStreams) {
    html += `
      <div style="margin-bottom:32px;">
        <div class="section-title"><span style="color:var(--color-live-red);">&#9679;</span> Live Broadcasts (${streams.length})</div>
        <div class="streams-grid">
          ${streams.map(s => `
            <div class="card stream-card hover-lift" data-stream-id="${s.id}">
              <div class="stream-thumb">
                <img src="${s.thumbnailUrl || '/cosmic_orbit_banner.png'}" alt="${escapeHtml(s.title)}" />
                <div style="position:absolute;top:10px;left:10px;display:flex;gap:6px;">
                  <span class="badge-live">LIVE</span>
                  <span class="badge-viewers">${Icons.eye} ${s.viewerCount || 0}</span>
                </div>
                ${s.categoryName ? `<span class="badge-category" style="position:absolute;top:10px;right:10px;">${escapeHtml(s.categoryName)}</span>` : ''}
              </div>
              <div class="stream-info">
                <div class="streamer-row">
                  <div class="streamer-avatar">${s.profilePictureUrl ? `<img src="${s.profilePictureUrl}" />` : (s.streamerName || 'S')[0].toUpperCase()}</div>
                  <div style="flex:1;overflow:hidden;">
                    <div class="streamer-name">${escapeHtml(s.streamerName || 'Streamer')} ${Icons.checkCircle}</div>
                    <div style="font-size:12px;color:var(--color-cyan-primary);">${escapeHtml(s.categoryName || 'General')}</div>
                  </div>
                </div>
                <div class="stream-title">${escapeHtml(s.title || 'Live Stream')}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // 3. CATEGORIES SECTION
  if (showCats) {
    html += `
      <div style="margin-bottom:32px;">
        <div class="section-title">${Icons.grid} Categories (${categories.length})</div>
        <div class="categories-grid">
          ${categories.map(c => `
            <div class="card category-card hover-lift" data-slug="${c.slug}">
              <div class="cat-thumb">
                ${c.imageUrl ? `<img src="${c.imageUrl}" alt="${escapeHtml(c.name)}" />` : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:48px;background:var(--bg-gradient-card);">&#127918;</div>'}
              </div>
              <div class="cat-info">
                <div class="cat-name">${escapeHtml(c.name)}</div>
                ${c.totalViewers ? `<div class="cat-viewers">${c.totalViewers} viewers</div>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // 4. CLIPS SECTION
  if (showClips) {
    html += `
      <div style="margin-bottom:32px;">
        <div class="section-title">${Icons.clip} Clips (${clips.length})</div>
        <div class="clips-grid">
          ${clips.map(c => `
            <div class="card clip-card hover-lift" data-clip-id="${c.id}">
              <div class="clip-thumb">
                <img src="${c.thumbnailUrl || '/cosmic_orbit_banner.png'}" alt="${escapeHtml(c.title)}" onerror="this.onerror=null;this.src='/cosmic_orbit_banner.png';" />
                <span class="clip-views">${Icons.eye} ${c.viewCount || 0}</span>
              </div>
              <div class="clip-info">
                <div class="clip-title truncate">${escapeHtml(c.title || 'Untitled Clip')}</div>
                <div class="clip-meta">by ${escapeHtml(c.creatorName || c.creatorUsername || 'Unknown')}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  container.innerHTML = html;

  // Event handlers
  container.querySelectorAll('.channel-search-card, .btn-view-channel').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const cid = parseInt(el.dataset.channelId || el.dataset.cid);
      if (cid) store.navigate('channel', { channelId: cid });
    });
  });

  container.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('click', () => {
      store.navigate('category-detail', { slug: card.dataset.slug });
    });
  });

  container.querySelectorAll('.stream-card').forEach(card => {
    card.addEventListener('click', () => {
      const sid = parseInt(card.dataset.streamId);
      const stream = streams.find(s => s.id === sid);
      if (stream) {
        store.setActiveStream(stream);
        store.navigate('watch', { streamId: sid });
      }
    });
  });

  container.querySelectorAll('.clip-card').forEach(card => {
    card.addEventListener('click', () => {
      const cid = parseInt(card.dataset.clipId);
      const clip = clips.find(c => c.id === cid);
      if (clip) openClipPlayerModal(clip);
    });
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}