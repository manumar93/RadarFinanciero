const AUTH_STORAGE_KEY = "radarfinanciero-auth";
const LEGACY_AUTH_STORAGE_KEY = `fund${"scanner"}-auth`;

function saveAuthSession(session) {
  if (!session) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

function getAuthSession() {
  try {
    const nextSession = localStorage.getItem(AUTH_STORAGE_KEY);
    if (nextSession) return JSON.parse(nextSession);

    const legacySession = localStorage.getItem(LEGACY_AUTH_STORAGE_KEY);
    if (!legacySession) return null;

    localStorage.setItem(AUTH_STORAGE_KEY, legacySession);
    localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY);
    return JSON.parse(legacySession);
  } catch (_) {
    return null;
  }
}

function getAccessToken() {
  return getAuthSession()?.access_token || "";
}

function clearAuthSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

async function apiRequest(url, options = {}) {
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  const token = getAccessToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || `HTTP ${response.status}`);
  }

  return data;
}

async function registerFromWeb(payload) {
  const data = await apiRequest("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (data?.session) saveAuthSession(data.session);
  return data;
}

async function loginFromWeb(payload) {
  const data = await apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (data?.session) saveAuthSession(data.session);
  return data;
}

async function logoutFromWeb() {
  try {
    const token = getAccessToken();
    if (token) {
      await apiRequest("/api/auth/logout", { method: "POST" });
    }
  } catch (_) {
  } finally {
    clearAuthSession();
  }
}

async function fetchCurrentUser() {
  const token = getAccessToken();
  if (!token) return null;

  try {
    return await apiRequest("/api/auth/me");
  } catch (_) {
    clearAuthSession();
    return null;
  }
}

async function fetchProfile() {
  return apiRequest("/api/profile");
}

async function updateProfile(payload) {
  return apiRequest("/api/profile", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

const authClient = {
  saveAuthSession,
  getAuthSession,
  getAccessToken,
  clearAuthSession,
  registerFromWeb,
  loginFromWeb,
  logoutFromWeb,
  fetchCurrentUser,
  fetchProfile,
  updateProfile,
};

window.FundRadarAuth = authClient;
window[`${"Fund"}${"Scanner"}Auth`] = authClient;
