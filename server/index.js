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
  }
}
const OPENCLAW_GW = process.env.OPENCLAW_GW || 'ws://127.0.0.1:18789';

// --- App setup ---
const app = express();
const server = http.createServer(app);
const store = new Store(DATA_DIR);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", 'ws:', 'wss:'],
    },
  },
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowed = ['http://localhost:8843', 'http://127.0.0.1:8843', 'http://localhost:8844', 'http://127.0.0.1:8844'];
    if (origin.match(/^https?:\/\/192\.168\..*?:884[34]$/)) return callback(null, true);
    if (origin.match(/^https?:\/\/ai\.wembassy\.com$/)) return callback(null, true);
    if (allowed.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Rate limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts. Try again later.' },
});
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 120,
  message: { error: 'Rate limit exceeded.' },
});
app.use('/api/', apiLimiter);

// --- Input validation helpers ---
function validateColor(color) {
  if (!color) return '#4a90d9';
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) return null;
  return color;
}

function validateDepartmentInput(body, isUpdate = false) {
  const errors = [];
  if (!isUpdate || body.name !== undefined) {
    if (!body.name || typeof body.name !== 'string' || body.name.length > 100) {
      errors.push('Department name is required (max 100 chars)');
    }
  }
  if (!isUpdate || body.executiveAgentId !== undefined) {
    if (!body.executiveAgentId || typeof body.executiveAgentId !== 'string' || body.executiveAgentId.length > 50) {
      errors.push('Executive agent ID is required (max 50 chars)');
    }
  }
  if (body.description !== undefined && typeof body.description !== 'string') {
    errors.push('Description must be a string');
  }
  if (body.color !== undefined) {
    const color = validateColor(body.color);
    if (color === null) {
      errors.push('Color must be a valid hex color (e.g., #4a90d9)');
    }
  }
  return errors;
}

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
  const errors = validateDepartmentInput(req.body);
  if (errors.length > 0) return res.status(400).json({ error: errors.join('; ') });
  const { name, executiveAgentId, description, color } = req.body;
  const dept = store.addDepartment({
    name,
    executiveAgentId,
    description: description || '',
    color: validateColor(color) || '#4a90d9',
  });
  res.status(201).json({ department: dept });
});

app.put('/api/departments/:id', authMiddleware(JWT_SECRET), (req, res) => {
  const errors = validateDepartmentInput(req.body, true);
  if (errors.length > 0) return res.status(400).json({ error: errors.join('; ') });
  const { id } = req.params;
  // Sanitize color before update
  if (req.body.color !== undefined) {
    req.body.color = validateColor(req.body.color) || '#4a90d9';
  }
  const updated = store.updateDepartment(id, req.body);
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
    if (!resp.ok) return res.status(resp.status).json({ error: `OpenProject API error: ${resp.status}` });
    const text = await resp.text();
    if (text.length > 10 * 1024 * 1024) return res.status(502).json({ error: 'Response too large' });
    res.json(JSON.parse(text));
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
    const { project_id } = req.query;
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
    if (!resp.ok) return res.status(resp.status).json({ error: `OpenProject API error: ${resp.status}` });
    const text = await resp.text();
    if (text.length > 10 * 1024 * 1024) return res.status(502).json({ error: 'Response too large' });
    res.json(JSON.parse(text));
  } catch (err) {
    console.error('[OpenProject] proxy error:', err.message);
    res.status(502).json({ error: 'Failed to reach OpenProject' });
  }
});

app.put('/api/openproject/config', authMiddleware(JWT_SECRET), (req, res) => {
  const { url, apiKey } = req.body;
  if (url && typeof url === 'string') {
    try { new URL(url); } catch { return res.status(400).json({ error: 'Invalid URL' }); }
  }
  store.setOpenProjectConfig({ url, apiKey });
  res.json({ success: true, configured: !!(url && apiKey) });
});

app.get('/api/openproject/config', authMiddleware(JWT_SECRET), (req, res) => {
  const config = store.getOpenProjectConfig();
  res.json({ url: config.url, configured: !!(config.url && config.apiKey) });
});

