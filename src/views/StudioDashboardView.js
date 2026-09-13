import { store } from '../state/store.js';
import { channelApi } from '../api/channel.js';
import { streamApi } from '../api/stream.js';
import { dashboardApi } from '../api/dashboard.js';
import { Icons } from '../components/CosmicIcons.js';
import { openVodPlayerModal } from '../components/VodPlayerModal.js';

let studioTab = 'overview';
let channelData = null;
let hasChannel = false;
let authError = false;

export function renderStudioDashboardView() {
  const user = store.getState().currentUser;
  if (!user) return `<div class="empty-state"><div class="empty-icon">&#128274;</div><h3>Login Required</h3><p>Please log in to access Creator Studio.</p><button id="studio-login" class="btn btn-primary">Login</button></div>`;

  return `
    <div class="studio-layout" style="margin:-24px;min-height:calc(100vh - var(--topbar-height));">
      <aside class="studio-sidebar">
        <div style="padding:16px 14px 8px;font-size:11px;font-weight:700;color:var(--color-cyan-primary);letter-spacing:0.1em;text-transform:uppercase;">Creator Studio</div>
        <button class="studio-sidebar-btn ${studioTab==='overview'?'active':''}" data-tab="overview"><span class="tab-icon">&#128200;</span><span class="tab-label">Overview</span></button>
        <button class="studio-sidebar-btn ${studioTab==='channel'?'active':''}" data-tab="channel"><span class="tab-icon">&#128225;</span><span class="tab-label">Channel Setup</span></button>
        <button class="studio-sidebar-btn ${studioTab==='broadcast'?'active':''}" data-tab="broadcast"><span class="tab-icon">&#128308;</span><span class="tab-label">Stream Manager</span></button>
        <button class="studio-sidebar-btn ${studioTab==='analytics'?'active':''}" data-tab="analytics"><span class="tab-icon">&#128202;</span><span class="tab-label">Analytics</span></button>
        <button class="studio-sidebar-btn ${studioTab==='vods'?'active':''}" data-tab="vods"><span class="tab-icon">&#128249;</span><span class="tab-label">VOD Archive</span></button>
        <button class="studio-sidebar-btn ${studioTab==='moderation'?'active':''}" data-tab="moderation"><span class="tab-icon">&#128737;</span><span class="tab-label">Moderation</span></button>
        <button class="studio-sidebar-btn ${studioTab==='emotes'?'active':''}" data-tab="emotes"><span class="tab-icon">&#128578;</span><span class="tab-label">Emotes & Badges</span></button>
      </aside>
      <main class="studio-workspace" id="studio-workspace">
        <div class="spinner"></div>
      </main>
    </div>
  `;
}

export function setupStudioDashboardEvents() {
  document.getElementById('studio-login')?.addEventListener('click', () => store.navigate('login'));
  document.querySelectorAll('.studio-sidebar-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      studioTab = btn.dataset.tab;
      document.querySelectorAll('.studio-sidebar-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderWorkspace();
    });
  });
  initStudio();
}

async function initStudio() {
  authError = false;
  try {
    channelData = await channelApi.getMyChannel();
    hasChannel = !!channelData;
  } catch (e) {
    if (e.status === 401) {
      authError = true;
      hasChannel = false;
    } else {
      hasChannel = false;
    }
  }
  renderWorkspace();
}

async function renderWorkspace() {
  const ws = document.getElementById('studio-workspace');
  if (!ws) return;

  if (authError) {
    ws.innerHTML = `
      <div class="empty-state" style="max-width:500px;margin:40px auto;">
        <div class="empty-icon">&#128274;</div>
        <h3>Session Expired</h3>
        <p>Your session has expired. Please log in again to manage your channel.</p>
        <button id="ws-relogin-btn" class="btn btn-cyan">Log In</button>
      </div>`;
    document.getElementById('ws-relogin-btn')?.addEventListener('click', () => store.navigate('login'));
    return;
  }

  if (!hasChannel && studioTab !== 'channel') {
    ws.innerHTML = `
      <div class="empty-state" style="max-width:500px;margin:40px auto;">
        <div class="empty-icon">&#128225;</div>
        <h3>Create Your Channel First</h3>
        <p>You need a channel before you can stream. Set up your channel identity to get started.</p>
        <button id="ws-create-ch" class="btn btn-cyan">Create Channel</button>
      </div>`;
    document.getElementById('ws-create-ch')?.addEventListener('click', () => { studioTab = 'channel'; document.querySelectorAll('.studio-sidebar-btn').forEach(b => { b.classList.remove('active'); if(b.dataset.tab==='channel')b.classList.add('active'); }); renderWorkspace(); });
    return;
  }

  switch(studioTab) {
    case 'overview': await renderOverview(ws); break;
    case 'channel': renderChannelSetup(ws); break;
    case 'broadcast': await renderBroadcast(ws); break;
    case 'analytics': await renderAnalytics(ws); break;
    case 'vods': await renderVods(ws); break;
    case 'moderation': await renderModeration(ws); break;
    case 'emotes': await renderEmotes(ws); break;
    default: ws.innerHTML = '<p>Select a tab</p>';
  }
}

