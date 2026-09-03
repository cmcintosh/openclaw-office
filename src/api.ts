/**
 * Backend API client — handles auth, departments, and third-party integrations.
 * All requests use JWT from localStorage.
 */

const API_BASE = (window as any).__OFFICE_API_BASE__ || '';
const WS_BASE = (window as any).__OFFICE_WS_BASE__ || '';

function getToken(): string | null {
  return localStorage.getItem('office_jwt');
}

function setToken(token: string): void {
  localStorage.setItem('office_jwt', token);
}

function clearToken(): void {
  localStorage.removeItem('office_jwt');
}

async function request(method: string, path: string, body?: any): Promise<any> {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  const resp = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (resp.status === 401) {
    clearToken();
    throw new Error('Authentication expired');
  }
  const data = await resp.json();
  if (!resp.ok) throw new Error(data.error || `HTTP ${resp.status}`);
  return data;
}

// --- Auth ---
export const auth = {
  async login(username: string, password: string): Promise<{ token: string; user: any }> {
    const resp = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'Login failed');
    setToken(data.token);
    return data;
  },

  async verify(): Promise<boolean> {
    const token = getToken();
    if (!token) return false;
    try {
      const resp = await fetch(`${API_BASE}/api/auth/verify`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      return resp.ok;
    } catch {
      return false;
    }
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await request('POST', '/api/auth/change-password', { currentPassword, newPassword });
  },

  logout(): void {
    clearToken();
  },

  getToken,
  setToken,
};

// --- Departments ---
export const departments = {
  list: () => request('GET', '/api/departments'),
  create: (data: { name: string; executiveAgentId: string; description?: string; color?: string }) =>
    request('POST', '/api/departments', data),
  update: (id: string, data: any) => request('PUT', `/api/departments/${id}`, data),
  delete: (id: string) => request('DELETE', `/api/departments/${id}`),
};

// --- OpenProject ---
export const openproject = {
  getConfig: () => request('GET', '/api/openproject/config'),
  setConfig: (url: string, apiKey: string) => request('PUT', '/api/openproject/config', { url, apiKey }),
  getProjects: () => request('GET', '/api/openproject/projects'),
  getWorkPackages: (projectId?: string) =>
    request('GET', '/api/openproject/work-packages' + (projectId ? `?project_id=${projectId}` : '')),
};

// --- SuiteCRM ---
export const suitecrm = {
  getConfig: () => request('GET', '/api/suitecrm/config'),
  setConfig: (url: string, apiKey: string) => request('PUT', '/api/suitecrm/config', { url, apiKey }),
  getContacts: () => request('GET', '/api/suitecrm/contacts'),
};

// --- OpenClaw ---
export const openclaw = {
  getConfig: () => request('GET', '/api/openclaw/config'),
};

// --- WebSocket chat relay ---
export function createChatSocket(): WebSocket {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = WS_BASE || `${wsProtocol}//${window.location.host}`;
  return new WebSocket(`${wsUrl}/ws/chat?token=${encodeURIComponent(token)}`);
}