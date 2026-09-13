import { store } from '../state/store.js';
import { Icons } from '../components/CosmicIcons.js';

export function renderSplashView() {
  return `
    <div class="auth-page" style="flex-direction:column;gap:0;">
      <!-- Orbit rings -->
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);">
        <div class="orbit-ring orbit-ring-1" style="top:-100px;left:-100px;"></div>
        <div class="orbit-ring orbit-ring-2" style="top:-150px;left:-150px;"></div>
        <div class="orbit-ring orbit-ring-3" style="top:-200px;left:-200px;"></div>
      </div>

      <!-- Floating icons -->
      <div class="space-icon animate-float" style="top:15%;left:12%;width:32px;">${Icons.rocket}</div>
      <div class="space-icon animate-float-slow" style="top:20%;right:15%;width:28px;">${Icons.planet}</div>
      <div class="space-icon animate-float" style="bottom:25%;left:18%;width:24px;animation-delay:1s;">${Icons.star}</div>
      <div class="space-icon animate-float-slow" style="bottom:20%;right:20%;width:30px;animation-delay:0.5s;">${Icons.rocket}</div>

      <div style="position:relative;z-index:2;text-align:center;" class="animate-fade-up">
        <div class="auth-logo-group" style="justify-content:center;margin-bottom:24px;">
          <img src="/Orbit_logo.png" alt="Orbit" style="height:120px;" />
          <span class="logo-text" style="font-size:72px;">RBIT</span>
        </div>
        <p class="auth-tagline" style="font-size:24px;margin-bottom:48px;">Stream Across the Galaxy</p>

        <div style="display:flex;flex-direction:column;gap:14px;max-width:340px;margin:0 auto;">
          <button class="btn btn-primary btn-lg btn-full" id="splash-login-btn" style="font-size:17px;">
            Login
          </button>
          <button class="btn btn-secondary btn-lg btn-full" id="splash-signup-btn" style="font-size:17px;">
            Sign Up
          </button>
        </div>

        <p style="margin-top:32px;color:var(--color-text-muted);font-size:13px;">
          Enter Your Orbit!
        </p>
      </div>
    </div>
  `;
}

export function setupSplashEvents() {
  document.getElementById('splash-login-btn')?.addEventListener('click', () => store.navigate('login'));
  document.getElementById('splash-signup-btn')?.addEventListener('click', () => store.navigate('register'));
}