async function renderOverview(ws) {
  ws.innerHTML = '<div class="spinner"></div>';
  try {
    const summary = await dashboardApi.getSummary();
    const ch = summary.channelProfile || channelData || {};
    const stats = summary.lifetimeStats || {};
    const live = summary.liveManager;
    ws.innerHTML = `
      <h2 style="font-family:var(--font-display);color:var(--color-cyan-neon);margin-bottom:24px;">Dashboard Overview</h2>
      ${live ? `<div class="card" style="padding:20px;margin-bottom:20px;border-color:var(--color-live-red);"><div style="display:flex;align-items:center;gap:12px;"><span class="badge-live" style="font-size:14px;padding:4px 12px;">LIVE NOW</span><span style="font-size:16px;font-weight:600;">${live.title || 'Broadcasting'}</span><span class="text-muted">${live.viewerCount || 0} viewers</span></div></div>` : ''}
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:28px;">
        <div class="stat-card animate-fade-up"><div class="stat-label">Total Streams</div><div class="stat-value">${stats.totalStreams || 0}</div></div>
        <div class="stat-card animate-fade-up" style="animation-delay:0.1s;"><div class="stat-label">Peak Viewers</div><div class="stat-value">${stats.peakViewers || 0}</div></div>
        <div class="stat-card animate-fade-up" style="animation-delay:0.2s;"><div class="stat-label">Total Chat Messages</div><div class="stat-value">${stats.totalChatMessages || 0}</div></div>
        <div class="stat-card animate-fade-up" style="animation-delay:0.3s;"><div class="stat-label">Total Clips</div><div class="stat-value">${stats.totalClips || 0}</div></div>
      </div>
      <div class="chart-container" style="margin-bottom:20px;">
        <h4>Viewer Activity (Last 7 Streams)</h4>
        <div class="mini-chart" style="height:120px;align-items:flex-end;gap:6px;padding:16px 0;">
          ${generateChartBars(7, stats.peakViewers || 50)}
        </div>
      </div>
      <div class="card" style="padding:20px;">
        <h4 style="color:var(--color-text-muted);font-size:14px;margin-bottom:12px;">Channel Info</h4>
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#00AEBD,#00DDEE);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:18px;color:#000;overflow:hidden;">${ch.profilePhotoUrl ? `<img src="${ch.profilePhotoUrl}" style="width:100%;height:100%;object-fit:cover;" />` : (ch.name||'C')[0].toUpperCase()}</div>
          <div><div style="font-weight:600;">${ch.name || ch.channelName || 'Your Channel'}</div><div style="font-size:13px;color:var(--color-text-muted);">${ch.description || 'No description'}</div></div>
        </div>
      </div>
    `;
  } catch (e) { ws.innerHTML = '<div class="empty-state"><h3>Failed to load dashboard</h3></div>'; }
}

