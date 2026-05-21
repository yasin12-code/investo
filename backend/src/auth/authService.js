const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

const JWT_SECRET = process.env.JWT_SECRET || 'investo-dev-secret-change-me';
const ACCESS_TTL_SEC = 60 * 60 * 2; // 2h
const REFRESH_TTL_SEC = 60 * 60 * 24 * 7; // 7d

const activeSessions = new Map(); // sid -> { email, createdAt, refreshToken, refreshExp }
const usersDb = new Map(); // email -> password

// Pre-populate with default demo user
const demoCreds = {
  email: process.env.DEMO_USER_EMAIL || 'admin@investo.ai',
  password: process.env.DEMO_USER_PASSWORD || 'demo123'
};
usersDb.set(demoCreds.email, demoCreds.password);

function base64url(input) {
  return Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function signJwt(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(data).digest('base64')
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${data}.${signature}`;
}

function verifyJwt(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) return null;
  const [h, p, s] = parts;
  const data = `${h}.${p}`;
  const expected = crypto.createHmac('sha256', JWT_SECRET).update(data).digest('base64')
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  if (expected !== s) return null;
  try {
    const payload = JSON.parse(Buffer.from(p.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8'));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

function getDemoCredentials() {
  return {
    email: process.env.DEMO_USER_EMAIL || 'admin@investo.ai',
    password: process.env.DEMO_USER_PASSWORD || 'demo123'
  };
}

function issueSession(email, password) {
  const storedPassword = usersDb.get(email);
  if (!storedPassword || storedPassword !== password) {
    throw new Error('Invalid credentials');
  }

  const sid = uuidv4();
  const now = Math.floor(Date.now() / 1000);
  const refreshToken = uuidv4() + uuidv4().replace(/-/g, '');
  const refreshExp = now + REFRESH_TTL_SEC;
  activeSessions.set(sid, {
    email,
    createdAt: new Date().toISOString(),
    refreshToken,
    refreshExp
  });

  const accessToken = signJwt({ sub: email, sid, iat: now, exp: now + ACCESS_TTL_SEC });
  return { accessToken, refreshToken, expiresIn: ACCESS_TTL_SEC, user: { email } };
}

function refreshSession(refreshToken) {
  const now = Math.floor(Date.now() / 1000);
  for (const [sid, sess] of activeSessions.entries()) {
    if (sess.refreshToken === refreshToken && sess.refreshExp > now) {
      const accessToken = signJwt({ sub: sess.email, sid, iat: now, exp: now + ACCESS_TTL_SEC });
      return { accessToken, expiresIn: ACCESS_TTL_SEC, user: { email: sess.email } };
    }
  }
  throw new Error('Invalid refresh token');
}

function terminateSession(sid) {
  activeSessions.delete(sid);
}

function requireAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing bearer token' });
  const payload = verifyJwt(token);
  if (!payload) return res.status(401).json({ error: 'Invalid or expired token' });
  const sess = activeSessions.get(payload.sid);
  if (!sess) return res.status(401).json({ error: 'Session no longer active' });
  req.user = { email: payload.sub, sid: payload.sid };
  next();
}

function registerUser(email, password) {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }
  if (usersDb.has(email)) {
    throw new Error('User already exists');
  }
  usersDb.set(email, password);
  return { email };
}

module.exports = {
  issueSession,
  refreshSession,
  terminateSession,
  requireAuth,
  registerUser
};
