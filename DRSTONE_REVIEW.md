# DrStone Adversarial Code Review — OpenClaw Office v2

**Branch:** `feature/departments-auth-integrations`  
**Date:** 2026-09-03  
**Reviewer:** DrStone (adversarial code reviewer)

---

## 1. CRITICAL Issues (Must Fix Before PR)

### C1. SSRF via Client-Controlled Gateway URL in WebSocket Relay
**File:** `server/index.js` (WebSocket `connect` handler, ~line 280)

The WebSocket relay allows the client to specify an arbitrary `gatewayUrl`:
```js
const gwUrl = msg.gatewayUrl || OPENCLAW_GW;
const fullUrl = gwToken ? `${gwUrl}?token=${encodeURIComponent(gwToken)}` : gwUrl;
gatewayWs = new WebSocket(fullUrl);
```

Any authenticated user can instruct the server to open a WebSocket connection to **any URL**, including internal services (`http://169.254.169.254/`, `http://localhost:3000/`, etc.). This is a textbook **Server-Side Request Forgery (SSRF)** vulnerability. The server will attempt to connect to whatever URL the client provides, and any response data is forwarded back to the client via `gateway_message`.

**Fix:** Either (a) ignore `msg.gatewayUrl` entirely and always use `OPENCLAW_GW` from server env, or (b) validate the URL against an allowlist of known gateway hosts.

### C2. Gateway Token Exposed to Frontend (Stored in localStorage)
**File:** `src/office-view.ts` (~line 100), `src/settings.ts` (~line 150)

The OpenClaw gateway token is stored in `localStorage` and sent to the server via WebSocket:
```js
gatewayToken: localStorage.getItem('oc_gateway_token') || '',
```

The settings page lets users enter the gateway token, which is stored in `localStorage` — accessible to any XSS payload. The token is then sent through the WebSocket relay to connect to the gateway. If any XSS vulnerability exists in the app (see C3), the gateway token can be stolen.

**Fix:** Store the gateway token server-side (like OpenProject/SuiteCRM API keys) and never send it to the frontend. The server already knows `OPENCLAW_GW` from env vars.

### C3. XSS via Department Color Field
**File:** `src/settings.ts` (~line 97)

Department colors are rendered in inline styles without sanitization:
```js
list.innerHTML = depts.map((d) => `
  <div class="dept-item">
    <span class="dept-item-color" style="background: ${d.color}"></span>
```

The `color` field from the API is injected directly into an HTML `style` attribute. While the server validates `name` (max 100 chars), there is **no validation on `color`**. An attacker could set a color value like:
```
red"></span><script>alert(document.cookie)</script><span style="background: blue
```
This would execute arbitrary JavaScript in the browser. The `escapeHtml` function is not applied to `d.color`.

Similarly in `office-view.ts` line 21:
```js
<span class="office-dept-dot" style="background: ${department.color}"></span>
```

**Fix:** Validate `color` on the server side to be a valid hex color (`/^#[0-9a-fA-F]{6}$/`). Also sanitize all dynamic values inserted into `innerHTML`.

### C4. Default Admin Credentials Logged to Console
**File:** `server/store.js` (~line 38), `src/login.ts` (~line 24)

The server logs the default password on startup:
```js
console.log('[Store] Created default admin user (password: openclaw2026)');
```

The login page displays: `Default credentials: admin / openclaw2026`. If the default password is not changed after deployment, any attacker who can reach the login page gets full admin access. The password `openclaw2026` is weak and guessable.

**Fix:** 
- Do not log the password to stdout.
- Remove the hint from the login page.
- Force password change on first login.
- Generate a random password on first boot and write it to a file the admin must read.

### C5. No Rate Limiting on WebSocket Messages
**File:** `server/index.js` (WebSocket section)

The `apiLimiter` (120 req/min) only applies to HTTP endpoints. WebSocket messages bypass rate limiting entirely. An authenticated user can flood the WebSocket relay with messages, which are forwarded to the OpenClaw gateway, potentially causing denial-of-service.

**Fix:** Add per-connection message rate limiting in the WebSocket handler.

### C6. JWT Token in WebSocket Query Parameter — Logged/Leakable
**File:** `src/api.ts` (~line 113), `server/index.js` (~line 256)

The JWT is passed as a URL query parameter to the WebSocket:
```js
return new WebSocket(`${wsUrl}/ws/chat?token=${encodeURIComponent(token)}`);
```