function renderChannelSetup(ws) {
  const ch = channelData || {};
  ws.innerHTML = `
    <h2 style="font-family:var(--font-display);color:var(--color-cyan-neon);margin-bottom:24px;">${hasChannel ? 'Channel Settings' : 'Create Your Channel'}</h2>
    <div class="card" style="padding:24px;margin-bottom:20px;">
      <form id="ch-setup-form">
        <div class="form-group"><label style="color:var(--color-text-muted);">Channel Name</label><input class="input-dark" id="ch-name" value="${ch.name || ch.channelName || ''}" placeholder="Your channel name" required /></div>
        <div class="form-group"><label style="color:var(--color-text-muted);">Description</label><textarea class="input-dark" id="ch-desc" rows="3" placeholder="Tell viewers about your channel" style="resize:vertical;padding:12px;height:auto;border-radius:12px;">${ch.description || ''}</textarea></div>
        <button type="submit" class="btn btn-cyan" id="ch-save-btn">${hasChannel ? 'Save Changes' : 'Create Channel'}</button>
      </form>
    </div>
    ${hasChannel ? `
    <div class="card" style="padding:24px;margin-bottom:20px;">
      <h4 style="color:var(--color-text-muted);font-size:14px;margin-bottom:12px;">Channel Images</h4>
      <div style="display:flex;gap:16px;">
        <label class="btn btn-outline btn-sm" style="cursor:pointer;">${Icons.image} Upload Profile Photo<input type="file" id="ch-photo-upload" accept="image/*" style="display:none;" /></label>
        <label class="btn btn-outline btn-sm" style="cursor:pointer;">${Icons.image} Upload Cover<input type="file" id="ch-cover-upload" accept="image/*" style="display:none;" /></label>
      </div>
    </div>
    <div class="card" style="padding:24px;margin-bottom:20px;">
      <h4 style="color:var(--color-text-muted);font-size:14px;margin-bottom:12px;">Social Links</h4>
      <form id="social-form">
        <div class="form-row"><div class="form-group"><label style="color:var(--color-text-muted);">YouTube</label><input class="input-dark" id="sl-youtube" placeholder="https://youtube.com/..." /></div><div class="form-group"><label style="color:var(--color-text-muted);">Twitter/X</label><input class="input-dark" id="sl-twitter" placeholder="https://x.com/..." /></div></div>
        <div class="form-row"><div class="form-group"><label style="color:var(--color-text-muted);">Instagram</label><input class="input-dark" id="sl-instagram" placeholder="https://instagram.com/..." /></div><div class="form-group"><label style="color:var(--color-text-muted);">Discord</label><input class="input-dark" id="sl-discord" placeholder="https://discord.gg/..." /></div></div>
        <button type="submit" class="btn btn-outline btn-sm" style="margin-top:8px;">${Icons.link} Save Social Links</button>
      </form>
    </div>
    ` : ''}
  `;

  document.getElementById('ch-setup-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('ch-save-btn');
    btn.disabled = true;
    try {
      if (hasChannel) {
        await channelApi.updateProfile({ channelName: document.getElementById('ch-name').value, description: document.getElementById('ch-desc').value });
        store.showToast('Channel updated!', 'success');
      } else {
        channelData = await channelApi.create({ channelName: document.getElementById('ch-name').value, description: document.getElementById('ch-desc').value });
        hasChannel = true;
        store.showToast('Channel created! You can now stream.', 'success');
        renderWorkspace();
      }
    } catch (err) { store.showToast(err.message || 'Failed', 'error'); }
    btn.disabled = false;
  });

  document.getElementById('ch-photo-upload')?.addEventListener('change', async (e) => { if (e.target.files[0]) { try { await channelApi.uploadPhoto(e.target.files[0]); store.showToast('Photo uploaded!', 'success'); } catch (er) { store.showToast(er.message, 'error'); } } });
  document.getElementById('ch-cover-upload')?.addEventListener('change', async (e) => { if (e.target.files[0]) { try { await channelApi.uploadCover(e.target.files[0]); store.showToast('Cover uploaded!', 'success'); } catch (er) { store.showToast(er.message, 'error'); } } });
  document.getElementById('social-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await channelApi.updateSocialLinks({ youtubeUrl: document.getElementById('sl-youtube').value, twitterUrl: document.getElementById('sl-twitter').value, instagramUrl: document.getElementById('sl-instagram').value, discordUrl: document.getElementById('sl-discord').value });
      store.showToast('Social links saved!', 'success');
    } catch (er) { store.showToast(er.message, 'error'); }
  });
}

