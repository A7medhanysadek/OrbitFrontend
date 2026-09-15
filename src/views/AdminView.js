import { store } from '../state/store.js';
import { adminApi } from '../api/admin.js';
import { categoryApi } from '../api/category.js';
import { Icons } from '../components/CosmicIcons.js';
import { openClipPlayerModal } from './ClipsFeedView.js';
import { openVodPlayerModal } from '../components/VodPlayerModal.js';
import { openImageCropperModal } from '../components/ImageCropperModal.js';
import { DEFAULT_BANNER, attachMediaImages } from '../utils/mediaImage.js';
import { fetchMediaConfig } from '../utils/mediaConfig.js';

let currentTab = 'overview';
let userPage = 1;
let channelPage = 1;
let clipPage = 1;
let vodPage = 1;
let userSearch = '';
let userRoleFilter = '';
let channelSearch = '';

export function renderAdminView() {
  const user = store.getState().currentUser;
  const isAdmin = user?.roles?.includes?.('Admin');

  if (!isAdmin) {
    return `
      <div class="empty-state" style="padding:80px 20px;">
        <div class="empty-icon">&#128274;</div>
        <h2 style="color:var(--color-error);font-family:var(--font-display);">Access Denied</h2>
        <p style="color:var(--color-text-muted);max-width:440px;margin:12px auto;">
          Administrative privileges are required to access this portal. If you are a system administrator, please log in with your admin credentials.
        </p>
        <button id="admin-login-btn" class="btn btn-cyan btn-sm" style="margin-top:16px;">Log in as Admin</button>
      </div>
    `;
  }

  return `
    <div>
      <!-- Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;margin-bottom:24px;">
        <div>
          <div style="display:flex;align-items:center;gap:10px;">
            <h1 style="font-family:var(--font-display);font-size:26px;color:#fff;margin:0;">
              ${Icons.admin} Cosmic Admin Center
            </h1>
            <span class="badge-role admin">SYSTEM ADMIN</span>
          </div>
          <p style="color:var(--color-text-muted);font-size:14px;margin-top:4px;">
            Comprehensive platform controls, account governance, and live stream moderation.
          </p>
        </div>
        <button id="admin-refresh-all" class="btn btn-ghost btn-sm">${Icons.refresh} Refresh Portal</button>
      </div>

      <!-- Navigation Tabs -->
      <div class="tabs">
        <button class="tab-btn ${currentTab==='overview'?'active':''}" data-admin-tab="overview">${Icons.grid} Overview</button>
        <button class="tab-btn ${currentTab==='users'?'active':''}" data-admin-tab="users">${Icons.user} User Accounts</button>
        <button class="tab-btn ${currentTab==='channels'?'active':''}" data-admin-tab="channels">${Icons.video} Channels</button>
        <button class="tab-btn ${currentTab==='streams'?'active':''}" data-admin-tab="streams"><span style="color:var(--color-live-red);">&#9679;</span> Live Moderation</button>
        <button class="tab-btn ${currentTab==='clips'?'active':''}" data-admin-tab="clips">${Icons.clip} Clips</button>
        <button class="tab-btn ${currentTab==='vods'?'active':''}" data-admin-tab="vods">${Icons.video} VOD Archives</button>
        <button class="tab-btn ${currentTab==='categories'?'active':''}" data-admin-tab="categories">${Icons.star} Categories</button>
        <button class="tab-btn ${currentTab==='media-server'?'active':''}" data-admin-tab="media-server">${Icons.settings} Media Server</button>
      </div>

      <!-- Active Tab Container -->
      <div id="admin-tab-body">
        <div class="spinner"></div>
      </div>

      <!-- Modal Container -->
      <div id="admin-modal-root"></div>
    </div>
  `;
}

export function setupAdminEvents() {
  document.getElementById('admin-login-btn')?.addEventListener('click', () => store.navigate('login'));
  document.getElementById('admin-refresh-all')?.addEventListener('click', () => loadTabContent());

  document.querySelectorAll('[data-admin-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentTab = btn.dataset.adminTab;
      document.querySelectorAll('[data-admin-tab]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadTabContent();
    });
  });

  loadTabContent();
}

async function loadTabContent() {
  const container = document.getElementById('admin-tab-body');
  if (!container) return;

  container.innerHTML = '<div class="spinner"></div>';

  switch (currentTab) {
    case 'overview':
      await renderOverviewTab(container);
      break;
    case 'users':
      await renderUsersTab(container);
      break;
    case 'channels':
      await renderChannelsTab(container);
      break;
    case 'streams':
      await renderStreamsTab(container);
      break;
    case 'clips':
      await renderClipsTab(container);
      break;
    case 'vods':
      await renderVodsTab(container);
      break;
    case 'categories':
      await renderCategoriesTab(container);
      break;
    case 'media-server':
      await renderMediaServerTab(container);
      break;
  }
}

// ──────────────────────────────────────────
// 1. OVERVIEW TAB
// ──────────────────────────────────────────
async function renderOverviewTab(container) {
  try {
    const stats = await adminApi.getStats();
    container.innerHTML = `
      <div class="admin-stats-grid">
        <div class="admin-stat-card">
          <div class="admin-stat-title">Platform Users</div>
          <div class="admin-stat-num">${stats.totalUsers || 0}</div>
          <div style="font-size:12px;color:var(--color-cyan-primary);">${Icons.user} Registered Accounts</div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-title">Channels</div>
          <div class="admin-stat-num">${stats.totalChannels || 0}</div>
          <div style="font-size:12px;color:var(--color-cyan-primary);">${Icons.video} Streamer Channels</div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-title">Active Broadcasts</div>
          <div class="admin-stat-num" style="color:${stats.activeStreams > 0 ? 'var(--color-live-red)' : 'var(--color-text-muted)'};">${stats.activeStreams || 0}</div>
          <div style="font-size:12px;color:var(--color-live-red);">&#9679; Live Streams Now</div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-title">Highlight Clips</div>
          <div class="admin-stat-num">${stats.totalClips || 0}</div>
          <div style="font-size:12px;color:var(--color-cyan-primary);">${Icons.clip} Recorded Clips</div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-title">Categories</div>
          <div class="admin-stat-num">${stats.totalCategories || 0}</div>
          <div style="font-size:12px;color:var(--color-cyan-primary);">${Icons.grid} Stream Categories</div>
        </div>
      </div>

      <!-- Quick Platform Actions -->
      <div class="card" style="padding:24px;margin-bottom:24px;">
        <h3 style="font-size:16px;color:#fff;margin-bottom:16px;display:flex;align-items:center;gap:8px;">
          ${Icons.rocket} Quick Administration Actions
        </h3>
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
          <button id="quick-users-btn" class="btn btn-cyan btn-sm">${Icons.user} Manage Accounts</button>
          <button id="quick-streams-btn" class="btn btn-outline btn-sm">${Icons.video} Monitor Live Broadcasts</button>
          <button id="quick-categories-btn" class="btn btn-ghost btn-sm">${Icons.grid} Add New Category</button>
        </div>
      </div>
    `;

    document.getElementById('quick-users-btn')?.addEventListener('click', () => {
      currentTab = 'users';
      updateTabButtons();
      loadTabContent();
    });
    document.getElementById('quick-streams-btn')?.addEventListener('click', () => {
      currentTab = 'streams';
      updateTabButtons();
      loadTabContent();
    });
    document.getElementById('quick-categories-btn')?.addEventListener('click', () => {
      currentTab = 'categories';
      updateTabButtons();
      loadTabContent();
    });
  } catch (e) {
    container.innerHTML = '<p class="text-muted">Failed to load platform overview statistics.</p>';
  }
}

