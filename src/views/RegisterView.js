import { store } from '../state/store.js';
import { authApi } from '../api/auth.js';
import { Icons } from '../components/CosmicIcons.js';
import { ORBIT_LOGO } from '../utils/mediaImage.js';

export function renderRegisterView() {
  return `
    <div class="auth-page">
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);">
        <div class="orbit-ring orbit-ring-1" style="top:-100px;left:-100px;"></div>
        <div class="orbit-ring orbit-ring-2" style="top:-150px;left:-150px;"></div>
      </div>
      <div class="space-icon animate-float" style="top:12%;right:10%;width:30px;">${Icons.rocket}</div>
      <div class="space-icon animate-float-slow" style="bottom:18%;left:10%;width:26px;">${Icons.planet}</div>

      <div class="auth-container animate-fade-up">
        <div class="auth-hero">
          <div class="auth-logo-group">
            <img src="${ORBIT_LOGO}" alt="Orbit" />
            <span class="logo-text">rbit</span>
          </div>
          <p class="auth-tagline">Join the Galaxy</p>
        </div>

        <div class="auth-form-panel" style="overflow-y:auto;max-height:90vh;">
          <h2>Create Account</h2>
          <p class="auth-subtitle">Start streaming across the galaxy</p>

          <form id="register-form">
            <div class="form-group">
              <label>Username</label>
              <div class="input-wrapper">
                <span class="input-icon">${Icons.userRound}</span>
                <input type="text" id="reg-username" placeholder="Choose a username" required minlength="3" maxlength="50" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>First Name</label>
                <div class="input-wrapper">
                  <span class="input-icon">${Icons.userRound}</span>
                  <input type="text" id="reg-firstname" placeholder="First name" required />
                </div>
              </div>
              <div class="form-group">
                <label>Last Name</label>
                <div class="input-wrapper">
                  <input type="text" id="reg-lastname" placeholder="Last name" required />
                </div>
              </div>
            </div>

            <div class="form-group">
              <label>Date of Birth</label>
              <div class="input-wrapper">
                <span class="input-icon">${Icons.calendar}</span>
                <input type="date" id="reg-dob" required style="color:var(--color-text-dark);" />
              </div>
            </div>

            <div class="form-group">
              <label>Email</label>
              <div class="input-wrapper">
                <span class="input-icon">${Icons.mail}</span>
                <input type="email" id="reg-email" placeholder="your@email.com" required />
              </div>
            </div>

            <div class="form-group">
              <label>Password</label>
              <div class="input-wrapper">
                <span class="input-icon">${Icons.lock}</span>
                <input type="password" id="reg-password" placeholder="Min 6 characters" required minlength="6" />
                <span class="input-toggle" id="toggle-reg-pass">${Icons.eyeClosed}</span>
              </div>
            </div>

            <div class="form-group">
              <label>Confirm Password</label>
              <div class="input-wrapper">
                <span class="input-icon">${Icons.lock}</span>
                <input type="password" id="reg-confirm" placeholder="Re-enter password" required />
              </div>
            </div>

            <button type="submit" id="reg-submit" class="btn btn-primary btn-full" style="margin-top:12px;">Sign Up</button>

            <div style="text-align:center;margin:18px 0;font-size:13px;color:var(--color-space-deep);">
              Already have an account? <button type="button" id="reg-login" style="color:var(--color-cyan-primary);font-weight:600;">Login</button>
            </div>

            <div class="social-divider">or continue with</div>
            <div class="social-buttons" style="justify-content:center;min-height:44px;">
              <div id="google-reg-container" style="display:flex;justify-content:center;width:100%;">
                <button type="button" id="google-reg-btn" class="social-btn" title="Sign up with Google" style="width:100%;height:44px;border-radius:24px;display:flex;align-items:center;justify-content:center;gap:10px;font-size:14px;font-weight:600;color:#333;background:#fff;border:1px solid #ddd;cursor:pointer;transition:all 0.2s;box-shadow:0 2px 6px rgba(0,0,0,0.06);">
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

export function setupRegisterEvents() {
  document.getElementById('reg-login')?.addEventListener('click', () => store.navigate('login'));

  const passInput = document.getElementById('reg-password');
  const toggle = document.getElementById('toggle-reg-pass');
  if (toggle && passInput) {
    toggle.addEventListener('click', () => {
      const show = passInput.type === 'password';
      passInput.type = show ? 'text' : 'password';
      toggle.innerHTML = show ? Icons.eyeOpen : Icons.eyeClosed;
    });
  }

  document.getElementById('register-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('reg-submit');
    const password = document.getElementById('reg-password').value;
    const confirm = document.getElementById('reg-confirm').value;
    if (password !== confirm) { store.showToast('Passwords do not match', 'error'); return; }

    const dob = document.getElementById('reg-dob').value;
    const age = Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    if (age < 1 || age > 120) { store.showToast('Invalid date of birth', 'error'); return; }

    const firstName = document.getElementById('reg-firstname').value.trim();
    const lastName = document.getElementById('reg-lastname').value.trim();
    const data = {
      username: document.getElementById('reg-username').value.trim(),
      fullName: `${firstName} ${lastName}`,
      email: document.getElementById('reg-email').value.trim(),
      password,
      age,
    };

    btn.disabled = true; btn.textContent = 'Creating account...';
    try {
      await authApi.register(data);
      store.showToast('Account created! Check your email for OTP code.', 'success');
      store.navigate('otp', { email: data.email });
    } catch (err) {
      store.showToast(err.message || 'Registration failed', 'error');
    } finally { btn.disabled = false; btn.textContent = 'Sign Up'; }
  });

  // Google OAuth Initialization
  const clientId = localStorage.getItem('orbit_google_client_id') || '42595995252-orbit.apps.googleusercontent.com';

  const handleGoogleCredential = async (response) => {
    if (!response?.credential) return;
    try {
      store.showToast('Creating account with Google...', 'info');
      const res = await authApi.googleLogin(response.credential);
      store.setCurrentUser(res);
      store.showToast('Welcome to Orbit!', 'success');
      store.navigate('home');
    } catch (err) {
      store.showToast(err.message || 'Google signup failed', 'error');
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

        const container = document.getElementById('google-reg-container');
        if (container) {
          window.google.accounts.id.renderButton(container, {
            theme: 'outline',
            size: 'large',
            type: 'standard',
            shape: 'pill',
            text: 'signup_with',
            logo_alignment: 'left',
            width: 280
          });
        }
      } catch (e) {
        console.warn('[Google GIS] Register init notice:', e);
      }
    }
  };

  if (window.google?.accounts?.id) {
    initGoogleGIS();
  } else {
    setTimeout(initGoogleGIS, 600);
  }

  document.getElementById('google-reg-btn')?.addEventListener('click', () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      store.showToast('Google services loading, please wait...', 'info');
    }
  });
}