async function renderBroadcast(ws) {
  ws.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;flex-wrap:wrap;gap:12px;">
      <div>
        <h2 style="font-family:var(--font-display);color:var(--color-cyan-neon);margin:0 0 4px 0;">Stream Manager</h2>
        <p style="color:var(--color-text-muted);margin:0;font-size:14px;">Configure OBS Studio and broadcast live to your Orbit channel.</p>
      </div>
      <div id="streaming-server-status" style="display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:600;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:var(--color-text-muted);">
        <span style="width:8px;height:8px;border-radius:50%;background:#888;"></span> Checking Streaming Server...
      </div>
    </div>

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
            <input class="input-dark" id="rtmp-url-display" type="text" value="rtmp://localhost:1935/live" readonly style="flex:1;font-family:monospace;font-size:13px;color:var(--color-cyan-neon);background:rgba(0,0,0,0.4);" />
            <button id="copy-rtmp" class="btn btn-ghost btn-sm" title="Copy RTMP URL" style="border:1px solid rgba(255,255,255,0.1);">${Icons.copy}</button>
          </div>
          <span style="display:block;font-size:11px;color:var(--color-text-muted);margin-top:4px;">
            In OBS: <b>Service</b> &rarr; <b>Custom...</b> &bull; <b>Server</b> &rarr; paste this URL
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

      <!-- Go Live Stream Metadata -->
      <div class="card" style="padding:24px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
          <span style="color:var(--color-live-red);font-size:18px;">${Icons.video}</span>
          <h4 style="margin:0;font-size:15px;font-weight:700;color:var(--color-text);">Stream Session Details</h4>
        </div>
        <form id="go-live-form">
          <div class="form-group" style="margin-bottom:12px;">
            <label style="color:var(--color-text-muted);font-size:12px;font-weight:600;">STREAM TITLE</label>
            <input class="input-dark" id="go-title" placeholder="e.g., Chill Late Night Gaming & Chat" required style="margin-top:4px;" />
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
        ${Icons.settings} How to Stream with OBS Studio
      </h4>
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:16px;font-size:13px;color:var(--color-text-muted);">
        <div style="background:rgba(0,0,0,0.25);padding:12px 14px;border-radius:8px;border-left:3px solid var(--color-cyan-neon);">
          <strong style="color:var(--color-text);display:block;margin-bottom:4px;">1. Generate or copy your Stream Key</strong>
          Press <code style="color:var(--color-cyan-neon);background:rgba(0,0,0,0.4);padding:2px 6px;border-radius:4px;">Generate New Key</code> shown above and copy it.
        </div>
        <div style="background:rgba(0,0,0,0.25);padding:12px 14px;border-radius:8px;border-left:3px solid var(--color-cyan-neon);">
          <strong style="color:var(--color-text);display:block;margin-bottom:4px;">2. Configure OBS Stream</strong>
          In OBS: <b>Settings &rarr; Stream &rarr; Service: Custom...</b><br>
          Paste <b>Server:</b> <code style="color:var(--color-cyan-neon);">rtmp://localhost:1935/live</code>
        </div>
        <div style="background:rgba(0,0,0,0.25);padding:12px 14px;border-radius:8px;border-left:3px solid var(--color-cyan-neon);">
          <strong style="color:var(--color-text);display:block;margin-bottom:4px;">3. Paste Key & Go Live</strong>
          Paste your <b>Stream Key</b> into OBS and click <b>Start Streaming</b> in OBS!
        </div>
      </div>
    </div>

    <div id="live-manager-section"></div>
  `;

  // Check Local Streaming Server Status (http://localhost:8080/health)
  const statusEl = document.getElementById('streaming-server-status');
  if (statusEl) {
    try {
      const healthRes = await fetch('http://localhost:8080/health', { method: 'GET', mode: 'cors' });
      if (healthRes.ok) {
        statusEl.innerHTML = `
          <span style="width:8px;height:8px;border-radius:50%;background:#10b981;box-shadow:0 0 8px #10b981;"></span>
          <span style="color:#10b981;">Streaming Server ONLINE</span>
        `;
        statusEl.style.borderColor = 'rgba(16,185,129,0.3)';
        statusEl.style.background = 'rgba(16,185,129,0.08)';
      } else {
        throw new Error('Server returned non-200');
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
      await streamApi.createStream({ title: document.getElementById('go-title').value, description: document.getElementById('go-desc').value });
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
      section.innerHTML = '<div class="card" style="padding:20px;text-align:center;color:var(--color-text-muted);">You are currently offline. Create a stream session and start broadcasting!</div>';
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
              <h3 style="font-size:18px;margin:0 0 2px 0;">${live.title || 'Broadcasting'}</h3>
              <div style="font-size:12px;color:var(--color-text-muted);">${statusText}</div>
            </div>
          </div>
          <div style="display:flex;gap:8px;">
            ${isLive ? `<button id="studio-view-live-btn" class="btn btn-outline btn-sm">${Icons.eye} Open Watch Room</button>` : ''}
            <button id="end-stream-btn" class="btn btn-danger btn-sm">${endBtnText}</button>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:16px;">
          <div class="stat-card">
            <div class="stat-label">Viewers</div>
            <div class="stat-value">${live.currentViewerCount || live.viewerCount || 0}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Duration</div>
            <div class="stat-value">${isLive ? (live.formattedUptime || live.duration || '0:00') : '00:00'}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Status</div>
            <div class="stat-value" style="font-size:16px;color:${isLive ? '#10b981' : '#f59e0b'};">
              ${isLive ? 'Active' : 'Pending OBS'}
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('studio-view-live-btn')?.addEventListener('click', () => {
      if (live.streamId) store.navigate('watch', { streamId: live.streamId });
    });

    document.getElementById('end-stream-btn')?.addEventListener('click', async () => {
      const confirmMsg = isLive
        ? 'Are you sure you want to end your active live broadcast?'
        : 'Are you sure you want to cancel this pending stream session?';
      if (!confirm(confirmMsg)) return;

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

async function renderAnalytics(ws) {
  ws.innerHTML = '<div class="spinner"></div>';
  try {
    const summary = await dashboardApi.getSummary();
    const stats = summary.lifetimeStats || {};
    ws.innerHTML = `
      <h2 style="font-family:var(--font-display);color:var(--color-cyan-neon);margin-bottom:24px;">${Icons.chart} Analytics & Insights</h2>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:28px;">
        <div class="stat-card"><div class="stat-label">Total Streams</div><div class="stat-value">${stats.totalStreams||0}</div></div>
        <div class="stat-card"><div class="stat-label">Peak Viewers</div><div class="stat-value">${stats.peakViewers||0}</div></div>
        <div class="stat-card"><div class="stat-label">Total Watch Time</div><div class="stat-value">${stats.totalWatchTimeHours||0}h</div></div>
        <div class="stat-card"><div class="stat-label">Avg Viewers</div><div class="stat-value">${stats.avgViewers||0}</div></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">
        <div class="chart-container"><h4>Viewer Trend</h4><div class="mini-chart" style="height:140px;gap:8px;padding:20px 0;">${generateChartBars(12, stats.peakViewers || 100)}</div></div>
        <div class="chart-container"><h4>Chat Activity</h4><div class="mini-chart" style="height:140px;gap:8px;padding:20px 0;">${generateChartBars(12, stats.totalChatMessages || 500)}</div></div>
      </div>
      <div class="chart-container"><h4>Stream Duration History</h4><div class="mini-chart" style="height:100px;gap:6px;padding:16px 0;">${generateChartBars(20, 180)}</div></div>
    `;
  } catch (e) { ws.innerHTML = '<div class="empty-state"><h3>Analytics unavailable</h3></div>'; }
}

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
      <h2 style="font-family:var(--font-display);color:var(--color-cyan-neon);margin-bottom:24px;">${Icons.archive} Broadcast Archive</h2>
      <table class="data-table">
        <thead><tr><th>Title</th><th>Date</th><th>Duration</th><th>Peak Viewers</th><th>Actions</th></tr></thead>
        <tbody>${streams.map(s => `
          <tr>
            <td style="font-weight:500;">${s.title || 'Untitled'}</td>
            <td style="color:var(--color-text-muted);">${s.startedAt ? new Date(s.startedAt).toLocaleDateString() : '-'}</td>
            <td>${s.formattedDuration || s.duration || '-'}</td>
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
        if (!confirm('Delete this VOD from your channel archive?')) return;
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

async function renderModeration(ws) {
  ws.innerHTML = `
    <h2 style="font-family:var(--font-display);color:var(--color-cyan-neon);margin-bottom:24px;">${Icons.shield} Moderation & Team</h2>
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
    try { await channelApi.hireModerator(username); store.showToast(`${username} is now a moderator!`, 'success'); loadMods(); document.getElementById('mod-username').value = ''; } catch (e) { store.showToast(e.message, 'error'); }
  });

  loadMods();
  loadModSummary();
}

async function loadMods() {
  const list = document.getElementById('mod-list');
  if (!list) return;
  try {
    const mods = await channelApi.getModerators();
    if (!mods?.length) { list.innerHTML = '<p class="text-muted">No moderators yet</p>'; return; }
    list.innerHTML = mods.map(m => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04);">
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#34C759,#30D158);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;color:#000;">${(m.username||'M')[0].toUpperCase()}</div>
          <span style="font-weight:500;">${m.username || 'Moderator'}</span>
          <span class="badge-role mod">MOD</span>
        </div>
        <button class="btn btn-ghost btn-sm" data-remove-mod="${m.username}" style="color:var(--color-error);">${Icons.x} Remove</button>
      </div>
    `).join('');
    list.querySelectorAll('[data-remove-mod]').forEach(btn => {
      btn.addEventListener('click', async () => {
        try { await channelApi.removeModerator(btn.dataset.removeMod); store.showToast('Moderator removed', 'info'); loadMods(); } catch (e) { store.showToast(e.message, 'error'); }
      });
    });
  } catch (e) { list.innerHTML = '<p class="text-muted">Failed to load moderators</p>'; }
}

