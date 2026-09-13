import { getCurrentUser } from '../api/client.js';

class Store {
  constructor() {
    this.state = {
      currentUser: getCurrentUser(),
      currentView: getCurrentUser() ? 'home' : 'splash',
      viewParams: {},
      activeStream: null,
      sidebarCollapsed: false,
      notifications: [],
      modal: null,
      followedChannels: JSON.parse(localStorage.getItem('orbit_followed') || '[]'),
    };
    this.listeners = [];
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
  setCurrentUser(user) { this.setState({ currentUser: user }); }
  setActiveStream(stream) { this.setState({ activeStream: stream }); }
  toggleSidebar() { this.setState({ sidebarCollapsed: !this.state.sidebarCollapsed }); }
  openModal(type, data = {}) { this.setState({ modal: { type, data } }); }
  closeModal() { this.setState({ modal: null }); }
  followChannel(channelId, channelName) {
    const followed = [...this.state.followedChannels];
    if (!followed.find(f => f.id === channelId)) {
      followed.push({ id: channelId, name: channelName });
      localStorage.setItem('orbit_followed', JSON.stringify(followed));
      this.setState({ followedChannels: followed });
    }
  }
  unfollowChannel(channelId) {
    const followed = this.state.followedChannels.filter(f => f.id !== channelId);
    localStorage.setItem('orbit_followed', JSON.stringify(followed));
    this.setState({ followedChannels: followed });
  }
  isFollowing(channelId) { return this.state.followedChannels.some(f => f.id === channelId); }
  showToast(message, type = 'info') {
    const id = Date.now();
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

// Handle browser back/forward
window.addEventListener('popstate', (e) => {
  if (e.state && e.state.view) {
    store.setState({ currentView: e.state.view, viewParams: e.state.params || {} });
  }
});