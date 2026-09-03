/**
 * JWT Authentication — login, verify, change password
 * Passwords are hashed with scrypt + salt.
 */

const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// --- Password hashing ---
function hashPassword(password, salt = null) {
  const useSalt = salt || crypto.randomBytes(16);
  const derived = crypto.scryptSync(password, useSalt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt:${useSalt.toString('hex')}:${derived.toString('hex')}`;
}

function verifyPassword(password, stored) {
  const [algo, saltHex, hashHex] = stored.split(':');
  if (algo !== 'scrypt') return false;
  const salt = Buffer.from(saltHex, 'hex');
  const derived = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return crypto.timingSafeEqual(derived, Buffer.from(hashHex, 'hex'));
}

// --- Middleware ---
function authMiddleware(secret) {
  return (req, res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }
    const token = header.slice(7);
    try {
      req.user = jwt.verify(token, secret);
      next();
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  };
}

// --- Login handler ---
function loginHandler(req, res, store, secret) {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  const user = store.getUser(username);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    // Constant-time response to avoid timing attacks
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ username: user.username, role: user.role }, secret, {
    expiresIn: '24h',
  });
  res.json({ token, user: { username: user.username, role: user.role } });
}

// --- Change password handler ---
function changePasswordHandler(req, res, store, secret) {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new passwords are required' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters' });
  }
  const user = store.getUser(req.user.username);
  if (!user || !verifyPassword(currentPassword, user.passwordHash)) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }
  store.updateUser(user.username, { passwordHash: hashPassword(newPassword) });
  const token = jwt.sign({ username: user.username, role: user.role }, secret, {
    expiresIn: '24h',
  });
  res.json({ token, success: true });
}

module.exports = { authMiddleware, loginHandler, changePasswordHandler, hashPassword };