async function loadModSummary() {
  const card = document.getElementById('mod-summary-card');
  if (!card) return;
  try {
    const data = await dashboardApi.getModeration();
    card.innerHTML = `
      <h4 style="color:var(--color-text-muted);font-size:14px;margin-bottom:12px;">Moderation Overview</h4>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
        <div><div style="font-size:24px;font-weight:700;color:var(--color-cyan-neon);">${data.moderatorCount || 0}</div><div style="font-size:11px;color:var(--color-text-muted);">Moderators</div></div>
        <div><div style="font-size:24px;font-weight:700;color:var(--color-error);">${data.activeBanCount || 0}</div><div style="font-size:11px;color:var(--color-text-muted);">Active Bans</div></div>
        <div><div style="font-size:24px;font-weight:700;color:var(--color-warning);">${data.activeTimeoutCount || 0}</div><div style="font-size:11px;color:var(--color-text-muted);">Timeouts</div></div>
      </div>
    `;
  } catch (e) { card.innerHTML = '<h4 style="color:var(--color-text-muted);">Moderation Overview</h4><p class="text-muted">Unavailable</p>'; }
}

async function renderEmotes(ws) {
  ws.innerHTML = `
    <h2 style="font-family:var(--font-display);color:var(--color-cyan-neon);margin-bottom:24px;">${Icons.emoji} Emotes & Badges</h2>
    <div class="card" style="padding:24px;margin-bottom:20px;">
      <h4 style="color:var(--color-text-muted);font-size:14px;margin-bottom:12px;">Platform Badges</h4>
      <div id="badges-list"><div class="spinner" style="margin:0;width:24px;height:24px;"></div></div>
    </div>
    <div class="card" style="padding:24px;">
      <h4 style="color:var(--color-text-muted);font-size:14px;margin-bottom:12px;">Custom Emojis</h4>
      <div id="emojis-list"><div class="spinner" style="margin:0;width:24px;height:24px;"></div></div>
    </div>
  `;
  try {
    const badges = await dashboardApi.getBadges();
    const badgesList = document.getElementById('badges-list');
    if (badgesList && badges) {
      badgesList.innerHTML = `<div style="display:flex;gap:20px;">${Object.entries(badges).filter(([k])=>k!=='channelId').map(([k,v])=>`<div style="text-align:center;"><div style="font-size:32px;">${v}</div><div style="font-size:12px;color:var(--color-text-muted);margin-top:4px;">${k}</div></div>`).join('')}</div>`;
    }
  } catch (e) {}
  try {
    const emojis = await dashboardApi.getEmojis();
    const emojisList = document.getElementById('emojis-list');
    if (emojisList) {
      if (!emojis?.length) { emojisList.innerHTML = '<p class="text-muted">No custom emojis configured</p>'; }
      else { emojisList.innerHTML = emojis.map(e => `<span style="font-size:24px;margin:4px;" title="${e.code}">${e.emoji || e.code}</span>`).join(''); }
    }
  } catch (e) {}
}

function generateChartBars(count, maxVal) {
  return Array.from({length: count}, () => {
    const h = Math.max(8, Math.random() * 100);
    return `<div class="mini-chart-bar" style="height:${h}%;flex:1;opacity:${0.5 + Math.random()*0.5};animation-delay:${Math.random()*0.5}s;"></div>`;
  }).join('');
}