WebSocket URLs are often logged by proxies, load balancers, and server access logs. This exposes the JWT in cleartext in log files. It also appears in browser history in some implementations.

**Fix:** Use a protocol-level authentication (send JWT as the first message after connection) instead of URL parameters. Alternatively, use a short-lived one-time WebSocket ticket.

---

## 2. IMPORTANT Issues (Should Fix)

### I1. Pending RPC Map Never Cleaned Up — Memory Leak in WebSocket
**File:** `server/index.js` (~line 270-340)

The `pending` Map in the WebSocket handler stores promises for RPC calls but has **no timeout mechanism**. If the gateway never responds (connection drops silently, network issue), entries remain in the map forever. Over time with many connections and failed RPCs, this leaks memory.

Additionally, when `clientWs` closes, the `pending` Map is not cleared — only `gatewayWs` is closed.

**Fix:** Add a timeout for each pending entry (like the 15s timeout in `openclaw-bridge.ts`). Clear `pending` on `clientWs.close`.

### I2. `gatewayConnections` Map Declared but Never Used
**File:** `server/index.js` (line 251)

```js
const gatewayConnections = new Map(); // deptId -> { ws, pending, msgId }
```

This map is declared but never populated or read. It appears to be leftover from a planned feature. Dead code that suggests an incomplete implementation.

### I3. Race Condition in JSON Store
**File:** `server/store.js`

The store uses synchronous writes with atomic rename (`_save` writes to `.tmp` then renames), which is good for crash safety. However, the in-memory state (`this.data`) is not protected against concurrent requests in the same event loop tick. Multiple rapid `addDepartment` calls could both read the same `this.data.departments` array, both push to it, and both call `_save` — with the second save overwriting the first.

In practice, Node.js is single-threaded so this is unlikely for synchronous operations, but if any async operation reads `this.data` and then later writes, a race could occur.

**Fix:** Use a write lock/queue or serialize all writes through a single function.

### I4. No Input Validation on Department Update
**File:** `server/index.js` (~line 107)

```js
app.put('/api/departments/:id', authMiddleware(JWT_SECRET), (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const updated = store.updateDepartment(id, updates);
```

The `updates` object is passed directly to `store.updateDepartment`, which does whitelist fields (`name`, `executiveAgentId`, `description`, `color`), but there's no validation on the values. A user could set `name` to an empty string, a 10MB string, or `color` to a malicious value (see C3). The `name` length validation that exists on POST is missing on PUT.

**Fix:** Apply the same validation on PUT as on POST.

### I5. No Path Traversal Protection (Low Risk, but Worth Noting)
**File:** `server/store.js` (line 13)

```js
this.dbPath = path.join(dataDir, 'office.json');
```

The data directory is hardcoded (not user-controlled), so path traversal is not directly exploitable. However, if the `DATA_DIR` env var were ever introduced, it should be validated.

### I6. CORS Allows `null` Origin (Same-Origin/Curl Bypass)
**File:** `server/index.js` (~line 56)

```js
if (!origin) return callback(null, true); // allow same-origin/curl
```

Allowing requests with no `Origin` header means any tool (curl, Postman, scripts) can call the API without CORS restrictions. While this is intentional for CLI usage, it means any non-browser HTTP client can bypass CORS entirely. Combined with the lack of CSRF tokens, this is a defense-in-depth gap.

### I7. Helmet CSP Disabled
**File:** `server/index.js` (~line 48)

```js
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
```

CSP is disabled, meaning XSS attacks (like C3) can execute without CSP blocking them. In production, a strict CSP should be configured.

**Fix:** Enable CSP with appropriate directives for the single-file build.

### I8. OpenProject/SuiteCRM Proxy — No Response Size Limit
**File:** `server/index.js` (OpenProject and SuiteCRM proxy handlers)

The proxy endpoints fetch and forward the full response from third-party APIs:
```js
const data = await resp.json();
res.json(data);
```

There's no limit on response size. A misconfigured or compromised OpenProject/SuiteCRM instance could return a multi-GB response, causing the Node.js server to OOM.

**Fix:** Add a response size limit (e.g., 10MB) and stream large responses.

### I9. WebSocket `send_message` — No Validation of `sessionKey`
**File:** `server/index.js` (~line 335)

```js
chatWs.send(JSON.stringify({
  type: 'send_message',
  sessionKey: currentSessionKey,
  message: text,
}));
```

