import { store } from '../state/store.js';
import { profileApi } from '../api/profile.js';
import { authApi } from '../api/auth.js';
import { clearTokens, setCurrentUser } from '../api/client.js';
import { Icons } from '../components/CosmicIcons.js';

export function renderProfileView() {
  const user = store.getState().currentUser;
  if (!user) return '<div class="empty-state"><h3>Not logged in</h3></div>';
  return `
    <div style="max-width:600px;margin:0 auto;">
      <div class="card" style="padding:32px;text-align:center;margin-bottom:24px;">
        <div style="width:100px;height:100px;border-radius:50%;margin:0 auto 16px;overflow:hidden;border:3px solid var(--color-cyan-primary);background:linear-gradient(135deg,var(--color-cyan-primary),var(--color-cyan-neon));display:flex;align-items:center;justify-content:center;font-size:36px;font-weight:700;color:#000;" id="profile-avatar">
          ${user.profilePictureUrl ? `<img src="${user.profilePictureUrl}" style="width:100%;height:100%;object-fit:cover;" />` : (user.fullName || user.username || 'U')[0].toUpperCase()}
        </div>
        <h2 style="font-size:22px;margin-bottom:4px;">${user.fullName || user.username}</h2>
        <p style="color:var(--color-cyan-primary);font-size:14px;margin-bottom:4px;">@${user.username || ''}</p>
        <p style="color:var(--color-text-muted);font-size:13px;">${user.email || ''}</p>
        <div style="margin-top:16px;display:flex;justify-content:center;gap:10px;">
          <label class="btn btn-outline btn-sm" style="cursor:pointer;">
            ${Icons.upload} Upload Photo
            <input type="file" id="profile-upload" accept="image/*" style="display:none;" />
          </label>
          <button id="profile-remove-pic" class="btn btn-ghost btn-sm">${Icons.trash} Remove</button>
        </div>
      </div>

      <div class="card" style="padding:24px;">
        <h3 style="font-size:16px;margin-bottom:16px;color:var(--color-cyan-neon);">Account Info</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div><span style="font-size:12px;color:var(--color-text-muted);">Username</span><p>${user.username || '-'}</p></div>
          <div><span style="font-size:12px;color:var(--color-text-muted);">Full Name</span><p>${user.fullName || '-'}</p></div>
          <div><span style="font-size:12px;color:var(--color-text-muted);">Email</span><p>${user.email || '-'}</p></div>
          <div><span style="font-size:12px;color:var(--color-text-muted);">Age</span><p>${user.age || '-'}</p></div>
        </div>
      </div>

      <div style="margin-top:24px;display:flex;gap:12px;">
        <button id="profile-logout" class="btn btn-danger btn-full">${Icons.logout} Log Out</button>
      </div>
    </div>
  `;
}

export function setupProfileEvents() {
  document.getElementById('profile-upload')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const res = await profileApi.uploadPicture(file);
      store.showToast('Profile picture updated!', 'success');
      const user = { ...store.getState().currentUser, profilePictureUrl: res.profilePictureUrl || res.url };
      setCurrentUser(user);
      store.setCurrentUser(user);
    } catch (err) { store.showToast(err.message || 'Upload failed', 'error'); }
  });

  document.getElementById('profile-remove-pic')?.addEventListener('click', async () => {
    try {
      await profileApi.removePicture();
      const user = { ...store.getState().currentUser, profilePictureUrl: null };
      setCurrentUser(user);
      store.setCurrentUser(user);
      store.showToast('Profile picture removed', 'info');
    } catch (err) { store.showToast(err.message || 'Failed', 'error'); }
  });

  document.getElementById('profile-logout')?.addEventListener('click', async () => {
    try { await authApi.revokeToken(); } catch (e) {}
    clearTokens();
    setCurrentUser(null);
    store.setCurrentUser(null);
    store.navigate('splash');
    store.showToast('Logged out', 'info');
  });
}