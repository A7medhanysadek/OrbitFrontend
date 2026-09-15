import { store } from '../state/store.js';
import { Icons } from './CosmicIcons.js';
import { clearTokens, setCurrentUser } from '../api/client.js';
import { ORBIT_LOGO } from '../utils/mediaImage.js';
import { notificationApi } from '../api/notification.js';

export function renderSidebar() {
  const state = store.getState();
  const user = state.currentUser;
  const collapsed = state.sidebarCollapsed;
  const view = state.currentView;
  const isAdmin = user && user.roles && user.roles.includes && user.roles.includes('Admin');

  if (!user || ['splash','login','register','otp','forgot-password','reset-password'].includes(view)) return '';

  return `
    <aside class="app-sidebar ${collapsed ? 'collapsed' : ''}" id="app-sidebar">
      <div class="sidebar-logo">
        <img src="${ORBIT_LOGO}" alt="Orbit" />
        <span class="logo-text">rbit</span>
      </div>

      <nav class="sidebar-nav">
        <div class="sidebar-section">Menu</div>
        <a class="sidebar-link ${view === 'home' ? 'active' : ''}" data-nav="home">
          <span class="nav-icon">${Icons.home}</span>
          <span class="nav-label">Home</span>
        </a>
        <a class="sidebar-link ${view === 'categories' ? 'active' : ''}" data-nav="categories">
          <span class="nav-icon">${Icons.grid}</span>
          <span class="nav-label">Browse</span>
        </a>
        <a class="sidebar-link ${view === 'clips' ? 'active' : ''}" data-nav="clips">
          <span class="nav-icon">${Icons.clip}</span>
          <span class="nav-label">Top Clips</span>
        </a>
        <a class="sidebar-link ${view === 'settings' ? 'active' : ''}" data-nav="settings">
          <span class="nav-icon">${Icons.settings}</span>
          <span class="nav-label">Settings</span>
        </a>

        <div class="sidebar-section">Creator</div>
        <a class="sidebar-link ${view === 'studio' ? 'active' : ''}" data-nav="studio">
          <span class="nav-icon">${Icons.monitor}</span>
          <span class="nav-label">Dashboard</span>
        </a>

        ${isAdmin ? `
        <div class="sidebar-section">Admin</div>
        <a class="sidebar-link ${view === 'admin' ? 'active' : ''}" data-nav="admin">
          <span class="nav-icon">${Icons.admin}</span>
          <span class="nav-label">Admin Panel</span>
        </a>
        ` : ''}

        <div class="sidebar-section">Following</div>
        <div class="followed-list" id="sidebar-followed">
          ${state.followedChannels.length === 0 ? `
            <div style="padding: 8px 14px; font-size: 12px; color: var(--color-text-muted);">
              ${collapsed ? '' : 'No channels followed yet'}
            </div>
          ` : state.followedChannels.slice(0, 8).map(ch => `
            <div class="followed-item" data-channel-id="${ch.id || ch.channelId}">
              <div class="followed-avatar">
                ${ch.profilePhotoUrl ? `<img src="${ch.profilePhotoUrl}" alt="" style="width:28px;height:28px;border-radius:50%;object-fit:cover;" />` : `<div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#00AEBD,#00DDEE);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#000;">${(ch.name || ch.channelName || 'C')[0].toUpperCase()}</div>`}
              </div>
              <span class="followed-name" style="display:flex;align-items:center;justify-content:space-between;width:100%;gap:4px;">
                <span class="truncate">${ch.name || ch.channelName || 'Channel'}</span>
                ${ch.isLive ? `<span style="width:7px;height:7px;border-radius:50%;background:var(--color-error,#ef4444);display:inline-block;box-shadow:0 0 6px #ef4444;flex-shrink:0;"></span>` : ''}
              </span>
            </div>
          `).join('')}
        </div>
      </nav>

      <div class="sidebar-footer">
        <div class="sidebar-user" id="sidebar-user-btn">
          <div class="user-avatar">
            ${user.profilePictureUrl ? `<img src="${user.profilePictureUrl}" alt="" />` : (user.fullName || user.username || 'U')[0].toUpperCase()}
          </div>
          <div class="user-info">
            <div class="user-name">${user.username || user.fullName || 'User'}</div>
            <div class="user-role">${isAdmin ? 'Admin' : 'Viewer'}</div>
          </div>
        </div>
      </div>

      <button class="sidebar-toggle" id="sidebar-toggle-btn">
        ${collapsed ? Icons.chevronRight : Icons.chevronLeft}
      </button>
    </aside>
  `;
}

