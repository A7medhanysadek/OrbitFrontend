import { store } from '../state/store.js';
import { streamApi } from '../api/stream.js';
import { categoryApi } from '../api/category.js';
import { channelApi } from '../api/channel.js';
import { clipApi } from '../api/clip.js';
import { Icons } from '../components/CosmicIcons.js';
import { openClipPlayerModal } from './ClipsFeedView.js';
import { DEFAULT_BANNER, attachMediaImages } from '../utils/mediaImage.js';
import { renderSaturnAvatar } from '../components/OrbitEmotes.js';

let selectedCat = null;
let currentHeroIndex = 0;
let liveStreamsList = [];
let heroTimer = null;

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderHomeFeedView() {
  return `
    <div>
      <!-- Kick-Style Hero Carousel Container -->
      <div id="home-hero-mount">
        <!-- Rendered dynamically based on live streams availability -->
        <div class="kick-hero-carousel" style="min-height:360px;display:flex;align-items:center;justify-content:center;">
          <div class="spinner"></div>
        </div>
      </div>

      <!-- Live Broadcasts Section -->
      <div style="margin-bottom:36px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:12px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <span class="cosmic-beacon"></span>
            <h2 style="font-family:var(--font-display);font-size:22px;color:var(--color-text-white);margin:0;">
              Live Channels
            </h2>
          </div>
          <button id="refresh-streams" class="btn btn-ghost btn-sm">${Icons.refresh} Refresh</button>
        </div>

        <!-- Category Filter Pills -->
        <div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:10px;margin-bottom:20px;" id="home-cat-pills">
          <button class="cat-pill active" data-slug="all" style="padding:8px 18px;border-radius:20px;font-size:13px;font-weight:600;background:var(--color-cyan-primary);color:#000;border:none;cursor:pointer;flex-shrink:0;">All Channels</button>
        </div>

        <!-- Streams Grid -->
        <div class="streams-grid" id="home-streams-grid">
          <div class="spinner" style="grid-column:1/-1;"></div>
        </div>
      </div>

      <!-- Top Categories Shelf -->
      <div style="margin-bottom:40px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:20px;color:var(--color-cyan-neon);">${Icons.star || '⭐'}</span>
            <h2 style="font-family:var(--font-display);font-size:20px;color:var(--color-text-white);margin:0;">
              Top Categories
            </h2>
          </div>
          <button id="view-all-cats-btn" class="btn btn-ghost btn-sm" style="color:var(--color-cyan-primary);">
            View All &rarr;
          </button>
        </div>
        <div class="categories-grid" id="home-top-categories">
          <div class="spinner"></div>
        </div>
      </div>

      <!-- Trending Highlights / Clips Shelf -->
      <div style="margin-bottom:40px;" id="home-trending-clips-section">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:20px;color:var(--color-cyan-neon);">${Icons.clip || '🎬'}</span>
            <h2 style="font-family:var(--font-display);font-size:20px;color:var(--color-text-white);margin:0;">
              Trending Highlights &amp; Clips
            </h2>
          </div>
          <button id="view-all-clips-btn" class="btn btn-ghost btn-sm" style="color:var(--color-cyan-primary);">
            Explore Clips &rarr;
          </button>
        </div>
        <div class="streams-grid" id="home-clips-grid" style="grid-template-columns:repeat(auto-fill, minmax(240px, 1fr));">
          <div class="spinner" style="grid-column:1/-1;"></div>
        </div>
      </div>
    </div>
  `;
}

export function setupHomeFeedEvents() {
  document.getElementById('refresh-streams')?.addEventListener('click', () => {
    loadStreams();
  });
  document.getElementById('view-all-cats-btn')?.addEventListener('click', () => {
    store.navigate('categories');
  });
  document.getElementById('view-all-clips-btn')?.addEventListener('click', () => {
    store.navigate('clips');
  });

  loadInitialData();
}

async function loadInitialData() {
  await Promise.allSettled([
    loadCategories(),
    loadTopCategories(),
    loadStreams(),
    loadTrendingClips()
  ]);
}

