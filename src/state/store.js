import { getCurrentUser } from '../api/client.js';
import { channelApi } from '../api/channel.js';

class Store {
  constructor() {
    const validViews = ['splash', 'login', 'register', 'otp', 'forgot-password', 'reset-password', 'home', 'watch', 'categories', 'category-detail', 'clips', 'channel', 'studio', 'profile', 'search', 'admin', 'mod'];
    const initialHash = (typeof window !== 'undefined' && window.location.hash.replace(/^#\/?/, '')) || '';
    let startView = getCurrentUser() ? 'home' : 'splash';
    if (initialHash && validViews.includes(initialHash)) {
      startView = initialHash;
    }

    this.state = {
      currentUser: getCurrentUser(),
      currentView: startView,
      viewParams: {},
      activeStream: null,
      sidebarCollapsed: false,
      notifications: [],
      modal: null,
      followedChannels: JSON.parse(localStorage.getItem('orbit_followed') || '[]'),
    };
    this.listeners = [];

    if (this.state.currentUser) {
      this.loadFollowedChannels();
    }
  }

  getState() { return this.state; }
  setState(partial) { this.state = { ...this.state, ...partial }; this.notify(); }
  subscribe(listener) { this.listeners.push(listener); return () => { this.listeners = this.listeners.filter(l => l !== listener); }; }
  notify() { this.listeners.forEach(l => l(this.state)); }

  navigate(view, params = {}) {
    this.setState({ currentView: view, viewParams: params });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    history.pushState({ view, params }, '', `#${view}`);
  }

  setCurrentUser(user) {
    this.setState({ currentUser: user });
    if (user) {
      this.loadFollowedChannels();
    } else {
      localStorage.removeItem('orbit_followed');
      this.setState({ followedChannels: [] });
    }
  }

  setActiveStream(stream) { this.setState({ activeStream: stream }); }
  toggleSidebar() { this.setState({ sidebarCollapsed: !this.state.sidebarCollapsed }); }
  openModal(type, data = {}) { this.setState({ modal: { type, data } }); }
  closeModal() { this.setState({ modal: null }); }

  async loadFollowedChannels() {
    if (!this.state.currentUser) return;
    try {
      const list = await channelApi.getFollowedChannels();
      if (Array.isArray(list)) {
        const normalized = list.map(c => ({
          id: c.channelId,
          channelId: c.channelId,
          name: c.channelName,
          channelName: c.channelName,
          ownerUsername: c.ownerUsername,
          profilePhotoUrl: c.profilePhotoUrl,
          isLive: c.isLive,
          followedAt: c.followedAt,
        }));
        localStorage.setItem('orbit_followed', JSON.stringify(normalized));
        this.setState({ followedChannels: normalized });
      }
    } catch (e) {
      console.warn('Failed to load server follows:', e);
    }
  }

  async toggleFollow(channelId, channelName = '') {
    if (!this.state.currentUser) {
      this.showToast('Please log in to follow channels', 'warning');
      this.navigate('login');
      return false;
    }

    try {
      const res = await channelApi.toggleFollow(channelId);
      const isFollowing = !!res.isFollowing;
      let followed = [...this.state.followedChannels];

      if (isFollowing) {
        if (!followed.some(f => (f.id === channelId || f.channelId === channelId))) {
          followed.unshift({
            id: channelId,
            channelId: channelId,
            name: channelName || 'Channel',
            channelName: channelName || 'Channel',
          });
        }
      } else {
        followed = followed.filter(f => f.id !== channelId && f.channelId !== channelId);
      }

      localStorage.setItem('orbit_followed', JSON.stringify(followed));
      this.setState({ followedChannels: followed });
      return isFollowing;
    } catch (err) {
      this.showToast(err.message || 'Failed to update follow status', 'error');
      return this.isFollowing(channelId);
    }
  }

  async followChannel(channelId, channelName) {
    if (!this.isFollowing(channelId)) {
      return await this.toggleFollow(channelId, channelName);
    }
    return true;
  }

  async unfollowChannel(channelId) {
    if (this.isFollowing(channelId)) {
      return await this.toggleFollow(channelId);
    }
    return false;
  }

  isFollowing(channelId) {
    return this.state.followedChannels.some(f => f.id === channelId || f.channelId === channelId);
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (container) {
      const el = document.createElement('div');
      el.className = `toast ${type}`;
      el.innerHTML = `<span>${message}</span><button style="opacity:0.7;font-size:16px;margin-left:8px;" onclick="this.parentElement.remove()">x</button>`;
      container.appendChild(el);
      setTimeout(() => { if (el.parentElement) el.remove(); }, 4000);
    }
  }
}

export const store = new Store();

// Handle browser back/forward and hash changes
window.addEventListener('popstate', (e) => {
  if (e.state && e.state.view) {
    store.setState({ currentView: e.state.view, viewParams: e.state.params || {} });
  }
});

window.addEventListener('hashchange', () => {
  const hashView = window.location.hash.replace(/^#\/?/, '');
  const validViews = ['splash', 'login', 'register', 'otp', 'forgot-password', 'reset-password', 'home', 'watch', 'categories', 'category-detail', 'clips', 'channel', 'studio', 'profile', 'search', 'admin', 'mod'];
  if (hashView && validViews.includes(hashView) && hashView !== store.getState().currentView) {
    store.setState({ currentView: hashView });
  }
});