export function renderTopbar() {
  const state = store.getState();
  const user = state.currentUser;
  const view = state.currentView;

  if (!user || ['splash','login','register','otp','forgot-password','reset-password'].includes(view)) return '';

  return `
    <header class="app-topbar" id="app-topbar">
      <div class="topbar-left">
        <div class="search-bar" id="topbar-search">
          ${Icons.search}
          <input type="text" id="topbar-search-input" placeholder="Search channels, categories, clips..." />
        </div>
      </div>
      <div class="topbar-right">
        <button class="topbar-action" id="topbar-go-live" title="Go Live">
          ${Icons.video}
        </button>
        <div class="dropdown" id="notif-dropdown" style="position:relative;">
          <button class="topbar-action" id="topbar-notifications" title="Notifications" style="position:relative;">
            ${Icons.bell}
            <span class="notif-badge hidden" id="notif-badge" style="position:absolute;top:4px;right:4px;background:var(--color-live-red,#ef4444);color:#fff;font-size:10px;font-weight:700;padding:2px 6px;border-radius:10px;line-height:1;box-shadow:0 0 8px rgba(239,68,68,0.6);">0</span>
          </button>
          <div class="dropdown-menu hidden" id="notif-dropdown-menu" style="width:340px;right:0;padding:0;border-radius:16px;overflow:hidden;box-shadow:0 12px 36px rgba(0,0,0,0.6);border:1px solid rgba(0,242,254,0.2);background:var(--color-space-panel,#121626);z-index:200;">
            <div style="padding:14px 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.02);">
              <strong style="font-size:14px;color:#fff;">Notifications</strong>
              <button id="mark-all-read-btn" style="background:none;border:none;color:var(--color-cyan-neon,#00f2fe);font-size:12px;font-weight:600;cursor:pointer;">Mark all read</button>
            </div>
            <div id="notif-items-list" style="max-height:340px;overflow-y:auto;">
              <div style="padding:20px;text-align:center;color:var(--color-text-muted);font-size:13px;">No notifications</div>
            </div>
          </div>
        </div>
        <div class="dropdown" id="user-dropdown">
          <button class="topbar-user-btn" id="topbar-user-trigger">
            <div class="mini-avatar">
              ${user.profilePictureUrl ? `<img src="${user.profilePictureUrl}" alt="" />` : (user.fullName || user.username || 'U')[0].toUpperCase()}
            </div>
            <span style="font-size:13px;font-weight:500;color:#fff;">${user.username || 'User'}</span>
            ${Icons.chevronDown}
          </button>
          <div class="dropdown-menu hidden" id="user-dropdown-menu">
            <div class="dropdown-item" data-action="profile">${Icons.user} Profile</div>
            <div class="dropdown-item" data-action="studio">${Icons.monitor} Creator Studio</div>
            <div class="dropdown-item" data-action="settings">${Icons.settings} Settings</div>
            <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:4px 0;" />
            <div class="dropdown-item" data-action="logout" style="color:var(--color-error);">${Icons.logout} Log Out</div>
          </div>
        </div>
      </div>
    </header>
  `;
}