// ──────────────────────────────────────────
// Kick-Style Hero Carousel Renderer
// ──────────────────────────────────────────
function renderHero() {
  const mount = document.getElementById('home-hero-mount');
  if (!mount) return;

  if (heroTimer) {
    clearInterval(heroTimer);
    heroTimer = null;
  }

  if (!liveStreamsList || liveStreamsList.length === 0) {
    // Cosmic Fallback Hero with Space Concept Animations
    mount.innerHTML = `
      <div style="position:relative;background:radial-gradient(ellipse at top right, rgba(0, 242, 254, 0.15), transparent 50%), radial-gradient(ellipse at bottom left, rgba(121, 40, 202, 0.2), transparent 50%), var(--bg-gradient-card);border-radius:var(--radius-card);padding:48px 40px;margin-bottom:36px;overflow:hidden;border:1px solid rgba(0, 174, 189, 0.15);box-shadow:0 12px 36px rgba(0,0,0,0.4);">
        <!-- Celestial Orbiting Rings -->
        <div class="orbit-ring orbit-ring-1" style="top:-60px;right:60px;border-color:rgba(0,242,254,0.25);pointer-events:none;"></div>
        <div class="orbit-ring orbit-ring-2" style="top:-110px;right:10px;border-color:rgba(121,40,202,0.3);pointer-events:none;"></div>
        <div class="orbit-ring orbit-ring-3" style="top:-160px;right:-40px;border-color:rgba(0,174,189,0.15);pointer-events:none;"></div>

        <!-- Floating Nebula Dust -->
        <div style="position:absolute;top:20%;right:15%;width:180px;height:180px;background:radial-gradient(circle, rgba(0,242,254,0.2), transparent 70%);animation:nebula-pulse 8s ease-in-out infinite;pointer-events:none;"></div>

        <div style="position:relative;z-index:2;max-width:600px;">
          <div style="display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border-radius:20px;background:rgba(0,242,254,0.08);border:1px solid rgba(0,242,254,0.25);margin-bottom:16px;">
            <span style="font-size:12px;color:var(--color-cyan-neon);font-weight:700;letter-spacing:0.05em;text-transform:uppercase;">
              ${Icons.rocket} Next-Gen Streaming Platform
            </span>
          </div>
          <h1 style="font-family:var(--font-display);font-size:34px;color:#fff;margin:0 0 12px;line-height:1.2;">
            Broadcast Across the <span style="background:linear-gradient(135deg, var(--color-cyan-neon), #00aebd);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">Cosmos</span>
          </h1>
          <p style="color:var(--color-text-muted);font-size:15px;line-height:1.6;margin:0 0 24px;">
            Discover live creators, join interactive real-time chats, and stream with low-latency RTMP to viewers worldwide.
          </p>
          <div style="display:flex;gap:12px;flex-wrap:wrap;">
            <button id="hero-studio-btn" class="btn btn-cyan btn-sm" style="padding:10px 22px;font-weight:700;">
              ${Icons.rocket} Creator Studio
            </button>
            <button id="hero-explore-btn" class="btn btn-outline btn-sm" style="padding:10px 22px;">
              ${Icons.grid} Browse Categories
            </button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('hero-studio-btn')?.addEventListener('click', () => store.navigate('studio'));
    document.getElementById('hero-explore-btn')?.addEventListener('click', () => store.navigate('categories'));
    return;
  }

  // Ensure index is within bounds
  if (currentHeroIndex >= liveStreamsList.length) currentHeroIndex = 0;
  const currentStream = liveStreamsList[currentHeroIndex];

  mount.innerHTML = `
    <div class="kick-hero-carousel">
      <div class="kick-hero-main">
        <!-- Main Video Preview Stage -->
        <div class="kick-hero-preview" id="hero-preview-stage" title="Click to watch stream">
          <img src="${DEFAULT_BANNER}" data-thumb-src="${currentStream.thumbnailUrl || ''}" alt="${escapeHtml(currentStream.title)}" />
          
          <!-- Badges overlay -->
          <div style="position:absolute;top:16px;left:16px;display:flex;align-items:center;gap:8px;z-index:2;">
            <span class="badge-live" style="font-size:13px;padding:4px 12px;display:inline-flex;align-items:center;gap:6px;">
              <span class="cosmic-beacon" style="width:8px;height:8px;"></span> LIVE
            </span>
            <span class="badge-viewers" style="font-size:13px;padding:4px 10px;">
              ${Icons.eye} ${currentStream.viewerCount || 0}
            </span>
          </div>

          <!-- Play overlay icon -->
          <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.25);transition:background 0.3s;" class="hero-play-overlay">
            <div style="width:64px;height:64px;border-radius:50%;background:rgba(0,242,254,0.9);display:flex;align-items:center;justify-content:center;box-shadow:0 0 20px rgba(0,242,254,0.8);color:#000;">
              <span style="font-size:24px;margin-left:4px;">▶</span>
            </div>
          </div>
        </div>

        <!-- Streamer Details Sidebar -->
        <div class="kick-hero-details">
          <div>
            <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px;">
              ${renderSaturnAvatar({
                src: currentStream.profilePictureUrl,
                fallback: (currentStream.channelName || currentStream.streamerName || 'S')[0].toUpperCase(),
                size: 'lg'
              })}
              <div>
                <div style="font-weight:700;font-size:16px;color:var(--color-text-white);display:flex;align-items:center;gap:6px;">
                  <span>${escapeHtml(currentStream.channelName || currentStream.streamerName || 'Streamer')}</span>
                  <span style="color:var(--color-cyan-neon);">${Icons.checkCircle || '✓'}</span>
                </div>
                <div style="font-size:12px;color:var(--color-text-muted);margin-top:2px;">
                  Streaming ${escapeHtml(currentStream.categoryName || 'General')}
                </div>
              </div>
            </div>

            <h3 style="font-size:20px;font-weight:700;color:#fff;margin:0 0 10px;line-height:1.3;">
              ${escapeHtml(currentStream.title || 'Live Broadcast')}
            </h3>

            ${currentStream.categoryName ? `
              <span class="badge-category" style="margin-bottom:14px;display:inline-block;">
                ${escapeHtml(currentStream.categoryName)}
              </span>
            ` : ''}

            <p style="font-size:13px;color:var(--color-text-muted);line-height:1.5;margin:0 0 20px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;">
              ${escapeHtml(currentStream.description || 'Welcome to the live stream! Come join the chat, say hello, and hang out with the community.')}
            </p>
          </div>

          <div>
            <button id="hero-watch-btn" class="btn btn-cyan btn-full" style="padding:12px;font-weight:700;font-size:14px;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 0 16px rgba(0,242,254,0.3);">
              ${Icons.play} Watch Live Stream
            </button>

            <!-- Carousel Controls -->
            <div style="display:flex;align-items:center;justify-content:space-between;margin-top:16px;">
              <div class="kick-hero-nav-pills">
                ${liveStreamsList.map((_, idx) => `
                  <button class="kick-hero-nav-pill ${idx === currentHeroIndex ? 'active' : ''}" data-hero-index="${idx}"></button>
                `).join('')}
              </div>

              <div style="display:flex;gap:6px;">
                <button id="hero-prev-btn" class="btn btn-ghost btn-sm" style="padding:4px 8px;border-radius:6px;border:1px solid rgba(255,255,255,0.1);">&larr;</button>
                <button id="hero-next-btn" class="btn btn-ghost btn-sm" style="padding:4px 8px;border-radius:6px;border:1px solid rgba(255,255,255,0.1);">&rarr;</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  attachMediaImages(mount);

  const goToStream = () => {
    store.setActiveStream(currentStream);
    store.navigate('watch', { streamId: currentStream.id });
  };

  document.getElementById('hero-preview-stage')?.addEventListener('click', goToStream);
  document.getElementById('hero-watch-btn')?.addEventListener('click', goToStream);

  document.getElementById('hero-prev-btn')?.addEventListener('click', () => {
    currentHeroIndex = (currentHeroIndex - 1 + liveStreamsList.length) % liveStreamsList.length;
    renderHero();
  });

  document.getElementById('hero-next-btn')?.addEventListener('click', () => {
    currentHeroIndex = (currentHeroIndex + 1) % liveStreamsList.length;
    renderHero();
  });

  mount.querySelectorAll('.kick-hero-nav-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      currentHeroIndex = parseInt(pill.dataset.heroIndex);
      renderHero();
    });
  });

  // Auto-rotate hero every 8 seconds
  if (liveStreamsList.length > 1) {
    heroTimer = setInterval(() => {
      currentHeroIndex = (currentHeroIndex + 1) % liveStreamsList.length;
      renderHero();
    }, 8000);
  }
}

