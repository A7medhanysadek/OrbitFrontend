import { apiClient, setTokens, setCurrentUser, clearTokens, getRefreshToken, getAuthToken, API_BASE } from './client.js';

export const authApi = {
  async register(data) {
    // data: { username, fullName, email, password, age }
    return await apiClient('/api/Auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async confirmEmail(email, otpCode) {
    const res = await apiClient('/api/Auth/confirm-email', {
      method: 'POST',
      body: JSON.stringify({ email, otp_Code: otpCode })
    });
    const token = res?.accessToken || res?.token;
    if (res && token) {
      setTokens(token, res.refreshToken);
      setCurrentUser(res);
    }
    return res;
  },

  async login(email, password) {
    const res = await apiClient('/api/Auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    const token = res?.accessToken || res?.token;
    if (res && token) {
      setTokens(token, res.refreshToken);
      setCurrentUser(res);
    }
    return res;
  },

  async googleLogin(credential) {
    const res = await apiClient('/api/Auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential })
    });
    const token = res?.accessToken || res?.token;
    if (res && token) {
      setTokens(token, res.refreshToken);
      setCurrentUser(res);
    }
    return res;
  },

  async refreshToken() {
    const refreshToken = getRefreshToken();
    const token = getAuthToken();
    if (!refreshToken) return null;
    try {
      const res = await fetch(`${API_BASE}/api/Auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ refreshToken })
      });
      if (res.ok) {
        const data = await res.json();
        const newToken = data?.accessToken || data?.token;
        if (data && newToken) {
          setTokens(newToken, data.refreshToken);
          setCurrentUser(data);
          return data;
        }
      }
    } catch (e) {
      console.warn('Failed to refresh token', e);
    }
    return null;
  },

  async forgotPassword(email) {
    return await apiClient('/api/Auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  },

  async resetPassword(email, otpCode, newPassword) {
    return await apiClient('/api/Auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, otp_Code: otpCode, newPassword })
    });
  },

  async revokeToken() {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await apiClient('/api/Auth/revoke-token', {
          method: 'POST',
          body: JSON.stringify({ refreshToken })
        });
      } catch (e) {
        console.warn('Revoke token error', e);
      }
    }
    clearTokens();
  },

  async getGoogleClientId() {
    return await apiClient('/api/Auth/google-client-id');
  }
};