// --- SuiteCRM proxy ---
app.get('/api/suitecrm/contacts', authMiddleware(JWT_SECRET), async (req, res) => {
  try {
    const config = store.getSuiteCRMConfig();
    if (!config.url || !config.apiKey) {
      return res.status(400).json({ error: 'SuiteCRM not configured' });
    }
    const apiUrl = `${config.url.replace(/\/$/, '')}/Api/V8/module/Contacts`;
    const resp = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    if (!resp.ok) return res.status(resp.status).json({ error: `SuiteCRM API error: ${resp.status}` });
    const text = await resp.text();
    if (text.length > 10 * 1024 * 1024) return res.status(502).json({ error: 'Response too large' });
    res.json(JSON.parse(text));
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

// --- OpenClaw gateway config ---
app.get('/api/openclaw/config', authMiddleware(JWT_SECRET), (req, res) => {
  res.json({ gatewayUrl: OPENCLAW_GW });
});

// --- Serve static files in production ---
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'dist');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    // Only catch non-API routes
    app.get(/^(?!\/api\/).*/, (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

// --- WebSocket server for OpenClaw chat relay ---
const wss = new WebSocketServer({ server, path: '/ws/chat' });

// WebSocket rate limiting (per connection)
const WS_MSG_LIMIT = 60; // messages per minute
const WS_MSG_WINDOW = 60 * 1000;

wss.on('connection', (clientWs, req) => {
  // Authenticate via first message (not URL params to avoid log leakage)
  let authenticated = false;
  let msgCount = 0;
  let msgWindowStart = Date.now();

  clientWs.on('message', (raw) => {
    // Rate limit
    const now = Date.now();
    if (now - msgWindowStart > WS_MSG_WINDOW) {
      msgWindowStart = now;
      msgCount = 0;
    }
    msgCount++;
    if (msgCount > WS_MSG_LIMIT) {
      clientWs.send(JSON.stringify({ type: 'error', message: 'WebSocket rate limit exceeded' }));
      return;
    }

    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    // First message must be authentication
    if (!authenticated) {
      if (msg.type !== 'auth' || !msg.token) {
        clientWs.close(1008, 'Authentication required');
        return;
      }
      try {
        jwt.verify(msg.token, JWT_SECRET);
        authenticated = true;
        clientWs.send(JSON.stringify({ type: 'auth_ok' }));
      } catch {
        clientWs.close(1008, 'Invalid token');
      }
      return;
    }

    let gatewayWs = null;
    let msgId = 1;
    const pending = new Map();

    if (msg.type === 'connect') {
      // Always use server-configured gateway URL (prevent SSRF)
      const gwUrl = OPENCLAW_GW;
      try {
        gatewayWs = new WebSocket(gwUrl);
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
        clientWs.send(JSON.stringify({ type: 'gateway_message', data: gwMsg }));
        if (gwMsg.id && pending.has(gwMsg.id)) {
          const p = pending.get(gwMsg.id);
          pending.delete(gwMsg.id);
          if (gwMsg.error) p.reject(gwMsg.error);
          else p.resolve(gwMsg.result ?? gwMsg.data);
        }
      });
      gatewayWs.on('close', (code, reason) => {
        clientWs.send(JSON.stringify({ type: 'gateway_disconnected', code, reason: reason.toString() }));
        pending.clear();
      });
      gatewayWs.on('error', () => {
        clientWs.send(JSON.stringify({ type: 'error', message: 'Gateway error' }));
      });
    } else if (msg.type === 'rpc' && gatewayWs && gatewayWs.readyState === WebSocket.OPEN) {
      const id = msgId++;
      const timeout = setTimeout(() => {
        if (pending.has(id)) {
          pending.delete(id);
          clientWs.send(JSON.stringify({ type: 'rpc_error', id: msg.id, error: 'Timeout' }));
        }
      }, 15000);
      pending.set(id, {
        resolve: (result) => {
          clearTimeout(timeout);
          clientWs.send(JSON.stringify({ type: 'rpc_result', id: msg.id, result }));
        },
        reject: (error) => {
          clearTimeout(timeout);
          clientWs.send(JSON.stringify({ type: 'rpc_error', id: msg.id, error }));
        },
      });
      gatewayWs.send(JSON.stringify({ id, method: msg.method, params: msg.params || {} }));
    } else if (msg.type === 'send_message' && gatewayWs && gatewayWs.readyState === WebSocket.OPEN) {
      const id = msgId++;
      const timeout = setTimeout(() => {
        if (pending.has(id)) {
          pending.delete(id);
          clientWs.send(JSON.stringify({ type: 'message_error', id: msg.id, error: 'Timeout' }));
        }
      }, 15000);
      pending.set(id, {
        resolve: (result) => {
          clearTimeout(timeout);
          clientWs.send(JSON.stringify({ type: 'message_sent', id: msg.id, result }));
        },
        reject: (error) => {
          clearTimeout(timeout);
          clientWs.send(JSON.stringify({ type: 'message_error', id: msg.id, error }));
        },
      });
      gatewayWs.send(JSON.stringify({
        id,
        method: 'sessions.send',
        params: { sessionKey: msg.sessionKey, message: msg.message },
      }));
    }
  });

  clientWs.on('close', () => {
    // Cleanup is handled per-connection above
  });
});

// --- Start ---
server.listen(PORT, () => {
  console.log(`[OpenClaw Office] Backend running on http://localhost:${PORT}`);
  console.log(`[OpenClaw Office] WebSocket chat relay on ws://localhost:${PORT}/ws/chat`);
  console.log(`[OpenClaw Office] OpenClaw gateway target: ${OPENCLAW_GW}`);
});