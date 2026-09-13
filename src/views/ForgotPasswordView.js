import { store } from '../state/store.js';
import { authApi } from '../api/auth.js';
import { Icons } from '../components/CosmicIcons.js';
import { ORBIT_LOGO } from '../utils/mediaImage.js';

export function renderForgotPasswordView() {
  return `
    <div class="auth-page">
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);">
        <div class="orbit-ring orbit-ring-1" style="top:-100px;left:-100px;"></div>
      </div>
      <div class="auth-container animate-fade-up" style="max-width:520px;">
        <div class="auth-form-panel" style="flex:unset;width:100%;">
          <div style="text-align:center;margin-bottom:16px;">
            <img src="${ORBIT_LOGO}" alt="Orbit" style="height:50px;margin:0 auto;filter:drop-shadow(0 4px 20px rgba(0,174,189,0.4));" />
          </div>
          <h2 style="text-align:center;">Forgot Password</h2>
          <p class="auth-subtitle" style="text-align:center;">Enter your email to receive a reset code</p>
          <form id="forgot-form">
            <div class="form-group">
              <label>Email</label>
              <div class="input-wrapper">
                <span class="input-icon">${Icons.mail}</span>
                <input type="email" id="forgot-email" placeholder="your@email.com" required />
              </div>
            </div>
            <button type="submit" id="forgot-submit" class="btn btn-primary btn-full">Get Code</button>
            <div style="text-align:center;margin-top:16px;">
              <button type="button" id="forgot-back" class="btn btn-ghost btn-full">Back to Login</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
}

export function setupForgotPasswordEvents() {
  document.getElementById('forgot-back')?.addEventListener('click', () => store.navigate('login'));
  document.getElementById('forgot-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('forgot-submit');
    const email = document.getElementById('forgot-email').value.trim();
    btn.disabled = true; btn.textContent = 'Sending...';
    try {
      await authApi.forgotPassword(email);
      store.showToast('Reset code sent! Check your email.', 'success');
      store.navigate('reset-password', { email });
    } catch (err) {
      store.showToast(err.message || 'Failed to send code', 'error');
    } finally { btn.disabled = false; btn.textContent = 'Get Code'; }
  });
}