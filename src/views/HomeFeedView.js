import { store } from '../state/store.js';
import { streamApi } from '../api/stream.js';
import { categoryApi } from '../api/category.js';
import { Icons } from '../components/CosmicIcons.js';
import { DEFAULT_BANNER, attachMediaImages } from '../utils/mediaImage.js';

let selectedCat = null;

export function renderHomeFeedView() {
  return `
    <div>
      <!-- Hero Banner -->
      <div style="background:var(--bg-gradient-card);border-radius:var(--radius-card);padding:40px;margin-bottom:28px;position:relative;overflow:hidden;border:1px solid rgba(0,174,189,0.12);">
        <div style="position:absolute;top:-40px;right:-20px;opacity:0.08;font-size:180px;">&#127756;</div>
        <h1 style="font-family:var(--font-display);font-size:28px;color:var(--color-cyan-neon);margin-bottom:8px;">Welcome to Orbit</h1>
        <p style="color:var(--color-text-muted);font-size:15px;margin-bottom:20px;max-width:500px;">Discover live broadcasts from across the galaxy. Watch, chat, and connect with your favorite streamers.</p>
        <div style="display:flex;gap:12px;">
          <button id="hero-studio-btn" class="btn btn-cyan btn-sm">${Icons.rocket} Creator Studio</button>
          <button id="hero-explore-btn" class="btn btn-outline btn-sm">${Icons.grid} Browse Categories</button>
        </div>
      </div>

      <!-- Category Pills -->
      <div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:8px;margin-bottom:24px;" id="home-cat-pills">
        <button class="cat-pill active" data-slug="all" style="padding:8px 18px;border-radius:20px;font-size:13px;font-weight:600;background:var(--color-cyan-primary);color:#000;border:none;cursor:pointer;flex-shrink:0;">All Channels</button>
      </div>

      <!-- Top Categories -->
      <div style="margin-bottom:32px;">
        <div class="section-title">${Icons.star} Top Categories</div>
        <div class="categories-grid" id="home-top-categories">
          <div class="spinner"></div>
        </div>
      </div>

      <!-- Live Broadcasts -->
      <div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
          <div class="section-title" style="margin-bottom:0;"><span style="color:var(--color-live-red);">&#9679;</span> Live Broadcasts</div>
          <button id="refresh-streams" class="btn btn-ghost btn-sm">${Icons.refresh} Refresh</button>
        </div>
        <div class="streams-grid" id="home-streams-grid">
          <div class="spinner" style="grid-column:1/-1;"></div>
        </div>
      </div>
    </div>
  `;
}