// ──────────────────────────────────────────
// Live Streams Grid
// ──────────────────────────────────────────
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

    liveStreamsList = Array.isArray(streams) ? streams : [];

    // Enrich live streams with authentic channel profile photos if missing
    if (liveStreamsList.length > 0) {
      const channelIds = [...new Set(liveStreamsList.map(s => s.channelId).filter(Boolean))];
      await Promise.allSettled(channelIds.map(async (cid) => {
        try {
          const ch = await channelApi.getById(cid);
          if (ch) {
            const photo = ch.profilePhotoUrl || ch.ownerProfilePictureUrl || ch.profilePictureUrl;
            liveStreamsList.forEach(s => {
              if (s.channelId === cid) {
                s.profilePictureUrl = s.profilePictureUrl || photo;
              }
            });
          }
        } catch (e) {
          console.warn('[HomeFeed] Could not load channel profile for', cid, e);
        }
      }));
    }

    renderHero();

    if (!liveStreamsList.length) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;padding:48px 20px;">
          <div class="empty-icon">&#128752;</div>
          <h3 style="font-size:18px;color:#fff;">No Active Broadcasts</h3>
          <p style="color:var(--color-text-muted);font-size:14px;max-width:380px;margin:8px auto 16px;">
            ${selectedCat ? 'No streams currently live in this category.' : 'No channels are live right now. Be the first to start broadcasting!'}
          </p>
          <button id="empty-go-live" class="btn btn-cyan btn-sm">${Icons.rocket} Launch Creator Studio</button>
        </div>`;
      document.getElementById('empty-go-live')?.addEventListener('click', () => store.navigate('studio'));
      return;
    }

    grid.innerHTML = liveStreamsList.map((s) => `
      <div class="card stream-card" data-sid="${s.id}" style="cursor:pointer;">
        <div class="stream-thumb" style="position:relative;aspect-ratio:16/9;background:#000;border-radius:12px 12px 0 0;overflow:hidden;">
          <img src="${DEFAULT_BANNER}" data-thumb-src="${s.thumbnailUrl || ''}" alt="${escapeHtml(s.title)}" style="width:100%;height:100%;object-fit:cover;" />
          <div style="position:absolute;top:10px;left:10px;display:flex;gap:6px;z-index:2;">
            <span class="badge-live" style="display:inline-flex;align-items:center;gap:4px;font-size:11px;padding:3px 8px;">
              <span class="cosmic-beacon" style="width:6px;height:6px;"></span> LIVE
            </span>
            <span class="badge-viewers" style="font-size:11px;padding:3px 8px;">${Icons.eye} ${s.viewerCount || 0}</span>
          </div>
          ${s.categoryName ? `<span class="badge-category" style="position:absolute;top:10px;right:10px;font-size:11px;">${escapeHtml(s.categoryName)}</span>` : ''}
        </div>
        <div class="stream-info" style="padding:14px;">
          <div class="streamer-row" style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
            ${renderSaturnAvatar({
              src: s.profilePictureUrl,
              fallback: (s.channelName || s.streamerName || 'S')[0].toUpperCase(),
              size: 'sm'
            })}
            <div style="flex:1;overflow:hidden;">
              <div class="streamer-name" style="font-size:13px;font-weight:700;color:var(--color-text-primary);display:flex;align-items:center;gap:4px;">
                <span>${escapeHtml(s.channelName || s.streamerName || 'Channel')}</span>
                <span style="color:var(--color-cyan-neon);font-size:11px;">${Icons.checkCircle || '✓'}</span>
              </div>
              <div style="font-size:11px;color:var(--color-cyan-primary);">${escapeHtml(s.categoryName || 'General')}</div>
            </div>
          </div>
          <div class="stream-title" style="font-size:13px;font-weight:600;color:var(--color-text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
            ${escapeHtml(s.title || 'Live Stream')}
          </div>
        </div>
      </div>
    `).join('');

    attachMediaImages(grid);

    grid.querySelectorAll('.stream-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = parseInt(card.dataset.sid);
        const found = liveStreamsList.find(s => s.id === id);
        if (found) {
          store.setActiveStream(found);
          store.navigate('watch', { streamId: id });
        }
      });
    });
  } catch (e) {
    grid.innerHTML = '<p class="text-muted" style="grid-column:1/-1;text-align:center;padding:40px;">Failed to load live streams.</p>';
  }
}

// ──────────────────────────────────────────
// Category Filter Pills
// ──────────────────────────────────────────
async function loadCategories() {
  const container = document.getElementById('home-cat-pills');
  if (!container) return;
  try {
    const cats = await categoryApi.getAll();
    if (!cats?.length) return;
    container.innerHTML = `
      <button class="cat-pill ${!selectedCat ? 'active' : ''}" data-slug="all" style="padding:8px 18px;border-radius:20px;font-size:13px;font-weight:600;background:${!selectedCat ? 'var(--color-cyan-primary)' : 'var(--color-space-slate)'};color:${!selectedCat ? '#000' : 'var(--color-text-white)'};border:1px solid var(--color-cyan-border);cursor:pointer;flex-shrink:0;">All</button>
      ${cats.map(c => `<button class="cat-pill ${selectedCat === c.slug ? 'active' : ''}" data-slug="${c.slug}" style="padding:8px 18px;border-radius:20px;font-size:13px;font-weight:500;background:${selectedCat === c.slug ? 'var(--color-cyan-primary)' : 'var(--color-space-slate)'};color:${selectedCat === c.slug ? '#000' : 'var(--color-text-white)'};border:1px solid var(--color-cyan-border);cursor:pointer;flex-shrink:0;">${escapeHtml(c.name)}</button>`).join('')}
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