// ──────────────────────────────────────────
// 2. USERS TAB
// ──────────────────────────────────────────
async function renderUsersTab(container) {
  try {
    const res = await adminApi.getUsers(userPage, 12, userSearch, userRoleFilter);
    const users = res.items || [];
    const totalCount = res.totalCount || users.length;
    const totalPages = Math.ceil(totalCount / 12) || 1;

    container.innerHTML = `
      <!-- Toolbar -->
      <div style="display:flex;gap:12px;align-items:center;margin-bottom:20px;flex-wrap:wrap;">
        <div class="search-bar" style="max-width:340px;height:40px;">
          ${Icons.search}
          <input type="text" id="admin-user-search" placeholder="Search by username or email..." value="${escapeHtml(userSearch)}" />
        </div>
        <select id="admin-role-filter" class="input-dark" style="width:160px;height:40px;border-radius:var(--radius-pill);padding:0 16px;">
          <option value="" ${!userRoleFilter?'selected':''}>All Roles</option>
          <option value="Admin" ${userRoleFilter==='Admin'?'selected':''}>Admin</option>
          <option value="Streamer" ${userRoleFilter==='Streamer'?'selected':''}>Streamer</option>
          <option value="Moderator" ${userRoleFilter==='Moderator'?'selected':''}>Moderator</option>
        </select>
        <button id="admin-user-search-btn" class="btn btn-cyan btn-sm">Search</button>
      </div>

      <!-- Table -->
      <div class="card" style="padding:0;overflow-x:auto;">
        <table class="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Roles</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(u => `
              <tr data-user-row="${u.id}">
                <td>
                  <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,var(--color-cyan-primary),var(--color-cyan-neon));display:flex;align-items:center;justify-content:center;color:#000;font-weight:700;overflow:hidden;">
                      ${u.profilePictureUrl ? `<img src="${u.profilePictureUrl}" style="width:100%;height:100%;object-fit:cover;" />` : (u.username||'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <div style="font-weight:600;color:#fff;">${escapeHtml(u.username || 'Unknown')}</div>
                      <div style="font-size:12px;color:var(--color-text-muted);">${escapeHtml(u.fullName || '')}</div>
                    </div>
                  </div>
                </td>
                <td style="color:var(--color-text-muted);">${escapeHtml(u.email || '-')}</td>
                <td>
                  <div style="display:flex;gap:4px;flex-wrap:wrap;">
                    ${(u.roles || []).map(r => `
                      <span class="badge-role ${r.toLowerCase()}">${escapeHtml(r)}</span>
                    `).join('')}
                    ${(!u.roles || !u.roles.length) ? '<span class="text-muted" style="font-size:12px;">Viewer</span>' : ''}
                  </div>
                </td>
                <td>
                  ${u.isLockedOut ?
                    '<span style="color:var(--color-error);font-size:12px;font-weight:600;">&#128274; Locked</span>' :
                    '<span style="color:var(--color-success);font-size:12px;font-weight:600;">&#9679; Active</span>'}
                </td>
                <td>
                  <div style="display:flex;gap:6px;">
                    <button class="btn btn-ghost btn-sm btn-edit-roles" data-uid="${u.id}" data-roles="${(u.roles||[]).join(',')}" data-uname="${escapeHtml(u.username || 'User')}" title="Manage Roles">
                      ${Icons.settings} Roles
                    </button>
                    <button class="btn btn-ghost btn-sm btn-del-account" data-uid="${u.id}" style="color:var(--color-error);" title="Delete Account">
                      ${Icons.trash}
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
            ${!users.length ? '<tr><td colspan="5" style="text-align:center;padding:32px;color:var(--color-text-muted);">No user accounts found matching your query.</td></tr>' : ''}
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination">
        <button id="user-prev-page" class="btn btn-ghost btn-sm" ${userPage<=1?'disabled':''}>${Icons.chevronLeft}</button>
        <span style="color:var(--color-text-muted);font-size:14px;">Page ${userPage} of ${totalPages} (${totalCount} users)</span>
        <button id="user-next-page" class="btn btn-ghost btn-sm" ${userPage>=totalPages?'disabled':''}>${Icons.chevronRight}</button>
      </div>
    `;

    // Search events
    const searchInput = document.getElementById('admin-user-search');
    const searchBtn = document.getElementById('admin-user-search-btn');
    const roleSelect = document.getElementById('admin-role-filter');

    searchBtn?.addEventListener('click', () => {
      userSearch = searchInput.value.trim();
      userRoleFilter = roleSelect.value;
      userPage = 1;
      loadTabContent();
    });

    searchInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        userSearch = searchInput.value.trim();
        userRoleFilter = roleSelect.value;
        userPage = 1;
        loadTabContent();
      }
    });

    roleSelect?.addEventListener('change', () => {
      userRoleFilter = roleSelect.value;
      userPage = 1;
      loadTabContent();
    });

    // Pagination
    document.getElementById('user-prev-page')?.addEventListener('click', () => {
      if (userPage > 1) { userPage--; loadTabContent(); }
    });
    document.getElementById('user-next-page')?.addEventListener('click', () => {
      if (userPage < totalPages) { userPage++; loadTabContent(); }
    });

    // Actions
    container.querySelectorAll('.btn-edit-roles').forEach(btn => {
      btn.addEventListener('click', () => openRolesModal(btn.dataset.uid, (btn.dataset.roles || '').split(',').filter(Boolean), btn.dataset.uname));
    });

    container.querySelectorAll('.btn-del-account').forEach(btn => {
      btn.addEventListener('click', async () => {
        const uid = btn.dataset.uid;
        if (!confirm('Permanently delete this user account? All associated streams and data will be removed. This cannot be undone.')) return;
        try {
          await adminApi.deleteAccount(uid);
          store.showToast('Account deleted successfully', 'info');
          loadTabContent();
        } catch (err) {
          store.showToast(err.message || 'Failed to delete account', 'error');
        }
      });
    });
  } catch (e) {
    container.innerHTML = '<p class="text-muted">Failed to load user accounts.</p>';
  }
}

// ──────────────────────────────────────────
// 3. CHANNELS TAB
// ──────────────────────────────────────────
async function renderChannelsTab(container) {
  try {
    const res = await adminApi.getChannels(channelPage, 12, channelSearch);
    const channels = res.items || [];
    const totalPages = Math.ceil((res.totalCount || channels.length) / 12) || 1;

    container.innerHTML = `
      <!-- Toolbar -->
      <div style="display:flex;gap:12px;align-items:center;margin-bottom:20px;flex-wrap:wrap;">
        <div class="search-bar" style="max-width:340px;height:40px;">
          ${Icons.search}
          <input type="text" id="admin-channel-search" placeholder="Search channels by name or owner..." value="${escapeHtml(channelSearch)}" />
        </div>
        <button id="admin-channel-search-btn" class="btn btn-cyan btn-sm">Search</button>
      </div>

      <!-- Table -->
      <div class="card" style="padding:0;overflow-x:auto;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Channel Name</th>
              <th>Owner</th>
              <th>Status</th>
              <th>Stream Key</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${channels.map(c => `
              <tr>
                <td>
                  <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,var(--color-cyan-primary),var(--color-cyan-neon));display:flex;align-items:center;justify-content:center;color:#000;font-weight:700;overflow:hidden;">
                      ${c.profilePhotoUrl ? `<img src="${c.profilePhotoUrl}" style="width:100%;height:100%;object-fit:cover;" />` : (c.channelName||'C')[0].toUpperCase()}
                    </div>
                    <div>
                      <div style="font-weight:600;color:#fff;">${escapeHtml(c.channelName)}</div>
                      <div style="font-size:12px;color:var(--color-text-muted);">${escapeHtml(c.description || 'No description')}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div style="font-weight:500;">${escapeHtml(c.ownerUsername || 'Owner')}</div>
                  <div style="font-size:12px;color:var(--color-text-muted);">${escapeHtml(c.ownerEmail || '')}</div>
                </td>
                <td>
                  ${c.isLive ?
                    `<span class="badge-live">LIVE (${c.currentViewers} viewers)</span>` :
                    '<span class="text-muted" style="font-size:12px;">Offline</span>'}
                </td>
                <td>
                  ${c.hasStreamKey ?
                    '<span style="color:var(--color-success);font-size:12px;">Configured</span>' :
                    '<span style="color:var(--color-warning);font-size:12px;">Not Generated</span>'}
                </td>
                <td style="color:var(--color-text-muted);font-size:13px;">${c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '-'}</td>
                <td>
                  <div style="display:flex;gap:6px;">
                    <button class="btn btn-ghost btn-sm btn-visit-channel" data-cid="${c.id}" title="Visit Channel">
                      ${Icons.rocket} Visit
                    </button>
                    <button class="btn btn-ghost btn-sm btn-reset-skey" data-cid="${c.id}" title="Reset Stream Key">
                      ${Icons.refresh} Reset Key
                    </button>
                    <button class="btn btn-ghost btn-sm btn-del-channel" data-cid="${c.id}" style="color:var(--color-error);" title="Delete Channel">
                      ${Icons.trash}
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
            ${!channels.length ? '<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--color-text-muted);">No channels found.</td></tr>' : ''}
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination">
        <button id="ch-prev-page" class="btn btn-ghost btn-sm" ${channelPage<=1?'disabled':''}>${Icons.chevronLeft}</button>
        <span style="color:var(--color-text-muted);font-size:14px;">Page ${channelPage} of ${totalPages}</span>
        <button id="ch-next-page" class="btn btn-ghost btn-sm" ${channelPage>=totalPages?'disabled':''}>${Icons.chevronRight}</button>
      </div>
    `;

    document.getElementById('admin-channel-search-btn')?.addEventListener('click', () => {
      channelSearch = document.getElementById('admin-channel-search')?.value?.trim() || '';
      channelPage = 1;
      loadTabContent();
    });

    document.getElementById('ch-prev-page')?.addEventListener('click', () => { if (channelPage > 1) { channelPage--; loadTabContent(); } });
    document.getElementById('ch-next-page')?.addEventListener('click', () => { if (channelPage < totalPages) { channelPage++; loadTabContent(); } });

    container.querySelectorAll('.btn-visit-channel').forEach(btn => {
      btn.addEventListener('click', () => store.navigate('channel', { channelId: parseInt(btn.dataset.cid) }));
    });

    container.querySelectorAll('.btn-reset-skey').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Regenerate RTMP stream key for this channel? The streamer will need to update OBS settings.')) return;
        try {
          const res = await adminApi.resetChannelStreamKey(parseInt(btn.dataset.cid));
          store.showToast('Stream key regenerated successfully', 'success');
        } catch (err) {
          store.showToast(err.message || 'Failed to reset stream key', 'error');
        }
      });
    });

    container.querySelectorAll('.btn-del-channel').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Permanently delete this channel? Streamer role and all associated stream data will be affected.')) return;
        try {
          await adminApi.deleteChannel(parseInt(btn.dataset.cid));
          store.showToast('Channel deleted successfully', 'info');
          loadTabContent();
        } catch (err) {
          store.showToast(err.message || 'Failed to delete channel', 'error');
        }
      });
    });
  } catch (e) {
    container.innerHTML = '<p class="text-muted">Failed to load channels.</p>';
  }
}

