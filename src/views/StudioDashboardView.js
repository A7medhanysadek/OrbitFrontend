import { store } from '../state/store.js';
import { channelApi } from '../api/channel.js';
import { streamApi } from '../api/stream.js';
import { dashboardApi } from '../api/dashboard.js';
import { categoryApi } from '../api/category.js';
import { Icons } from '../components/CosmicIcons.js';
import { openVodPlayerModal } from '../components/VodPlayerModal.js';
import { openImageCropperModal } from '../components/ImageCropperModal.js';
import { OrbitEmotes, getEmoteSvg, getAllPresets, renderEmoteVisual } from '../components/OrbitEmotes.js';

let studioTab = 'overview';
let channelSubTab = 'profile';
let channelData = null;
let hasChannel = false;
let authError = false;
let cachedCategories = [];
let studioLiveDurationTimer = null;

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function parseUtcDate(dateInput) {
  if (!dateInput) return null;
  if (dateInput instanceof Date) return dateInput;
  let str = String(dateInput).trim();
  if (!str) return null;
  if (str.includes('T')) {
    const parts = str.split('T');
    const timePart = parts[1];
    if (!timePart.includes('Z') && !timePart.includes('+') && !timePart.includes('-')) {
      str = `${str}Z`;
    }
  } else if (!str.includes('Z') && !str.includes('+')) {
    str = `${str}Z`;
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

export function renderStudioDashboardView() {
  const user = store.getState().currentUser;
  if (!user) {
    return `
      <div class="empty-state" style="padding:80px 20px;">
        <div class="empty-icon">&#128274;</div>
        <h2 style="color:var(--color-error);font-family:var(--font-display);">Authentication Required</h2>
        <p style="color:var(--color-text-muted);max-width:440px;margin:12px auto;">
          Please log in to your account to access Creator Studio, broadcast live, and manage channel assets.
        </p>
        <button id="studio-login-btn" class="btn btn-cyan btn-sm" style="margin-top:16px;">Log in</button>
      </div>
    `;
  }

  return `
    <div>
      <!-- Header (Admin-Synced Layout) -->
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;margin-bottom:24px;">
        <div>
          <div style="display:flex;align-items:center;gap:10px;">
            <h1 style="font-family:var(--font-display);font-size:26px;color:#fff;margin:0;">
              ${Icons.video} Cosmic Creator Studio
            </h1>
            <span class="badge-role streamer">CREATOR STUDIO</span>
          </div>
          <p style="color:var(--color-text-muted);font-size:14px;margin-top:4px;">
            Live stream management, broadcast analytics, channel branding, and custom emote studio.
          </p>
        </div>
        <button id="studio-refresh-all" class="btn btn-ghost btn-sm">${Icons.refresh} Refresh Studio</button>
      </div>

      <!-- Navigation Tabs (Horizontal Admin Sync) -->
      <div class="tabs">
        <button class="tab-btn ${studioTab === 'overview' ? 'active' : ''}" data-studio-tab="overview">${Icons.grid} Overview</button>
        <button class="tab-btn ${studioTab === 'broadcast' ? 'active' : ''}" data-studio-tab="broadcast"><span style="color:var(--color-live-red);">&#9679;</span> Stream Manager</button>
        <button class="tab-btn ${studioTab === 'channel' ? 'active' : ''}" data-studio-tab="channel">${Icons.user} Channel Setup</button>
        <button class="tab-btn ${studioTab === 'analytics' ? 'active' : ''}" data-studio-tab="analytics">${Icons.chart || '📊'} Analytics &amp; Insights</button>
        <button class="tab-btn ${studioTab === 'vods' ? 'active' : ''}" data-studio-tab="vods">${Icons.video} Broadcast Archive</button>
        <button class="tab-btn ${studioTab === 'moderation' ? 'active' : ''}" data-studio-tab="moderation">${Icons.shield || '🛡️'} Moderation</button>
        <button class="tab-btn ${studioTab === 'emotes' ? 'active' : ''}" data-studio-tab="emotes">${Icons.emoji || '😀'} Emotes &amp; Badges</button>
      </div>

      <!-- Active Tab Container -->
      <div id="studio-tab-body">
        <div class="spinner"></div>
      </div>
    </div>
  `;
}

export function setupStudioDashboardEvents() {
  document.getElementById('studio-login-btn')?.addEventListener('click', () => store.navigate('login'));
  document.getElementById('studio-refresh-all')?.addEventListener('click', () => initStudio());

  document.querySelectorAll('[data-studio-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      studioTab = btn.dataset.studioTab;
      document.querySelectorAll('[data-studio-tab]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderWorkspace();
    });
  });

  initStudio();
}

async function initStudio() {
  authError = false;
  try {
    const [channelRes, catsRes] = await Promise.allSettled([
      channelApi.getMyChannel(),
      categoryApi.getAll()
    ]);

    if (channelRes.status === 'fulfilled') {
      channelData = channelRes.value;
      hasChannel = !!channelData;
    } else {
      if (channelRes.reason?.status === 401) {
        authError = true;
      }
      hasChannel = false;
    }

    if (catsRes.status === 'fulfilled' && Array.isArray(catsRes.value)) {
      cachedCategories = catsRes.value;
    }
  } catch (e) {
    hasChannel = false;
  }
  renderWorkspace();
}

async function renderWorkspace() {
  const ws = document.getElementById('studio-tab-body');
  if (!ws) return;

  if (authError) {
    ws.innerHTML = `
      <div class="empty-state" style="max-width:500px;margin:40px auto;">
        <div class="empty-icon">&#128274;</div>
        <h3>Session Expired</h3>
        <p>Your session has expired. Please log in again to access Creator Studio.</p>
        <button id="ws-relogin-btn" class="btn btn-cyan btn-sm">Log In</button>
      </div>`;
    document.getElementById('ws-relogin-btn')?.addEventListener('click', () => store.navigate('login'));
    return;
  }

  if (!hasChannel && studioTab !== 'channel') {
    ws.innerHTML = `
      <div class="empty-state" style="max-width:500px;margin:40px auto;">
        <div class="empty-icon">&#128225;</div>
        <h3>Create Your Channel First</h3>
        <p>You need a channel before you can stream. Set up your channel identity to unlock broadcasting with OBS.</p>
        <button id="ws-create-ch" class="btn btn-cyan btn-sm">Create Channel</button>
      </div>`;
    document.getElementById('ws-create-ch')?.addEventListener('click', () => {
      studioTab = 'channel';
      document.querySelectorAll('[data-studio-tab]').forEach(b => {
        b.classList.remove('active');
        if (b.dataset.studioTab === 'channel') b.classList.add('active');
      });
      renderWorkspace();
    });
    return;
  }

  switch (studioTab) {
    case 'overview': await renderOverview(ws); break;
    case 'broadcast': await renderBroadcast(ws); break;
    case 'channel': renderChannelSetup(ws); break;
    case 'analytics': await renderAnalytics(ws); break;
    case 'vods': await renderVods(ws); break;
    case 'moderation': await renderModeration(ws); break;
    case 'emotes': await renderEmotes(ws); break;
    default: ws.innerHTML = '<p>Select a tab</p>';
  }
}

