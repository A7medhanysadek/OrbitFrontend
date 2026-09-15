import { store } from '../state/store.js';
import { authApi } from '../api/auth.js';
import { Icons } from '../components/CosmicIcons.js';
import { ORBIT_LOGO } from '../utils/mediaImage.js';

export function renderLoginView() {
  return `
    <div class="auth-page">
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);">
        <div class="orbit-ring orbit-ring-1" style="top:-100px;left:-100px;"></div>
        <div class="orbit-ring orbit-ring-2" style="top:-150px;left:-150px;"></div>
        <div class="orbit-ring orbit-ring-3" style="top:-200px;left:-200px;"></div>
      </div>
      <div class="space-icon animate-float" style="top:10%;left:8%;width:30px;">${Icons.rocket}</div>
      <div class="space-icon animate-float-slow" style="top:15%;right:10%;width:28px;">${Icons.planet}</div>
      <div class="space-icon animate-float" style="bottom:15%;right:12%;width:26px;animation-delay:0.8s;">${Icons.star}</div>

      <div class="auth-container animate-fade-up">
        <div class="auth-hero">
          <div class="auth-logo-group">
            <img src="${ORBIT_LOGO}" alt="Orbit" />
            <span class="logo-text">rbit</span>
          </div>
          <p class="auth-tagline">Stream Across the Galaxy</p>
        </div>

        <div class="auth-form-panel">
          <h2>Stream Across the Galaxy</h2>
          <p class="auth-subtitle">Welcome back! Sign in to continue your cosmic journey.</p>

          <form id="login-form">
            <div class="form-group">
              <label>Email / Username</label>
              <div class="input-wrapper">
                <span class="input-icon">${Icons.mail}</span>
                <input type="email" id="login-email" placeholder="example@mail.com" required />
              </div>
            </div>

            <div class="form-group">
              <label>Password</label>
              <div class="input-wrapper">
                <span class="input-icon">${Icons.lock}</span>
                <input type="password" id="login-password" placeholder="Enter your password" required />
                <span class="input-toggle" id="toggle-login-pass">${Icons.eyeClosed}</span>
              </div>
              <div style="text-align:right;margin-top:6px;">
                <button type="button" id="login-forgot" style="font-size:12px;color:var(--color-cyan-primary);font-weight:500;">Forget Password?</button>
              </div>
            </div>

            <button type="submit" id="login-submit" class="btn btn-primary btn-full" style="margin-top:8px;">Login</button>

            <div style="text-align:center;margin:18px 0;font-size:13px;color:var(--color-space-deep);">
              Don't have an account? <button type="button" id="login-signup" style="color:var(--color-cyan-primary);font-weight:600;">Sign up</button>
            </div>

            <div class="social-divider">or continue with</div>
            <div class="social-buttons" style="justify-content:center;min-height:44px;">
              <div id="google-login-container" style="display:flex;justify-content:center;width:100%;">
                <button type="button" id="google-login-btn" class="social-btn" title="Sign in with Google" style="width:100%;height:44px;border-radius:24px;display:flex;align-items:center;justify-content:center;gap:10px;font-size:14px;font-weight:600;color:#333;background:#fff;border:1px solid #ddd;cursor:pointer;transition:all 0.2s;box-shadow:0 2px 6px rgba(0,0,0,0.06);">
                  ${Icons.google} <span>Continue with Google</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
}

export function setupLoginEvents() {
  document.getElementById('login-signup')?.addEventListener('click', () => store.navigate('register'));
  document.getElementById('login-forgot')?.addEventListener('click', () => store.navigate('forgot-password'));

  const passInput = document.getElementById('login-password');
  const toggle = document.getElementById('toggle-login-pass');
  if (toggle && passInput) {
    toggle.addEventListener('click', () => {
      const show = passInput.type === 'password';
      passInput.type = show ? 'text' : 'password';
      toggle.innerHTML = show ? Icons.eyeOpen : Icons.eyeClosed;
    });
  }

  document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('login-submit');
    const email = document.getElementById('login-email').value.trim();
    const password = passInput.value;
    btn.disabled = true; btn.textContent = 'Logging in...';
    try {
      const res = await authApi.login(email, password);
      store.setCurrentUser(res);
      store.showToast('Welcome back to Orbit!', 'success');
      store.navigate('home');
    } catch (err) {
      store.showToast(err.message || 'Login failed', 'error');
    } finally { btn.disabled = false; btn.textContent = 'Login'; }
  });

  // Google OAuth Initialization
  const clientId = localStorage.getItem('orbit_google_client_id') || '42595995252-orbit.apps.googleusercontent.com';

  const handleGoogleCredential = async (response) => {
    if (!response?.credential) return;
    try {
      store.showToast('Authenticating with Google...', 'info');
      const res = await authApi.googleLogin(response.credential);
      store.setCurrentUser(res);
      store.showToast('Welcome to Orbit!', 'success');
      store.navigate('home');
    } catch (err) {
      store.showToast(err.message || 'Google authentication failed', 'error');
    }
  };

  const initGoogleGIS = () => {
    if (window.google?.accounts?.id && clientId) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleCredential,
          auto_select: false,
          cancel_on_tap_outside: true
        });

        const container = document.getElementById('google-login-container');
        if (container) {
          window.google.accounts.id.renderButton(container, {
            theme: 'outline',
            size: 'large',
            type: 'standard',
            shape: 'pill',
            text: 'continue_with',
            logo_alignment: 'left',
            width: 280
          });
        }
      } catch (e) {
        console.warn('[Google GIS] Initialization notice:', e);
      }
    }
  };

  if (window.google?.accounts?.id) {
    initGoogleGIS();
  } else {
    setTimeout(initGoogleGIS, 600);
  }

  document.getElementById('google-login-btn')?.addEventListener('click', () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      store.showToast('Google services loading, please wait...', 'info');
    }
  });
}