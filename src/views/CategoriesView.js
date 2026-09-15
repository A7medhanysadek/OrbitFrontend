import { store } from '../state/store.js';
import { categoryApi } from '../api/category.js';
import { streamApi } from '../api/stream.js';
import { Icons } from '../components/CosmicIcons.js';
import { DEFAULT_BANNER, attachMediaImages } from '../utils/mediaImage.js';

let activeBrowseTab = 'live'; // 'live' or 'categories'
let browsePollTimer = null;
let cachedActiveStreams = [];
let cachedCategories = [];

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderCategoriesView() {
  return `
    <div>
      <!-- Browse Header with Tabs and Search -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;flex-wrap:wrap;gap:16px;">
        <div style="display:flex;align-items:center;gap:16px;">
          <div class="section-title" style="margin-bottom:0;">${Icons.grid} Browse</div>
          <div class="tab-group" style="display:flex;background:var(--color-space-panel, #0f1424);padding:4px;border-radius:10px;border:1px solid rgba(255,255,255,0.08);gap:4px;">
            <button id="browse-tab-live" class="tab-btn ${activeBrowseTab === 'live' ? 'active' : ''}" style="padding:6px 14px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;">
              <span style="color:#ff3b30;margin-right:4px;">●</span> Live Channels
            </button>
            <button id="browse-tab-cats" class="tab-btn ${activeBrowseTab === 'categories' ? 'active' : ''}" style="padding:6px 14px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;">
              ${Icons.grid} Categories
            </button>
          </div>
        </div>

        <div style="display:flex;align-items:center;gap:10px;">
          <div class="search-bar" style="max-width:280px;">
            ${Icons.search}
            <input type="text" id="cat-search-input" placeholder="${activeBrowseTab === 'live' ? 'Search live channels...' : 'Search categories...'}" />
          </div>
          <button id="browse-refresh-btn" class="btn btn-ghost btn-sm" title="Refresh list" style="padding:8px 12px;border-radius:8px;">
            ${Icons.refresh}
          </button>
        </div>
      </div>

      <!-- Main Content Container -->
      <div id="browse-content-container">
        <div class="spinner" style="margin:40px auto;"></div>
      </div>
    </div>
  `;
}

export function setupCategoriesEvents() {
  if (browsePollTimer) {
    clearInterval(browsePollTimer);
    browsePollTimer = null;
  }

  loadBrowseData(true);

  // Auto-refresh active live streams every 15s
  browsePollTimer = setInterval(() => {
    const container = document.getElementById('browse-content-container');
    if (!container) {
      clearInterval(browsePollTimer);
      browsePollTimer = null;
      return;
    }
    loadBrowseData(false);
  }, 15000);

  // Tab switching
  document.getElementById('browse-tab-live')?.addEventListener('click', () => {
    activeBrowseTab = 'live';
    updateTabsUI();
    renderActiveTab();
  });

  document.getElementById('browse-tab-cats')?.addEventListener('click', () => {
    activeBrowseTab = 'categories';
    updateTabsUI();
    renderActiveTab();
  });

  // Manual refresh button
  document.getElementById('browse-refresh-btn')?.addEventListener('click', () => {
    loadBrowseData(true);
  });

  // Search input
  const searchInput = document.getElementById('cat-search-input');
  let timeout;
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        filterBrowseContent(searchInput.value.trim());
      }, 250);
    });
  }
}

function updateTabsUI() {
  const liveTab = document.getElementById('browse-tab-live');
  const catsTab = document.getElementById('browse-tab-cats');
  const searchInput = document.getElementById('cat-search-input');

  if (liveTab) liveTab.classList.toggle('active', activeBrowseTab === 'live');
  if (catsTab) catsTab.classList.toggle('active', activeBrowseTab === 'categories');
  if (searchInput) {
    searchInput.placeholder = activeBrowseTab === 'live' ? 'Search live channels...' : 'Search categories...';
    searchInput.value = '';
  }
}

async function loadBrowseData(showSpinner = false) {
  const container = document.getElementById('browse-content-container');
  if (!container) return;

  if (showSpinner) {
    container.innerHTML = '<div class="spinner" style="margin:40px auto;"></div>';
  }

  try {
    const [streams, cats] = await Promise.all([
      streamApi.getActiveStreams().catch(() => []),
      categoryApi.getAll().catch(() => [])
    ]);

    cachedActiveStreams = Array.isArray(streams) ? streams : [];
    cachedCategories = Array.isArray(cats) ? cats : [];

    renderActiveTab();
  } catch (err) {
    console.warn('[Browse] Error loading data:', err);
    if (showSpinner) {
      container.innerHTML = '<p class="text-muted text-center" style="margin:40px 0;">Failed to load browse content.</p>';
    }
  }
}

function renderActiveTab() {
  const container = document.getElementById('browse-content-container');
  if (!container) return;

  if (activeBrowseTab === 'live') {
    renderLiveStreams(container, cachedActiveStreams);
  } else {
    renderCats(container, cachedCategories);
  }
}

function filterBrowseContent(query) {
  const container = document.getElementById('browse-content-container');
  if (!container) return;

  const q = query.toLowerCase();

  if (activeBrowseTab === 'live') {
    const filtered = cachedActiveStreams.filter(s =>
      (s.title && s.title.toLowerCase().includes(q)) ||
      (s.streamerName && s.streamerName.toLowerCase().includes(q)) ||
      (s.channelName && s.channelName.toLowerCase().includes(q)) ||
      (s.categoryName && s.categoryName.toLowerCase().includes(q))
    );
    renderLiveStreams(container, filtered);
  } else {
    const filtered = cachedCategories.filter(c =>
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.slug && c.slug.toLowerCase().includes(q))
    );
    renderCats(container, filtered);
  }
}