// ──────────────────────────────────────────
// 1. OVERVIEW TAB
// ──────────────────────────────────────────
async function renderOverview(ws) {
  ws.innerHTML = '<div class="spinner"></div>';
  try {
    const summary = await dashboardApi.getSummary();
    const ch = summary.channelProfile || channelData || {};
    const stats = summary.lifetimeStats || {};
    const live = summary.liveManager;

    ws.innerHTML = `
      ${live && live.isLive ? `
        <div class="card" style="padding:20px;margin-bottom:24px;border-color:var(--color-live-red);background:rgba(255,0,85,0.04);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
          <div style="display:flex;align-items:center;gap:14px;">
            <span class="badge-live" style="font-size:14px;padding:4px 14px;">LIVE NOW</span>
            <div>
              <div style="font-size:16px;font-weight:700;color:#fff;">${escapeHtml(live.title || 'Broadcasting Live')}</div>
              <div style="font-size:12px;color:var(--color-text-muted);margin-top:2px;">
                ${live.currentViewerCount || 0} viewers &bull; Uptime: ${live.formattedUptime || '00:00'} &bull; ${escapeHtml(live.categoryName || 'General')}
              </div>
            </div>
          </div>
          <div style="display:flex;gap:8px;">
            <button id="ov-watch-btn" class="btn btn-outline btn-sm">${Icons.eye} Watch Room</button>
            <button id="ov-manage-btn" class="btn btn-cyan btn-sm">${Icons.video} Stream Manager</button>
          </div>
        </div>
      ` : ''}

      <!-- Lifetime Numerical KPI Cards -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:16px;margin-bottom:28px;">
        <div class="stat-card animate-stat-in">
          <div class="stat-label">Total Streams</div>
          <div class="stat-value">${stats.totalStreams || 0}</div>
          <div style="font-size:11px;color:var(--color-text-muted);margin-top:4px;">Completed broadcasts</div>
        </div>
        <div class="stat-card animate-stat-in" style="animation-delay:0.05s;">
          <div class="stat-label">All-Time Peak Viewers</div>
          <div class="stat-value" style="color:var(--color-live-red);">${stats.allTimePeakViewers || 0}</div>
          <div style="font-size:11px;color:var(--color-text-muted);margin-top:4px;">Highest concurrent audience</div>
        </div>
        <div class="stat-card animate-stat-in" style="animation-delay:0.1s;">
          <div class="stat-label">Average Peak Viewers</div>
          <div class="stat-value" style="color:var(--color-cyan-primary);">${stats.averagePeakViewers ? stats.averagePeakViewers.toFixed(1) : 0}</div>
          <div style="font-size:11px;color:var(--color-text-muted);margin-top:4px;">Per stream session average</div>
        </div>
        <div class="stat-card animate-stat-in" style="animation-delay:0.15s;">
          <div class="stat-label">Total Broadcast Time</div>
          <div class="stat-value">${stats.totalBroadcastHours || '0h'}</div>
          <div style="font-size:11px;color:var(--color-text-muted);margin-top:4px;">Avg duration: ${stats.averageStreamDurationFormatted || '0m'}</div>
        </div>
        <div class="stat-card animate-stat-in" style="animation-delay:0.2s;">
          <div class="stat-label">Total Chat Messages</div>
          <div class="stat-value" style="color:var(--color-cyan-neon);">${stats.totalChatMessages || 0}</div>
          <div style="font-size:11px;color:var(--color-text-muted);margin-top:4px;">${stats.uniqueChattersCount || 0} unique chatters</div>
        </div>
        <div class="stat-card animate-stat-in" style="animation-delay:0.25s;">
          <div class="stat-label">Total Clips Created</div>
          <div class="stat-value">${stats.totalClipsCount || 0}</div>
          <div style="font-size:11px;color:var(--color-text-muted);margin-top:4px;">${stats.totalClipViews || 0} total clip views</div>
        </div>
      </div>

      <!-- Quick Chart & Channel Info Grid -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(340px, 1fr));gap:20px;">
        <div class="chart-container">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <h4 style="margin:0;font-size:14px;color:#fff;">Viewer Activity (Recent Streams)</h4>
            <span style="font-size:11px;color:var(--color-cyan-primary);">Peak: ${stats.allTimePeakViewers || 0}</span>
          </div>
          <div class="mini-chart" style="height:130px;align-items:flex-end;gap:8px;padding:16px 0;">
            ${generateChartBars(8, stats.allTimePeakViewers || 50)}
          </div>
        </div>

        <div class="card" style="padding:22px;display:flex;flex-direction:column;justify-content:space-between;">
          <div>
            <div style="font-size:12px;font-weight:700;color:var(--color-cyan-primary);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:12px;">Channel Identity</div>
            <div style="display:flex;align-items:center;gap:14px;">
              <div style="width:54px;height:54px;border-radius:50%;background:linear-gradient(135deg,#00AEBD,#00DDEE);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:22px;color:#000;overflow:hidden;flex-shrink:0;">
                ${ch.profilePhotoUrl ? `<img src="${ch.profilePhotoUrl}" style="width:100%;height:100%;object-fit:cover;" />` : (ch.name || ch.channelName || 'C')[0].toUpperCase()}
              </div>
              <div>
                <div style="font-weight:700;font-size:16px;color:#fff;">${escapeHtml(ch.name || ch.channelName || 'Your Channel')}</div>
                <div style="font-size:13px;color:var(--color-text-muted);margin-top:2px;">${escapeHtml(ch.description || 'No description added yet.')}</div>
              </div>
            </div>
          </div>
          <div style="display:flex;gap:10px;margin-top:20px;">
            <button id="ov-setup-btn" class="btn btn-outline btn-sm" style="flex:1;">Channel Branding</button>
            <button id="ov-emotes-btn" class="btn btn-ghost btn-sm" style="flex:1;">Emotes Studio</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('ov-watch-btn')?.addEventListener('click', () => {
      if (live?.streamId) store.navigate('watch', { streamId: live.streamId });
    });
    document.getElementById('ov-manage-btn')?.addEventListener('click', () => {
      switchTab('broadcast');
    });
    document.getElementById('ov-setup-btn')?.addEventListener('click', () => {
      switchTab('channel');
    });
    document.getElementById('ov-emotes-btn')?.addEventListener('click', () => {
      switchTab('emotes');
    });
  } catch (e) {
    ws.innerHTML = '<div class="empty-state"><h3>Failed to load dashboard overview</h3></div>';
  }
}

// ──────────────────────────────────────────
// 2. STREAM MANAGER TAB (With Category Picker & Live Metadata Editing)
// ──────────────────────────────────────────
async function renderBroadcast(ws) {
  ws.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;flex-wrap:wrap;gap:12px;">
      <div>
        <h2 style="font-family:var(--font-display);color:var(--color-cyan-neon);margin:0 0 4px 0;">Stream Manager</h2>
        <p style="color:var(--color-text-muted);margin:0;font-size:14px;">Configure OBS Studio, pick stream categories, and broadcast live to Orbit viewers.</p>
      </div>
      <div id="streaming-server-status" style="display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:600;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:var(--color-text-muted);">
        <span style="width:8px;height:8px;border-radius:50%;background:#888;"></span> Checking Streaming Server...
      </div>
    </div>

    <!-- Active Live Stream Manager & Metadata Editor Container -->
    <div id="live-manager-section" style="margin-bottom:24px;"></div>

    <!-- OBS Settings & Ingest Card Grid -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(340px, 1fr));gap:20px;margin-bottom:24px;">
      <!-- Stream Connection Info -->
      <div class="card" style="padding:24px;border-color:rgba(0,242,254,0.25);">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
          <span style="color:var(--color-cyan-neon);font-size:18px;">${Icons.live}</span>
          <h4 style="margin:0;font-size:15px;font-weight:700;color:var(--color-text);">OBS Connection Settings</h4>
        </div>

        <!-- RTMP Server URL -->
        <div style="margin-bottom:16px;">
          <label style="display:block;font-size:12px;color:var(--color-text-muted);margin-bottom:6px;font-weight:600;">
            RTMP SERVER (OBS "Server" field)
          </label>
          <div style="display:flex;gap:8px;">
            <input class="input-dark" id="rtmp-url-display" type="text" value="rtmp://localhost/live" readonly style="flex:1;font-family:monospace;font-size:13px;color:var(--color-cyan-neon);background:rgba(0,0,0,0.4);" />
            <button id="copy-rtmp" class="btn btn-ghost btn-sm" title="Copy RTMP URL" style="border:1px solid rgba(255,255,255,0.1);">${Icons.copy}</button>
          </div>
          <span style="display:block;font-size:11px;color:var(--color-text-muted);margin-top:4px;">
            In OBS: <b>Settings &rarr; Stream &rarr; Service: Custom...</b> &bull; Paste this URL
          </span>
        </div>

        <!-- Stream Key -->
        <div style="margin-bottom:16px;">
          <label style="display:block;font-size:12px;color:var(--color-text-muted);margin-bottom:6px;font-weight:600;">
            STREAM KEY (OBS "Stream Key" field)
          </label>
          <div style="display:flex;gap:8px;">
            <input class="input-dark" id="stream-key-display" type="password" value="Loading..." readonly style="flex:1;font-family:monospace;font-size:13px;background:rgba(0,0,0,0.4);" />
            <button id="toggle-key" class="btn btn-ghost btn-sm" title="Show/Hide Key" style="border:1px solid rgba(255,255,255,0.1);">${Icons.eyeClosed}</button>
            <button id="copy-key" class="btn btn-ghost btn-sm" title="Copy Stream Key" style="border:1px solid rgba(255,255,255,0.1);">${Icons.copy}</button>
          </div>
        </div>

        <button id="gen-key" class="btn btn-outline btn-sm btn-full" style="gap:8px;">
          ${Icons.refresh} Generate New Key
        </button>
      </div>

      <!-- Go Live Stream Metadata with Category Selection -->
      <div class="card" style="padding:24px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
          <span style="color:var(--color-live-red);font-size:18px;">${Icons.video}</span>
          <h4 style="margin:0;font-size:15px;font-weight:700;color:var(--color-text);">New Stream Session</h4>
        </div>
        <form id="go-live-form">
          <div class="form-group" style="margin-bottom:12px;">
            <label style="color:var(--color-text-muted);font-size:12px;font-weight:600;">STREAM TITLE</label>
            <input class="input-dark" id="go-title" placeholder="e.g. Late Night Cosmic Gaming &amp; Q&amp;A" required style="margin-top:4px;" />
          </div>
          <div class="form-group" style="margin-bottom:12px;">
            <label style="color:var(--color-text-muted);font-size:12px;font-weight:600;">STREAM CATEGORY</label>
            <select class="input-dark" id="go-category" style="margin-top:4px;">
              <option value="">Select Category (Optional)</option>
              ${cachedCategories.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group" style="margin-bottom:16px;">
            <label style="color:var(--color-text-muted);font-size:12px;font-weight:600;">DESCRIPTION (OPTIONAL)</label>
            <input class="input-dark" id="go-desc" placeholder="What's this stream about?" style="margin-top:4px;" />
          </div>
          <button type="submit" class="btn btn-cyan btn-full" id="go-live-btn" style="padding:10px 16px;font-weight:700;">
            ${Icons.rocket} Create Stream Session
          </button>
        </form>
      </div>
    </div>

    <!-- Quick OBS Setup Guide Card -->
    <div class="card" style="padding:20px 24px;margin-bottom:24px;background:rgba(18,20,32,0.6);border:1px dashed rgba(0,242,254,0.3);">
      <h4 style="margin:0 0 12px 0;font-size:14px;color:var(--color-cyan-neon);display:flex;align-items:center;gap:8px;">
        ${Icons.settings} How to Broadcast with OBS Studio
      </h4>
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:16px;font-size:13px;color:var(--color-text-muted);">
        <div style="background:rgba(0,0,0,0.25);padding:12px 14px;border-radius:8px;border-left:3px solid var(--color-cyan-neon);">
          <strong style="color:var(--color-text);display:block;margin-bottom:4px;">1. Copy your Stream Key</strong>
          Click the copy button next to your <b>Stream Key</b> above.
        </div>
        <div style="background:rgba(0,0,0,0.25);padding:12px 14px;border-radius:8px;border-left:3px solid var(--color-cyan-neon);">
          <strong style="color:var(--color-text);display:block;margin-bottom:4px;">2. Paste into OBS Settings</strong>
          In OBS: <b>Settings &rarr; Stream &rarr; Service: Custom...</b><br>
          Server: <code style="color:var(--color-cyan-neon);">rtmp://localhost/live</code>
        </div>
        <div style="background:rgba(0,0,0,0.25);padding:12px 14px;border-radius:8px;border-left:3px solid var(--color-cyan-neon);">
          <strong style="color:var(--color-text);display:block;margin-bottom:4px;">3. Start Streaming</strong>
          Hit <b>Start Streaming</b> in OBS to go live immediately!
        </div>
      </div>
    </div>
  `;

  // Server health check
  const statusEl = document.getElementById('streaming-server-status');
  if (statusEl) {
    try {
      const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
      const healthUrl = isHttps ? 'https://localhost:8443/health' : 'http://localhost:8080/health';
      const healthRes = await fetch(healthUrl, { method: 'GET', mode: 'cors' });
      if (healthRes.ok) {
        statusEl.innerHTML = `
          <span style="width:8px;height:8px;border-radius:50%;background:#10b981;box-shadow:0 0 8px #10b981;"></span>
          <span style="color:#10b981;">Streaming Server ONLINE</span>
        `;
        statusEl.style.borderColor = 'rgba(16,185,129,0.3)';
        statusEl.style.background = 'rgba(16,185,129,0.08)';
      } else {
        throw new Error('Server non-200');
      }
    } catch (_) {
      statusEl.innerHTML = `
        <span style="width:8px;height:8px;border-radius:50%;background:#f59e0b;"></span>
        <span style="color:#f59e0b;">Streaming Server OFFLINE (run start-server.bat)</span>
      `;
      statusEl.style.borderColor = 'rgba(245,158,11,0.3)';
      statusEl.style.background = 'rgba(245,158,11,0.08)';
    }
  }

  // Copy RTMP URL
  document.getElementById('copy-rtmp')?.addEventListener('click', () => {
    const rtmpInp = document.getElementById('rtmp-url-display');
    if (rtmpInp) {
      navigator.clipboard.writeText(rtmpInp.value);
      store.showToast('RTMP URL copied! Paste into OBS Server field.', 'success');
    }
  });

  // Load stream key
  try {
    const keyData = await streamApi.getStreamKey();
    const keyInput = document.getElementById('stream-key-display');
    if (keyInput && keyData) {
      keyInput.value = keyData.streamKey || keyData.key || 'No key generated';
      if (keyData.rtmpUrl) {
        const rtmpInp = document.getElementById('rtmp-url-display');
        if (rtmpInp) rtmpInp.value = keyData.rtmpUrl;
      }
    }
  } catch (e) {
    const ki = document.getElementById('stream-key-display');
    if (ki) ki.value = 'No key yet';
  }

  document.getElementById('toggle-key')?.addEventListener('click', () => {
    const inp = document.getElementById('stream-key-display');
    const btn = document.getElementById('toggle-key');
    if (inp) {
      const isPass = inp.type === 'password';
      inp.type = isPass ? 'text' : 'password';
      if (btn) btn.innerHTML = isPass ? Icons.eye : Icons.eyeClosed;
    }
  });

  document.getElementById('copy-key')?.addEventListener('click', () => {
    const inp = document.getElementById('stream-key-display');
    if (inp) {
      navigator.clipboard.writeText(inp.value);
      store.showToast('Stream key copied! Keep it secret.', 'success');
    }
  });

  document.getElementById('gen-key')?.addEventListener('click', async () => {
    try {
      const res = await streamApi.generateStreamKey();
      const inp = document.getElementById('stream-key-display');
      if (inp) inp.value = res.streamKey || res.key || '';
      if (res.rtmpUrl) {
        const rtmpInp = document.getElementById('rtmp-url-display');
        if (rtmpInp) rtmpInp.value = res.rtmpUrl;
      }
      store.showToast('New stream key generated!', 'success');
    } catch (e) { store.showToast(e.message, 'error'); }
  });

  document.getElementById('go-live-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('go-live-btn');
    btn.disabled = true;
    try {
      const title = document.getElementById('go-title')?.value;
      const desc = document.getElementById('go-desc')?.value;
      const catVal = document.getElementById('go-category')?.value;
      const categoryId = catVal ? parseInt(catVal) : null;

      await streamApi.createStream({ title, description: desc, categoryId });
      store.showToast('Stream session ready! Click "Start Streaming" in OBS.', 'success');
      loadLiveManager();
    } catch (er) { store.showToast(er.message, 'error'); }
    btn.disabled = false;
  });

  loadLiveManager();
}

