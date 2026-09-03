/**
 * OpenClaw Office — Backend Server
 * 
 * Provides: JWT auth, department management, OpenProject proxy,
 * SuiteCRM proxy, and OpenClaw gateway WebSocket proxy.
 * 
 * Security: All endpoints (except /api/auth/login) require valid JWT.
 * API keys for third-party services are stored server-side only.
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const { WebSocket, WebSocketServer } = require('ws');
const http = require('http');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const { Store } = require('./store');
const { authMiddleware, loginHandler, changePasswordHandler } = require('./auth');

const PORT = process.env.PORT || 8844;
const DATA_DIR = path.join(__dirname, 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

// JWT secret: use env var or persist a generated one to disk
let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  const secretPath = path.join(DATA_DIR, 'jwt-secret.key');
  try {
    JWT_SECRET = fs.readFileSync(secretPath, 'utf8').trim();
  } catch {
    JWT_SECRET = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(secretPath, JWT_SECRET, { mode: 0o600 });
    console.log('[Auth] Generated new JWT secret and saved to disk.');
  }
}
const OPENCLAW_GW = process.env.OPENCLAW_GW || 'ws://127.0.0.1:18789';

// --- App setup ---
const app = express();
const server = http.createServer(app);
const store = new Store(path.join(__dirname, 'data'));

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Vite handles CSP in dev
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({
  origin: (origin, callback) => {
    // Allow same-origin and configured origins
    if (!origin) return callback(null, true); // allow same-origin/curl
    const allowed = ['http://localhost:8843', 'http://127.0.0.1:8843', 'http://localhost:8844', 'http://127.0.0.1:8844'];
    // Also allow LAN access
    if (origin.match(/^https?:\/\/192\.168\..*?:884[34]$/)) return callback(null, true);
    if (allowed.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Rate limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 10,
  message: { error: 'Too many login attempts. Try again later.' },
});
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 120,
  message: { error: 'Rate limit exceeded.' },
});
app.use('/api/', apiLimiter);

// --- Auth routes ---
app.post('/api/auth/login', loginLimiter, (req, res) => loginHandler(req, res, store, JWT_SECRET));
app.post('/api/auth/change-password', authMiddleware(JWT_SECRET), (req, res) =>
  changePasswordHandler(req, res, store, JWT_SECRET),
);
app.get('/api/auth/verify', authMiddleware(JWT_SECRET), (req, res) => {
  res.json({ valid: true, user: req.user });
});

// --- Department routes ---
app.get('/api/departments', authMiddleware(JWT_SECRET), (req, res) => {
  res.json({ departments: store.getDepartments() });
});

app.post('/api/departments', authMiddleware(JWT_SECRET), (req, res) => {
  const { name, executiveAgentId, description, color } = req.body;
  if (!name || typeof name !== 'string' || name.length > 100) {
    return res.status(400).json({ error: 'Department name is required (max 100 chars)' });
  }
  if (!executiveAgentId || typeof executiveAgentId !== 'string') {
    return res.status(400).json({ error: 'Executive agent ID is required' });
  }
  const dept = store.addDepartment({ name, executiveAgentId, description: description || '', color: color || '#4a90d9' });
  res.status(201).json({ department: dept });
});

app.put('/api/departments/:id', authMiddleware(JWT_SECRET), (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const updated = store.updateDepartment(id, updates);
  if (!updated) return res.status(404).json({ error: 'Department not found' });
  res.json({ department: updated });
});

app.delete('/api/departments/:id', authMiddleware(JWT_SECRET), (req, res) => {
  const { id } = req.params;
  const deleted = store.deleteDepartment(id);
  if (!deleted) return res.status(404).json({ error: 'Department not found' });
  res.json({ success: true });
});

// --- OpenProject proxy ---
app.get('/api/openproject/projects', authMiddleware(JWT_SECRET), async (req, res) => {
  try {
    const config = store.getOpenProjectConfig();
    if (!config.url || !config.apiKey) {
      return res.status(400).json({ error: 'OpenProject not configured' });
    }
    const resp = await fetch(`${config.url.replace(/\/$/, '')}/api/v3/projects`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`apikey:${config.apiKey}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
    });
    if (!resp.ok) {
      return res.status(resp.status).json({ error: `OpenProject API error: ${resp.status}` });
    }
    const data = await resp.json();
    res.json(data);
  } catch (err) {
    console.error('[OpenProject] proxy error:', err.message);
    res.status(502).json({ error: 'Failed to reach OpenProject' });
  }
});

app.get('/api/openproject/work-packages', authMiddleware(JWT_SECRET), async (req, res) => {
  try {
    const config = store.getOpenProjectConfig();
    if (!config.url || !config.apiKey) {
      return res.status(400).json({ error: 'OpenProject not configured' });
    }
    const { project_id, assignee } = req.query;
    let url = `${config.url.replace(/\/$/, '')}/api/v3/work_packages`;
    const params = new URLSearchParams();
    if (project_id) params.set('parentId', project_id);
    params.set('pageSize', '100');
    url += '?' + params.toString();
    const resp = await fetch(url, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`apikey:${config.apiKey}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
    });
    if (!resp.ok) {
      return res.status(resp.status).json({ error: `OpenProject API error: ${resp.status}` });
    }
    const data = await resp.json();
    res.json(data);
  } catch (err) {
    console.error('[OpenProject] proxy error:', err.message);
    res.status(502).json({ error: 'Failed to reach OpenProject' });
  }
});

app.put('/api/openproject/config', authMiddleware(JWT_SECRET), (req, res) => {
  const { url, apiKey } = req.body;
  if (url && typeof url === 'string') {
    // Validate URL format
    try { new URL(url); } catch { return res.status(400).json({ error: 'Invalid URL' }); }
  }
  store.setOpenProjectConfig({ url, apiKey });
  res.json({ success: true, configured: !!(url && apiKey) });
});

app.get('/api/openproject/config', authMiddleware(JWT_SECRET), (req, res) => {
  const config = store.getOpenProjectConfig();
  // Don't expose the API key
  res.json({ url: config.url, configured: !!(config.url && config.apiKey) });
});

// --- SuiteCRM proxy ---
app.get('/api/suitecrm/contacts', authMiddleware(JWT_SECRET), async (req, res) => {
  try {
    const config = store.getSuiteCRMConfig();
    if (!config.url || !config.apiKey) {
      return res.status(400).json({ error: 'SuiteCRM not configured' });
    }
    // SuiteCRM v8 REST API
    const apiUrl = `${config.url.replace(/\/$/, '')}/Api/V8/module/Contacts`;
    const resp = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    if (!resp.ok) {
      return res.status(resp.status).json({ error: `SuiteCRM API error: ${resp.status}` });
    }
    const data = await resp.json();
    res.json(data);
  } catch (err) {
    console.error('[SuiteCRM] proxy error:', err.message);
    res.status(502).json({ error: 'Failed to reach SuiteCRM' });
  }
});

app.put('/api/suitecrm/config', authMiddleware(JWT_SECRET), (req, res) => {
  const { url, apiKey } = req.body;
  if (url && typeof url === 'string') {
    try { new URL(url); } catch { return res.status(400).json({ error: 'Invalid URL' }); }
  }
  store.setSuiteCRMConfig({ url, apiKey });
  res.json({ success: true, configured: !!(url && apiKey) });
});

app.get('/api/suitecrm/config', authMiddleware(JWT_SECRET), (req, res) => {
  const config = store.getSuiteCRMConfig();
  res.json({ url: config.url, configured: !!(config.url && config.apiKey) });
});

// --- OpenClaw gateway proxy info ---
app.get('/api/openclaw/config', authMiddleware(JWT_SECRET), (req, res) => {
  res.json({ gatewayUrl: OPENCLAW_GW });
});

// --- Serve static files in production ---
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'dist');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

// --- WebSocket server for OpenClaw chat relay ---
const wss = new WebSocketServer({ server, path: '/ws/chat' });

// Track active OpenClaw gateway connections per department
const gatewayConnections = new Map(); // deptId -> { ws, pending, msgId }

wss.on('connection', (clientWs, req) => {
  // Verify JWT from query param
  const url = new URL(req.url, `http://${req.headers.host}`);
  const token = url.searchParams.get('token');
  if (!token) {
    clientWs.close(1008, 'Missing token');
    return;
  }
  try {
    jwt.verify(token, JWT_SECRET);
  } catch {
    clientWs.close(1008, 'Invalid token');
    return;
  }

  let gatewayWs = null;
  let msgId = 1;
  const pending = new Map();

  clientWs.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    if (msg.type === 'connect') {
      // Connect to OpenClaw gateway
      if (gatewayWs) { try { gatewayWs.close(); } catch {} }
      const gwUrl = msg.gatewayUrl || OPENCLAW_GW;
      const gwToken = msg.gatewayToken || '';
      const fullUrl = gwToken ? `${gwUrl}?token=${encodeURIComponent(gwToken)}` : gwUrl;
      try {
        gatewayWs = new WebSocket(fullUrl);
      } catch (e) {
        clientWs.send(JSON.stringify({ type: 'error', message: 'Failed to connect to gateway' }));
        return;
      }
      gatewayWs.on('open', () => {
        clientWs.send(JSON.stringify({ type: 'gateway_connected' }));
      });
      gatewayWs.on('message', (data) => {
        let gwMsg;
        try { gwMsg = JSON.parse(data); } catch { return; }
        // Forward to client
        clientWs.send(JSON.stringify({ type: 'gateway_message', data: gwMsg }));
        // Resolve pending RPC
        if (gwMsg.id && pending.has(gwMsg.id)) {
          const p = pending.get(gwMsg.id);
          pending.delete(gwMsg.id);
          if (gwMsg.error) p.reject(gwMsg.error);
          else p.resolve(gwMsg.result ?? gwMsg.data);
        }
      });
      gatewayWs.on('close', (code, reason) => {
        clientWs.send(JSON.stringify({ type: 'gateway_disconnected', code, reason: reason.toString() }));
      });
      gatewayWs.on('error', (err) => {
        clientWs.send(JSON.stringify({ type: 'error', message: 'Gateway error' }));
      });
    } else if (msg.type === 'rpc' && gatewayWs && gatewayWs.readyState === WebSocket.OPEN) {
      const id = msgId++;
      pending.set(id, {
        resolve: (result) => {
          clientWs.send(JSON.stringify({ type: 'rpc_result', id: msg.id, result }));
        },
        reject: (error) => {
          clientWs.send(JSON.stringify({ type: 'rpc_error', id: msg.id, error }));
        },
      });
      gatewayWs.send(JSON.stringify({ id, method: msg.method, params: msg.params || {} }));
    } else if (msg.type === 'send_message' && gatewayWs && gatewayWs.readyState === WebSocket.OPEN) {
      // Send a chat message to an OpenClaw session
      const id = msgId++;
      gatewayWs.send(JSON.stringify({
        id,
        method: 'sessions.send',
        params: { sessionKey: msg.sessionKey, message: msg.message },
      }));
      pending.set(id, {
        resolve: (result) => {
          clientWs.send(JSON.stringify({ type: 'message_sent', id: msg.id, result }));
        },
        reject: (error) => {
          clientWs.send(JSON.stringify({ type: 'message_error', id: msg.id, error }));
        },
      });
    }
  });

  clientWs.on('close', () => {
    if (gatewayWs) { try { gatewayWs.close(); } catch {} }
  });
});

// --- Start ---
server.listen(PORT, () => {
  console.log(`[OpenClaw Office] Backend running on http://localhost:${PORT}`);
  console.log(`[OpenClaw Office] WebSocket chat relay on ws://localhost:${PORT}/ws/chat`);
  console.log(`[OpenClaw Office] OpenClaw gateway target: ${OPENCLAW_GW}`);
  if (!process.env.JWT_SECRET) {
    console.warn('[WARN] JWT_SECRET not set — using random secret. Sessions will not persist across restarts.');
  }
});