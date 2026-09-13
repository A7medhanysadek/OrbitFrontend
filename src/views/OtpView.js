import { store } from '../state/store.js';
import { authApi } from '../api/auth.js';

export function renderOtpView() {
  const email = store.getState().viewParams?.email || '';
  return `
    <div class="auth-page">
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);">
        <div class="orbit-ring orbit-ring-1" style="top:-100px;left:-100px;"></div>
        <div class="orbit-ring orbit-ring-2" style="top:-150px;left:-150px;"></div>
      </div>
      <div class="auth-container animate-fade-up" style="max-width:520px;">
        <div class="auth-form-panel" style="text-align:center;flex:unset;width:100%;">
          <div style="margin-bottom:16px;">
            <img src="/Orbit_logo.png" alt="Orbit" style="height:60px;margin:0 auto;filter:drop-shadow(0 4px 20px rgba(0,174,189,0.4));" />
          </div>
          <h2 style="text-align:center;">Verify Your Email</h2>
          <p class="auth-subtitle" style="text-align:center;">We sent a 6-digit code to <strong>${email}</strong></p>

          <div class="otp-group" id="otp-group">
            <input class="otp-box" type="text" maxlength="1" data-idx="0" inputmode="numeric" autofocus />
            <input class="otp-box" type="text" maxlength="1" data-idx="1" inputmode="numeric" />
            <input class="otp-box" type="text" maxlength="1" data-idx="2" inputmode="numeric" />
            <input class="otp-box" type="text" maxlength="1" data-idx="3" inputmode="numeric" />
            <input class="otp-box" type="text" maxlength="1" data-idx="4" inputmode="numeric" />
            <input class="otp-box" type="text" maxlength="1" data-idx="5" inputmode="numeric" />
          </div>

          <button id="otp-submit" class="btn btn-primary btn-full" style="margin-top:12px;">Confirm</button>

          <div style="margin-top:20px;font-size:13px;color:var(--color-text-subtle);">
            Didn't receive code? <button id="otp-resend" style="color:var(--color-cyan-primary);font-weight:600;">Resend Code</button>
          </div>
          <div style="margin-top:12px;">
            <button id="otp-back" style="color:var(--color-text-subtle);font-size:13px;">Back to Login</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function setupOtpEvents() {
  const boxes = document.querySelectorAll('.otp-box');
  boxes.forEach((box, i) => {
    box.addEventListener('input', (e) => {
      if (e.target.value && i < boxes.length - 1) boxes[i + 1].focus();
    });
    box.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !e.target.value && i > 0) boxes[i - 1].focus();
    });
    box.addEventListener('paste', (e) => {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData('text').trim();
      [...text].slice(0, 6).forEach((ch, idx) => { if (boxes[idx]) boxes[idx].value = ch; });
      if (boxes[Math.min(text.length, 5)]) boxes[Math.min(text.length, 5)].focus();
    });
  });

  document.getElementById('otp-back')?.addEventListener('click', () => store.navigate('login'));

  document.getElementById('otp-submit')?.addEventListener('click', async () => {
    const btn = document.getElementById('otp-submit');
    const code = [...boxes].map(b => b.value).join('');
    if (code.length !== 6) { store.showToast('Please enter the full 6-digit code', 'error'); return; }
    const email = store.getState().viewParams?.email;
    if (!email) { store.showToast('Email not found. Please register again.', 'error'); return; }
    btn.disabled = true; btn.textContent = 'Verifying...';
    try {
      const res = await authApi.confirmEmail(email, code);
      store.setCurrentUser(res);
      store.showToast('Email verified! Welcome to Orbit!', 'success');
      store.navigate('home');
    } catch (err) {
      store.showToast(err.message || 'Verification failed', 'error');
    } finally { btn.disabled = false; btn.textContent = 'Confirm'; }
  });
}