async function loadLiveManager() {
  const section = document.getElementById('live-manager-section');
  if (!section) return;
  try {
    const live = await dashboardApi.getLiveManager();
    if (!live) {
      section.innerHTML = `
        <div class="card" style="padding:24px;text-align:center;color:var(--color-text-muted);">
          <div style="font-size:28px;margin-bottom:8px;">&#128225;</div>
          <div style="font-weight:600;color:#fff;font-size:15px;margin-bottom:4px;">You are currently offline</div>
          <div style="font-size:13px;">Create a new stream session below and start streaming in OBS to go live.</div>
        </div>
      `;
      return;
    }

    const isLive = live.isLive;
    const badgeHtml = isLive
      ? '<span class="badge-live" style="font-size:14px;padding:4px 14px;">LIVE</span>'
      : '<span style="font-size:12px;padding:4px 12px;border-radius:12px;background:rgba(245,158,11,0.15);color:#f59e0b;font-weight:700;border:1px solid rgba(245,158,11,0.4);">READY (WAITING FOR OBS)</span>';

    const endBtnText = isLive ? `${Icons.x} End Stream` : `${Icons.x} Cancel Session`;
    const borderColor = isLive ? 'var(--color-live-red)' : 'rgba(245,158,11,0.4)';
    const statusText = isLive ? 'Broadcasting live to viewers' : 'Stream session ready &bull; Click "Start Streaming" in OBS to go live';

    section.innerHTML = `
      <div class="card" style="padding:24px;border-color:${borderColor};">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:12px;">
          <div style="display:flex;align-items:center;gap:12px;">
            ${badgeHtml}
            <div>
              <h3 style="font-size:18px;margin:0 0 2px 0;color:#fff;" id="active-live-title">${escapeHtml(live.title || 'Broadcasting')}</h3>
              <div style="font-size:12px;color:var(--color-text-muted);" id="active-live-meta">
                ${statusText} &bull; Category: <strong style="color:var(--color-cyan-primary);">${escapeHtml(live.categoryName || 'General')}</strong>
              </div>
            </div>
          </div>
          <div style="display:flex;gap:8px;">
            ${isLive ? `<button id="studio-view-live-btn" class="btn btn-outline btn-sm">${Icons.eye} Open Watch Room</button>` : ''}
            <button id="end-stream-btn" class="btn btn-danger btn-sm">${endBtnText}</button>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:16px;margin-bottom:20px;">
          <div class="stat-card">
            <div class="stat-label">Viewers</div>
            <div class="stat-value">${live.currentViewerCount || live.viewerCount || 0}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Duration</div>
            <div class="stat-value" id="live-stream-duration">${isLive ? (live.formattedUptime || live.duration || '0:00') : '00:00'}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Status</div>
            <div class="stat-value" style="font-size:16px;color:${isLive ? '#10b981' : '#f59e0b'};">
              ${isLive ? 'Active' : 'Pending OBS'}
            </div>
          </div>
        </div>

        <!-- Live Stream Metadata Editor (Real-Time Edit While Streaming) -->
        <div style="background:rgba(0,242,254,0.03);border:1px solid rgba(0,242,254,0.15);border-radius:12px;padding:18px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
            <h4 style="color:#fff;font-size:14px;margin:0;display:flex;align-items:center;gap:6px;">
              ${Icons.edit || '✏️'} Edit Stream Info (Broadcasts Real-Time)
            </h4>
            <span style="font-size:11px;color:var(--color-cyan-primary);">Updates live to watching viewers</span>
          </div>

          <form id="live-edit-meta-form" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group" style="grid-column:span 2;">
              <label style="font-size:11px;font-weight:600;color:var(--color-text-muted);">Stream Title</label>
              <input class="input-dark" id="live-meta-title" value="${escapeHtml(live.title || '')}" required style="margin-top:4px;" />
            </div>
            <div class="form-group">
              <label style="font-size:11px;font-weight:600;color:var(--color-text-muted);">Category</label>
              <select class="input-dark" id="live-meta-category" style="margin-top:4px;">
                <option value="">Select Category (Optional)</option>
                ${(cachedCategories || []).map(c => `
                  <option value="${c.id}" ${c.id === live.categoryId ? 'selected' : ''}>${escapeHtml(c.name)}</option>
                `).join('')}
              </select>
            </div>
            <div class="form-group">
              <label style="font-size:11px;font-weight:600;color:var(--color-text-muted);">Actions</label>
              <button type="submit" id="live-meta-save-btn" class="btn btn-cyan btn-sm" style="margin-top:4px;width:100%;height:40px;">
                Update Stream Info
              </button>
            </div>
            <div class="form-group" style="grid-column:span 2;">
              <label style="font-size:11px;font-weight:600;color:var(--color-text-muted);">Description</label>
              <textarea class="input-dark" id="live-meta-desc" rows="2" style="margin-top:4px;height:auto;padding:8px 12px;border-radius:10px;">${escapeHtml(live.description || '')}</textarea>
            </div>
          </form>
        </div>
      </div>
    `;

    // Real-time ticking stream duration interval
    if (studioLiveDurationTimer) {
      clearInterval(studioLiveDurationTimer);
      studioLiveDurationTimer = null;
    }
    if (isLive && (live.startedAt || live.createdAt)) {
      const parsedStart = parseUtcDate(live.startedAt || live.createdAt);
      const startMs = parsedStart ? parsedStart.getTime() : Date.now();
      const updateDuration = () => {
        const durationEl = document.getElementById('live-stream-duration');
        if (!durationEl) return;
        const elapsedSec = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
        const h = Math.floor(elapsedSec / 3600);
        const m = Math.floor((elapsedSec % 3600) / 60);
        const s = elapsedSec % 60;
        durationEl.textContent = h > 0
          ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
          : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      };
      updateDuration();
      studioLiveDurationTimer = setInterval(updateDuration, 1000);
    }

    document.getElementById('studio-view-live-btn')?.addEventListener('click', () => {
      store.navigate('watch', { streamId: live.id });
    });

    document.getElementById('live-edit-meta-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const saveBtn = document.getElementById('live-meta-save-btn');
      saveBtn.disabled = true;
      try {
        const title = document.getElementById('live-meta-title')?.value.trim();
        const desc = document.getElementById('live-meta-desc')?.value.trim();
        const catVal = document.getElementById('live-meta-category')?.value;
        const categoryId = catVal ? parseInt(catVal) : null;

        await dashboardApi.updateStreamMeta({ title, description: desc, categoryId });
        store.showToast('Stream information updated and broadcasted!', 'success');
        loadLiveManager();
      } catch (err) {
        store.showToast(err.message || 'Failed to update stream info', 'error');
      }
      saveBtn.disabled = false;
    });

    document.getElementById('end-stream-btn')?.addEventListener('click', async () => {
      const confirmMsg = isLive
        ? 'Are you sure you want to end your active live broadcast?'
        : 'Are you sure you want to cancel this pending stream session?';
      if (!confirm(confirmMsg)) return;

      if (studioLiveDurationTimer) {
        clearInterval(studioLiveDurationTimer);
        studioLiveDurationTimer = null;
      }

      const btn = document.getElementById('end-stream-btn');
      if (btn) btn.disabled = true;
      try {
        await dashboardApi.endStream();
        store.showToast(isLive ? 'Stream ended successfully.' : 'Pending session cancelled.', 'info');
        loadLiveManager();
      } catch (e) {
        store.showToast(e.message || 'Failed to end stream', 'error');
        if (btn) btn.disabled = false;
      }
    });
  } catch (e) {
    console.warn('[Studio] loadLiveManager error', e);
    section.innerHTML = '';
  }
}