function renderLiveStreams(container, streams) {
  if (!streams?.length) {
    container.innerHTML = `
      <div class="empty-state" style="margin:60px auto;text-align:center;">
        <div class="empty-icon" style="font-size:48px;margin-bottom:12px;">📡</div>
        <h3 style="margin-bottom:6px;">No Live Broadcasts Right Now</h3>
        <p class="text-muted" style="font-size:13px;max-width:400px;margin:0 auto 16px;">
          No channels are currently broadcasting. Check back in a moment or start your own stream!
        </p>
        <button id="browse-go-studio-btn" class="btn btn-cyan btn-sm">Go to Streamer Dashboard</button>
      </div>
    `;
    container.querySelector('#browse-go-studio-btn')?.addEventListener('click', () => store.navigate('dashboard'));
    return;
  }

  container.innerHTML = `
    <div class="streams-grid" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(280px, 1fr));gap:20px;">
      ${streams.map(s => {
        const streamerLetter = (s.streamerName || s.channelName || 'S')[0].toUpperCase();
        return `
          <div class="card stream-card hover-lift" data-stream-id="${s.id}" style="cursor:pointer;overflow:hidden;border-radius:12px;background:var(--color-space-panel, #0f1424);border:1px solid rgba(255,255,255,0.08);">
            <div class="stream-thumb" style="position:relative;aspect-ratio:16/9;background:#000;overflow:hidden;">
              <img src="${DEFAULT_BANNER}" data-thumb-src="${s.thumbnailUrl || ''}" alt="${escapeHtml(s.title || 'Live Stream')}" style="width:100%;height:100%;object-fit:cover;" />
              <div class="badge-live" style="position:absolute;top:10px;left:10px;background:#ff3b30;color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;display:flex;align-items:center;gap:4px;box-shadow:0 2px 8px rgba(0,0,0,0.6);">
                <span style="width:6px;height:6px;border-radius:50%;background:#fff;display:inline-block;"></span>
                LIVE
              </div>
              <div style="position:absolute;bottom:10px;left:10px;background:rgba(4,7,18,0.85);color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;display:flex;align-items:center;gap:4px;backdrop-filter:blur(4px);">
                ${Icons.eye} <span>${s.viewerCount || 0} viewers</span>
              </div>
            </div>
            <div style="padding:14px;display:flex;gap:12px;align-items:flex-start;">
              <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,var(--color-cyan-primary),var(--color-cyan-neon));display:flex;align-items:center;justify-content:center;font-weight:700;font-size:16px;color:#000;flex-shrink:0;">
                ${streamerLetter}
              </div>
              <div style="flex:1;overflow:hidden;">
                <div style="font-weight:700;font-size:14px;color:var(--color-text,#fff);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:3px;">
                  ${escapeHtml(s.title || 'Live Stream')}
                </div>
                <div style="font-size:12px;color:var(--color-text-muted,#aaa);margin-bottom:4px;">
                  ${escapeHtml(s.streamerName || s.channelName || 'Streamer')}
                </div>
                ${s.categoryName ? `<span class="badge-category" style="font-size:10px;padding:1px 6px;">${escapeHtml(s.categoryName)}</span>` : ''}
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  attachMediaImages(container);

  container.querySelectorAll('.stream-card').forEach(card => {
    card.addEventListener('click', () => {
      const sid = parseInt(card.dataset.streamId, 10);
      const target = streams.find(x => x.id === sid);
      if (target) {
        store.setActiveStream(target);
        store.navigate('watch', { streamId: sid });
      }
    });
  });
}

function renderCats(container, cats) {
  if (!cats?.length) {
    container.innerHTML = '<div class="empty-state" style="margin:40px auto;text-align:center;"><div class="empty-icon" style="font-size:48px;">🔍</div><h3>No Categories Found</h3></div>';
    return;
  }

  // Count active live viewers per category
  const categoryViewerMap = {};
  for (const s of cachedActiveStreams) {
    if (s.categoryId) {
      categoryViewerMap[s.categoryId] = (categoryViewerMap[s.categoryId] || 0) + (s.viewerCount || 0);
    }
  }

  container.innerHTML = `
    <div class="categories-grid" id="categories-grid">
      ${cats.map(cat => {
        const liveViewers = categoryViewerMap[cat.id] || cat.totalViewers || 0;
        return `
          <div class="card category-card hover-lift stagger-item" data-slug="${cat.slug}" style="cursor:pointer;">
            <div class="cat-thumb">
              ${cat.imageUrl ? `<img src="${cat.imageUrl}" alt="${escapeHtml(cat.name)}" />` : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:48px;background:var(--bg-gradient-card);">🎮</div>`}
            </div>
            <div class="cat-info">
              <div class="cat-name">${escapeHtml(cat.name)}</div>
              <div class="cat-viewers" style="color:${liveViewers > 0 ? '#ff3b30' : 'inherit'};font-weight:${liveViewers > 0 ? '700' : '400'};">
                ${liveViewers > 0 ? `● ${liveViewers} viewers` : '0 viewers'}
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  container.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('click', () => store.navigate('category-detail', { slug: card.dataset.slug }));
  });
}