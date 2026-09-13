// Base API Client connecting to https://orbit.tryasp.net (overridable via localStorage.orbit_api_base)
export const API_BASE = (typeof window !== 'undefined' && window.localStorage && localStorage.getItem('orbit_api_base')) || 'https://orbit.tryasp.net';

export function getAuthToken() {
  return localStorage.getItem('orbit_access_token');
}

export function getRefreshToken() {
  return localStorage.getItem('orbit_refresh_token');
}

export function setTokens(accessToken, refreshToken) {
  if (accessToken) localStorage.setItem('orbit_access_token', accessToken);
  if (refreshToken) localStorage.setItem('orbit_refresh_token', refreshToken);
}

export function clearTokens() {
  localStorage.removeItem('orbit_access_token');
  localStorage.removeItem('orbit_refresh_token');
  localStorage.removeItem('orbit_user');
}

function extractRolesFromToken(token) {
  if (!token) return [];
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    const payload = JSON.parse(jsonPayload);
    const roleClaim = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || payload['role'] || payload['roles'];
    if (Array.isArray(roleClaim)) return roleClaim;
    if (roleClaim) return [roleClaim];
  } catch (e) {}
  return [];
}

export function getCurrentUser() {
  const userJson = localStorage.getItem('orbit_user');
  try {
    const user = userJson ? JSON.parse(userJson) : null;
    if (user) {
      if (!user.roles || !user.roles.length) {
        const token = user.accessToken || user.token || getAuthToken();
        const roles = extractRolesFromToken(token);
        if (roles.length) user.roles = roles;
      }
    }
    return user;
  } catch (e) {
    return null;
  }
}

export function setCurrentUser(user) {
  if (user) {
    if (!user.roles || !user.roles.length) {
      const token = user.accessToken || user.token || getAuthToken();
      const roles = extractRolesFromToken(token);
      if (roles.length) user.roles = roles;
    }
    localStorage.setItem('orbit_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('orbit_user');
  }
}

export async function apiClient(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  const token = getAuthToken();

  const headers = {
    ...(options.headers || {})
  };

  // Don't override Content-Type if sending FormData
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (response.status === 401 && getRefreshToken() && !options._retry) {
    // Attempt token refresh
    try {
      const refreshRes = await fetch(`${API_BASE}/api/Auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken: getRefreshToken() })
      });
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        const newAccessToken = refreshData.accessToken || refreshData.token;
        const newRefreshToken = refreshData.refreshToken;
        setTokens(newAccessToken, newRefreshToken);

        const currentUser = getCurrentUser();
        if (currentUser) {
          const roles = extractRolesFromToken(newAccessToken);
          if (roles.length) currentUser.roles = roles;
          currentUser.accessToken = newAccessToken;
          setCurrentUser(currentUser);
        }

        options._retry = true;
        const retryHeaders = {
          ...headers,
          'Authorization': `Bearer ${newAccessToken}`
        };
        return apiClient(endpoint, { ...options, headers: retryHeaders });
      }
    } catch (e) {
      console.warn('Failed to refresh token', e);
      clearTokens();
    }
  }

  if (!response.ok) {
    let errorMsg = 'An error occurred';
    try {
      const errorData = await response.json();
      errorMsg = errorData.message || errorData.error || errorData.title || JSON.stringify(errorData);
    } catch (e) {
      errorMsg = `HTTP ${response.status}: ${response.statusText}`;
    }
    const err = new Error(errorMsg);
    err.status = response.status;
    throw err;
  }

  // If 204 No Content
  if (response.status === 204) return null;

  try {
    return await response.json();
  } catch (e) {
    return null;
  }
}