// ──────────────────────────────────────────
// 3. CHANNEL SETUP TAB (With Image Cropper Integration)
// ──────────────────────────────────────────
function renderChannelSetup(ws) {
  const ch = channelData || {};

  if (!hasChannel) {
    ws.innerHTML = `
      <h2 style="font-family:var(--font-display);color:var(--color-cyan-neon);margin-bottom:24px;">Create Your Channel</h2>
      <div class="card" style="padding:28px;max-width:640px;border-radius:16px;">
        <p style="color:var(--color-text-muted);margin-bottom:20px;line-height:1.5;">
          Launch your streaming journey on Orbit! Creating a channel grants you the Streamer role and unlocks broadcasting with OBS.
        </p>
        <form id="ch-setup-form">
          <div class="form-group">
            <label style="color:var(--color-text-muted);font-weight:600;">Channel Name</label>
            <input class="input-dark" id="ch-name" placeholder="e.g. AstroStreamer" required style="margin-top:6px;" />
          </div>
          <div class="form-group" style="margin-top:16px;">
            <label style="color:var(--color-text-muted);font-weight:600;">Bio / Description</label>
            <textarea class="input-dark" id="ch-desc" rows="3" placeholder="Tell viewers what your content is about..." style="margin-top:6px;resize:vertical;padding:12px;height:auto;border-radius:12px;"></textarea>
          </div>
          <button type="submit" class="btn btn-cyan" id="ch-save-btn" style="margin-top:20px;width:100%;padding:12px;font-weight:700;">
            Create Channel &amp; Become Streamer
          </button>
        </form>
      </div>
    `;

    document.getElementById('ch-setup-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('ch-save-btn');
      btn.disabled = true;
      try {
        channelData = await channelApi.create({
          channelName: document.getElementById('ch-name').value.trim(),
          description: document.getElementById('ch-desc').value.trim()
        });
        hasChannel = true;
        store.showToast('Channel created! You are now a streamer.', 'success');
        renderWorkspace();
      } catch (err) {
        store.showToast(err.message || 'Failed to create channel', 'error');
        btn.disabled = false;
      }
    });
    return;
  }

  // Has Channel: Twitch/Kick-like Multi-Tab Channel Settings
  const chName = ch.name || ch.channelName || 'Your Channel';
  const socialList = Array.isArray(ch.socialLinks) ? ch.socialLinks : [];
  const getSocial = (plat) => socialList.find(s => s.platform && s.platform.toLowerCase() === plat.toLowerCase())?.url || '';

  ws.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
      <div>
        <h2 style="font-family:var(--font-display);color:var(--color-cyan-neon);margin:0 0 4px 0;">Channel Settings</h2>
        <p style="color:var(--color-text-muted);margin:0;font-size:14px;">Manage your public streamer brand, VOD archiving, tips, and social links.</p>
      </div>
      <button id="view-my-ch-btn" class="btn btn-outline btn-sm" style="gap:6px;border-radius:10px;">
        ${Icons.eye} View Channel
      </button>
    </div>

    <!-- Sub-tab Navigation (Twitch / Kick Style) -->
    <div class="tabs" id="ch-subtabs" style="margin-bottom:24px;border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:2px;">
      <button class="tab-btn ${channelSubTab === 'profile' ? 'active' : ''}" data-subtab="profile">
        ${Icons.user} Profile &amp; Branding
      </button>
      <button class="tab-btn ${channelSubTab === 'stream-vods' ? 'active' : ''}" data-subtab="stream-vods">
        ${Icons.video} Stream &amp; VODs
      </button>
      <button class="tab-btn ${channelSubTab === 'donations' ? 'active' : ''}" data-subtab="donations">
        💰 Donations &amp; Tips
      </button>
      <button class="tab-btn ${channelSubTab === 'socials' ? 'active' : ''}" data-subtab="socials">
        ${Icons.link} Social Links
      </button>
    </div>

    <!-- Sub-tab Content Area -->
    <div id="ch-subtab-content"></div>
  `;

  document.getElementById('view-my-ch-btn')?.addEventListener('click', () => {
    if (ch.id) store.navigate('channel', { channelId: ch.id });
  });

  // Attach sub-tab switch handlers
  document.querySelectorAll('#ch-subtabs .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      channelSubTab = btn.dataset.subtab;
      document.querySelectorAll('#ch-subtabs .tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderSubTabContent();
    });
  });

  renderSubTabContent();

  function renderSubTabContent() {
    const subWs = document.getElementById('ch-subtab-content');
    if (!subWs) return;

    if (channelSubTab === 'profile') {
      subWs.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:24px;max-width:800px;">
          <!-- Profile Info Form -->
          <div class="card" style="padding:24px;border-radius:16px;">
            <h4 style="margin:0 0 16px;color:#fff;font-size:16px;font-weight:700;">Profile Information</h4>
            <form id="profile-edit-form">
              <div class="form-group">
                <label style="color:var(--color-text-muted);font-size:13px;font-weight:600;">Channel Name</label>
                <input class="input-dark" value="${escapeHtml(chName)}" disabled style="opacity:0.75;cursor:not-allowed;margin-top:6px;" title="Channel name is permanent" />
              </div>
              <div class="form-group" style="margin-top:16px;">
                <label style="color:var(--color-text-muted);font-size:13px;font-weight:600;">Bio / About (Max 500 characters)</label>
                <textarea class="input-dark" id="profile-desc" rows="4" maxlength="500" placeholder="Tell viewers about yourself, schedule, and content..." style="margin-top:6px;resize:vertical;padding:12px;height:auto;border-radius:12px;">${escapeHtml(ch.description || '')}</textarea>
              </div>
              <button type="submit" class="btn btn-cyan btn-sm" id="profile-save-btn" style="margin-top:16px;padding:8px 20px;">
                Save Profile Changes
              </button>
            </form>
          </div>

          <!-- Channel Branding Images (With Image Cropper) -->
          <div class="card" style="padding:24px;border-radius:16px;">
            <h4 style="margin:0 0 16px;color:#fff;font-size:16px;font-weight:700;">Channel Branding &amp; Images</h4>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
              <!-- Avatar -->
              <div style="background:rgba(255,255,255,0.03);padding:16px;border-radius:12px;border:1px solid rgba(255,255,255,0.06);display:flex;flex-direction:column;align-items:center;text-align:center;">
                <div style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#00AEBD,#00DDEE);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:24px;color:#000;overflow:hidden;margin-bottom:12px;">
                  ${ch.profilePhotoUrl ? `<img src="${ch.profilePhotoUrl}" style="width:100%;height:100%;object-fit:cover;" />` : escapeHtml(chName)[0].toUpperCase()}
                </div>
                <div style="font-size:13px;font-weight:600;color:#fff;">Profile Picture (1:1)</div>
                <div style="font-size:11px;color:var(--color-text-muted);margin:4px 0 12px;">Interactive Cropper &bull; Max 10MB</div>
                <label class="btn btn-outline btn-sm" style="cursor:pointer;width:100%;justify-content:center;">
                  ${Icons.image} Crop &amp; Upload Photo
                  <input type="file" id="ch-photo-upload" accept="image/*" style="display:none;" />
                </label>
              </div>

              <!-- Cover Banner -->
              <div style="background:rgba(255,255,255,0.03);padding:16px;border-radius:12px;border:1px solid rgba(255,255,255,0.06);display:flex;flex-direction:column;align-items:center;text-align:center;">
                <div style="width:100%;height:72px;border-radius:8px;background:${ch.coverPhotoUrl ? `url(${ch.coverPhotoUrl}) center/cover` : 'linear-gradient(135deg,#0f1424,#1a2035)'};display:flex;align-items:center;justify-content:center;margin-bottom:12px;border:1px solid rgba(255,255,255,0.1);">
                  ${!ch.coverPhotoUrl ? '<span style="font-size:12px;color:var(--color-text-muted);">No Cover Set</span>' : ''}
                </div>
                <div style="font-size:13px;font-weight:600;color:#fff;">Channel Banner (4:1)</div>
                <div style="font-size:11px;color:var(--color-text-muted);margin:4px 0 12px;">Interactive Cropper &bull; 1200x300</div>
                <label class="btn btn-outline btn-sm" style="cursor:pointer;width:100%;justify-content:center;">
                  ${Icons.image} Crop &amp; Upload Banner
                  <input type="file" id="ch-cover-upload" accept="image/*" style="display:none;" />
                </label>
              </div>
            </div>
          </div>
        </div>
      `;

      // Profile Handlers
      document.getElementById('profile-edit-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('profile-save-btn');
        btn.disabled = true;
        try {
          const updated = await channelApi.updateProfile({
            description: document.getElementById('profile-desc').value.trim()
          });
          channelData = { ...channelData, ...updated };
          store.showToast('Profile updated successfully!', 'success');
        } catch (err) {
          store.showToast(err.message || 'Failed to update profile', 'error');
        }
        btn.disabled = false;
      });

      // Photo upload with Image Cropper Modal
      document.getElementById('ch-photo-upload')?.addEventListener('change', async (e) => {
        if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          openImageCropperModal(file, {
            aspectRatio: 1,
            title: 'Crop Channel Avatar (1:1)'
          }, async (croppedFile) => {
            try {
              store.showToast('Uploading photo...', 'info');
              const updated = await channelApi.uploadPhoto(croppedFile);
              channelData = { ...channelData, ...updated };
              store.showToast('Profile photo updated!', 'success');
              renderSubTabContent();
            } catch (er) {
              store.showToast(er.message || 'Failed to upload photo', 'error');
            }
          });
          e.target.value = '';
        }
      });

      // Cover upload with Image Cropper Modal
      document.getElementById('ch-cover-upload')?.addEventListener('change', async (e) => {
        if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          openImageCropperModal(file, {
            aspectRatio: 4 / 1,
            title: 'Crop Channel Banner (4:1)'
          }, async (croppedFile) => {
            try {
              store.showToast('Uploading banner...', 'info');
              const updated = await channelApi.uploadCover(croppedFile);
              channelData = { ...channelData, ...updated };
              store.showToast('Channel banner updated!', 'success');
              renderSubTabContent();
            } catch (er) {
              store.showToast(er.message || 'Failed to upload banner', 'error');
            }
          });
          e.target.value = '';
        }
      });

    } else if (channelSubTab === 'stream-vods') {
      subWs.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:20px;max-width:800px;">
          <!-- Save Streams / VOD Archiving Card -->
          <div class="card" style="padding:24px;border-radius:16px;">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;">
              <div>
                <h4 style="margin:0 0 6px;color:#fff;font-size:16px;font-weight:700;">Store Past Broadcasts (VODs)</h4>
                <p style="margin:0;font-size:13px;color:var(--color-text-muted);line-height:1.5;">
                  Automatically save your live stream broadcasts as Video On Demand (VOD) archives. Viewers can rewatch full past streams and generate highlight clips anytime.
                </p>
              </div>
              <label class="toggle-switch" style="position:relative;display:inline-block;width:48px;height:26px;flex-shrink:0;">
                <input type="checkbox" id="save-vods-toggle" ${ch.saveStreams ? 'checked' : ''} style="opacity:0;width:0;height:0;">
                <span class="toggle-slider" style="position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background-color:rgba(255,255,255,0.15);transition:0.3s;border-radius:26px;"></span>
              </label>
            </div>
            <div id="vod-toggle-status" style="margin-top:12px;font-size:12px;font-weight:600;color:${ch.saveStreams ? 'var(--color-cyan-neon)' : 'var(--color-text-muted)'};">
              ${ch.saveStreams ? '&#10003; Automatic VOD archiving is currently ENABLED.' : '&#10007; Automatic VOD archiving is currently DISABLED.'}
            </div>
          </div>
        </div>
      `;

      document.getElementById('save-vods-toggle')?.addEventListener('change', async (e) => {
        const val = e.target.checked;
        const statusEl = document.getElementById('vod-toggle-status');
        try {
          const res = await channelApi.toggleSaveStreams(val);
          channelData.saveStreams = res.saveStreams;
          if (statusEl) {
            statusEl.innerHTML = val
              ? '&#10003; Automatic VOD archiving is currently ENABLED.'
              : '&#10007; Automatic VOD archiving is currently DISABLED.';
            statusEl.style.color = val ? 'var(--color-cyan-neon)' : 'var(--color-text-muted)';
          }
          store.showToast(`VOD archiving ${val ? 'enabled' : 'disabled'}!`, 'success');
        } catch (err) {
          e.target.checked = !val;
          store.showToast(err.message || 'Failed to update VOD settings', 'error');
        }
      });

    } else if (channelSubTab === 'donations') {
      subWs.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:20px;max-width:800px;">
          <div class="card" style="padding:24px;border-radius:16px;">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
              <span style="font-size:20px;">💰</span>
              <h4 style="margin:0;color:#fff;font-size:16px;font-weight:700;">Streamer Donations &amp; Tip Jar</h4>
            </div>
            <p style="font-size:13px;color:var(--color-text-muted);margin:0 0 20px;line-height:1.5;">
              Let your community support you! Configure an external donation link (PayPal, Ko-fi, BuyMeACoffee, Streamlabs) that will be featured prominently on your channel page.
            </p>
            <form id="donation-form">
              <div class="form-group">
                <label style="color:var(--color-text-muted);font-size:13px;font-weight:600;">Donation / Tip Page URL</label>
                <input class="input-dark" id="don-url" type="url" value="${escapeHtml(ch.donationUrl || '')}" placeholder="https://ko-fi.com/yourname or https://streamlabs.com/yourname/tip" style="margin-top:6px;" />
              </div>
              <div class="form-group" style="margin-top:16px;">
                <label style="color:var(--color-text-muted);font-size:13px;font-weight:600;">Custom Tip Message / Callout (Max 200 chars)</label>
                <input class="input-dark" id="don-msg" maxlength="200" value="${escapeHtml(ch.donationMessage || '')}" placeholder="Support the broadcast! Tips go towards new stream equipment." style="margin-top:6px;" />
              </div>
              <button type="submit" class="btn btn-cyan btn-sm" id="don-save-btn" style="margin-top:20px;padding:8px 22px;">
                Save Donation Settings
              </button>
            </form>
          </div>
        </div>
      `;

      document.getElementById('donation-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('don-save-btn');
        btn.disabled = true;
        try {
          const updated = await channelApi.updateProfile({
            donationUrl: document.getElementById('don-url')?.value.trim() || null,
            donationMessage: document.getElementById('don-msg')?.value.trim() || null,
          });
          channelData = { ...channelData, ...updated };
          store.showToast('Donation settings saved!', 'success');
        } catch (er) {
          store.showToast(er.message || 'Failed to save donation settings', 'error');
        }
        btn.disabled = false;
      });

    } else if (channelSubTab === 'socials') {
      subWs.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:20px;max-width:800px;">
          <div class="card" style="padding:24px;border-radius:16px;">
            <h4 style="margin:0 0 8px;color:#fff;font-size:16px;font-weight:700;">Social Media Links</h4>
            <p style="font-size:13px;color:var(--color-text-muted);margin:0 0 20px;">
              Connect your social media presence. These links will appear in your public channel About section.
            </p>
            <form id="social-form">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
                <div class="form-group">
                  <label style="color:var(--color-text-muted);font-size:12px;font-weight:600;">YouTube</label>
                  <input class="input-dark" id="sl-youtube" value="${escapeHtml(getSocial('youtube'))}" placeholder="https://youtube.com/@channel" style="margin-top:4px;" />
                </div>
                <div class="form-group">
                  <label style="color:var(--color-text-muted);font-size:12px;font-weight:600;">Twitter / X</label>
                  <input class="input-dark" id="sl-twitter" value="${escapeHtml(getSocial('twitter'))}" placeholder="https://x.com/username" style="margin-top:4px;" />
                </div>
                <div class="form-group">
                  <label style="color:var(--color-text-muted);font-size:12px;font-weight:600;">Discord</label>
                  <input class="input-dark" id="sl-discord" value="${escapeHtml(getSocial('discord'))}" placeholder="https://discord.gg/invite" style="margin-top:4px;" />
                </div>
                <div class="form-group">
                  <label style="color:var(--color-text-muted);font-size:12px;font-weight:600;">Instagram</label>
                  <input class="input-dark" id="sl-instagram" value="${escapeHtml(getSocial('instagram'))}" placeholder="https://instagram.com/profile" style="margin-top:4px;" />
                </div>
                <div class="form-group">
                  <label style="color:var(--color-text-muted);font-size:12px;font-weight:600;">TikTok</label>
                  <input class="input-dark" id="sl-tiktok" value="${escapeHtml(getSocial('tiktok'))}" placeholder="https://tiktok.com/@profile" style="margin-top:4px;" />
                </div>
                <div class="form-group">
                  <label style="color:var(--color-text-muted);font-size:12px;font-weight:600;">Twitch / Kick</label>
                  <input class="input-dark" id="sl-twitch" value="${escapeHtml(getSocial('twitch'))}" placeholder="https://twitch.tv/channel" style="margin-top:4px;" />
                </div>
              </div>
              <button type="submit" class="btn btn-cyan btn-sm" id="sl-save-btn" style="margin-top:20px;padding:8px 22px;">
                ${Icons.link} Save Social Links
              </button>
            </form>
          </div>
        </div>
      `;

      document.getElementById('social-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('sl-save-btn');
        btn.disabled = true;

        const platforms = [
          { platform: 'youtube', url: document.getElementById('sl-youtube')?.value.trim() },
          { platform: 'twitter', url: document.getElementById('sl-twitter')?.value.trim() },
          { platform: 'discord', url: document.getElementById('sl-discord')?.value.trim() },
          { platform: 'instagram', url: document.getElementById('sl-instagram')?.value.trim() },
          { platform: 'tiktok', url: document.getElementById('sl-tiktok')?.value.trim() },
          { platform: 'twitch', url: document.getElementById('sl-twitch')?.value.trim() },
        ];

        const validLinks = platforms.filter(p => p.url && p.url.length > 0);

        try {
          const res = await channelApi.updateSocialLinks({ socialLinks: validLinks });
          channelData.socialLinks = res;
          store.showToast('Social links saved!', 'success');
        } catch (er) {
          store.showToast(er.message || 'Failed to save social links', 'error');
        }
        btn.disabled = false;
      });
    }
  }
}

// ──────────────────────────────────────────
// 4. ANALYTICS TAB (Numerical KPI Values + Dual Charts + History Table)
// ──────────────────────────────────────────
async function renderAnalytics(ws) {
  ws.innerHTML = '<div class="spinner"></div>';
  try {
    const [summaryRes, pastStreamsRes] = await Promise.allSettled([
      dashboardApi.getSummary(),
      dashboardApi.getPastStreams(1, 10)
    ]);

    const summary = summaryRes.status === 'fulfilled' ? summaryRes.value : {};
    const stats = summary.lifetimeStats || {};
    const pastStreams = pastStreamsRes.status === 'fulfilled' && Array.isArray(pastStreamsRes.value)
      ? pastStreamsRes.value
      : [];

    // Calculate real data metrics from broadcast history with saved VODs
    const validVodStreams = pastStreams.filter(s => s.isSaved || (s.durationSeconds > 0 && s.durationSeconds < 86400 && s.vodUrl));
    const totalVodSeconds = validVodStreams.length > 0
      ? validVodStreams.reduce((acc, s) => acc + (s.durationSeconds || 0), 0)
      : (summary.lifetimeStats?.totalBroadcastSeconds && summary.lifetimeStats.totalBroadcastSeconds < 86400 * 5
        ? summary.lifetimeStats.totalBroadcastSeconds
        : 0);

    const effectiveBroadcastHours = totalVodSeconds > 0
      ? `${(totalVodSeconds / 3600).toFixed(1)} hrs`
      : '0.0 hrs';

    const pastPeaks = pastStreams.map(s => s.peakViewers || 0).filter(p => p > 0);
    const effectiveAllTimePeak = Math.max(stats.allTimePeakViewers || 0, ...pastPeaks, 0);
    const effectiveAvgPeak = stats.averagePeakViewers && stats.averagePeakViewers > 0
      ? stats.averagePeakViewers.toFixed(1)
      : (pastPeaks.length > 0
        ? (pastPeaks.reduce((a, b) => a + b, 0) / pastPeaks.length).toFixed(1)
        : (effectiveAllTimePeak > 0 ? effectiveAllTimePeak.toFixed(1) : '0.0'));

    ws.innerHTML = `
      <div style="margin-bottom:24px;">
        <h2 style="font-family:var(--font-display);color:var(--color-cyan-neon);margin:0 0 4px 0;">${Icons.chart || '📊'} Analytics &amp; Insights</h2>
        <p style="color:var(--color-text-muted);font-size:14px;margin:0;">Channel performance metrics, numerical viewer records, watch time, and broadcast breakdown.</p>
      </div>

      <!-- Numerical KPI Metric Cards -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:16px;margin-bottom:28px;">
        <div class="stat-card animate-fade-up">
          <div class="stat-label">All-Time Peak Viewers</div>
          <div class="stat-value" style="color:var(--color-live-red);">${effectiveAllTimePeak}</div>
          <div style="font-size:11px;color:var(--color-text-muted);margin-top:4px;">Highest concurrent viewers</div>
        </div>
        <div class="stat-card animate-fade-up" style="animation-delay:0.05s;">
          <div class="stat-label">Average Peak Viewers</div>
          <div class="stat-value" style="color:var(--color-cyan-primary);">${effectiveAvgPeak}</div>
          <div style="font-size:11px;color:var(--color-text-muted);margin-top:4px;">Average peak across all streams</div>
        </div>
        <div class="stat-card animate-fade-up" style="animation-delay:0.1s;">
          <div class="stat-label">Total Broadcast Time</div>
          <div class="stat-value" style="color:#fff;">${effectiveBroadcastHours}</div>
          <div style="font-size:11px;color:var(--color-text-muted);margin-top:4px;">Avg duration: ${stats.averageStreamDurationFormatted || '0m'}</div>
        </div>
        <div class="stat-card animate-fade-up" style="animation-delay:0.15s;">
          <div class="stat-label">Total Stream Sessions</div>
          <div class="stat-value" style="color:#fff;">${Math.max(stats.totalStreams || 0, pastStreams.length)}</div>
          <div style="font-size:11px;color:var(--color-text-muted);margin-top:4px;">Completed broadcast sessions</div>
        </div>
        <div class="stat-card animate-fade-up" style="animation-delay:0.2s;">
          <div class="stat-label">Total Chat Messages</div>
          <div class="stat-value" style="color:var(--color-cyan-neon);">${stats.totalChatMessages || 0}</div>
          <div style="font-size:11px;color:var(--color-text-muted);margin-top:4px;">${stats.uniqueChattersCount || 0} unique chatters</div>
        </div>
        <div class="stat-card animate-fade-up" style="animation-delay:0.25s;">
          <div class="stat-label">VOD &amp; Clip Views</div>
          <div class="stat-value" style="color:#10b981;">${(stats.totalVodViews || 0) + (stats.totalClipViews || 0)}</div>
          <div style="font-size:11px;color:var(--color-text-muted);margin-top:4px;">${stats.totalVodViews || 0} VOD &bull; ${stats.totalClipViews || 0} Clip</div>
        </div>
      </div>

      <!-- Activity & Engagement Charts -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(360px, 1fr));gap:20px;margin-bottom:28px;">
        <div class="chart-container">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <h4 style="margin:0;font-size:14px;color:#fff;">Viewer Activity (Recent Streams)</h4>
            <span style="font-size:11px;color:var(--color-cyan-primary);">Peak: ${effectiveAllTimePeak} viewers</span>
          </div>
          <div class="mini-chart" style="height:140px;gap:8px;padding:20px 0;align-items:flex-end;">
            ${generateStreamDataBars(pastStreams, 'peakViewers', 12)}
          </div>
        </div>
        <div class="chart-container">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <h4 style="margin:0;font-size:14px;color:#fff;">Chat Engagement Activity</h4>
            <span style="font-size:11px;color:var(--color-cyan-primary);">${stats.totalChatMessages || 0} total messages</span>
          </div>
          <div class="mini-chart" style="height:140px;gap:8px;padding:20px 0;align-items:flex-end;">
            ${generateStreamDataBars(pastStreams, 'chatMessageCount', 12)}
          </div>
        </div>
      </div>

      <!-- Numerical Past Broadcasts Table -->
      <div class="card" style="padding:24px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px;">
          <h4 style="margin:0;font-size:15px;font-weight:700;color:#fff;">Recent Broadcast Performance</h4>
          <span style="font-size:12px;color:var(--color-text-muted);">Showing recent ${pastStreams.length} sessions</span>
        </div>
        <div style="overflow-x:auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Stream Title</th>
                <th>Category</th>
                <th>Date</th>
                <th>Duration</th>
                <th>Peak Viewers</th>
                <th>Chat Messages</th>
                <th>Clips Created</th>
                <th>VOD Archive</th>
              </tr>
            </thead>
            <tbody>
              ${(pastStreams || []).map(s => `
                <tr>
                  <td style="font-weight:600;color:#fff;">${escapeHtml(s.title || 'Untitled Stream')}</td>
                  <td><span class="badge-category">${escapeHtml(s.categoryName || 'General')}</span></td>
                  <td style="color:var(--color-text-muted);font-size:12px;">${s.startedAt ? new Date(s.startedAt).toLocaleDateString() : 'N/A'}</td>
                  <td style="font-weight:600;color:var(--color-cyan-primary);">${s.formattedDuration || '0m'}</td>
                  <td style="font-weight:700;color:var(--color-live-red);">${s.peakViewers || 0}</td>
                  <td style="color:var(--color-text);">${s.chatMessageCount || 0}</td>
                  <td style="color:var(--color-text);">${s.clipsCount || 0}</td>
                  <td>${s.vodUrl ? `<span style="color:#10b981;font-size:12px;font-weight:600;">✓ Saved</span>` : `<span style="color:var(--color-text-muted);font-size:12px;">Not Saved</span>`}</td>
                </tr>
              `).join('')}
              ${!pastStreams?.length ? '<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--color-text-muted);">No broadcasts recorded yet. Start streaming to populate performance analytics!</td></tr>' : ''}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (e) {
    ws.innerHTML = '<div class="empty-state"><h3>Failed to load analytics</h3></div>';
  }
}

