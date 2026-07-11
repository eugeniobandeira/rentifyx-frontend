import { randomUUID } from 'node:crypto';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';

// Standalone mock of the RentifyX Identity backend (see .specs/features/identity/).
// In-memory only, resets on restart. Not a substitute for the real backend's
// validation/security rules — just enough to click through every screen this
// frontend implements. See mock-server/README.md for usage.

const PORT = 5000;
const FRONTEND_ORIGIN = 'http://localhost:4200';
const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_COOKIE_PATH = '/api/v1/auth';

const app = express();
app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use((req, _res, next) => {
  console.log(`  ${req.method} ${req.originalUrl}`);
  next();
});

/** @typedef {{ id: string, email: string, taxId: string, password: string, role: string, status: string, createdAt: string, consentGivenAt: string | null, verifyToken: string | null, resetToken: string | null, auditHistory: { eventType: string, occurredAt: string }[] }} MockUser */

/** @type {Map<string, MockUser>} keyed by lowercased email */
const users = new Map();
/** @type {Map<string, string>} refresh-cookie value -> lowercased email */
const refreshSessions = new Map();

function now() {
  return new Date().toISOString();
}

function seedUser({ email, password, role, status }) {
  const user = {
    id: randomUUID(),
    email,
    taxId: '12345678900',
    password,
    role,
    status,
    createdAt: now(),
    consentGivenAt: now(),
    verifyToken: null,
    resetToken: null,
    auditHistory: [{ eventType: 'AccountCreated', occurredAt: now() }],
  };
  users.set(email.toLowerCase(), user);
  return user;
}

seedUser({ email: 'demo@rentityx.com', password: 'Demo123!@#Demo', role: 'Renter', status: 'Active' });
seedUser({ email: 'owner@rentityx.com', password: 'Owner123!@#Demo', role: 'Owner', status: 'Active' });

function base64url(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function makeAccessToken(user) {
  const header = base64url({ alg: 'none', typ: 'JWT' });
  const exp = Math.floor(Date.now() / 1000) + ACCESS_TOKEN_TTL_SECONDS;
  const payload = base64url({ sub: user.id, email: user.email, exp });
  return `${header}.${payload}.mock-signature`;
}

function decodeAccessToken(token) {
  const parts = typeof token === 'string' ? token.split('.') : [];
  if (parts.length !== 3) {
    return null;
  }
  try {
    return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

function toUserResponse(user) {
  return { id: user.id, email: user.email, role: user.role, status: user.status, createdAt: user.createdAt };
}

function toDataExportResponse(user) {
  return {
    id: user.id,
    email: user.email,
    taxId: user.taxId,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    consentGivenAt: user.consentGivenAt,
    auditHistory: user.auditHistory,
  };
}

function sendError(res, status, title) {
  res.status(status).json({ title, status, extensions: { correlationId: randomUUID() } });
}

function sendValidation(res, title, errors) {
  res.status(422).json({ title, status: 422, errors, extensions: { correlationId: randomUUID() } });
}

function setRefreshCookie(res, email) {
  const token = randomUUID();
  refreshSessions.set(token, email.toLowerCase());
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: REFRESH_COOKIE_PATH,
  });
}

function logLink(label, path, params) {
  const query = new URLSearchParams(params).toString();
  console.log(`\n  [mock email] ${label}:\n  ${FRONTEND_ORIGIN}${path}?${query}\n`);
}

const router = express.Router();

router.post('/auth/register', (req, res) => {
  const { email, taxId, password, role, consentGiven } = req.body ?? {};
  const errors = {};
  if (!email) errors.email = ['Email is required.'];
  if (!taxId) errors.taxId = ['Tax ID is required.'];
  if (!password) errors.password = ['Password is required.'];
  if (!role) errors.role = ['Role is required.'];
  if (Object.keys(errors).length > 0) {
    return sendValidation(res, 'Validation failed', errors);
  }

  const key = email.toLowerCase();
  if (users.has(key)) {
    return sendError(res, 409, `Email ${email} is already registered.`);
  }

  const verifyToken = randomUUID();
  const user = {
    id: randomUUID(),
    email,
    taxId,
    password,
    role,
    status: 'PendingVerification',
    createdAt: now(),
    consentGivenAt: consentGiven ? now() : null,
    verifyToken,
    resetToken: null,
    auditHistory: [{ eventType: 'Registered', occurredAt: now() }],
  };
  users.set(key, user);
  logLink('verify-email link', '/verify-email', { email, token: verifyToken });

  res.status(201).json(toUserResponse(user));
});

router.post('/auth/verify-email', (req, res) => {
  const { email, token } = req.body ?? {};
  const user = users.get((email ?? '').toLowerCase());
  if (!user) {
    return sendError(res, 404, 'User not found.');
  }
  if (!token || user.verifyToken !== token) {
    return sendError(res, 400, 'This verification link is invalid or has expired.');
  }

  user.status = 'Active';
  user.verifyToken = null;
  user.auditHistory.push({ eventType: 'EmailVerified', occurredAt: now() });
  res.json(toUserResponse(user));
});

router.post('/auth/login', (req, res) => {
  const { email, password } = req.body ?? {};
  const user = users.get((email ?? '').toLowerCase());

  if (!user || user.password !== password || user.status === 'Deleted') {
    return sendError(res, 401, 'Invalid email or password.');
  }
  if (user.status === 'PendingVerification') {
    return sendError(res, 401, 'Please verify your email before signing in.');
  }

  setRefreshCookie(res, user.email);
  res.json({ accessToken: makeAccessToken(user), user: toUserResponse(user) });
});

router.post('/auth/refresh', (req, res) => {
  const { email } = req.body ?? {};
  const cookieToken = req.cookies?.[REFRESH_COOKIE_NAME];
  const mappedEmail = cookieToken ? refreshSessions.get(cookieToken) : undefined;

  if (!mappedEmail || mappedEmail !== (email ?? '').toLowerCase()) {
    return sendError(res, 422, 'Session expired, please sign in again.');
  }

  const user = users.get(mappedEmail);
  if (!user) {
    return sendError(res, 422, 'Session expired, please sign in again.');
  }

  refreshSessions.delete(cookieToken);
  setRefreshCookie(res, user.email);
  res.json({ accessToken: makeAccessToken(user), user: toUserResponse(user) });
});

router.post('/auth/logout', (req, res) => {
  const cookieToken = req.cookies?.[REFRESH_COOKIE_NAME];
  if (cookieToken) {
    refreshSessions.delete(cookieToken);
  }
  res.clearCookie(REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_PATH });
  res.status(204).send();
});

