import { store } from '../state/store.js';
import { Icons } from '../components/CosmicIcons.js';

export function renderSettingsView() {
  const currentTheme = localStorage.getItem('orbit_theme') || 'dark';
  const autoplay = localStorage.getItem('orbit_pref_autoplay') !== 'false';
  const lowLatency = localStorage.getItem('orbit_pref_low_latency') !== 'false';
  const timestamps = localStorage.getItem('orbit_pref_chat_timestamps') === 'true';
  const chatSound = localStorage.getItem('orbit_pref_chat_sound') !== 'false';
  const chatFontSize = localStorage.getItem('orbit_pref_chat_font_size') || 'normal';
  const defaultVolume = localStorage.getItem('orbit_pref_volume') || '80';

  return `
    <div style="max-width:960px;margin:0 auto;padding:24px 16px;">
      <!-- Page Header -->
      <div style="margin-bottom:32px;border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:20px;">
        <div style="display:flex;align-items:center;gap:14px;">
          <div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,rgba(0,174,189,0.2),rgba(0,242,254,0.1));border:1px solid var(--color-cyan-primary);display:flex;align-items:center;justify-content:center;color:var(--color-cyan-primary);font-size:24px;">
            ${Icons.settings}
          </div>
          <div>
            <h1 style="font-size:26px;font-family:var(--font-display);color:#fff;margin:0;">System & Platform Settings</h1>
            <p style="color:var(--color-text-muted);font-size:14px;margin:4px 0 0;">
              Customize your Orbit experience, toggle display themes, and tune audio/video playback.
            </p>
          </div>
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:32px;">
        <!-- 1. Appearance & Theme -->
        <section class="card" style="padding:28px;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
            <span style="color:var(--color-cyan-primary);font-size:20px;">${Icons.palette || '🎨'}</span>
            <h2 style="font-size:18px;color:#fff;margin:0;font-weight:700;">Appearance & Theme</h2>
          </div>
          <p style="color:var(--color-text-muted);font-size:13px;margin:0 0 20px;">
            Switch between deep space dark mode and high-contrast stellar light mode.
          </p>

          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(240px, 1fr));gap:16px;">
            <!-- Dark Theme Card -->
            <div class="theme-choice-card ${currentTheme === 'dark' ? 'active-theme' : ''}" data-theme-mode="dark" style="cursor:pointer;padding:20px;border-radius:var(--radius-lg);border:2px solid ${currentTheme === 'dark' ? 'var(--color-cyan-primary)' : 'rgba(255,255,255,0.1)'};background:rgba(15,20,36,0.9);box-shadow:${currentTheme === 'dark' ? '0 0 20px rgba(0,174,189,0.2)' : 'none'};transition:all 0.2s;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                <span style="font-size:20px;">🌌</span>
                ${currentTheme === 'dark' ? `<span style="background:var(--color-cyan-primary);color:#000;font-size:11px;font-weight:700;padding:2px 8px;border-radius:12px;">ACTIVE</span>` : ''}
              </div>
              <div style="font-weight:700;color:#fff;font-size:16px;margin-bottom:4px;">Cosmic Dark</div>
              <div style="font-size:12px;color:var(--color-text-muted);line-height:1.4;">
                Deep space midnight palette tailored for low-light streaming environments.
              </div>
            </div>

            <!-- Light Theme Card -->
            <div class="theme-choice-card ${currentTheme === 'light' ? 'active-theme' : ''}" data-theme-mode="light" style="cursor:pointer;padding:20px;border-radius:var(--radius-lg);border:2px solid ${currentTheme === 'light' ? 'var(--color-cyan-primary)' : 'rgba(255,255,255,0.1)'};background:rgba(255,255,255,0.06);box-shadow:${currentTheme === 'light' ? '0 0 20px rgba(0,174,189,0.2)' : 'none'};transition:all 0.2s;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                <span style="font-size:20px;">☀️</span>
                ${currentTheme === 'light' ? `<span style="background:var(--color-cyan-primary);color:#000;font-size:11px;font-weight:700;padding:2px 8px;border-radius:12px;">ACTIVE</span>` : ''}
              </div>
              <div style="font-weight:700;color:#fff;font-size:16px;margin-bottom:4px;">Stellar Light</div>
              <div style="font-size:12px;color:var(--color-text-muted);line-height:1.4;">
                Clean, luminous daytime interface with crisp slate panels and high contrast.
              </div>
            </div>

            <!-- System Sync Card -->
            <div class="theme-choice-card ${currentTheme === 'system' ? 'active-theme' : ''}" data-theme-mode="system" style="cursor:pointer;padding:20px;border-radius:var(--radius-lg);border:2px solid ${currentTheme === 'system' ? 'var(--color-cyan-primary)' : 'rgba(255,255,255,0.1)'};background:rgba(0,0,0,0.2);box-shadow:${currentTheme === 'system' ? '0 0 20px rgba(0,174,189,0.2)' : 'none'};transition:all 0.2s;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                <span style="font-size:20px;">💻</span>
                ${currentTheme === 'system' ? `<span style="background:var(--color-cyan-primary);color:#000;font-size:11px;font-weight:700;padding:2px 8px;border-radius:12px;">ACTIVE</span>` : ''}
              </div>
              <div style="font-weight:700;color:#fff;font-size:16px;margin-bottom:4px;">System Default</div>
              <div style="font-size:12px;color:var(--color-text-muted);line-height:1.4;">
                Automatically synchronizes with your operating system's dark/light schedule.
              </div>
            </div>
          </div>
        </section>

        <!-- 2. Video & Stream Playback -->
        <section class="card" style="padding:28px;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
            <span style="color:var(--color-cyan-primary);font-size:20px;">${Icons.video}</span>
            <h2 style="font-size:18px;color:#fff;margin:0;font-weight:700;">Playback & Audio</h2>
          </div>
          <p style="color:var(--color-text-muted);font-size:13px;margin:0 0 24px;">
            Tune HLS live player behaviors, auto-buffering, and sound levels.
          </p>

          <div style="display:flex;flex-direction:column;gap:20px;">
            <!-- Autoplay -->
            <div style="display:flex;align-items:center;justify-content:space-between;padding-bottom:16px;border-bottom:1px solid rgba(255,255,255,0.06);">
              <div>
                <div style="font-weight:600;color:#fff;font-size:15px;">Autoplay Streams</div>
                <div style="font-size:12px;color:var(--color-text-muted);">Automatically start streaming video when opening a broadcast channel.</div>
              </div>
              <label class="switch-toggle" style="position:relative;display:inline-block;width:48px;height:26px;cursor:pointer;">
                <input type="checkbox" id="pref-autoplay" ${autoplay ? 'checked' : ''} style="opacity:0;width:0;height:0;" />
                <span class="toggle-slider" style="position:absolute;inset:0;background:${autoplay ? 'var(--color-cyan-primary)' : 'rgba(255,255,255,0.2)'};border-radius:26px;transition:0.2s;">
                  <span style="position:absolute;content:'';height:20px;width:20px;left:${autoplay ? '24px' : '3px'};bottom:3px;background:#fff;border-radius:50%;transition:0.2s;"></span>
                </span>
              </label>
            </div>

            <!-- Low Latency Mode -->
            <div style="display:flex;align-items:center;justify-content:space-between;padding-bottom:16px;border-bottom:1px solid rgba(255,255,255,0.06);">
              <div>
                <div style="font-weight:600;color:#fff;font-size:15px;">Ultra Low Latency Mode</div>
                <div style="font-size:12px;color:var(--color-text-muted);">Reduces broadcast latency (1-3s delay) for responsive streamer chat interaction.</div>
              </div>
              <label class="switch-toggle" style="position:relative;display:inline-block;width:48px;height:26px;cursor:pointer;">
                <input type="checkbox" id="pref-low-latency" ${lowLatency ? 'checked' : ''} style="opacity:0;width:0;height:0;" />
                <span class="toggle-slider" style="position:absolute;inset:0;background:${lowLatency ? 'var(--color-cyan-primary)' : 'rgba(255,255,255,0.2)'};border-radius:26px;transition:0.2s;">
                  <span style="position:absolute;content:'';height:20px;width:20px;left:${lowLatency ? '24px' : '3px'};bottom:3px;background:#fff;border-radius:50%;transition:0.2s;"></span>
                </span>
              </label>
            </div>

            <!-- Default Volume -->
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <div>
                <div style="font-weight:600;color:#fff;font-size:15px;">Default Audio Volume (<span id="volume-val-display">${defaultVolume}%</span>)</div>
                <div style="font-size:12px;color:var(--color-text-muted);">Set standard initial volume when opening any stream or clip.</div>
              </div>
              <div style="width:180px;">
                <input type="range" id="pref-volume" min="0" max="100" value="${defaultVolume}" style="width:100%;accent-color:var(--color-cyan-primary);cursor:pointer;" />
              </div>
            </div>
          </div>
        </section>

        <!-- 3. Chat & Notifications -->
        <section class="card" style="padding:28px;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
            <span style="color:var(--color-cyan-primary);font-size:20px;">💬</span>
            <h2 style="font-size:18px;color:#fff;margin:0;font-weight:700;">Chat Preferences</h2>
          </div>
          <p style="color:var(--color-text-muted);font-size:13px;margin:0 0 24px;">
            Customize chat presentation, timestamps, and alert sounds.
          </p>

          <div style="display:flex;flex-direction:column;gap:20px;">
            <!-- Timestamps -->
            <div style="display:flex;align-items:center;justify-content:space-between;padding-bottom:16px;border-bottom:1px solid rgba(255,255,255,0.06);">
              <div>
                <div style="font-weight:600;color:#fff;font-size:15px;">Show Chat Timestamps</div>
                <div style="font-size:12px;color:var(--color-text-muted);">Displays the exact time next to every incoming chat message.</div>
              </div>
              <label class="switch-toggle" style="position:relative;display:inline-block;width:48px;height:26px;cursor:pointer;">
                <input type="checkbox" id="pref-chat-timestamps" ${timestamps ? 'checked' : ''} style="opacity:0;width:0;height:0;" />
                <span class="toggle-slider" style="position:absolute;inset:0;background:${timestamps ? 'var(--color-cyan-primary)' : 'rgba(255,255,255,0.2)'};border-radius:26px;transition:0.2s;">
                  <span style="position:absolute;content:'';height:20px;width:20px;left:${timestamps ? '24px' : '3px'};bottom:3px;background:#fff;border-radius:50%;transition:0.2s;"></span>
                </span>
              </label>
            </div>

            <!-- Chat Font Size -->
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <div>
                <div style="font-weight:600;color:#fff;font-size:15px;">Chat Font Size</div>
                <div style="font-size:12px;color:var(--color-text-muted);">Adjust message typography scaling in watch room.</div>
              </div>
              <select id="pref-chat-font" class="input-dark" style="width:140px;height:38px;padding:0 12px;border-radius:var(--radius-md);">
                <option value="small" ${chatFontSize === 'small' ? 'selected' : ''}>Small (12px)</option>
                <option value="normal" ${chatFontSize === 'normal' ? 'selected' : ''}>Normal (14px)</option>
                <option value="large" ${chatFontSize === 'large' ? 'selected' : ''}>Large (16px)</option>
              </select>
            </div>
          </div>
        </section>
      </div>
    </div>
  `;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function setupSettingsEvents() {
  // Theme Switching
  document.querySelectorAll('[data-theme-mode]').forEach(card => {
    card.addEventListener('click', () => {
      const mode = card.dataset.themeMode;
      applyThemeMode(mode);
      localStorage.setItem('orbit_theme', mode);
      store.showToast(`Theme changed to ${mode === 'dark' ? 'Cosmic Dark' : mode === 'light' ? 'Stellar Light' : 'System Sync'}`, 'success');
      store.navigate('settings'); // re-render to reflect active borders
    });
  });

  // Autoplay toggle
  document.getElementById('pref-autoplay')?.addEventListener('change', (e) => {
    localStorage.setItem('orbit_pref_autoplay', e.target.checked);
    store.showToast(`Autoplay ${e.target.checked ? 'enabled' : 'disabled'}`, 'info');
  });

  // Low latency toggle
  document.getElementById('pref-low-latency')?.addEventListener('change', (e) => {
    localStorage.setItem('orbit_pref_low_latency', e.target.checked);
    store.showToast(`Low latency mode ${e.target.checked ? 'enabled' : 'disabled'}`, 'info');
  });

  // Volume slider
  const volumeSlider = document.getElementById('pref-volume');
  const volumeDisplay = document.getElementById('volume-val-display');
  if (volumeSlider) {
    volumeSlider.addEventListener('input', (e) => {
      if (volumeDisplay) volumeDisplay.textContent = `${e.target.value}%`;
    });
    volumeSlider.addEventListener('change', (e) => {
      localStorage.setItem('orbit_pref_volume', e.target.value);
      store.showToast(`Default volume set to ${e.target.value}%`, 'info');
    });
  }

  // Chat timestamps
  document.getElementById('pref-chat-timestamps')?.addEventListener('change', (e) => {
    localStorage.setItem('orbit_pref_chat_timestamps', e.target.checked);
    store.showToast(`Chat timestamps ${e.target.checked ? 'enabled' : 'disabled'}`, 'info');
  });

  // Chat font size
  document.getElementById('pref-chat-font')?.addEventListener('change', (e) => {
    localStorage.setItem('orbit_pref_chat_font_size', e.target.value);
    store.showToast(`Chat font size set to ${e.target.value}`, 'info');
  });
}

export function applyThemeMode(mode) {
  const isLight = mode === 'light' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: light)').matches);
  if (isLight) {
    document.documentElement.classList.add('theme-light');
    document.body.classList.add('theme-light');
  } else {
    document.documentElement.classList.remove('theme-light');
    document.body.classList.remove('theme-light');
  }
}