// ──────────────────────────────────────────
// 4. LIVE STREAMS MODERATION TAB
// ──────────────────────────────────────────
async function renderStreamsTab(container) {
  try {
    const [streamsRes, channelsRes, categoriesRes] = await Promise.allSettled([
      adminApi.getLiveStreams(),
      adminApi.getChannels(1, 100),
      categoryApi.getAll()
    ]);

    const streams = streamsRes.status === 'fulfilled' ? streamsRes.value : [];
    const channels = (channelsRes.status === 'fulfilled' && channelsRes.value?.items) ? channelsRes.value.items : [];
    const categories = (categoriesRes.status === 'fulfilled' && Array.isArray(categoriesRes.value)) ? categoriesRes.value : [];

    container.innerHTML = `
      <!-- YouTube Simulation Relay Ingest Card -->
      <div class="card" style="margin-bottom:24px;background:rgba(255,0,60,0.03);border:1px solid rgba(255,0,60,0.22);border-radius:var(--radius-lg);padding:24px;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
          <div style="width:38px;height:38px;border-radius:8px;background:rgba(255,0,60,0.15);color:#ff3344;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:bold;">
            ▶
          </div>
          <div>
            <h3 style="font-size:16px;color:#fff;margin:0;font-weight:700;">Simulate Live Stream (YouTube Relay Ingest)</h3>
            <p style="color:var(--color-text-muted);font-size:13px;margin:2px 0 0;">
              Paste any YouTube Live URL to simulate an active live broadcast on a chosen channel for testing player, chat, and room dynamics without saving VODs.
            </p>
          </div>
        </div>

        <form id="admin-simulate-youtube-form" style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:14px;align-items:end;margin-top:16px;">
          <div>
            <label style="display:block;font-size:12px;color:var(--color-text-muted);margin-bottom:6px;font-weight:600;">Target Channel</label>
            <select id="sim-channel-id" class="input-dark" style="width:100%;height:40px;border-radius:var(--radius-md);padding:0 12px;" required>
              <option value="">Select Channel...</option>
              ${channels.map(c => `<option value="${c.id}">${escapeHtml(c.channelName)} (@${escapeHtml(c.ownerUsername)})</option>`).join('')}
            </select>
          </div>

          <div style="grid-column: span 2;">
            <label style="display:block;font-size:12px;color:var(--color-text-muted);margin-bottom:6px;font-weight:600;">YouTube Live / Video URL</label>
            <input type="url" id="sim-youtube-url" class="input-dark" placeholder="https://www.youtube.com/watch?v=... or https://youtube.com/live/..." style="width:100%;height:40px;border-radius:var(--radius-md);padding:0 12px;" required />
          </div>

          <div>
            <label style="display:block;font-size:12px;color:var(--color-text-muted);margin-bottom:6px;font-weight:600;">Stream Title (Optional)</label>
            <input type="text" id="sim-stream-title" class="input-dark" placeholder="e.g. 24/7 Lo-Fi Beats Test" style="width:100%;height:40px;border-radius:var(--radius-md);padding:0 12px;" />
          </div>

          <div>
            <label style="display:block;font-size:12px;color:var(--color-text-muted);margin-bottom:6px;font-weight:600;">Category</label>
            <select id="sim-category-id" class="input-dark" style="width:100%;height:40px;border-radius:var(--radius-md);padding:0 12px;">
              <option value="">Select Category (Optional)</option>
              ${categories.map(cat => `<option value="${cat.id}">${escapeHtml(cat.name)}</option>`).join('')}
            </select>
          </div>

          <div>
            <button type="submit" id="sim-submit-btn" class="btn btn-sm" style="background:#ff3344;color:#fff;font-weight:600;width:100%;height:40px;border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;gap:8px;">
              Launch Simulated Stream
            </button>
          </div>
        </form>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h3 style="font-size:16px;color:#fff;margin:0;">Active Live Broadcasts (${streams.length})</h3>
        <button id="refresh-live-streams-btn" class="btn btn-ghost btn-sm">${Icons.refresh} Refresh</button>
      </div>

      <div class="card" style="padding:0;overflow-x:auto;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Broadcast</th>
              <th>Streamer / Channel</th>
              <th>Type</th>
              <th>Category</th>
              <th>Viewers</th>
              <th>Started</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${streams.map(s => `
              <tr>
                <td>
                  <div style="font-weight:600;color:#fff;">${escapeHtml(s.title || 'Untitled Stream')}</div>
                  <div style="font-size:12px;color:var(--color-text-muted);">Stream ID: ${s.streamId}</div>
                </td>
                <td>
                  <div style="font-weight:500;">${escapeHtml(s.streamerName || 'Streamer')}</div>
                  <div style="font-size:12px;color:var(--color-cyan-primary);">${escapeHtml(s.channelName || '')}</div>
                </td>
                <td>
                  ${s.isSimulated ? `
                    <span class="badge" style="background:rgba(255,0,50,0.15);color:#ff4455;border:1px solid rgba(255,0,50,0.3);font-size:11px;padding:2px 8px;border-radius:12px;display:inline-flex;align-items:center;gap:4px;">
                      ▶ YouTube
                    </span>
                  ` : `
                    <span class="badge" style="background:rgba(0,255,200,0.1);color:var(--color-cyan-primary);font-size:11px;padding:2px 8px;border-radius:12px;">
                      RTMP / HLS
                    </span>
                  `}
                </td>
                <td>
                  ${s.categoryName ? `<span class="badge-category">${escapeHtml(s.categoryName)}</span>` : '<span class="text-muted">-</span>'}
                </td>
                <td>
                  <span class="badge-viewers" style="background:rgba(255,20,0,0.15);color:var(--color-live-red);font-weight:700;">
                    &#9679; ${s.viewerCount || 0}
                  </span>
                </td>
                <td style="color:var(--color-text-muted);font-size:13px;">${s.startedAt ? new Date(s.startedAt).toLocaleTimeString() : '-'}</td>
                <td>
                  <div style="display:flex;gap:6px;">
                    <button class="btn btn-ghost btn-sm btn-watch-stream" data-sid="${s.streamId}">
                      ${Icons.eye} Watch
                    </button>
                    ${s.isSimulated ? `
                      <button class="btn btn-danger btn-sm btn-end-sim" data-sid="${s.streamId}" style="padding:0 14px;height:32px;font-size:12px;background:rgba(255,0,50,0.18);border:1px solid #ff3344;color:#ff4455;">
                        End Simulation
                      </button>
                    ` : `
                      <button class="btn btn-danger btn-sm btn-force-end" data-sid="${s.streamId}" style="padding:0 14px;height:32px;font-size:12px;">
                        Force Terminate
                      </button>
                    `}
                  </div>
                </td>
              </tr>
            `).join('')}
            ${!streams.length ? '<tr><td colspan="7" style="text-align:center;padding:48px;color:var(--color-text-muted);">No streams are currently broadcasting live across the platform.</td></tr>' : ''}
          </tbody>
        </table>
      </div>
    `;

    document.getElementById('refresh-live-streams-btn')?.addEventListener('click', () => loadTabContent());

    const simForm = document.getElementById('admin-simulate-youtube-form');
    if (simForm) {
      simForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const chIdVal = document.getElementById('sim-channel-id')?.value;
        const ytUrl = document.getElementById('sim-youtube-url')?.value?.trim();
        const title = document.getElementById('sim-stream-title')?.value?.trim();
        const catVal = document.getElementById('sim-category-id')?.value;

        if (!chIdVal || !ytUrl) {
          store.showToast('Please select a channel and enter a YouTube URL', 'error');
          return;
        }

        const submitBtn = document.getElementById('sim-submit-btn');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = 'Starting...';
        }

        try {
          await adminApi.simulateYoutubeStream({
            channelId: parseInt(chIdVal),
            youtubeUrl: ytUrl,
            title: title || null,
            categoryId: catVal ? parseInt(catVal) : null
          });
          store.showToast('YouTube live simulation started successfully!', 'success');
          loadTabContent();
        } catch (err) {
          store.showToast(err.message || 'Failed to start YouTube simulation', 'error');
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Launch Simulated Stream';
          }
        }
      });
    }

    container.querySelectorAll('.btn-watch-stream').forEach(btn => {
      btn.addEventListener('click', () => {
        store.navigate('watch', { streamId: parseInt(btn.dataset.sid) });
      });
    });

    container.querySelectorAll('.btn-end-sim').forEach(btn => {
      btn.addEventListener('click', async () => {
        const sid = parseInt(btn.dataset.sid);
        if (!confirm(`End YouTube simulation for stream #${sid}?`)) return;
        try {
          await adminApi.endSimulatedStream(sid);
          store.showToast('Simulated stream ended successfully', 'success');
          loadTabContent();
        } catch (err) {
          store.showToast(err.message || 'Failed to end simulation', 'error');
        }
      });
    });

    container.querySelectorAll('.btn-force-end').forEach(btn => {
      btn.addEventListener('click', async () => {
        const sid = parseInt(btn.dataset.sid);
        if (!confirm(`Are you sure you want to FORCE END stream #${sid}? The RTMP stream and viewers will be disconnected immediately.`)) return;
        try {
          await adminApi.forceEndStream(sid);
          store.showToast('Live stream terminated successfully', 'success');
          loadTabContent();
        } catch (err) {
          store.showToast(err.message || 'Failed to terminate stream', 'error');
        }
      });
    });
  } catch (e) {
    container.innerHTML = '<p class="text-muted">Failed to load active live streams.</p>';
  }
}