The `sessionKey` is validated client-side only (found from `sessions.list`). An attacker could send a message to any session key, including sessions belonging to other agents. The server relay does not validate that the authenticated user has access to the target session.

**Fix:** Validate the session key against the department's executive agent ID on the server side.

### I10. Voice Controller — `ttsEnabled` Property Not Reactive
**File:** `src/voice.ts`

The `VoiceController` interface has a `ttsEnabled` property, but it's a boolean primitive, not a getter. The value is captured at construction time:
```js
return {
  destroy() { ... },
  speak,
  ttsEnabled: false,  // Always false!
};
```

The `ttsEnabled` field on the returned object is always `false` even after the user toggles TTS on. The internal `ttsEnabled` variable is updated by the `dblclick` handler, but the returned object's `ttsEnabled` property is never updated. This means `office-view.ts`'s check:
```js
if (voiceController?.ttsEnabled) { voiceController.speak(...) }
```
will **never** trigger TTS.

**Fix:** Use a getter: `get ttsEnabled() { return ttsEnabled; }` instead of a static property.

### I11. No WebSocket Reconnection Logic in Office View
**File:** `src/office-view.ts`

When the chat WebSocket closes, the handler just updates status to 'offline' and logs it. There's no reconnection attempt. The user must navigate away and back to restore the connection.

**Fix:** Implement exponential backoff reconnection, or at minimum show a "Reconnect" button.

### I12. OpenClaw Gateway Chat — Fragile Session Discovery
**File:** `src/office-view.ts` (`handleGatewayMessage`)

The session discovery logic tries to find a session matching `department.executiveAgentId` by string-matching on session keys:
```js
s.key.includes(department.executiveAgentId) && s.key.includes(':main')
```

This is fragile. If the agent ID is "cto", it would match session keys like `agent:cto:main` but also `agent:cto_backup:main`. There's no exact matching.

**Fix:** Use exact parsing of the session key format (e.g., `agent:${executiveAgentId}:main`).

---

## 3. MINOR Issues (Nice to Fix)

### M1. `chatMessages` Module-Level State — Stale Data Between Views
**File:** `src/office-view.ts`

`chatMessages`, `isWaitingForResponse`, `currentSessionKey` are module-level variables. If a user visits department A's office, goes back to city, then visits department B's office, the `cleanup()` function resets these, but there's a brief window where stale messages could flash before the new view renders.

### M2. Polling Fallback in `openclaw-bridge.ts` Runs Forever
**File:** `src/openclaw-bridge.ts` (`startPolling`)

```js
setInterval(() => { ... }, POLL_INTERVAL_MS);
```

This interval runs for the lifetime of the page with no cleanup. If the user navigates away from the office view (but the SPA stays loaded), the polling continues. Not a major issue but wasteful.

### M3. `pixelFont.drawText` — Missing `color` Parameter in City View Calls
**File:** `src/city-view.ts`

Calls like `pixelFont.drawText(ctx, dept.name.toUpperCase(), signX + 4, signY + 2, 1)` don't pass a color, so it defaults to `'#fff'`. This works but is inconsistent — some places set `ctx.fillStyle` before calling, which gets immediately overwritten inside `drawText` (line: `ctx.fillStyle = color`).

### M4. TypeScript: `any` Types Used Extensively
**Files:** `src/office-view.ts`, `src/openclaw-bridge.ts`, `src/api.ts`

Many variables and parameters use `any` type:
- `handleGatewayMessage(data: any, ...)`
- `msg: any` in WebSocket handlers
- `const result = await api.departments.list()` returns `any`

This defeats the purpose of TypeScript strict mode. The `tsconfig.json` has `"strict": true` but the code doesn't leverage it.

### M5. `office-view.ts` — `drawSimpleOffice` Uses `ctx.font` Instead of Pixel Font
**File:** `src/office-view.ts` (~line 220)

```js
ctx.font = '6px monospace';
ctx.fillText(dept.name.toUpperCase(), 120, 34);
```

This mixes canvas font rendering with the custom pixel font system. The 6px font will be nearly unreadable and inconsistent with the rest of the pixel art.

### M6. `app.ts` — No Error Boundary for View Transitions
**File:** `src/app.ts`

If `renderCityView`, `renderOfficeView`, or `renderSettings` throws, the app will show a blank screen with no error message. There's no try/catch around view rendering.

