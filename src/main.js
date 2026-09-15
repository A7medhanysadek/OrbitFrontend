import { store } from './state/store.js';
import { fetchMediaConfig } from './utils/mediaConfig.js';
import { renderSidebar, renderTopbar, setupNavEvents } from './components/Navbar.js';
import { renderSplashView, setupSplashEvents } from './views/SplashView.js';
import { renderLoginView, setupLoginEvents } from './views/LoginView.js';
import { renderRegisterView, setupRegisterEvents } from './views/RegisterView.js';
import { renderOtpView, setupOtpEvents } from './views/OtpView.js';
import { renderForgotPasswordView, setupForgotPasswordEvents } from './views/ForgotPasswordView.js';
import { renderResetPasswordView, setupResetPasswordEvents } from './views/ResetPasswordView.js';
import { renderHomeFeedView, setupHomeFeedEvents } from './views/HomeFeedView.js';
import { renderWatchRoomView, setupWatchRoomEvents } from './views/WatchRoomView.js';
import { renderCategoriesView, setupCategoriesEvents } from './views/CategoriesView.js';
import { renderCategoryDetailView, setupCategoryDetailEvents } from './views/CategoryDetailView.js';
import { renderClipsFeedView, setupClipsFeedEvents } from './views/ClipsFeedView.js';
import { renderChannelView, setupChannelEvents } from './views/ChannelView.js';
import { renderStudioDashboardView, setupStudioDashboardEvents } from './views/StudioDashboardView.js';
import { renderProfileView, setupProfileEvents } from './views/ProfileView.js';
import { renderSearchView, setupSearchEvents } from './views/SearchView.js';
import { renderAdminView, setupAdminEvents } from './views/AdminView.js';
import { renderModView, setupModEvents } from './views/ModView.js';
import { renderSettingsView, setupSettingsEvents, applyThemeMode } from './views/SettingsView.js';

const appEl = document.getElementById('app');

const authViews = ['splash', 'login', 'register', 'otp', 'forgot-password', 'reset-password'];

const viewMap = {
  'splash': { render: renderSplashView, setup: setupSplashEvents },
  'login': { render: renderLoginView, setup: setupLoginEvents },
  'register': { render: renderRegisterView, setup: setupRegisterEvents },
  'otp': { render: renderOtpView, setup: setupOtpEvents },
  'forgot-password': { render: renderForgotPasswordView, setup: setupForgotPasswordEvents },
  'reset-password': { render: renderResetPasswordView, setup: setupResetPasswordEvents },
  'home': { render: renderHomeFeedView, setup: setupHomeFeedEvents },
  'watch': { render: renderWatchRoomView, setup: setupWatchRoomEvents },
  'categories': { render: renderCategoriesView, setup: setupCategoriesEvents },
  'category-detail': { render: renderCategoryDetailView, setup: setupCategoryDetailEvents },
  'clips': { render: renderClipsFeedView, setup: setupClipsFeedEvents },
  'channel': { render: renderChannelView, setup: setupChannelEvents },
  'studio': { render: renderStudioDashboardView, setup: setupStudioDashboardEvents },
  'profile': { render: renderProfileView, setup: setupProfileEvents },
  'search': { render: renderSearchView, setup: setupSearchEvents },
  'admin': { render: renderAdminView, setup: setupAdminEvents },
  'mod': { render: renderModView, setup: setupModEvents },
  'settings': { render: renderSettingsView, setup: setupSettingsEvents },
};

let currentRenderedView = null;
let currentRenderedParamsStr = null;
let currentRenderedUserToken = null;

function renderApp() {
  const state = store.getState();
  const currentView = state.currentView;
  const isAuth = authViews.includes(currentView);
  const entry = viewMap[currentView] || viewMap['home'];
  const userToken = state.currentUser ? (state.currentUser.id || state.currentUser.token || 'user') : 'guest';
  const paramsStr = JSON.stringify(state.viewParams || {});

  const viewChanged = (currentView !== currentRenderedView) ||
                      (paramsStr !== currentRenderedParamsStr) ||
                      (userToken !== currentRenderedUserToken);

  if (viewChanged) {
    currentRenderedView = currentView;
    currentRenderedParamsStr = paramsStr;
    currentRenderedUserToken = userToken;

    if (isAuth) {
      appEl.innerHTML = `<div class="page-enter">${entry.render()}</div>`;
    } else {
      const collapsed = state.sidebarCollapsed;
      appEl.innerHTML = `
        <div class="app-layout">
          ${renderSidebar()}
          <div class="app-main ${collapsed ? 'sidebar-collapsed' : ''}">
            ${renderTopbar()}
            <div class="app-content page-enter" id="view-content">
              ${entry.render()}
            </div>
          </div>
        </div>
      `;
      setupNavEvents();
    }

    if (entry.setup) entry.setup();
  } else {
    // If only sidebar collapsed changed, toggle class without tearing down page DOM
    const appMain = document.querySelector('.app-main');
    if (appMain) {
      if (state.sidebarCollapsed) {
        appMain.classList.add('sidebar-collapsed');
      } else {
        appMain.classList.remove('sidebar-collapsed');
      }
    }
  }
}

store.subscribe(() => renderApp());
const savedTheme = localStorage.getItem('orbit_theme') || 'dark';
applyThemeMode(savedTheme);
renderApp();
fetchMediaConfig().catch(err => console.warn('Media server config init:', err));
console.log('Orbit Desktop Platform Ready');