// ──────────────────────────────────────────
// 5. BROADCAST ARCHIVE TAB (VODs)
// ──────────────────────────────────────────
async function renderVods(ws) {
  ws.innerHTML = '<div class="spinner"></div>';
  try {
    const pastStreams = await dashboardApi.getPastStreams(1, 20);
    const streams = Array.isArray(pastStreams) ? pastStreams : pastStreams?.items || [];
    if (!streams.length) {
      ws.innerHTML = '<div class="empty-state"><div class="empty-icon">&#128249;</div><h3>No Past Streams</h3><p>Your broadcast archive is empty.</p></div>';
      return;
    }
    ws.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;flex-wrap:wrap;gap:12px;">
        <div>
          <h2 style="font-family:var(--font-display);color:var(--color-cyan-neon);margin:0 0 4px 0;">${Icons.archive || '📼'} Broadcast Archive</h2>
          <p style="color:var(--color-text-muted);font-size:14px;margin:0;">Stored Video-On-Demand (VOD) replays recorded from your live streams.</p>
        </div>
      </div>
      <table class="data-table">
        <thead><tr><th>Title</th><th>Date</th><th>Duration</th><th>Peak Viewers</th><th>Actions</th></tr></thead>
        <tbody>${streams.map(s => `
          <tr>
            <td style="font-weight:600;color:#fff;">${escapeHtml(s.title || 'Untitled Stream')}</td>
            <td style="color:var(--color-text-muted);">${s.startedAt ? new Date(s.startedAt).toLocaleDateString() : '-'}</td>
            <td style="color:var(--color-cyan-primary);font-weight:600;">${s.formattedDuration || s.duration || '-'}</td>
            <td>${s.peakViewers || 0}</td>
            <td style="white-space:nowrap;">
              <button class="btn btn-outline btn-sm" data-play-vod="${s.id || s.vodId}" style="margin-right:8px;padding:4px 10px;">
                ${Icons.play} Watch
              </button>
              ${s.vodId || s.id ? `<button class="btn btn-ghost btn-sm" data-del-vod="${s.vodId || s.id}" title="Delete VOD" style="color:#ef4444;">${Icons.trash}</button>` : ''}
            </td>
          </tr>
        `).join('')}</tbody>
      </table>
    `;

    ws.querySelectorAll('[data-play-vod]').forEach(btn => {
      btn.addEventListener('click', () => {
        const vid = parseInt(btn.dataset.playVod);
        const target = streams.find(x => (x.id === vid || x.vodId === vid));
        if (target) {
          openVodPlayerModal(target);
        }
      });
    });

    ws.querySelectorAll('[data-del-vod]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Permanently delete this VOD from your channel archive?')) return;
        try {
          await dashboardApi.deleteVod(parseInt(btn.dataset.delVod));
          store.showToast('VOD deleted', 'info');
          renderVods(ws);
        } catch (e) {
          store.showToast(e.message, 'error');
        }
      });
    });
  } catch (e) {
    ws.innerHTML = '<div class="empty-state"><h3>Failed to load archives</h3></div>';
  }
}

// ──────────────────────────────────────────
// 6. MODERATION TAB
// ──────────────────────────────────────────
async function renderModeration(ws) {
  ws.innerHTML = `
    <h2 style="font-family:var(--font-display);color:var(--color-cyan-neon);margin-bottom:24px;">${Icons.shield} Moderation &amp; Team</h2>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px;">
      <div class="card" style="padding:24px;">
        <h4 style="color:var(--color-text-muted);font-size:14px;margin-bottom:16px;">Hire Moderator</h4>
        <div style="display:flex;gap:8px;">
          <input class="input-dark" id="mod-username" placeholder="Enter username" style="flex:1;" />
          <button id="hire-mod-btn" class="btn btn-cyan btn-sm">Hire</button>
        </div>
      </div>
      <div class="card" style="padding:24px;" id="mod-summary-card">
        <h4 style="color:var(--color-text-muted);font-size:14px;margin-bottom:12px;">Moderation Overview</h4>
        <div class="spinner" style="margin:0;width:24px;height:24px;"></div>
      </div>
    </div>
    <div class="card" style="padding:24px;">
      <h4 style="color:var(--color-text-muted);font-size:14px;margin-bottom:16px;">Current Moderators</h4>
      <div id="mod-list"><div class="spinner" style="margin:0;width:24px;height:24px;"></div></div>
    </div>
  `;

  document.getElementById('hire-mod-btn')?.addEventListener('click', async () => {
    const username = document.getElementById('mod-username').value.trim();
    if (!username) return;
    try {
      await channelApi.hireModerator(username);
      store.showToast(`${username} is now a moderator!`, 'success');
      loadMods();
      document.getElementById('mod-username').value = '';
    } catch (e) {
      store.showToast(e.message, 'error');
    }
  });

  loadMods();
  loadModSummary();
}

async function loadMods() {
  const list = document.getElementById('mod-list');
  if (!list) return;
  try {
    const mods = await channelApi.getModerators();
    if (!mods?.length) {
      list.innerHTML = '<p class="text-muted" style="margin:0;">No moderators assigned yet.</p>';
      return;
    }
    list.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${mods.map(m => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:rgba(255,255,255,0.03);border-radius:8px;">
            <div style="display:flex;align-items:center;gap:10px;">
              <span class="badge-role mod">MOD</span>
              <span style="font-weight:600;color:#fff;">@${escapeHtml(m.username || m.userName)}</span>
            </div>
            <button class="btn btn-ghost btn-sm btn-unhire" data-user="${escapeHtml(m.username || m.userName)}" style="color:var(--color-error);">Remove</button>
          </div>
        `).join('')}
      </div>
    `;

    list.querySelectorAll('.btn-unhire').forEach(b => {
      b.addEventListener('click', async () => {
        const u = b.dataset.user;
        if (!confirm(`Remove moderator privileges from @${u}?`)) return;
        try {
          await channelApi.removeModerator(u);
          store.showToast(`Removed @${u} from moderators`, 'info');
          loadMods();
        } catch (e) {
          store.showToast(e.message, 'error');
        }
      });
    });
  } catch (e) {
    list.innerHTML = '<p class="text-muted">Failed to load moderators.</p>';
  }
}

async function loadModSummary() {
  const card = document.getElementById('mod-summary-card');
  if (!card) return;
  try {
    const data = await dashboardApi.getModeration();
    card.innerHTML = `
      <h4 style="color:var(--color-text-muted);font-size:14px;margin-bottom:12px;">Moderation Overview</h4>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
        <div><div style="font-size:24px;font-weight:700;color:var(--color-cyan-neon);">${data.totalModerators || data.moderatorCount || 0}</div><div style="font-size:11px;color:var(--color-text-muted);">Moderators</div></div>
        <div><div style="font-size:24px;font-weight:700;color:var(--color-error);">${data.activeBansCount || data.activeBanCount || 0}</div><div style="font-size:11px;color:var(--color-text-muted);">Active Bans</div></div>
        <div><div style="font-size:24px;font-weight:700;color:var(--color-warning);">${data.activeTimeoutsCount || data.activeTimeoutCount || 0}</div><div style="font-size:11px;color:var(--color-text-muted);">Timeouts</div></div>
      </div>
    `;
  } catch (e) {
    card.innerHTML = '<h4 style="color:var(--color-text-muted);">Moderation Overview</h4><p class="text-muted">Unavailable</p>';
  }
}

// ──────────────────────────────────────────
// 7. EMOTES & BADGES STUDIO (Interactive Custom Emotes)
// ──────────────────────────────────────────
async function renderEmotes(ws) {
  ws.innerHTML = '<div class="spinner"></div>';
  try {
    const [emojisRes, badgesRes] = await Promise.allSettled([
      dashboardApi.getEmojis(),
      dashboardApi.getBadges()
    ]);

    const channelId = channelData?.id || 'me';
    const localStored = localStorage.getItem(`orbit_channel_emotes_${channelId}`);
    let parsedLocal = null;
    if (localStored) {
      try { parsedLocal = JSON.parse(localStored); } catch (_) {}
    }

    let customEmojis = (emojisRes.status === 'fulfilled' && Array.isArray(emojisRes.value) && emojisRes.value.length > 0)
      ? emojisRes.value
      : (Array.isArray(parsedLocal) && parsedLocal.length > 0 ? parsedLocal : []);

    const badges = badgesRes.status === 'fulfilled' ? badgesRes.value : null;
    let isDirty = false;
    let activeSubTab = 'presets'; // 'presets' | 'upload'
    let selectedImageDataUrl = '';

    function renderStudioUI() {
      const usedCount = customEmojis.length;
      const pct = Math.min(100, Math.round((usedCount / 50) * 100));

      ws.innerHTML = `
        <!-- Studio Header & Save Action -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;flex-wrap:wrap;gap:16px;">
          <div>
            <div style="display:flex;align-items:center;gap:10px;">
              <h2 style="font-family:var(--font-display);color:var(--color-cyan-neon);margin:0;display:flex;align-items:center;gap:10px;font-size:24px;">
                <span style="width:28px;height:28px;display:inline-flex;">${getEmoteSvg('orbitStar')}</span>
                Custom Emotes &amp; Badges Studio
              </h2>
              <span id="emotes-dirty-badge" style="display:${isDirty ? 'inline-flex' : 'none'};background:rgba(245,158,11,0.15);border:1px solid #f59e0b;color:#f59e0b;font-size:11px;font-weight:700;padding:3px 10px;border-radius:12px;align-items:center;gap:4px;">
                ● Unsaved Changes
              </span>
            </div>
            <p style="color:var(--color-text-muted);font-size:14px;margin:6px 0 0 0;">
              Add unique emotes exclusively for your channel viewers. Only emotes configured here will appear in your live stream chat.
            </p>
          </div>

          <div style="display:flex;align-items:center;gap:12px;">
            <button id="save-emojis-server-btn" class="btn btn-cyan btn-sm" style="padding:10px 22px;font-weight:700;font-size:13px;display:inline-flex;align-items:center;gap:8px;box-shadow:0 0 16px rgba(0,242,254,0.3);transition:all 0.2s;">
              ${Icons.check || '✓'} Save All Emotes (<span id="btn-emotes-count">${usedCount}</span>/50)
            </button>
          </div>
        </div>

        <!-- Slots Usage Progress Bar -->
        <div class="card" style="padding:16px 20px;margin-bottom:24px;background:linear-gradient(135deg,rgba(15,20,36,0.9),rgba(7,10,20,0.9));border:1px solid rgba(0,242,254,0.15);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <div style="display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700;color:var(--color-text-primary);">
              <span>⚡ Channel Emote Capacity:</span>
              <span style="color:var(--color-cyan-neon);"><span id="header-emotes-count">${usedCount}</span> of 50 Emotes Assigned</span>
            </div>
            <span style="font-size:12px;color:var(--color-text-muted);">${50 - usedCount} slots available</span>
          </div>
          <div style="width:100%;height:8px;background:rgba(255,255,255,0.06);border-radius:10px;overflow:hidden;position:relative;">
            <div id="emotes-progress-bar" style="width:${pct}%;height:100%;background:linear-gradient(90deg,var(--color-cyan-primary),var(--color-cyan-neon));border-radius:10px;box-shadow:0 0 10px rgba(0,242,254,0.5);transition:width 0.3s ease;"></div>
          </div>
        </div>

        <!-- Emote Creation Studio -->
        <div class="card" style="padding:24px;margin-bottom:24px;border:1px solid rgba(0,242,254,0.25);position:relative;overflow:hidden;background:linear-gradient(180deg,rgba(15,20,36,0.95) 0%,rgba(9,12,24,0.98) 100%);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px;border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:14px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:16px;font-weight:700;color:#fff;">Create &amp; Add Channel Emotes</span>
            </div>
            <div class="tabs" style="margin:0;border:none;gap:8px;">
              <button type="button" id="subtab-btn-presets" class="tab-btn ${activeSubTab === 'presets' ? 'active' : ''}" style="padding:6px 14px;font-size:12px;font-weight:700;border-radius:8px;">
                ✨ Cosmic Presets
              </button>
              <button type="button" id="subtab-btn-upload" class="tab-btn ${activeSubTab === 'upload' ? 'active' : ''}" style="padding:6px 14px;font-size:12px;font-weight:700;border-radius:8px;">
                🖼️ Custom Image Upload
              </button>
            </div>
          </div>

          <!-- SUBTAB 1: Cosmic Presets -->
          <div id="subtab-content-presets" style="display:${activeSubTab === 'presets' ? 'block' : 'none'};">
            <p style="font-size:13px;color:var(--color-text-muted);margin:0 0 16px 0;">
              Add official Orbit cosmic emotes to your channel chat with one click. Viewers can type their shortcode or select them from the chat picker.
            </p>
            <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(130px, 1fr));gap:12px;" id="presets-grid">
              ${getAllPresets().map(p => {
                const isAlreadyAdded = customEmojis.some(e => e.name.toLowerCase() === p.name.toLowerCase());
                return `
                  <div class="preset-card" style="display:flex;flex-direction:column;align-items:center;padding:14px 10px;background:rgba(255,255,255,0.03);border:1px solid ${isAlreadyAdded ? 'rgba(0,242,254,0.4)' : 'rgba(255,255,255,0.08)'};border-radius:10px;text-align:center;gap:8px;position:relative;transition:all 0.2s ease;">
                    <div style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;">
                      ${p.svg}
                    </div>
                    <div style="font-size:11px;font-weight:700;color:#fff;">:${p.name}:</div>
                    <div style="font-size:10px;color:var(--color-text-muted);">${p.label}</div>
                    <button class="btn btn-sm add-preset-quick-btn ${isAlreadyAdded ? 'btn-ghost' : 'btn-cyan'}" data-name="${p.name}" data-val="orbit:${p.name}" style="width:100%;font-size:11px;padding:4px 8px;margin-top:2px;" ${isAlreadyAdded ? 'disabled' : ''}>
                      ${isAlreadyAdded ? '✓ Added' : '+ Add'}
                    </button>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- SUBTAB 2: Custom Image Upload -->
          <div id="subtab-content-upload" style="display:${activeSubTab === 'upload' ? 'block' : 'none'};">
            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:20px;align-items:start;">
              <div>
                <div class="form-group" style="margin-bottom:14px;">
                  <label style="font-size:12px;font-weight:700;color:var(--color-text-muted);margin-bottom:6px;display:block;">
                    1. Shortcode (e.g. <code style="color:var(--color-cyan-neon);">galaxy</code>)
                  </label>
                  <div style="display:flex;align-items:center;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.15);border-radius:8px;overflow:hidden;padding:0 10px;">
                    <span style="font-family:var(--font-mono);color:var(--color-cyan-neon);font-weight:700;font-size:15px;">:</span>
                    <input class="input-dark" id="custom-emote-shortcode" placeholder="hype" style="border:none;background:transparent;box-shadow:none;flex:1;padding:10px 6px;font-weight:600;" maxlength="32" />
                    <span style="font-family:var(--font-mono);color:var(--color-cyan-neon);font-weight:700;font-size:15px;">:</span>
                  </div>
                  <small style="color:var(--color-text-muted);font-size:11px;display:block;margin-top:4px;">
                    Only alphanumeric characters and underscores (2-32 chars).
                  </small>
                </div>

                <div class="form-group" style="margin-bottom:16px;">
                  <label style="font-size:12px;font-weight:700;color:var(--color-text-muted);margin-bottom:6px;display:block;">
                    2. Select &amp; Crop Square Image
                  </label>
                  <div id="drop-zone" style="border:2px dashed rgba(0,242,254,0.3);border-radius:10px;padding:24px 16px;text-align:center;background:rgba(0,242,254,0.02);cursor:pointer;transition:all 0.2s;">
                    <div style="font-size:28px;margin-bottom:6px;">🖼️</div>
                    <div style="font-size:13px;font-weight:600;color:#fff;" id="drop-zone-text">
                      ${selectedImageDataUrl ? 'Image Selected (Click to change)' : 'Click to Browse or Drag Image'}
                    </div>
                    <div style="font-size:11px;color:var(--color-text-muted);margin-top:4px;">
                      Square 1:1 auto-crop &bull; PNG, JPG, WebP, SVG supported
                    </div>
                    <input type="file" id="custom-emote-file-inp" accept="image/*" style="display:none;" />
                  </div>
                </div>

                <button id="commit-custom-emote-btn" class="btn btn-cyan btn-sm btn-full" style="height:42px;font-weight:700;font-size:13px;">
                  + Add to Channel Emotes
                </button>
              </div>

              <!-- Live Interactive Chat Preview Bubble -->
              <div style="background:rgba(4,7,18,0.7);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:18px;">
                <div style="font-size:12px;font-weight:700;color:var(--color-cyan-neon);margin-bottom:12px;display:flex;align-items:center;gap:6px;">
                  <span>💬</span> Live Chat Bubble Simulation
                </div>
                <div style="background:rgba(15,20,36,0.8);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:12px;display:flex;align-items:flex-start;gap:10px;">
                  <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--color-cyan-primary),var(--color-cyan-neon));display:flex;align-items:center;justify-content:center;font-weight:700;color:#000;font-size:12px;overflow:hidden;flex-shrink:0;">
                    ${channelData?.profilePhotoUrl ? `<img src="${channelData.profilePhotoUrl}" style="width:100%;height:100%;object-fit:cover;" />` : 'C'}
                  </div>
                  <div style="flex:1;font-size:13px;line-height:1.4;">
                    <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
                      <span style="font-weight:700;color:var(--color-cyan-neon);">${channelData?.channelName || 'Streamer'}</span>
                      <span style="background:linear-gradient(135deg,#FFD700,#FFA500);color:#000;font-size:9px;font-weight:800;padding:1px 4px;border-radius:4px;">👑 HOST</span>
                    </div>
                    <div id="simulated-chat-msg" style="color:var(--color-text-primary);word-break:break-word;">
                      Hey chat! Check out our new emote <span id="preview-emote-token" style="display:inline-flex;align-items:center;vertical-align:middle;margin:0 2px;">
                        ${selectedImageDataUrl ? `<img src="${selectedImageDataUrl}" style="width:24px;height:24px;object-fit:contain;border-radius:4px;" />` : '<span style="color:var(--color-text-muted);font-style:italic;">:shortcode:</span>'}
                      </span> in action!
                    </div>
                  </div>
                </div>
                <div style="margin-top:12px;font-size:11px;color:var(--color-text-muted);display:flex;align-items:center;gap:6px;">
                  <span>💡</span> This is exactly how your emote appears in your live stream chat room.
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Active Channel Emotes Grid -->
        <div class="card" style="padding:24px;margin-bottom:24px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:10px;">
            <div>
              <h4 style="color:#fff;font-size:16px;font-weight:700;margin:0;display:flex;align-items:center;gap:8px;">
                <span style="width:20px;height:20px;display:inline-flex;">${getEmoteSvg('orbitCrown')}</span>
                Active Channel Emotes (<span id="emotes-count">${usedCount}</span>/50)
              </h4>
              <p style="font-size:12px;color:var(--color-text-muted);margin:4px 0 0 0;">
                Click any emote code to copy it. Remember to click <strong>"Save All Emotes"</strong> above when finished.
              </p>
            </div>
            ${usedCount > 0 ? `
              <button id="clear-all-emotes-btn" class="btn btn-ghost btn-sm" style="color:var(--color-error);font-size:11px;padding:4px 10px;">
                Clear All
              </button>
            ` : ''}
          </div>

          <div id="emotes-grid" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(150px, 1fr));gap:14px;">
            <!-- Rendered dynamically -->
          </div>
        </div>

        <!-- Platform Cosmic Role Badges (Reference) -->
        <div class="card" style="padding:24px;">
          <div style="margin-bottom:16px;">
            <h4 style="color:#fff;font-size:15px;font-weight:700;margin:0;display:flex;align-items:center;gap:8px;">
              <span style="width:20px;height:20px;display:inline-flex;">${getEmoteSvg('orbitGG')}</span>
              Cosmic Role Badges
            </h4>
            <p style="font-size:12px;color:var(--color-text-muted);margin:4px 0 0 0;">
              Automatic space badges assigned to users according to their celestial roles in chat.
            </p>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:16px;">
            <div class="orbit-badge-card" style="display:flex;align-items:center;gap:12px;padding:14px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,215,0,0.25);border-radius:10px;">
              <div class="badge-icon" style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,rgba(255,215,0,0.2),rgba(255,165,0,0.1));display:flex;align-items:center;justify-content:center;font-size:20px;">
                👑
              </div>
              <div>
                <strong style="color:#FFD700;font-size:13px;display:block;">${badges?.owner?.role || 'Channel Host'}</strong>
                <div style="font-size:11px;color:var(--color-text-muted);margin-top:2px;">Earth — Creator &amp; Broadcaster</div>
              </div>
            </div>
            <div class="orbit-badge-card" style="display:flex;align-items:center;gap:12px;padding:14px;background:rgba(255,255,255,0.03);border:1px solid rgba(16,185,129,0.25);border-radius:10px;">
              <div class="badge-icon" style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,rgba(16,185,129,0.2),rgba(5,150,105,0.1));display:flex;align-items:center;justify-content:center;font-size:20px;">
                🛡️
              </div>
              <div>
                <strong style="color:#10b981;font-size:13px;display:block;">${badges?.moderator?.role || 'Moderator'}</strong>
                <div style="font-size:11px;color:var(--color-text-muted);margin-top:2px;">Saturn — Shield of the stream chat</div>
              </div>
            </div>
            <div class="orbit-badge-card" style="display:flex;align-items:center;gap:12px;padding:14px;background:rgba(255,255,255,0.03);border:1px solid rgba(245,158,11,0.25);border-radius:10px;">
              <div class="badge-icon" style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,rgba(245,158,11,0.2),rgba(217,119,6,0.1));display:flex;align-items:center;justify-content:center;font-size:20px;">
                ⭐
              </div>
              <div>
                <strong style="color:#f59e0b;font-size:13px;display:block;">${badges?.ogUser?.role || 'OG Pioneer'}</strong>
                <div style="font-size:11px;color:var(--color-text-muted);margin-top:2px;">Gold Star — Early platform adopter</div>
              </div>
            </div>
          </div>
        </div>
      `;

      attachEventHandlers();
      renderEmotesGrid();
    }

    function renderEmotesGrid() {
      const grid = document.getElementById('emotes-grid');
      const countEl = document.getElementById('emotes-count');
      const headerCountEl = document.getElementById('header-emotes-count');
      const btnCountEl = document.getElementById('btn-emotes-count');
      const progBar = document.getElementById('emotes-progress-bar');
      const dirtyBadge = document.getElementById('emotes-dirty-badge');

      const count = customEmojis.length;
      if (countEl) countEl.textContent = count;
      if (headerCountEl) headerCountEl.textContent = count;
      if (btnCountEl) btnCountEl.textContent = count;
      if (progBar) progBar.style.width = `${Math.min(100, Math.round((count / 50) * 100))}%`;
      if (dirtyBadge) dirtyBadge.style.display = isDirty ? 'inline-flex' : 'none';

      if (!grid) return;
      if (!customEmojis.length) {
        grid.innerHTML = `
          <div style="grid-column:1/-1;text-align:center;padding:48px 20px;background:rgba(255,255,255,0.02);border:1px dashed rgba(255,255,255,0.08);border-radius:12px;">
            <div style="font-size:36px;margin-bottom:10px;">🛸</div>
            <h4 style="color:#fff;margin:0 0 6px 0;font-size:15px;">No Custom Emotes Configured Yet</h4>
            <p style="color:var(--color-text-muted);font-size:13px;max-width:400px;margin:0 auto 16px auto;">
              Your channel live stream chat currently has no custom emotes. Add a cosmic preset or upload an image above!
            </p>
          </div>
        `;
        return;
      }

      grid.innerHTML = customEmojis.map((e, idx) => {
        const isCustomImg = e.isCustomImage || (e.emojiValue && (e.emojiValue.startsWith('data:image') || e.emojiValue.startsWith('http')));
        return `
          <div class="orbit-emote-card" style="display:flex;flex-direction:column;align-items:center;padding:16px 12px;background:rgba(255,255,255,0.03);border:1px solid rgba(0,242,254,0.18);border-radius:12px;text-align:center;gap:8px;position:relative;transition:all 0.2s ease;">
            <div style="width:44px;height:44px;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.3);border-radius:8px;padding:4px;">
              ${renderEmoteVisual(e, 36)}
            </div>
            <div class="copy-emote-badge" data-code=":${escapeHtml(e.name)}:" title="Click to copy code" style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:var(--color-cyan-neon);cursor:pointer;padding:2px 6px;background:rgba(0,242,254,0.08);border-radius:4px;border:1px solid rgba(0,242,254,0.2);">
              :${escapeHtml(e.name)}:
            </div>
            <span style="font-size:10px;padding:2px 6px;border-radius:4px;background:${isCustomImg ? 'rgba(121,40,202,0.15)' : 'rgba(0,174,189,0.15)'};color:${isCustomImg ? '#c084fc' : 'var(--color-cyan-primary)'};border:1px solid ${isCustomImg ? 'rgba(121,40,202,0.3)' : 'rgba(0,174,189,0.3)'};">
              ${isCustomImg ? 'Custom Image' : 'Cosmic Preset'}
            </span>
            <button class="btn btn-ghost btn-sm del-emote-btn" data-index="${idx}" title="Remove emote" style="color:var(--color-error);font-size:11px;padding:4px 8px;margin-top:2px;">
              ${Icons.trash || '🗑'} Delete
            </button>
          </div>
        `;
      }).join('');

      // Click to copy code
      grid.querySelectorAll('.copy-emote-badge').forEach(badge => {
        badge.addEventListener('click', () => {
          const code = badge.dataset.code;
          navigator.clipboard?.writeText(code).then(() => {
            const original = badge.textContent;
            badge.textContent = 'Copied!';
            badge.style.color = '#10b981';
            setTimeout(() => {
              badge.textContent = original;
              badge.style.color = 'var(--color-cyan-neon)';
            }, 1200);
          });
        });
      });

      // Delete emote
      grid.querySelectorAll('.del-emote-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.index);
          const removed = customEmojis.splice(idx, 1)[0];
          isDirty = true;
          renderEmotesGrid();
          // Update presets buttons state
          document.querySelectorAll('.add-preset-quick-btn').forEach(pb => {
            if (pb.dataset.name.toLowerCase() === removed?.name?.toLowerCase()) {
              pb.disabled = false;
              pb.className = 'btn btn-sm add-preset-quick-btn btn-cyan';
              pb.textContent = '+ Add';
            }
          });
          store.showToast(`Removed :${removed?.name}:. Click "Save All Emotes" to commit.`, 'info');
        });
      });
    }

    function attachEventHandlers() {
      // Sub-tab toggling
      const btnPresets = document.getElementById('subtab-btn-presets');
      const btnUpload = document.getElementById('subtab-btn-upload');
      const tabPresets = document.getElementById('subtab-content-presets');
      const tabUpload = document.getElementById('subtab-content-upload');

      btnPresets?.addEventListener('click', () => {
        activeSubTab = 'presets';
        btnPresets.classList.add('active');
        btnUpload?.classList.remove('active');
        if (tabPresets) tabPresets.style.display = 'block';
        if (tabUpload) tabUpload.style.display = 'none';
      });

      btnUpload?.addEventListener('click', () => {
        activeSubTab = 'upload';
        btnUpload.classList.add('active');
        btnPresets?.classList.remove('active');
        if (tabPresets) tabPresets.style.display = 'none';
        if (tabUpload) tabUpload.style.display = 'block';
      });

      // Add preset buttons
      document.querySelectorAll('.add-preset-quick-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (customEmojis.length >= 50) {
            store.showToast('Maximum 50 custom emotes reached', 'error');
            return;
          }
          const pName = btn.dataset.name;
          const pVal = btn.dataset.val;
          if (customEmojis.some(e => e.name.toLowerCase() === pName.toLowerCase())) {
            store.showToast(`:${pName}: is already added to this channel`, 'info');
            return;
          }
          customEmojis.push({
            name: pName,
            emojiValue: pVal,
            isCustomImage: false
          });
          isDirty = true;
          btn.disabled = true;
          btn.className = 'btn btn-sm add-preset-quick-btn btn-ghost';
          btn.textContent = '✓ Added';
          renderEmotesGrid();
          store.showToast(`Added :${pName}:! Remember to click "Save All Emotes".`, 'success');
        });
      });

      // File input & Drag/Drop
      const dropZone = document.getElementById('drop-zone');
      const fileInp = document.getElementById('custom-emote-file-inp');
      const dropZoneText = document.getElementById('drop-zone-text');
      const tokenPreview = document.getElementById('preview-emote-token');
      const shortcodeInp = document.getElementById('custom-emote-shortcode');

      dropZone?.addEventListener('click', () => fileInp?.click());

      dropZone?.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--color-cyan-neon)';
      });
      dropZone?.addEventListener('dragleave', () => {
        dropZone.style.borderColor = 'rgba(0,242,254,0.3)';
      });
      dropZone?.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'rgba(0,242,254,0.3)';
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          handleFileSelected(e.dataTransfer.files[0]);
        }
      });

      fileInp?.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          handleFileSelected(e.target.files[0]);
          e.target.value = '';
        }
      });

      function handleFileSelected(file) {
        openImageCropperModal(file, {
          aspectRatio: 1,
          title: 'Crop Emote (1:1 Square)'
        }, (croppedFile) => {
          const reader = new FileReader();
          reader.onload = (re) => {
            selectedImageDataUrl = re.target.result;
            if (dropZoneText) dropZoneText.textContent = '✓ Image Ready (Click to change)';
            if (tokenPreview) {
              tokenPreview.innerHTML = `<img src="${selectedImageDataUrl}" style="width:24px;height:24px;object-fit:contain;border-radius:4px;" />`;
            }
            store.showToast('Image cropped and ready!', 'success');
          };
          reader.readAsDataURL(croppedFile);
        });
      }

      // Live Shortcode Input listener
      shortcodeInp?.addEventListener('input', (e) => {
        const val = e.target.value.trim().replace(/^:/, '').replace(/:$/, '');
        if (!selectedImageDataUrl && tokenPreview) {
          tokenPreview.innerHTML = val ? `<span style="font-family:var(--font-mono);color:var(--color-cyan-neon);font-weight:700;">:${escapeHtml(val)}:</span>` : '<span style="color:var(--color-text-muted);font-style:italic;">:shortcode:</span>';
        }
      });

      // Commit Custom Emote
      document.getElementById('commit-custom-emote-btn')?.addEventListener('click', () => {
        if (customEmojis.length >= 50) {
          store.showToast('Maximum 50 custom emotes reached', 'error');
          return;
        }
        const rawName = shortcodeInp?.value?.trim().replace(/^:/, '').replace(/:$/, '');
        if (!rawName || !/^[a-zA-Z0-9_]{2,32}$/.test(rawName)) {
          store.showToast('Shortcode must be 2-32 characters alphanumeric/underscore', 'error');
          return;
        }
        if (customEmojis.some(e => e.name.toLowerCase() === rawName.toLowerCase())) {
          store.showToast(`An emote with code :${rawName}: already exists`, 'error');
          return;
        }
        if (!selectedImageDataUrl) {
          store.showToast('Please select and crop an image for this emote first', 'error');
          return;
        }

        customEmojis.push({
          name: rawName,
          emojiValue: selectedImageDataUrl,
          isCustomImage: true
        });

        isDirty = true;
        selectedImageDataUrl = '';
        if (shortcodeInp) shortcodeInp.value = '';
        if (dropZoneText) dropZoneText.textContent = 'Click to Browse or Drag Image';
        if (tokenPreview) tokenPreview.innerHTML = '<span style="color:var(--color-text-muted);font-style:italic;">:shortcode:</span>';

        renderEmotesGrid();
        store.showToast(`:${rawName}: added! Click "Save All Emotes" to save to channel.`, 'success');
      });

      // Clear all emotes button
      document.getElementById('clear-all-emotes-btn')?.addEventListener('click', () => {
        if (!confirm('Are you sure you want to remove all emotes from this channel?')) return;
        customEmojis = [];
        isDirty = true;
        renderEmotesGrid();
        document.querySelectorAll('.add-preset-quick-btn').forEach(pb => {
          pb.disabled = false;
          pb.className = 'btn btn-sm add-preset-quick-btn btn-cyan';
          pb.textContent = '+ Add';
        });
        store.showToast('All emotes cleared. Click "Save All Emotes" to save changes.', 'info');
      });

      // SAVE ALL EMOTES BUTTON (Dual-Persistence with loading & feedback)
      document.getElementById('save-emojis-server-btn')?.addEventListener('click', async () => {
        const btn = document.getElementById('save-emojis-server-btn');
        if (!btn) return;

        btn.disabled = true;
        const originalHtml = btn.innerHTML;
        btn.innerHTML = `<span style="display:inline-block;width:14px;height:14px;border:2px solid #fff;border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite;margin-right:6px;"></span> Saving...`;

        try {
          const payload = {
            emojis: customEmojis.map(e => ({
              name: e.name.toLowerCase(),
              emojiValue: e.emojiValue,
              isCustomImage: !!e.isCustomImage
            }))
          };

          // 1. Dual persistence: Save locally to localStorage first
          localStorage.setItem(`orbit_channel_emotes_${channelId}`, JSON.stringify(customEmojis));

          // 2. Save to backend database
          const res = await dashboardApi.setEmojis(payload);
          if (Array.isArray(res)) {
            customEmojis = res;
            localStorage.setItem(`orbit_channel_emotes_${channelId}`, JSON.stringify(customEmojis));
          }

          isDirty = false;
          renderEmotesGrid();

          btn.innerHTML = `✓ Saved to Channel!`;
          btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
          btn.style.borderColor = '#10b981';
          store.showToast('Custom emotes successfully saved and active for your channel!', 'success');

          setTimeout(() => {
            btn.disabled = false;
            btn.style.background = '';
            btn.style.borderColor = '';
            btn.innerHTML = `${Icons.check || '✓'} Save All Emotes (${customEmojis.length}/50)`;
          }, 2500);

        } catch (err) {
          console.error('[Studio] Failed to save custom emotes:', err);
          // Fallback: It is saved in localStorage
          localStorage.setItem(`orbit_channel_emotes_${channelId}`, JSON.stringify(customEmojis));
          store.showToast('Emotes saved locally! (Backend note: ' + (err.message || 'Server error') + ')', 'warning');
          btn.disabled = false;
          btn.innerHTML = originalHtml;
        }
      });
    }

    renderStudioUI();

  } catch (e) {
    console.error('[Studio] Emotes studio error:', e);
    ws.innerHTML = '<div class="empty-state" style="padding:40px 20px;"><h3>Failed to load Emotes Studio</h3><p style="color:var(--color-text-muted);">Please check your network connection and try again.</p></div>';
  }
}