### M7. No HTTPS Enforcement
**File:** `server/index.js`

The server listens on plain HTTP. While it's likely behind a reverse proxy in production, there's no `Strict-Transport-Security` header (Helmet includes it but it's not configured) and no redirect from HTTP to HTTPS.

### M8. Package.json — No `engines` Field
**File:** `package.json`

No Node.js version constraint. The code uses `fetch` (Node 18+) and `crypto.scryptSync`, but there's no `engines` field to prevent installation on older Node versions.

### M9. `openclaw-bridge.ts` — RPC Pending Map Never Cleaned on Disconnect
**File:** `src/openclaw-bridge.ts`

When the WebSocket disconnects (ws.onclose), the `pending` Map is not cleared. Pending RPC promises will hang until their 15s timeout. Not critical, but could cause a brief flurry of rejected promises on reconnect.

### M10. `city-view.ts` — No Department List Refresh
**File:** `src/app.ts` (`navigateToCity`)

When returning from an office view to the city view, `navigateToCity` re-fetches departments. But if the fetch fails, `cachedDepartments` is set to `[]` and the city shows zero buildings. The previous cached list is lost.

### M11. Static File Catch-All Could Serve API Routes as HTML
**File:** `server/index.js` (~line 239)

```js
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});
```

This catch-all is registered after API routes, so `/api/foo` hits the API router first. But unknown `/api/` paths that don't match any route will fall through to the catch-all and return `index.html` instead of a 404 JSON response.

---

## 4. Overall Assessment

### Summary

The codebase is a **prototype-quality** implementation with several real security issues that must be addressed before merging to main. The architecture is sound — JWT auth, server-side API key storage, proxy pattern, WebSocket relay — but the execution has gaps.

### Security Posture: ⚠️ Needs Work

| Area | Rating | Notes |
|------|--------|-------|
| Authentication | ✅ Good | JWT with scrypt (N=16384, r=8, p=1) is adequate. Secret persists to disk. |
| Authorization | ⚠️ Weak | No session-key authorization on WebSocket relay. Any user can message any session. |
| Input Validation | ❌ Poor | Missing validation on PUT updates, color field, session keys. |
| API Key Protection | ✅ Good | Keys stored server-side, never exposed in GET responses. |
| CORS | ⚠️ Moderate | Allows null origin (curl). LAN regex is reasonable but broad. |
| Rate Limiting | ⚠️ Partial | HTTP endpoints limited, WebSocket is not. |
| XSS Prevention | ❌ Fail | Color field allows inline script injection. CSP disabled. |
| SSRF | ❌ Fail | Client-controlled gateway URL enables SSRF. |
| JWT in URL | ⚠️ Bad Practice | Token in WebSocket query param is log-leakable. |

### Feature Completeness: ⚠️ Partial

| Feature | Status | Notes |
|---------|--------|-------|
| JWT Auth | ✅ Works | Login, verify, change password all functional. |
| Department CRUD | ✅ Works | Create, list, update, delete functional. |
| OpenProject Proxy | ✅ Works | Projects and work packages proxied. |
| SuiteCRM Proxy | ✅ Works | Contacts proxied. |
| Pixel City View | ✅ Works | Canvas rendering with click-to-enter. |
| Office Room View | ⚠️ Partial | Pixel art works, chat has a TTS bug (I10). |
| Voice Controller | ❌ TTS Broken | `ttsEnabled` always returns false (I10). STT may work. |
| WebSocket Relay | ⚠️ Works but insecure | SSRF (C1), no session validation (I9), no rate limiting (C5). |
| OpenClaw Chat End-to-End | ⚠️ Fragile | Session discovery via string matching (I12). No reconnection (I11). |

### Recommendations

1. **Block PR** until C1-C6 are fixed.
2. Fix I10 (TTS bug) — it makes a headline feature non-functional.
3. Add server-side validation for all inputs (color, session keys, update fields).
4. Move gateway token to server-side storage.
5. Enable CSP in production.
6. Add WebSocket rate limiting.
7. Replace URL-based JWT with message-based auth for WebSocket.

### Code Quality

The code is readable and well-organized. The separation between frontend (TypeScript/Vite) and backend (Node.js/Express) is clean. However, TypeScript is used in name only — pervasive `any` types mean the compiler catches almost nothing. The pixel art rendering is creative but the canvas code is monolithic.

---

*Review by DrStone — adversarial code reviewer*