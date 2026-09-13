import { store } from '../state/store.js';
import { moderationApi } from '../api/moderation.js';
import { Icons } from '../components/CosmicIcons.js';
import { API_BASE, getAuthToken } from '../api/client.js';
import * as signalR from '@microsoft/signalr';

let modConnection = null;
let channelId = null;

export function renderModView() {
  channelId = store.getState().viewParams?.channelId;
  return `
    <div style="display:flex;gap:0;margin:-24px;min-height:calc(100vh - var(--topbar-height));">
      <!-- Mod Chat Panel -->
      <div style="flex:1;display:flex;flex-direction:column;">
        <div style="padding:16px 20px;border-bottom:1px solid rgba(0,174,189,0.1);display:flex;align-items:center;gap:12px;">
          <span class="badge-role mod">MOD</span>
          <h2 style="font-size:18px;">Moderator View</h2>
          <span style="color:var(--color-text-muted);font-size:13px;" id="mod-status">Connecting...</span>
        </div>
        <div style="flex:1;overflow-y:auto;padding:12px 16px;" id="mod-chat-messages"></div>
        <div class="chat-input-area">
          <input type="text" id="mod-chat-input" placeholder="Send a message..." />
          <button id="mod-chat-send">${Icons.send}</button>
        </div>
      </div>

      <!-- Mod Actions Panel -->
      <div style="width:320px;border-left:1px solid rgba(0,174,189,0.1);padding:20px;display:flex;flex-direction:column;gap:16px;overflow-y:auto;">
        <h3 style="font-family:var(--font-display);color:var(--color-cyan-neon);font-size:16px;">${Icons.shield} Mod Actions</h3>

        <div class="card" style="padding:16px;">
          <h4 style="font-size:13px;color:var(--color-text-muted);margin-bottom:10px;">Timeout User</h4>
          <input class="input-dark" id="mod-timeout-user" placeholder="Username" style="margin-bottom:8px;" />
          <div style="display:flex;gap:6px;">
            <input class="input-dark" type="number" id="mod-timeout-dur" value="300" min="10" max="86400" style="flex:1;" />
            <button id="mod-timeout-btn" class="btn btn-sm" style="background:var(--color-warning);color:#000;">${Icons.clock} Timeout</button>
          </div>
        </div>

        <div class="card" style="padding:16px;">
          <h4 style="font-size:13px;color:var(--color-text-muted);margin-bottom:10px;">Ban User</h4>
          <input class="input-dark" id="mod-ban-user" placeholder="Username" style="margin-bottom:8px;" />
          <input class="input-dark" id="mod-ban-reason" placeholder="Reason (optional)" style="margin-bottom:8px;" />
          <button id="mod-ban-btn" class="btn btn-danger btn-sm btn-full">${Icons.ban} Ban</button>
        </div>

        <div class="card" style="padding:16px;">
          <h4 style="font-size:13px;color:var(--color-text-muted);margin-bottom:10px;">Unban User</h4>
          <div style="display:flex;gap:6px;">
            <input class="input-dark" id="mod-unban-user" placeholder="Username" style="flex:1;" />
            <button id="mod-unban-btn" class="btn btn-outline btn-sm">Unban</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function setupModEvents() {
  if (!channelId) { store.showToast('No channel specified', 'error'); return; }

  // Connect to chat as mod
  initModChat(channelId);

  // Chat send
  const input = document.getElementById('mod-chat-input');
  const send = document.getElementById('mod-chat-send');
  const sendMsg = () => {
    const msg = input?.value.trim();
    if (!msg || !modConnection) return;
    modConnection.invoke('SendMessage', msg).catch(e => console.error(e));
    input.value = '';
  };
  send?.addEventListener('click', sendMsg);
  input?.addEventListener('keydown', e => { if (e.key === 'Enter') sendMsg(); });

  // Timeout
  document.getElementById('mod-timeout-btn')?.addEventListener('click', async () => {
    const username = document.getElementById('mod-timeout-user').value.trim();
    const dur = parseInt(document.getElementById('mod-timeout-dur').value) || 300;
    if (!username) return;
    try { await moderationApi.timeoutUser(channelId, { username, durationSeconds: dur }); store.showToast(`${username} timed out for ${dur}s`, 'warning'); } catch (e) { store.showToast(e.message, 'error'); }
  });

  // Ban
  document.getElementById('mod-ban-btn')?.addEventListener('click', async () => {
    const username = document.getElementById('mod-ban-user').value.trim();
    const reason = document.getElementById('mod-ban-reason').value.trim();
    if (!username) return;
    try { await moderationApi.banUser(channelId, { username, reason }); store.showToast(`${username} has been banned`, 'error'); } catch (e) { store.showToast(e.message, 'error'); }
  });

  // Unban
  document.getElementById('mod-unban-btn')?.addEventListener('click', async () => {
    const username = document.getElementById('mod-unban-user').value.trim();
    if (!username) return;
    try { await moderationApi.unbanUser(channelId, username); store.showToast(`${username} has been unbanned`, 'success'); } catch (e) { store.showToast(e.message, 'error'); }
  });
}

async function initModChat(chId) {
  const status = document.getElementById('mod-status');
  const messages = document.getElementById('mod-chat-messages');
  if (!messages) return;
  try {
    const token = getAuthToken();
    modConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE}/hubs/stream-chat`, { accessTokenFactory: () => token })
      .withAutomaticReconnect()
      .build();

    modConnection.on('ReceiveMessage', (msg) => {
      const div = document.createElement('div');
      div.className = 'chat-msg';
      div.style.display = 'flex';
      div.style.justifyContent = 'space-between';
      div.style.alignItems = 'flex-start';
      div.innerHTML = `
        <div>
          <span class="chat-user" style="color:${msg.color || '#00AEBD'};">${msg.username}:</span>
          <span class="chat-text">${escapeHtml(msg.content)}</span>
        </div>
        <div class="mod-actions" style="flex-shrink:0;margin-left:8px;">
          <button class="mod-action-btn delete" title="Delete message" data-msg-id="${msg.id}">&#128465;</button>
          <button class="mod-action-btn timeout" title="Timeout user" data-timeout-user="${msg.username}">&#9201;</button>
          <button class="mod-action-btn ban" title="Ban user" data-ban-user="${msg.username}">&#128683;</button>
        </div>
      `;
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;

      // Inline mod actions
      div.querySelector('[data-msg-id]')?.addEventListener('click', async () => {
        try { await moderationApi.deleteMessage(chId, msg.id); div.style.opacity = '0.3'; store.showToast('Message deleted', 'info'); } catch (e) { store.showToast(e.message, 'error'); }
      });
      div.querySelector('[data-timeout-user]')?.addEventListener('click', async () => {
        try { await moderationApi.timeoutUser(chId, { username: msg.username, durationSeconds: 300 }); store.showToast(`${msg.username} timed out`, 'warning'); } catch (e) { store.showToast(e.message, 'error'); }
      });
      div.querySelector('[data-ban-user]')?.addEventListener('click', async () => {
        if (!confirm(`Ban ${msg.username}?`)) return;
        try { await moderationApi.banUser(chId, { username: msg.username, reason: 'Banned by moderator' }); store.showToast(`${msg.username} banned`, 'error'); } catch (e) { store.showToast(e.message, 'error'); }
      });
    });

    modConnection.on('SystemMessage', (msg) => {
      const div = document.createElement('div');
      div.className = 'chat-msg';
      div.innerHTML = `<span style="color:var(--color-warning);font-style:italic;">&#9888; ${msg}</span>`;
      messages.appendChild(div);
    });

    await modConnection.start();
    await modConnection.invoke('JoinChannel', chId);
    if (status) { status.textContent = 'Connected'; status.style.color = 'var(--color-success)'; }
  } catch (e) {
    if (status) { status.textContent = 'Disconnected'; status.style.color = 'var(--color-error)'; }
  }
}

function escapeHtml(str) { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; }