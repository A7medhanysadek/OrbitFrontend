import { store } from '../state/store.js';
import { categoryApi } from '../api/category.js';
import { Icons } from '../components/CosmicIcons.js';

let activeTab = 'streams';

export function renderCategoryDetailView() {
  return `
    <div>
      <div id="cat-header" style="display:flex;gap:20px;align-items:center;margin-bottom:24px;padding:24px;background:var(--color-space-panel);border-radius:var(--radius-card);border:1px solid rgba(0,174,189,0.12);">
        <div id="cat-img" style="width:120px;height:160px;border-radius:12px;overflow:hidden;background:var(--bg-gradient-card);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:48px;">&#127918;</div>
        <div>
          <h1 id="cat-name" style="font-size:24px;font-weight:700;margin-bottom:4px;">Loading...</h1>
          <p id="cat-desc" style="color:var(--color-text-muted);font-size:14px;"></p>
        </div>
      </div>
      <div class="tabs">
        <button class="tab-btn ${activeTab === 'streams' ? 'active' : ''}" data-tab="streams">Live Streams</button>
        <button class="tab-btn ${activeTab === 'clips' ? 'active' : ''}" data-tab="clips">Top Clips</button>
      </div>
      <div id="cat-content"><div class="spinner"></div></div>
    </div>
  `;
}

export function setupCategoryDetailEvents() {
  const slug = store.getState().viewParams?.slug;
  if (!slug) return;
  loadCategoryDetail(slug);
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadContent(slug);
    });
  });
}

async function loadCategoryDetail(slug) {
  try {
    const cat = await categoryApi.getBySlug(slug);
    document.getElementById('cat-name').textContent = cat.name;
    document.getElementById('cat-desc').textContent = cat.description || '';
    const img = document.getElementById('cat-img');
    if (cat.imageUrl && img) img.innerHTML = `<img src="${cat.imageUrl}" style="width:100%;height:100%;object-fit:cover;" />`;
    loadContent(slug);
  } catch (e) { store.showToast('Category not found', 'error'); }
}

async function loadContent(slug) {
  const container = document.getElementById('cat-content');
  if (!container) return;
  container.innerHTML = '<div class="spinner"></div>';
  if (activeTab === 'streams') {
    try {
      const streams = await categoryApi.getStreams(slug);
      if (!streams?.length) { container.innerHTML = '<div class="empty-state"><div class="empty-icon">&#128752;</div><h3>No Live Streams</h3><p>No one is streaming in this category right now.</p></div>'; return; }
      container.innerHTML = `<div class="streams-grid">${streams.map(s => `
        <div class="card stream-card hover-lift" data-sid="${s.id}">
          <div class="stream-thumb"><img src="${s.thumbnailUrl || '/cosmic_orbit_banner.png'}" /><div style="position:absolute;top:10px;left:10px;display:flex;gap:6px;"><span class="badge-live">LIVE</span><span class="badge-viewers">${s.viewerCount || 0}</span></div></div>
          <div class="stream-info"><div class="streamer-row"><div class="streamer-avatar">${(s.streamerName||'S')[0].toUpperCase()}</div><div><div class="streamer-name">${s.streamerName||'Streamer'}</div></div></div><div class="stream-title">${s.title||'Untitled'}</div></div>
        </div>
      `).join('')}</div>`;
      container.querySelectorAll('.stream-card').forEach(c => c.addEventListener('click', () => {
        const s = streams.find(x => x.id === parseInt(c.dataset.sid));
        if (s) { store.setActiveStream(s); store.navigate('watch', { streamId: s.id }); }
      }));
    } catch (e) { container.innerHTML = '<p class="text-muted">Failed to load streams</p>'; }
  } else {
    try {
      const clips = await categoryApi.getClips(slug);
      if (!clips?.length) { container.innerHTML = '<div class="empty-state"><div class="empty-icon">&#127916;</div><h3>No Clips</h3></div>'; return; }
      container.innerHTML = `<div class="clips-grid">${clips.map(c => `
        <div class="card clip-card hover-lift"><div class="clip-thumb"><img src="${c.thumbnailUrl || '/cosmic_orbit_banner.png'}" /><span class="clip-views">${Icons.eye} ${c.viewCount||0}</span></div><div class="clip-info"><div class="clip-title">${c.title||'Untitled'}</div><div class="clip-meta">by ${c.creatorUsername||'Unknown'}</div></div></div>
      `).join('')}</div>`;
    } catch (e) { container.innerHTML = '<p class="text-muted">Failed to load clips</p>'; }
  }
}