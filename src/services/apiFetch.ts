import { API_BASE_URL } from '../config/database';

export const ACCESS_TOKEN_STORAGE_KEY = 'mars_rover_access_token';
export const REFRESH_TOKEN_STORAGE_KEY = 'mars_rover_refresh_token';
export const TOKEN_EXPIRES_AT_STORAGE_KEY = 'mars_rover_token_expires_at';

const originalFetch = window.fetch.bind(window);
let refreshPromise: Promise<boolean> | null = null;

const isApiUrl = (input: RequestInfo | URL): boolean => {
  const rawUrl = typeof input === 'string'
    ? input
    : input instanceof URL
      ? input.toString()
      : input.url;

  return rawUrl.startsWith(API_BASE_URL);
};

const isAuthEndpoint = (input: RequestInfo | URL): boolean => {
  const rawUrl = typeof input === 'string'
    ? input
    : input instanceof URL
      ? input.toString()
      : input.url;

  return rawUrl.startsWith(`${API_BASE_URL}/auth/login`)
    || rawUrl.startsWith(`${API_BASE_URL}/auth/refresh`);
};

const buildInitWithAuth = (init?: RequestInit): RequestInit => {
  const accessToken = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
  if (!accessToken) {
    return init || {};
  }

  const headers = new Headers(init?.headers || {});
  if (!headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  return {
    ...init,
    headers,
  };
};

export const clearStoredSession = () => {
  localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  localStorage.removeItem(TOKEN_EXPIRES_AT_STORAGE_KEY);
  localStorage.removeItem('token');
};

export const storeSessionTokens = (session: {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
}) => {
  if (session.accessToken) {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, session.accessToken);
  }

  if (session.refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, session.refreshToken);
  }

  if (session.expiresAt) {
    localStorage.setItem(TOKEN_EXPIRES_AT_STORAGE_KEY, String(session.expiresAt));
  }
};

const refreshSession = async (): Promise<boolean> => {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
    if (!refreshToken) {
      clearStoredSession();
      return false;
    }

    const response = await originalFetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      clearStoredSession();
      return false;
    }

    const data = await response.json();
    storeSessionTokens(data);
    return true;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
};

export const installAuthenticatedFetch = () => {
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    if (!isApiUrl(input) || isAuthEndpoint(input)) {
      return originalFetch(input, init);
    }

    const response = await originalFetch(input, buildInitWithAuth(init));
    if (response.status !== 401 && response.status !== 403) {
      return response;
    }

    const refreshed = await refreshSession();
    if (!refreshed) {
      window.dispatchEvent(new Event('mars-rover-auth-expired'));
      return response;
    }

    return originalFetch(input, buildInitWithAuth(init));
  };
};
