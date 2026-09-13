import { store } from '../state/store.js';
import { clipApi } from '../api/clip.js';
import { Icons } from '../components/CosmicIcons.js';

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
  document.getElementById('refresh-clips-btn')?.addEventListener('click', () => loadClips());
  loadClips();
}

async function loadClips() {
  const grid = document.getElementById('clips-grid');
  if (!grid) return;
  grid.innerHTML = '<div class="spinner" style="grid-column:1/-1;"></div>';
  try {
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
          <img src="${c.thumbnailUrl || '/cosmic_orbit_banner.png'}"
               alt="${escapeHtml(c.title || 'Clip')}"
               onerror="this.onerror=null;this.src='/cosmic_orbit_banner.png';" />
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
        if (clip) openClipPlayerModal(clip);
      });
    });
  } catch (e) {
    grid.innerHTML = '<p class="text-muted" style="grid-column:1/-1;text-align:center;padding:40px;">Failed to load clips</p>';
  }
}

export function openClipPlayerModal(clip) {
  const root = document.getElementById('clip-modal-root') || document.body;
  const user = store.getState().currentUser;
  const isAdmin = user?.roles?.includes?.('Admin');
  const isOwner = user && (user.userId === clip.creatorId || user.id === clip.creatorId);

  // Record view asynchronously
  clipApi.recordView(clip.id).catch(() => {});

  const modalEl = document.createElement('div');
  modalEl.className = 'modal-overlay';
  modalEl.id = 'active-clip-modal';
  modalEl.innerHTML = `
    <div class="clip-modal-box">
      <div class="clip-modal-header">
        <div style="display:flex;align-items:center;gap:10px;overflow:hidden;">
          <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--color-cyan-primary),var(--color-cyan-neon));display:flex;align-items:center;justify-content:center;color:#000;font-weight:700;flex-shrink:0;">
            ${(clip.creatorName || clip.channelName || 'C')[0].toUpperCase()}
          </div>
          <div style="overflow:hidden;">
            <h3 style="font-size:16px;color:#fff;margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(clip.title || 'Highlight Clip')}</h3>
            <div style="font-size:12px;color:var(--color-text-muted);">
              Clipped by <strong style="color:var(--color-cyan-neon);">${escapeHtml(clip.creatorName || 'Unknown')}</strong>
              ${clip.channelName ? `&middot; Channel: <strong>${escapeHtml(clip.channelName)}</strong>` : ''}
            </div>
          </div>
        </div>
        <button id="close-clip-modal" style="width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px;cursor:pointer;">&times;</button>
      </div>
      <div class="clip-modal-video">
        <video id="clip-video-player" src="${clip.videoUrl}" controls autoplay playsinline style="width:100%;height:100%;object-fit:contain;background:#000;" onerror="this.style.display='none';document.getElementById('clip-video-error').style.display='flex';">
          Your browser does not support the video tag.
        </video>
        <div id="clip-video-error" style="display:none;position:absolute;inset:0;flex-direction:column;align-items:center;justify-content:center;background:var(--color-space-panel);padding:24px;text-align:center;">
          <div style="font-size:40px;margin-bottom:12px;">&#127916;</div>
          <h4 style="color:var(--color-cyan-neon);margin-bottom:6px;">Clip Stream File Unavailable</h4>
          <p style="color:var(--color-text-muted);font-size:13px;max-width:420px;">
            The streaming media server hosting this clip (${clip.videoUrl}) is currently offline or unreachable.
          </p>
        </div>
      </div>
      <div class="clip-modal-body">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
          <div style="display:flex;align-items:center;gap:12px;font-size:13px;color:var(--color-text-muted);">
            <span>${Icons.eye} <strong style="color:#fff;">${(clip.viewCount || 0) + 1}</strong> views</span>
            ${clip.durationSeconds ? `<span>&middot; Duration: <strong style="color:#fff;">${Math.round(clip.durationSeconds)}s</strong></span>` : ''}
            ${clip.categoryName ? `<span class="badge-category">${escapeHtml(clip.categoryName)}</span>` : ''}
          </div>
          <div class="clip-modal-actions">
            ${clip.channelId ? `<button id="clip-visit-channel" class="btn btn-cyan btn-sm">${Icons.rocket} Visit Channel</button>` : ''}
            <button id="clip-share-btn" class="btn btn-outline btn-sm">${Icons.share} Share Clip</button>
            ${(isAdmin || isOwner) ? `<button id="clip-delete-btn" class="btn btn-danger btn-sm">${Icons.trash} Delete Clip</button>` : ''}
          </div>
        </div>
      </div>
    </div>
  `;

  root.appendChild(modalEl);

  const closeModal = () => {
    const video = modalEl.querySelector('video');
    if (video) video.pause();
    modalEl.remove();
  };

  modalEl.querySelector('#close-clip-modal')?.addEventListener('click', closeModal);
  modalEl.addEventListener('click', (e) => {
    if (e.target === modalEl) closeModal();
  });

  modalEl.querySelector('#clip-visit-channel')?.addEventListener('click', () => {
    closeModal();
    if (clip.channelId) store.navigate('channel', { channelId: clip.channelId });
  });

  modalEl.querySelector('#clip-share-btn')?.addEventListener('click', () => {
    const shareUrl = clip.videoUrl || window.location.href;
    navigator.clipboard?.writeText(shareUrl).then(() => {
      store.showToast('Clip URL copied to clipboard!', 'success');
    }).catch(() => {
      store.showToast('Clip URL: ' + shareUrl, 'info');
    });
  });

  modalEl.querySelector('#clip-delete-btn')?.addEventListener('click', async () => {
    if (!confirm('Are you sure you want to delete this clip?')) return;
    try {
      await clipApi.delete(clip.id);
      store.showToast('Clip deleted successfully', 'info');
      closeModal();
      loadClips();
    } catch (err) {
      store.showToast(err.message || 'Failed to delete clip', 'error');
    }
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}