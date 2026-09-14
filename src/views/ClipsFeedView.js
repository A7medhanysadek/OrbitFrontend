import { store } from '../state/store.js';
import { clipApi } from '../api/clip.js';
import { Icons } from '../components/CosmicIcons.js';
import { openClipPlayerModal, closeClipPlayerModal } from '../components/ClipPlayerModal.js';
import { DEFAULT_BANNER, attachMediaImages } from '../utils/mediaImage.js';
import { fetchMediaConfig } from '../utils/mediaConfig.js';

export { openClipPlayerModal, closeClipPlayerModal };

let currentClips = [];

export function renderClipsFeedView() {
  return `<div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
      <div class="section-title" style="margin-bottom:0;">${Icons.clip} Top Clips Across the Galaxy</div>
      <button id="refresh-clips-btn" class="btn btn-ghost btn-sm">${Icons.refresh} Refresh</button>
    </div>
    <div class="clips-grid" id="clips-grid"><div class="spinner" style="grid-column:1/-1;"></div></div>
    <div id="clip-modal-root"></div>
  </div>`;
}

export function setupClipsFeedEvents() {
  document.getElementById('refresh-clips-btn')?.addEventListener('click', async () => {
    await fetchMediaConfig(true).catch(() => {});
    loadClips();
  });
  loadClips();
}

async function loadClips() {
  const grid = document.getElementById('clips-grid');
  if (!grid) return;
  grid.innerHTML = '<div class="spinner" style="grid-column:1/-1;"></div>';
  try {
    await fetchMediaConfig().catch(() => {});
    const clips = await clipApi.getTop(30);
    currentClips = clips || [];
    if (!currentClips.length) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          <div class="empty-icon">&#127916;</div>
          <h3>No Clips Found</h3>
          <p>No clips have been recorded yet. Watch a live broadcast and slice a clip!</p>
        </div>`;
      return;
    }

    grid.innerHTML = currentClips.map(c => `
      <div class="card clip-card hover-lift stagger-item" data-clip-id="${c.id}">
        <div class="clip-thumb">
          <img src="${DEFAULT_BANNER}"
               data-thumb-src="${c.thumbnailUrl || ''}"
               alt="${escapeHtml(c.title || 'Clip')}" />
          <span class="clip-views">${Icons.eye} ${c.viewCount || 0} views</span>
          ${c.durationSeconds ? `<span style="position:absolute;bottom:8px;right:8px;background:rgba(0,0,0,0.8);padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;">${Math.round(c.durationSeconds)}s</span>` : ''}
          <div style="position:absolute;inset:0;background:rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.2s;" class="clip-play-overlay">
            <div style="width:48px;height:48px;border-radius:50%;background:var(--color-cyan-primary);display:flex;align-items:center;justify-content:center;color:#000;box-shadow:0 0 16px rgba(0,221,238,0.5);">
              ${Icons.play}
            </div>
          </div>
        </div>
        <div class="clip-info">
          <div class="clip-title truncate" title="${escapeHtml(c.title || 'Untitled Clip')}">${escapeHtml(c.title || 'Untitled Clip')}</div>
          <div class="clip-meta" style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;">
            <span style="color:var(--color-text-muted);font-size:12px;">by <strong style="color:#fff;">${escapeHtml(c.creatorName || c.creatorUsername || 'Streamer')}</strong></span>
            ${c.channelName ? `<span style="color:var(--color-cyan-primary);font-size:12px;">${escapeHtml(c.channelName)}</span>` : ''}
          </div>
        </div>
      </div>
    `).join('');

    // Attach blob-streamed thumbnails for ngrok bypass
    attachMediaImages(grid);

    // Add hover play button effect & click listener
    grid.querySelectorAll('.clip-card').forEach(card => {
      card.addEventListener('mouseenter', () => {
        const overlay = card.querySelector('.clip-play-overlay');
        if (overlay) overlay.style.opacity = '1';
      });
      card.addEventListener('mouseleave', () => {
        const overlay = card.querySelector('.clip-play-overlay');
        if (overlay) overlay.style.opacity = '0';
      });
      card.addEventListener('click', () => {
        const clipId = parseInt(card.dataset.clipId);
        const clip = currentClips.find(item => item.id === clipId);
        if (clip) openClipPlayerModal(clip, () => loadClips());
      });
    });
  } catch (e) {
    grid.innerHTML = '<p class="text-muted" style="grid-column:1/-1;text-align:center;padding:40px;">Failed to load clips</p>';
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}