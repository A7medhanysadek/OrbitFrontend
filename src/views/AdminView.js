import { store } from '../state/store.js';
import { adminApi } from '../api/admin.js';
import { categoryApi } from '../api/category.js';
import { Icons } from '../components/CosmicIcons.js';
import { openClipPlayerModal } from './ClipsFeedView.js';

let currentTab = 'overview';
let userPage = 1;
let channelPage = 1;
let clipPage = 1;
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
        <button class="tab-btn ${currentTab==='categories'?'active':''}" data-admin-tab="categories">${Icons.star} Categories</button>
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
    case 'categories':
      await renderCategoriesTab(container);
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
                    <button class="btn btn-ghost btn-sm btn-edit-roles" data-uid="${u.id}" data-roles="${(u.roles||[]).join(',')}" title="Manage Roles">
                      ${Icons.settings} Roles
                    </button>
                    <button class="btn btn-ghost btn-sm btn-toggle-lock" data-uid="${u.id}" data-locked="${u.isLockedOut}" style="color:${u.isLockedOut?'var(--color-success)':'var(--color-warning)'};" title="${u.isLockedOut?'Unlock':'Lock'}">
                      ${u.isLockedOut ? Icons.checkCircle : Icons.lock} ${u.isLockedOut ? 'Unlock' : 'Lock'}
                    </button>
                    <button class="btn btn-ghost btn-sm btn-reset-pass" data-uid="${u.id}" data-uname="${escapeHtml(u.username)}" title="Reset Password">
                      ${Icons.mail} Password
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
      btn.addEventListener('click', () => openRolesModal(btn.dataset.uid, (btn.dataset.roles || '').split(',').filter(Boolean)));
    });

    container.querySelectorAll('.btn-toggle-lock').forEach(btn => {
      btn.addEventListener('click', async () => {
        const uid = btn.dataset.uid;
        const currentlyLocked = btn.dataset.locked === 'true';
        const actionText = currentlyLocked ? 'unlock' : 'lock / ban';
        if (!confirm(`Are you sure you want to ${actionText} this user account?`)) return;
        try {
          await adminApi.lockUser(uid, !currentlyLocked, 1440);
          store.showToast(`User account ${currentlyLocked ? 'unlocked' : 'locked'} successfully`, 'success');
          loadTabContent();
        } catch (err) {
          store.showToast(err.message || 'Operation failed', 'error');
        }
      });
    });

    container.querySelectorAll('.btn-reset-pass').forEach(btn => {
      btn.addEventListener('click', () => openResetPasswordModal(btn.dataset.uid, btn.dataset.uname));
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
    const streams = await adminApi.getLiveStreams();

    container.innerHTML = `
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
                    <button class="btn btn-danger btn-sm btn-force-end" data-sid="${s.streamId}" style="padding:0 14px;height:32px;font-size:12px;">
                      Force Terminate
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
            ${!streams.length ? '<tr><td colspan="6" style="text-align:center;padding:48px;color:var(--color-text-muted);">No streams are currently broadcasting live across the platform.</td></tr>' : ''}
          </tbody>
        </table>
      </div>
    `;

    document.getElementById('refresh-live-streams-btn')?.addEventListener('click', () => loadTabContent());

    container.querySelectorAll('.btn-watch-stream').forEach(btn => {
      btn.addEventListener('click', () => {
        store.navigate('watch', { streamId: parseInt(btn.dataset.sid) });
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
              <img src="${c.thumbnailUrl || '/cosmic_orbit_banner.png'}" alt="${escapeHtml(c.title)}" onerror="this.onerror=null;this.src='/cosmic_orbit_banner.png';" />
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
// 6. CATEGORIES TAB
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
          try {
            await categoryApi.uploadImage(parseInt(input.dataset.catImg), e.target.files[0]);
            store.showToast('Category image uploaded!', 'success');
            loadTabContent();
          } catch (err) {
            store.showToast(err.message || 'Failed to upload image', 'error');
          }
        }
      });
    });
  } catch (e) {
    container.innerHTML = '<p class="text-muted">Failed to load categories.</p>';
  }
}

// ──────────────────────────────────────────
// MODALS
// ──────────────────────────────────────────
function openRolesModal(userId, currentRoles) {
  const root = document.getElementById('admin-modal-root') || document.body;
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content" style="max-width:440px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h3 style="margin:0;font-size:18px;">Manage User Roles</h3>
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

function openResetPasswordModal(userId, username) {
  const root = document.getElementById('admin-modal-root') || document.body;
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content" style="max-width:420px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h3 style="margin:0;font-size:18px;">Reset Password</h3>
        <button id="close-reset-modal" style="background:none;border:none;color:#fff;font-size:20px;cursor:pointer;">&times;</button>
      </div>
      <p style="font-size:13px;color:var(--color-text-muted);margin-bottom:16px;">
        Set a new secure password for <strong>${escapeHtml(username)}</strong>:
      </p>
      <div class="form-group" style="margin-bottom:20px;">
        <label>New Password (min 6 characters)</label>
        <div class="input-wrapper" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);">
          <span class="input-icon">${Icons.lock}</span>
          <input type="password" id="admin-new-password" placeholder="Enter new password" style="color:#fff;" required />
        </div>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:10px;">
        <button id="cancel-reset-btn" class="btn btn-ghost btn-sm">Cancel</button>
        <button id="submit-reset-btn" class="btn btn-cyan btn-sm">Set Password</button>
      </div>
    </div>
  `;

  root.appendChild(modal);

  const close = () => modal.remove();
  modal.querySelector('#close-reset-modal')?.addEventListener('click', close);
  modal.querySelector('#cancel-reset-btn')?.addEventListener('click', close);

  modal.querySelector('#submit-reset-btn')?.addEventListener('click', async () => {
    const newPass = modal.querySelector('#admin-new-password')?.value;
    if (!newPass || newPass.length < 6) {
      store.showToast('Password must be at least 6 characters', 'error');
      return;
    }
    try {
      await adminApi.resetPassword(userId, newPass);
      store.showToast('User password reset successfully', 'success');
      close();
    } catch (err) {
      store.showToast(err.message || 'Failed to reset password', 'error');
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