function switchTab(tab) {
  studioTab = tab;
  document.querySelectorAll('[data-studio-tab]').forEach(b => {
    b.classList.toggle('active', b.dataset.studioTab === tab);
  });
  renderWorkspace();
}

function generateStreamDataBars(streams, field = 'peakViewers', fallbackCount = 8) {
  if (Array.isArray(streams) && streams.length > 0) {
    const list = [...streams].slice(0, 12).reverse();
    const values = list.map(s => s[field] || 0);
    const max = Math.max(...values, 1);
    return list.map((s) => {
      const val = s[field] || 0;
      const pct = Math.max(14, Math.round((val / max) * 100));
      const label = field === 'peakViewers' ? `${val} peak viewers` : `${val} chat msgs`;
      const titleStr = `${escapeHtml(s.title || 'Stream')}: ${label}`;
      const isPeak = field === 'peakViewers';
      const barColor = isPeak
        ? 'linear-gradient(180deg, var(--color-live-red, #ff1400), rgba(255, 20, 0, 0.4))'
        : 'linear-gradient(180deg, var(--color-cyan-neon, #00f2fe), var(--color-cyan-primary, #00aebd))';
      return `
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;height:100%;justify-content:flex-end;gap:4px;" title="${titleStr}">
          <div class="mini-chart-bar" style="height:${pct}%;width:100%;background:${barColor};border-radius:4px 4px 0 0;opacity:0.95;transition:all 0.3s ease;cursor:pointer;"></div>
          <span style="font-size:9px;color:var(--color-text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:36px;text-align:center;">${val}</span>
        </div>
      `;
    }).join('');
  }

  return Array.from({ length: fallbackCount }, () => {
    return `
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;height:100%;justify-content:flex-end;gap:4px;">
        <div class="mini-chart-bar" style="height:15%;width:100%;background:rgba(255,255,255,0.06);border-radius:4px 4px 0 0;"></div>
        <span style="font-size:9px;color:var(--color-text-muted);">-</span>
      </div>
    `;
  }).join('');
}

function generateChartBars(count, maxVal) {
  return generateStreamDataBars([], 'peakViewers', count || 8);
}