export function setupHomeFeedEvents() {
  document.getElementById('hero-studio-btn')?.addEventListener('click', () => store.navigate('studio'));
  document.getElementById('hero-explore-btn')?.addEventListener('click', () => store.navigate('categories'));
  document.getElementById('refresh-streams')?.addEventListener('click', () => loadStreams());

  loadCategories();
  loadTopCategories();
  loadStreams();

  async function loadTopCategories() {
    const grid = document.getElementById('home-top-categories');
    if (!grid) return;
    try {
      const cats = await categoryApi.getTop(8);
      if (!cats?.length) { grid.innerHTML = '<p class="text-muted" style="grid-column:1/-1;">No categories available</p>'; return; }
      grid.innerHTML = cats.map((cat, i) => `
        <div class="card category-card hover-lift stagger-item" data-slug="${cat.slug}">
          <div class="cat-thumb">
            ${cat.imageUrl ? `<img src="${cat.imageUrl}" alt="${cat.name}" />` : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:48px;">&#127918;</div>`}
          </div>
          <div class="cat-info">
            <div class="cat-name">${cat.name}</div>
            <div class="cat-viewers">${cat.totalViewers || 0} viewers &middot; ${cat.liveStreamCount || 0} live</div>
          </div>
        </div>
      `).join('');
      grid.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => store.navigate('category-detail', { slug: card.dataset.slug }));
      });
    } catch (e) { grid.innerHTML = '<p class="text-muted" style="grid-column:1/-1;">Failed to load categories</p>'; }
  }

  async function loadCategories() {
    const container = document.getElementById('home-cat-pills');
    if (!container) return;
    try {
      const cats = await categoryApi.getAll();
      if (!cats?.length) return;
      container.innerHTML = `
        <button class="cat-pill ${!selectedCat ? 'active' : ''}" data-slug="all" style="padding:8px 18px;border-radius:20px;font-size:13px;font-weight:600;background:${!selectedCat ? 'var(--color-cyan-primary)' : 'var(--color-space-slate)'};color:${!selectedCat ? '#000' : '#fff'};border:1px solid var(--color-cyan-border);cursor:pointer;flex-shrink:0;">All</button>
        ${cats.map(c => `<button class="cat-pill ${selectedCat === c.slug ? 'active' : ''}" data-slug="${c.slug}" style="padding:8px 18px;border-radius:20px;font-size:13px;font-weight:500;background:${selectedCat === c.slug ? 'var(--color-cyan-primary)' : 'var(--color-space-slate)'};color:${selectedCat === c.slug ? '#000' : '#fff'};border:1px solid var(--color-cyan-border);cursor:pointer;flex-shrink:0;">${c.name}</button>`).join('')}
      `;
      container.querySelectorAll('.cat-pill').forEach(pill => {
        pill.addEventListener('click', () => {
          selectedCat = pill.dataset.slug === 'all' ? null : pill.dataset.slug;
          loadCategories();
          loadStreams();
        });
      });
    } catch (e) {}
  }

  async function loadStreams() {
    const grid = document.getElementById('home-streams-grid');
    if (!grid) return;
    grid.innerHTML = '<div class="spinner" style="grid-column:1/-1;"></div>';
    try {
      let streams;
      if (selectedCat) {
        streams = await categoryApi.getStreams(selectedCat);
      } else {
        streams = await streamApi.getLiveStreams();
      }
      if (!streams?.length) {
        grid.innerHTML = `
          <div class="empty-state" style="grid-column:1/-1;">
            <div class="empty-icon">&#128752;</div>
            <h3>No Active Broadcasts</h3>
            <p>No channels are live right now. Be the first to stream!</p>
            <button id="empty-go-live" class="btn btn-cyan btn-sm">${Icons.rocket} Launch Creator Studio</button>
          </div>`;
        document.getElementById('empty-go-live')?.addEventListener('click', () => store.navigate('studio'));
        return;
      }
      grid.innerHTML = streams.map((s, i) => `
        <div class="card stream-card hover-lift stagger-item" data-sid="${s.id}">
          <div class="stream-thumb">
            <img src="${DEFAULT_BANNER}" data-thumb-src="${s.thumbnailUrl || ''}" alt="${s.title}" />
            <div style="position:absolute;top:10px;left:10px;display:flex;gap:6px;">
              <span class="badge-live">LIVE</span>
              <span class="badge-viewers">${Icons.eye} ${s.viewerCount || 0}</span>
            </div>
            ${s.categoryName ? `<span class="badge-category" style="position:absolute;top:10px;right:10px;">${s.categoryName}</span>` : ''}
          </div>
          <div class="stream-info">
            <div class="streamer-row">
              <div class="streamer-avatar">${s.profilePictureUrl ? `<img src="${s.profilePictureUrl}" />` : (s.streamerName || 'S')[0].toUpperCase()}</div>
              <div style="flex:1;overflow:hidden;">
                <div class="streamer-name">${s.streamerName || 'Streamer'} ${Icons.checkCircle}</div>
                <div style="font-size:12px;color:var(--color-cyan-primary);">${s.categoryName || 'General'}</div>
              </div>
            </div>
            <div class="stream-title">${s.title || 'Untitled Stream'}</div>
          </div>
        </div>
      `).join('');
      attachMediaImages(grid);
      grid.querySelectorAll('.stream-card').forEach(card => {
        card.addEventListener('click', () => {
          const id = parseInt(card.dataset.sid);
          const found = streams.find(s => s.id === id);
          if (found) { store.setActiveStream(found); store.navigate('watch', { streamId: id }); }
        });
      });
    } catch (e) { grid.innerHTML = '<p class="text-muted" style="grid-column:1/-1;text-align:center;padding:40px;">Failed to load streams</p>'; }
  }
}