// ──────────────────────────────────────────
// 5. CLIPS TAB
// ──────────────────────────────────────────
async function renderClipsTab(container) {
  try {
    const res = await adminApi.getClips(clipPage, 16);
    const clips = res.items || [];
    const totalPages = Math.ceil((res.totalCount || clips.length) / 16) || 1;

    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h3 style="font-size:16px;color:#fff;margin:0;">Platform Highlight Clips (${res.totalCount || clips.length})</h3>
        <button id="refresh-clips-admin-btn" class="btn btn-ghost btn-sm">${Icons.refresh} Refresh</button>
      </div>

      <div class="clips-grid" style="margin-bottom:24px;">
        ${clips.map(c => `
          <div class="card clip-card hover-lift" data-clip-id="${c.id}">
            <div class="clip-thumb">
              <img src="${DEFAULT_BANNER}" data-thumb-src="${c.thumbnailUrl || ''}" alt="${escapeHtml(c.title)}" />
              <span class="clip-views">${Icons.eye} ${c.viewCount || 0}</span>
              ${c.durationSeconds ? `<span style="position:absolute;bottom:8px;right:8px;background:rgba(0,0,0,0.8);padding:2px 8px;border-radius:4px;font-size:11px;">${Math.round(c.durationSeconds)}s</span>` : ''}
            </div>
            <div class="clip-info">
              <div class="clip-title truncate">${escapeHtml(c.title || 'Untitled Clip')}</div>
              <div class="clip-meta" style="display:flex;justify-content:space-between;margin-top:4px;">
                <span>by ${escapeHtml(c.creatorName || 'Streamer')}</span>
                <button class="btn-del-clip" data-cid="${c.id}" style="color:var(--color-error);font-size:12px;font-weight:600;padding:2px 6px;cursor:pointer;">Delete</button>
              </div>
            </div>
          </div>
        `).join('')}
        ${!clips.length ? '<div class="empty-state" style="grid-column:1/-1;"><h3>No Clips Available</h3></div>' : ''}
      </div>

      <div class="pagination">
        <button id="clip-prev-page" class="btn btn-ghost btn-sm" ${clipPage<=1?'disabled':''}>${Icons.chevronLeft}</button>
        <span style="color:var(--color-text-muted);font-size:14px;">Page ${clipPage} of ${totalPages}</span>
        <button id="clip-next-page" class="btn btn-ghost btn-sm" ${clipPage>=totalPages?'disabled':''}>${Icons.chevronRight}</button>
      </div>
    `;
    attachMediaImages(container);

    document.getElementById('refresh-clips-admin-btn')?.addEventListener('click', () => loadTabContent());
    document.getElementById('clip-prev-page')?.addEventListener('click', () => { if (clipPage > 1) { clipPage--; loadTabContent(); } });
    document.getElementById('clip-next-page')?.addEventListener('click', () => { if (clipPage < totalPages) { clipPage++; loadTabContent(); } });

    container.querySelectorAll('.clip-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.btn-del-clip')) return;
        const cid = parseInt(card.dataset.clipId);
        const clip = clips.find(c => c.id === cid);
        if (clip) openClipPlayerModal(clip);
      });
    });

    container.querySelectorAll('.btn-del-clip').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const cid = parseInt(btn.dataset.cid);
        if (!confirm('Are you sure you want to permanently delete this clip?')) return;
        try {
          await adminApi.deleteClip(cid);
          store.showToast('Clip deleted successfully', 'info');
          loadTabContent();
        } catch (err) {
          store.showToast(err.message || 'Failed to delete clip', 'error');
        }
      });
    });
  } catch (e) {
    container.innerHTML = '<p class="text-muted">Failed to load platform clips.</p>';
  }
}

// ──────────────────────────────────────────
// 6. VOD ARCHIVES TAB
// ──────────────────────────────────────────
async function renderVodsTab(container) {
  try {
    const res = await adminApi.getVods(vodPage, 15);
    const vods = res.items || [];
    const totalCount = res.totalCount || 0;
    const totalPages = Math.ceil(totalCount / 15) || 1;

    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
        <h3 style="margin:0;font-size:18px;">VOD Archives Management (${totalCount} Total)</h3>
        <button id="refresh-vods-btn" class="btn btn-ghost btn-sm">${Icons.refresh} Refresh</button>
      </div>

      <div class="card" style="padding:0;overflow:hidden;margin-bottom:20px;">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width:70px;">Preview</th>
              <th>Broadcast Title</th>
              <th>Streamer / Channel</th>
              <th>Duration</th>
              <th>Views</th>
              <th>Chat Messages</th>
              <th>Recorded At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${vods.map(v => `
              <tr data-vod-row="${v.id}">
                <td>
                  <div style="width:60px;height:36px;border-radius:6px;overflow:hidden;background:#000;position:relative;">
                    <img src="${DEFAULT_BANNER}" data-thumb-src="${v.thumbnailUrl || ''}" style="width:100%;height:100%;object-fit:cover;" alt="" />
                  </div>
                </td>
                <td style="font-weight:600;color:#fff;">${escapeHtml(v.title || 'Untitled Broadcast')}</td>
                <td>
                  <span style="color:var(--color-cyan-neon,#00f2fe);">${escapeHtml(v.streamerName || v.channelName || 'Streamer')}</span>
                </td>
                <td style="color:var(--color-text-muted);">${v.duration || '-'}</td>
                <td>${v.rewatchCount || 0}</td>
                <td style="color:var(--color-text-muted);">${v.chatMessageCount || 0} msgs</td>
                <td style="color:var(--color-text-muted);font-size:12px;">${v.startedAt ? new Date(v.startedAt).toLocaleDateString() : '-'}</td>
                <td>
                  <div style="display:flex;gap:6px;">
                    <button class="btn btn-outline btn-sm btn-watch-vod" data-vid="${v.id}" style="padding:4px 10px;">
                      ${Icons.play} Watch
                    </button>
                    <button class="btn btn-ghost btn-sm btn-del-vod" data-vid="${v.id}" style="color:var(--color-error);" title="Delete VOD">
                      ${Icons.trash}
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
            ${!vods.length ? '<tr><td colspan="8" style="text-align:center;padding:36px;color:var(--color-text-muted);">No recorded VODs found on the platform.</td></tr>' : ''}
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination">
        <button id="vod-prev-page" class="btn btn-ghost btn-sm" ${vodPage<=1?'disabled':''}>${Icons.chevronLeft}</button>
        <span style="color:var(--color-text-muted);font-size:14px;">Page ${vodPage} of ${totalPages} (${totalCount} VODs)</span>
        <button id="vod-next-page" class="btn btn-ghost btn-sm" ${vodPage>=totalPages?'disabled':''}>${Icons.chevronRight}</button>
      </div>
    `;

    attachMediaImages(container);

    document.getElementById('refresh-vods-btn')?.addEventListener('click', () => loadTabContent());

    document.getElementById('vod-prev-page')?.addEventListener('click', () => {
      if (vodPage > 1) { vodPage--; loadTabContent(); }
    });
    document.getElementById('vod-next-page')?.addEventListener('click', () => {
      if (vodPage < totalPages) { vodPage++; loadTabContent(); }
    });

    container.querySelectorAll('.btn-watch-vod').forEach(btn => {
      btn.addEventListener('click', () => {
        const vid = parseInt(btn.dataset.vid);
        const target = vods.find(x => x.id === vid);
        if (target) openVodPlayerModal(target);
      });
    });

    container.querySelectorAll('.btn-del-vod').forEach(btn => {
      btn.addEventListener('click', async () => {
        const vid = parseInt(btn.dataset.vid);
        if (!confirm('Permanently delete this VOD and its recorded chat replay from the system?')) return;
        try {
          await adminApi.deleteVod(vid);
          store.showToast('VOD deleted successfully', 'info');
          loadTabContent();
        } catch (err) {
          store.showToast(err.message || 'Failed to delete VOD', 'error');
        }
      });
    });

  } catch (e) {
    container.innerHTML = '<p class="text-muted">Failed to load VOD archives.</p>';
  }
}

// ──────────────────────────────────────────
// 7. CATEGORIES TAB
// ──────────────────────────────────────────
async function renderCategoriesTab(container) {
  try {
    const cats = await categoryApi.getAll();
    container.innerHTML = `
      <!-- Create Category Form -->
      <div class="card" style="padding:24px;margin-bottom:24px;">
        <h4 style="color:#fff;font-size:15px;margin-bottom:14px;display:flex;align-items:center;gap:8px;">
          ${Icons.plus} Add New Category
        </h4>
        <form id="admin-cat-form" style="display:flex;gap:12px;flex-wrap:wrap;">
          <input class="input-dark" id="admin-cat-name" placeholder="Category Name (e.g. Grand Theft Auto VI)" required style="flex:1;min-width:240px;" />
          <input class="input-dark" id="admin-cat-slug" placeholder="URL Slug (e.g. grand-theft-auto-6)" required style="flex:1;min-width:200px;" />
          <button type="submit" class="btn btn-cyan btn-sm" style="height:44px;">Create Category</button>
        </form>
      </div>

      <!-- Categories Table -->
      <div class="card" style="padding:0;overflow-x:auto;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Slug</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${(cats || []).map(c => `
              <tr>
                <td>
                  <div style="width:40px;height:52px;border-radius:6px;overflow:hidden;background:var(--bg-gradient-card);display:flex;align-items:center;justify-content:center;">
                    ${c.imageUrl ? `<img src="${c.imageUrl}" style="width:100%;height:100%;object-fit:cover;" />` : '<span style="font-size:18px;">&#127918;</span>'}
                  </div>
                </td>
                <td style="font-weight:600;color:#fff;">${escapeHtml(c.name)}</td>
                <td style="color:var(--color-text-muted);">${escapeHtml(c.slug)}</td>
                <td>
                  <div style="display:flex;gap:6px;">
                    <label class="btn btn-ghost btn-sm" style="cursor:pointer;" title="Upload Cover">
                      ${Icons.upload} Image
                      <input type="file" data-cat-img="${c.id}" accept="image/*" style="display:none;" />
                    </label>
                    <button class="btn btn-ghost btn-sm" data-del-cat="${c.id}" style="color:var(--color-error);" title="Delete Category">
                      ${Icons.trash}
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
            ${!cats?.length ? '<tr><td colspan="4" style="text-align:center;padding:32px;color:var(--color-text-muted);">No categories created yet.</td></tr>' : ''}
          </tbody>
        </table>
      </div>
    `;

    document.getElementById('admin-cat-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('admin-cat-name')?.value?.trim();
      const slug = document.getElementById('admin-cat-slug')?.value?.trim();
      if (!name || !slug) return;
      try {
        await categoryApi.create({ name, slug });
        store.showToast('Category created successfully!', 'success');
        loadTabContent();
      } catch (err) {
        store.showToast(err.message || 'Failed to create category', 'error');
      }
    });

    container.querySelectorAll('[data-del-cat]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this category?')) return;
        try {
          await categoryApi.delete(parseInt(btn.dataset.delCat));
          store.showToast('Category deleted', 'info');
          loadTabContent();
        } catch (err) {
          store.showToast(err.message || 'Failed to delete category', 'error');
        }
      });
    });

    container.querySelectorAll('[data-cat-img]').forEach(input => {
      input.addEventListener('change', async (e) => {
        if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const catId = parseInt(input.dataset.catImg);
          openImageCropperModal(file, {
            aspectRatio: 3 / 4,
            title: 'Crop Category Cover (3:4)'
          }, async (croppedFile) => {
            try {
              await categoryApi.uploadImage(catId, croppedFile);
              store.showToast('Category image uploaded!', 'success');
              loadTabContent();
            } catch (err) {
              store.showToast(err.message || 'Failed to upload image', 'error');
            }
          });
          input.value = '';
        }
      });
    });
  } catch (e) {
    container.innerHTML = '<p class="text-muted">Failed to load categories.</p>';
  }
}

// ──────────────────────────────────────────
// 8. MEDIA SERVER INGEST & PLAYBACK TAB
// ──────────────────────────────────────────
async function renderMediaServerTab(container) {
  try {
    const cfg = await adminApi.getMediaServerConfig();
    const isCustom = cfg.isCustomConfigured;
    container.innerHTML = `
      <div style="max-width:800px;">
        <div class="card" style="padding:28px;margin-bottom:24px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
            <div>
              <h3 style="color:#fff;font-size:18px;margin:0;display:flex;align-items:center;gap:8px;">
                ${Icons.settings} Media Server Streaming Ingest & Playback
              </h3>
              <p style="color:var(--color-text-muted);font-size:13px;margin:4px 0 0 0;">
                Configure the RTMP broadcast ingest endpoint and HLS playback base URLs used for live streaming across the platform.
              </p>
            </div>
            <span class="badge" style="background:${isCustom ? 'rgba(0,242,254,0.15)' : 'rgba(255,255,255,0.08)'};color:${isCustom ? 'var(--color-cyan-primary)' : 'var(--color-text-muted)'};border:1px solid ${isCustom ? 'rgba(0,242,254,0.3)' : 'rgba(255,255,255,0.1)'};padding:6px 12px;border-radius:20px;font-size:12px;font-weight:600;">
              ${isCustom ? 'Custom URLs Active' : 'Default URLs Active'}
            </span>
          </div>

          <form id="admin-media-server-form" style="display:flex;flex-direction:column;gap:18px;">
            <div class="form-group">
              <label style="display:block;font-size:13px;font-weight:600;color:var(--color-text-muted);margin-bottom:6px;">
                RTMP Ingest Server URL (used by OBS, Streamlabs, vMix)
              </label>
              <div class="input-wrapper" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:2px 12px;display:flex;align-items:center;">
                <span class="input-icon" style="color:var(--color-cyan-primary);margin-right:8px;">${Icons.video}</span>
                <input class="input-dark" id="admin-media-rtmp" type="text" value="${escapeHtml(cfg.effectiveRtmpUrl || '')}" placeholder="e.g. rtmp://stream.orbit.live/live" required style="width:100%;background:transparent;border:none;color:#fff;padding:10px 0;" />
              </div>
              <span style="font-size:11px;color:var(--color-text-muted);margin-top:4px;display:block;">Default: <code>rtmp://localhost/live</code></span>
            </div>

            <div class="form-group">
              <label style="display:block;font-size:13px;font-weight:600;color:var(--color-text-muted);margin-bottom:6px;">
                HLS Playback Base URL (HTTP / HTTPS live video delivery)
              </label>
              <div class="input-wrapper" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:2px 12px;display:flex;align-items:center;">
                <span class="input-icon" style="color:var(--color-cyan-primary);margin-right:8px;">${Icons.play}</span>
                <input class="input-dark" id="admin-media-hls" type="text" value="${escapeHtml(cfg.effectiveHlsBaseUrl || '')}" placeholder="e.g. https://cdn.orbit.live/hls" required style="width:100%;background:transparent;border:none;color:#fff;padding:10px 0;" />
              </div>
              <span style="font-size:11px;color:var(--color-text-muted);margin-top:4px;display:block;">Default: <code>https://localhost:8443/hls</code> (Secure HTTPS) or <code>http://localhost:8080/hls</code> (HTTP). (Format: <code>{hlsBaseUrl}/{streamKey}.m3u8</code>)</span>
              <div style="font-size:12px;color:var(--color-cyan-neon,#00f2fe);margin-top:8px;padding:8px 12px;background:rgba(0,242,254,0.06);border:1px solid rgba(0,242,254,0.15);border-radius:6px;display:flex;flex-direction:column;gap:4px;">
                <div>Clips Base URL: <strong style="color:#fff;">${escapeHtml(cfg.clipsBaseUrl || (cfg.effectiveHlsBaseUrl ? cfg.effectiveHlsBaseUrl.replace('/hls', '/clips') : 'http://localhost:8080/clips'))}</strong></div>
                <div>Recordings (VOD) Base URL: <strong style="color:#fff;">${escapeHtml(cfg.recordingsBaseUrl || (cfg.effectiveHlsBaseUrl ? cfg.effectiveHlsBaseUrl.replace('/hls', '/recordings') : 'http://localhost:8080/recordings'))}</strong></div>
              </div>
            </div>

            <div style="display:flex;gap:12px;justify-content:flex-end;margin-top:12px;flex-wrap:wrap;">
              <button type="button" id="admin-media-reset-btn" class="btn btn-ghost btn-sm" style="color:var(--color-text-muted);">
                Reset to System Defaults
              </button>
              <button type="submit" id="admin-media-save-btn" class="btn btn-cyan btn-sm" style="min-width:140px;">
                Save Configuration
              </button>
            </div>
          </form>
        </div>

        <div class="card" style="padding:20px;background:rgba(0,242,254,0.03);border:1px solid rgba(0,242,254,0.15);">
          <h4 style="color:var(--color-cyan-primary);margin:0 0 8px 0;font-size:14px;display:flex;align-items:center;gap:6px;">
            ${Icons.info} Deployment & HTTPS / Localhost Notes
          </h4>
          <p style="font-size:12px;color:var(--color-text-muted);line-height:1.6;margin:0 0 8px 0;">
            Changing these endpoints updates live stream ingest, HLS manifests, clips delivery, and VOD playback URLs across the platform immediately.
          </p>
          <p style="font-size:12px;color:var(--color-text-muted);line-height:1.6;margin:0;">
            <strong style="color:#fff;">Important for Localhost Testing:</strong> Modern browsers strictly block plaintext HTTP media requests (like <code>http://localhost:8080</code>) on HTTPS websites (such as GitHub Pages). If testing with a local NGINX server on your computer, run the frontend locally with <code style="color:var(--color-cyan-neon,#00f2fe);">npm run dev</code> (at <code>http://localhost:5173</code>), which connects directly to the MonsterASP backend without any mixed-content restrictions. Alternatively, configure an HTTPS tunnel (e.g. ngrok HTTPS URL) above for online playback on HTTPS pages.
          </p>
        </div>
      </div>
    `;

    document.getElementById('admin-media-server-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const rtmp = document.getElementById('admin-media-rtmp')?.value?.trim();
      const hls = document.getElementById('admin-media-hls')?.value?.trim();
      if (!rtmp || !hls) {
        store.showToast('Please fill in both RTMP and HLS URLs', 'error');
        return;
      }
      try {
        await adminApi.setMediaServerUrls(rtmp, hls);
        await fetchMediaConfig(true);
        store.showToast('Media server URLs updated successfully!', 'success');
        loadTabContent();
      } catch (err) {
        store.showToast(err.message || 'Failed to update media server URLs', 'error');
      }
    });

    document.getElementById('admin-media-reset-btn')?.addEventListener('click', async () => {
      if (!confirm('Reset media server URLs to local development defaults?')) return;
      try {
        await adminApi.clearMediaServerUrls();
        await fetchMediaConfig(true);
        store.showToast('Reset to default media server URLs', 'info');
        loadTabContent();
      } catch (err) {
        store.showToast(err.message || 'Failed to reset media server URLs', 'error');
      }
    });
  } catch (err) {
    container.innerHTML = '<p class="text-muted">Failed to load media server configuration.</p>';
  }
}

// ──────────────────────────────────────────
// MODALS
// ──────────────────────────────────────────
function openRolesModal(userId, currentRoles, username = '') {
  const root = document.getElementById('admin-modal-root') || document.body;
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content" style="max-width:440px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h3 style="margin:0;font-size:18px;">Manage Roles ${username ? `for @${escapeHtml(username)}` : ''}</h3>
        <button id="close-roles-modal" style="background:none;border:none;color:#fff;font-size:20px;cursor:pointer;">&times;</button>
      </div>
      <p style="font-size:13px;color:var(--color-text-muted);margin-bottom:20px;">
        Select the role permissions for this user account:
      </p>
      <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:24px;">
        <label style="display:flex;align-items:center;gap:10px;cursor:pointer;background:rgba(255,255,255,0.04);padding:10px 14px;border-radius:10px;">
          <input type="checkbox" id="role-admin" ${currentRoles.includes('Admin')?'checked':''} />
          <div>
            <strong style="color:var(--color-error);">Admin</strong>
            <div style="font-size:12px;color:var(--color-text-muted);">Full system control, platform governance, user management</div>
          </div>
        </label>
        <label style="display:flex;align-items:center;gap:10px;cursor:pointer;background:rgba(255,255,255,0.04);padding:10px 14px;border-radius:10px;">
          <input type="checkbox" id="role-streamer" ${currentRoles.includes('Streamer')?'checked':''} />
          <div>
            <strong style="color:var(--color-cyan-primary);">Streamer</strong>
            <div style="font-size:12px;color:var(--color-text-muted);">Ability to broadcast live, generate stream keys, and earn followers</div>
          </div>
        </label>
        <label style="display:flex;align-items:center;gap:10px;cursor:pointer;background:rgba(255,255,255,0.04);padding:10px 14px;border-radius:10px;">
          <input type="checkbox" id="role-mod" ${currentRoles.includes('Moderator')?'checked':''} />
          <div>
            <strong style="color:var(--color-success);">Moderator</strong>
            <div style="font-size:12px;color:var(--color-text-muted);">Chat moderation tools, timeouts, and bans across assigned channels</div>
          </div>
        </label>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:10px;">
        <button id="cancel-roles-btn" class="btn btn-ghost btn-sm">Cancel</button>
        <button id="save-roles-btn" class="btn btn-cyan btn-sm">Save Roles</button>
      </div>
    </div>
  `;

  root.appendChild(modal);

  const close = () => modal.remove();
  modal.querySelector('#close-roles-modal')?.addEventListener('click', close);
  modal.querySelector('#cancel-roles-btn')?.addEventListener('click', close);

  modal.querySelector('#save-roles-btn')?.addEventListener('click', async () => {
    const roles = [];
    if (modal.querySelector('#role-admin').checked) roles.push('Admin');
    if (modal.querySelector('#role-streamer').checked) roles.push('Streamer');
    if (modal.querySelector('#role-mod').checked) roles.push('Moderator');

    try {
      await adminApi.updateUserRoles(userId, roles);
      store.showToast('User roles updated successfully', 'success');
      close();
      loadTabContent();
    } catch (err) {
      store.showToast(err.message || 'Failed to update roles', 'error');
    }
  });
}

function updateTabButtons() {
  document.querySelectorAll('[data-admin-tab]').forEach(b => {
    b.classList.toggle('active', b.dataset.adminTab === currentTab);
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}