// ──────────────────────────────────────────
// Top Categories Shelf
// ──────────────────────────────────────────
async function loadTopCategories() {
  const grid = document.getElementById('home-top-categories');
  if (!grid) return;
  try {
    const cats = await categoryApi.getTop(8);
    if (!cats?.length) {
      grid.innerHTML = '<p class="text-muted" style="grid-column:1/-1;">No categories available.</p>';
      return;
    }
    grid.innerHTML = cats.map((cat) => `
      <div class="card category-card hover-lift stagger-item" data-slug="${cat.slug}" style="cursor:pointer;border-radius:12px;overflow:hidden;">
        <div class="cat-thumb" style="aspect-ratio:3/4;background:var(--color-space-slate);overflow:hidden;position:relative;">
          ${cat.imageUrl ? `<img src="${cat.imageUrl}" alt="${escapeHtml(cat.name)}" style="width:100%;height:100%;object-fit:cover;" />` : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:48px;">🎮</div>`}
          <div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(to top, rgba(0,0,0,0.85), transparent);padding:24px 12px 8px;">
            <div style="font-weight:700;color:#fff;font-size:14px;">${escapeHtml(cat.name)}</div>
            <div style="font-size:11px;color:var(--color-cyan-neon);margin-top:2px;">${cat.totalViewers || 0} viewers &bull; ${cat.liveStreamCount || 0} live</div>
          </div>
        </div>
      </div>
    `).join('');

    grid.querySelectorAll('.category-card').forEach(card => {
      card.addEventListener('click', () => store.navigate('category-detail', { slug: card.dataset.slug }));
    });
  } catch (e) {
    grid.innerHTML = '<p class="text-muted" style="grid-column:1/-1;">Failed to load categories.</p>';
  }
}

// ──────────────────────────────────────────
// Trending Highlights / Clips Shelf
// ──────────────────────────────────────────
async function loadTrendingClips() {
  const grid = document.getElementById('home-clips-grid');
  if (!grid) return;
  try {
    const clips = await clipApi.getTop(4);
    if (!clips?.length) {
      const section = document.getElementById('home-trending-clips-section');
      if (section) section.style.display = 'none';
      return;
    }

    grid.innerHTML = clips.map(c => `
      <div class="card clip-card hover-lift stagger-item" data-clip-id="${c.id}" style="cursor:pointer;border-radius:12px;overflow:hidden;">
        <div style="position:relative;aspect-ratio:16/9;background:#000;overflow:hidden;">
          <img src="${DEFAULT_BANNER}" data-thumb-src="${c.thumbnailUrl || ''}" alt="${escapeHtml(c.title)}" style="width:100%;height:100%;object-fit:cover;" />
          <div style="position:absolute;top:8px;left:8px;background:rgba(0,0,0,0.65);padding:2px 8px;border-radius:4px;font-size:11px;color:#fff;">
            ${Icons.eye} ${c.viewCount || 0}
          </div>
          <div style="position:absolute;bottom:8px;right:8px;background:rgba(0,0,0,0.75);padding:2px 6px;border-radius:4px;font-size:11px;color:var(--color-cyan-neon);font-family:monospace;">
            ${c.durationSeconds ? `${Math.floor(c.durationSeconds)}s` : '0:30'}
          </div>
          <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.2);">
            <div style="width:36px;height:36px;border-radius:50%;background:rgba(0,242,254,0.9);display:flex;align-items:center;justify-content:center;color:#000;font-size:14px;">
              ▶
            </div>
          </div>
        </div>
        <div style="padding:12px;">
          <div style="font-weight:600;font-size:13px;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
            ${escapeHtml(c.title || 'Highlight Clip')}
          </div>
          <div style="font-size:11px;color:var(--color-cyan-primary);margin-top:4px;display:flex;align-items:center;justify-content:space-between;">
            <span>${escapeHtml(c.channelName || 'Channel')}</span>
            <span style="color:var(--color-text-muted);font-size:10px;">by @${escapeHtml(c.creatorName || c.creatorUsername || 'user')}</span>
          </div>
        </div>
      </div>
    `).join('');

    attachMediaImages(grid);

    grid.querySelectorAll('.clip-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = parseInt(card.dataset.clipId);
        const target = clips.find(x => x.id === id);
        if (target) openClipPlayerModal(target);
      });
    });
  } catch (e) {
    const section = document.getElementById('home-trending-clips-section');
    if (section) section.style.display = 'none';
  }
}