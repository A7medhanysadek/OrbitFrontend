import { store } from '../state/store.js';
import { authApi } from '../api/auth.js';
import { Icons } from '../components/CosmicIcons.js';

export function renderResetPasswordView() {
  const email = store.getState().viewParams?.email || '';
  return `
    <div class="auth-page">
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);">
        <div class="orbit-ring orbit-ring-1" style="top:-100px;left:-100px;"></div>
      </div>
      <div class="auth-container animate-fade-up" style="max-width:520px;">
        <div class="auth-form-panel" style="flex:unset;width:100%;">
          <div style="text-align:center;margin-bottom:16px;">
            <img src="/Orbit_logo.png" alt="Orbit" style="height:50px;margin:0 auto;filter:drop-shadow(0 4px 20px rgba(0,174,189,0.4));" />
          </div>
          <h2 style="text-align:center;">Reset Password</h2>
          <p class="auth-subtitle" style="text-align:center;">Enter the OTP code and your new password</p>
          <form id="reset-form">
            <div class="form-group">
              <label>OTP Code</label>
              <div class="input-wrapper">
                <span class="input-icon">${Icons.key}</span>
                <input type="text" id="reset-otp" placeholder="Enter the 6-digit code" required />
              </div>
            </div>
            <div class="form-group">
              <label>New Password</label>
              <div class="input-wrapper">
                <span class="input-icon">${Icons.lock}</span>
                <input type="password" id="reset-pass" placeholder="Min 6 characters" required minlength="6" />
              </div>
            </div>
            <div class="form-group">
              <label>Confirm Password</label>
              <div class="input-wrapper">
                <span class="input-icon">${Icons.lock}</span>
                <input type="password" id="reset-confirm" placeholder="Re-enter password" required />
              </div>
            </div>
            <input type="hidden" id="reset-email" value="${email}" />
            <button type="submit" id="reset-submit" class="btn btn-primary btn-full">Confirm</button>
            <div style="text-align:center;margin-top:16px;">
              <button type="button" id="reset-back" class="btn btn-ghost btn-full">Back to Login</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
}

export function setupResetPasswordEvents() {
  document.getElementById('reset-back')?.addEventListener('click', () => store.navigate('login'));
  document.getElementById('reset-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('reset-submit');
    const pass = document.getElementById('reset-pass').value;
    const confirm = document.getElementById('reset-confirm').value;
    if (pass !== confirm) { store.showToast('Passwords do not match', 'error'); return; }
    const email = document.getElementById('reset-email').value;
    const otp = document.getElementById('reset-otp').value.trim();
    btn.disabled = true; btn.textContent = 'Resetting...';
    try {
      await authApi.resetPassword(email, otp, pass);
      store.showToast('Password reset successful! Please log in.', 'success');
      store.navigate('login');
    } catch (err) {
      store.showToast(err.message || 'Reset failed', 'error');
    } finally { btn.disabled = false; btn.textContent = 'Confirm'; }
  });
}