export function setupNavEvents() {
  // Sidebar nav links
  document.querySelectorAll('.sidebar-link[data-nav]').forEach(link => {
    link.addEventListener('click', () => store.navigate(link.dataset.nav));
  });

  // Followed channels
  document.querySelectorAll('.followed-item[data-channel-id]').forEach(item => {
    item.addEventListener('click', () => store.navigate('channel', { channelId: parseInt(item.dataset.channelId) }));
  });

  // Sidebar toggle
  const toggleBtn = document.getElementById('sidebar-toggle-btn');
  if (toggleBtn) toggleBtn.addEventListener('click', () => store.toggleSidebar());

  // User profile link
  const userBtn = document.getElementById('sidebar-user-btn');
  if (userBtn) userBtn.addEventListener('click', () => store.navigate('profile'));

  // Topbar search
  const searchInput = document.getElementById('topbar-search-input');
  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && searchInput.value.trim()) {
        store.navigate('search', { query: searchInput.value.trim() });
      }
    });
  }

  // Go live button
  const goLiveBtn = document.getElementById('topbar-go-live');
  if (goLiveBtn) goLiveBtn.addEventListener('click', () => store.navigate('studio'));

  // User dropdown
  const trigger = document.getElementById('topbar-user-trigger');
  const menu = document.getElementById('user-dropdown-menu');
  if (trigger && menu) {
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.classList.toggle('hidden');
    });
    document.addEventListener('click', () => menu.classList.add('hidden'));

    menu.querySelectorAll('.dropdown-item').forEach(item => {
      item.addEventListener('click', () => {
        const action = item.dataset.action;
        if (action === 'logout') {
          clearTokens();
          setCurrentUser(null);
          store.setCurrentUser(null);
          store.navigate('splash');
          store.showToast('Logged out successfully', 'info');
        } else if (action === 'profile') {
          store.navigate('profile');
        } else if (action === 'studio') {
          store.navigate('studio');
        } else if (action === 'settings') {
          store.navigate('settings');
        }
        menu.classList.add('hidden');
      });
    });
  }

  // Notifications logic
  const notifTrigger = document.getElementById('topbar-notifications');
  const notifMenu = document.getElementById('notif-dropdown-menu');
  const notifBadge = document.getElementById('notif-badge');
  const notifList = document.getElementById('notif-items-list');
  const markAllBtn = document.getElementById('mark-all-read-btn');

  const updateUnreadBadge = async () => {
    try {
      const res = await notificationApi.getUnreadCount();
      const count = res?.unreadCount || 0;
      if (notifBadge) {
        if (count > 0) {
          notifBadge.textContent = count > 99 ? '99+' : count;
          notifBadge.classList.remove('hidden');
        } else {
          notifBadge.classList.add('hidden');
        }
      }
    } catch (_) {}
  };

  const loadNotifications = async () => {
    if (!notifList) return;
    notifList.innerHTML = '<div style="padding:20px;text-align:center;"><div class="spinner" style="width:20px;height:20px;margin:0 auto;"></div></div>';
    try {
      const items = await notificationApi.getNotifications(30);
      if (!items || !items.length) {
        notifList.innerHTML = '<div style="padding:24px;text-align:center;color:var(--color-text-muted);font-size:13px;">No notifications yet</div>';
        return;
      }
      notifList.innerHTML = items.map(n => {
        let icon = '🔔';
        if (n.type === 'STREAM_LIVE') icon = '🔴';
        else if (n.type === 'NEW_FOLLOWER') icon = '🪐';
        else if (n.type === 'MOD_HIRED') icon = '🛡️';

        const timeStr = n.createdAt ? new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '';
        return `
          <div class="notif-item ${!n.isRead ? 'unread' : ''}" data-nid="${n.id}" data-type="${n.type}" data-data="${n.data || ''}" style="padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.04);background:${!n.isRead ? 'rgba(0,242,254,0.05)' : 'transparent'};cursor:pointer;display:flex;gap:12px;align-items:flex-start;transition:background 0.2s;">
            <div style="font-size:18px;line-height:1;margin-top:2px;">${icon}</div>
            <div style="flex:1;overflow:hidden;">
              <div style="font-size:13px;font-weight:${!n.isRead ? '700' : '500'};color:#fff;display:flex;justify-content:space-between;align-items:center;">
                <span class="truncate">${n.title}</span>
                <span style="font-size:11px;color:var(--color-text-muted);font-weight:400;margin-left:8px;">${timeStr}</span>
              </div>
              <div style="font-size:12px;color:var(--color-text-muted);margin-top:2px;line-height:1.4;">${n.message}</div>
            </div>
            ${!n.isRead ? `<span style="width:8px;height:8px;border-radius:50%;background:var(--color-cyan-neon);flex-shrink:0;margin-top:6px;"></span>` : ''}
          </div>
        `;
      }).join('');

      notifList.querySelectorAll('.notif-item').forEach(el => {
        el.addEventListener('click', async () => {
          const nid = parseInt(el.dataset.nid);
          const type = el.dataset.type;
          const data = el.dataset.data;
          await notificationApi.markAsRead(nid);
          updateUnreadBadge();
          notifMenu?.classList.add('hidden');

          if (type === 'STREAM_LIVE' && data) {
            store.navigate('watch', { streamId: parseInt(data) });
          } else if ((type === 'NEW_FOLLOWER' || type === 'MOD_HIRED') && data) {
            store.navigate('channel', { channelId: parseInt(data) });
          }
        });
      });
    } catch (_) {
      notifList.innerHTML = '<div style="padding:20px;text-align:center;color:var(--color-error);font-size:13px;">Failed to load notifications</div>';
    }
  };

  if (notifTrigger && notifMenu) {
    notifTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = notifMenu.classList.contains('hidden');
      document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.add('hidden'));
      if (isHidden) {
        notifMenu.classList.remove('hidden');
        loadNotifications();
      }
    });

    document.addEventListener('click', () => notifMenu.classList.add('hidden'));
    notifMenu.addEventListener('click', (e) => e.stopPropagation());

    markAllBtn?.addEventListener('click', async () => {
      await notificationApi.markAllAsRead();
      updateUnreadBadge();
      loadNotifications();
    });

    // Poll unread badge every 60s
    updateUnreadBadge();
  }
}