router.post('/auth/forgot-password', (req, res) => {
  const { email } = req.body ?? {};
  const user = users.get((email ?? '').toLowerCase());
  if (user) {
    user.resetToken = randomUUID();
    logLink('reset-password link', '/reset-password', { email: user.email, token: user.resetToken });
  }
  // Always 204, regardless of whether the email exists — no account enumeration.
  res.status(204).send();
});

router.post('/auth/reset-password', (req, res) => {
  const { email, token, newPassword } = req.body ?? {};
  const user = users.get((email ?? '').toLowerCase());

  if (!user || !token || user.resetToken !== token) {
    return sendError(res, 400, 'This link is invalid or has expired.');
  }

  user.password = newPassword;
  user.resetToken = null;
  user.auditHistory.push({ eventType: 'PasswordReset', occurredAt: now() });
  res.status(204).send();
});

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const payload = token ? decodeAccessToken(token) : null;

  if (!payload || payload.exp * 1000 < Date.now()) {
    return sendError(res, 401, 'Authentication required.');
  }

  const user = [...users.values()].find((candidate) => candidate.id === payload.sub);
  if (!user) {
    return sendError(res, 401, 'Authentication required.');
  }

  req.mockUser = user;
  next();
}

router.get('/users/me', requireAuth, (req, res) => {
  res.json(toUserResponse(req.mockUser));
});

router.delete('/users/me', requireAuth, (req, res) => {
  req.mockUser.status = 'Deleted';
  req.mockUser.auditHistory.push({ eventType: 'AccountDeleted', occurredAt: now() });
  res.status(204).send();
});

router.get('/users/me/data-export', requireAuth, (req, res) => {
  res.json(toDataExportResponse(req.mockUser));
});

app.use('/api/v1', router);

app.use((req, res) => {
  sendError(res, 404, `No mock route for ${req.method} ${req.originalUrl}`);
});

app.listen(PORT, () => {
  console.log(`\nMock identity API listening on http://localhost:${PORT}/api/v1`);
  console.log('Seeded users:');
  console.log('  demo@rentityx.com  / Demo123!@#Demo   (Renter, Active)');
  console.log('  owner@rentityx.com / Owner123!@#Demo  (Owner, Active)');
  console.log('Register/forgot-password links are logged here instead of being emailed.\n');
});
