import { store } from '../state/store.js';
import { Icons } from './CosmicIcons.js';
import { clearTokens, setCurrentUser } from '../api/client.js';

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
        <img src="/Orbit_logo.png" alt="Orbit" />
        <span class="logo-text">RBIT</span>
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
            <div class="followed-item" data-channel-id="${ch.id}">
              <div class="followed-avatar">
                <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#00AEBD,#00DDEE);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#000;">${(ch.name||'C')[0].toUpperCase()}</div>
              </div>
              <span class="followed-name">${ch.name || 'Channel'}</span>
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
        <button class="topbar-action" id="topbar-notifications" title="Notifications">
          ${Icons.bell}
        </button>
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
        }
        menu.classList.add('hidden');
      });
    });
  }
}