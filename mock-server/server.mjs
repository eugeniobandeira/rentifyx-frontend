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
seedUser({ email: 'admin@rentityx.com', password: 'Admin123!@#Demo', role: 'Admin', status: 'Active' });

// Mock of rentifyx-asset-registry-api's public read path only (SearchAssets/ListCategories) —
// see .specs/features/api-integration-plan/spec.md §1.2, P2. AssetStatus mirrors that repo's real
// enum ordinals (Draft=0, PendingModeration=1, Active=2, Suspended=3, Archived=4) since that
// backend has no JsonStringEnumConverter configured and serializes it as a number.
const ASSET_STATUS_DRAFT = 0;
const ASSET_STATUS_PENDING_MODERATION = 1;
const ASSET_STATUS_ACTIVE = 2;
const ASSET_STATUS_SUSPENDED = 3;
const ASSET_STATUS_ARCHIVED = 4;
// Real backend binds this enum from its name (e.g. "PendingModeration"), not its numeric value -
// mirrors ASP.NET Core's default query-string enum model binding.
const ASSET_STATUS_BY_NAME = {
  Draft: ASSET_STATUS_DRAFT,
  PendingModeration: ASSET_STATUS_PENDING_MODERATION,
  Active: ASSET_STATUS_ACTIVE,
  Suspended: ASSET_STATUS_SUSPENDED,
  Archived: ASSET_STATUS_ARCHIVED,
};
const ALLOWED_MEDIA_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'video/mp4']);

/** @type {Map<string, string>} idempotencyKey -> assetId, for CreateAsset's idempotent-replay behavior */
const idempotencyKeys = new Map();

const categories = [
  { id: 'cat-heavy-machinery', name: 'Heavy Machinery', parentCategoryId: null, depth: 0 },
  { id: 'cat-excavators', name: 'Excavators', parentCategoryId: 'cat-heavy-machinery', depth: 1 },
  { id: 'cat-cranes', name: 'Cranes', parentCategoryId: 'cat-heavy-machinery', depth: 1 },
  { id: 'cat-electronics', name: 'Electronics', parentCategoryId: null, depth: 0 },
  { id: 'cat-vehicles', name: 'Vehicles', parentCategoryId: null, depth: 0 },
];

const MOCK_OWNER_ID = randomUUID();

const assets = [
  { id: randomUUID(), title: 'Compact Excavator CAT 305E2', description: '2022 CAT 305E2 mini excavator, 5.5t, low hours, well maintained, available for daily or weekly rental.', price: 285.0, categoryId: 'cat-excavators', ownerId: MOCK_OWNER_ID, status: ASSET_STATUS_ACTIVE, createdAt: now() },
  { id: randomUUID(), title: 'Mini Excavator Bobcat E35', description: 'Compact Bobcat E35, ideal for tight-access sites, recently serviced.', price: 210.5, categoryId: 'cat-excavators', ownerId: MOCK_OWNER_ID, status: ASSET_STATUS_ACTIVE, createdAt: now() },
  { id: randomUUID(), title: 'Tower Crane Liebherr 132EC-H6', description: 'High-capacity tower crane for medium to large construction sites, includes operator training.', price: 1200.0, categoryId: 'cat-cranes', ownerId: MOCK_OWNER_ID, status: ASSET_STATUS_ACTIVE, createdAt: now() },
  { id: randomUUID(), title: 'Portable Generator 5000W', description: 'Reliable 5000W generator, quiet operation, includes fuel can.', price: 65.0, categoryId: 'cat-electronics', ownerId: MOCK_OWNER_ID, status: ASSET_STATUS_ACTIVE, createdAt: now() },
  { id: randomUUID(), title: 'Pickup Truck Ford Ranger', description: '2023 Ford Ranger, 4x4, full tank included, daily/weekly rates.', price: 180.0, categoryId: 'cat-vehicles', ownerId: MOCK_OWNER_ID, status: ASSET_STATUS_ACTIVE, createdAt: now() },
  { id: randomUUID(), title: 'Tower Crane Potain MDT 178', description: 'Mid-range tower crane, 8t max load, includes rigging kit.', price: 980.0, categoryId: 'cat-cranes', ownerId: MOCK_OWNER_ID, status: ASSET_STATUS_ACTIVE, createdAt: now() },
  { id: randomUUID(), title: 'Backhoe Loader JCB 3CX', description: 'Versatile backhoe loader, 4x4, extendable dipper, ready for site work.', price: 320.0, categoryId: 'cat-heavy-machinery', ownerId: MOCK_OWNER_ID, status: ASSET_STATUS_ACTIVE, createdAt: now() },
  { id: randomUUID(), title: 'Drone DJI Mavic 3 Enterprise', description: 'Survey-grade drone with thermal camera, spare batteries included.', price: 145.0, categoryId: 'cat-electronics', ownerId: MOCK_OWNER_ID, status: ASSET_STATUS_ACTIVE, createdAt: now() },
  { id: randomUUID(), title: 'Cargo Van Mercedes Sprinter', description: '2021 Sprinter, 15m³ cargo space, ideal for moves and deliveries.', price: 220.0, categoryId: 'cat-vehicles', ownerId: MOCK_OWNER_ID, status: ASSET_STATUS_ACTIVE, createdAt: now() },
  { id: randomUUID(), title: 'Wheel Loader Volvo L60H', description: 'Heavy-duty wheel loader awaiting moderation review.', price: 410.0, categoryId: 'cat-heavy-machinery', ownerId: MOCK_OWNER_ID, status: ASSET_STATUS_PENDING_MODERATION, createdAt: now() },
  { id: randomUUID(), title: 'Rooftop Solar Generator Kit', description: 'Portable solar generator kit with panels, awaiting moderation review.', price: 95.0, categoryId: 'cat-electronics', ownerId: MOCK_OWNER_ID, status: ASSET_STATUS_PENDING_MODERATION, createdAt: now() },
  { id: randomUUID(), title: 'Motorcycle Honda CB500X', description: 'Adventure motorcycle, awaiting moderation review.', price: 90.0, categoryId: 'cat-vehicles', ownerId: MOCK_OWNER_ID, status: ASSET_STATUS_PENDING_MODERATION, createdAt: now() },
  { id: randomUUID(), title: 'Crawler Crane Kobelco CK1000', description: 'Suspended pending compliance review.', price: 1500.0, categoryId: 'cat-cranes', ownerId: MOCK_OWNER_ID, status: ASSET_STATUS_SUSPENDED, createdAt: now() },
];

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

function requireAdmin(req, res, next) {
  if (req.mockUser.role !== 'Admin') {
    return sendError(res, 403, 'Requires the Admin role.');
  }
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

router.get('/categories', (_req, res) => {
  res.json(categories);
});

router.post('/categories', requireAuth, requireAdmin, (req, res) => {
  const { name, parentCategoryId } = req.body ?? {};
  if (!name) {
    return sendValidation(res, 'Validation failed', { name: ['Name is required.'] });
  }

  let depth = 0;
  if (parentCategoryId) {
    const parent = categories.find((c) => c.id === parentCategoryId);
    if (!parent) {
      return sendError(res, 400, `Parent category ${parentCategoryId} not found.`);
    }
    depth = parent.depth + 1;
  }

  const category = { id: randomUUID(), name, parentCategoryId: parentCategoryId ?? null, depth };
  categories.push(category);
  res.status(201).json(category);
});

router.patch('/categories/:id', requireAuth, requireAdmin, (req, res) => {
  const category = categories.find((c) => c.id === req.params.id);
  if (!category) return sendError(res, 404, `Category ${req.params.id} not found.`);

  const { newName, newParentCategoryId } = req.body ?? {};
  if (newName) category.name = newName;
  if (newParentCategoryId !== undefined) {
    if (newParentCategoryId) {
      const parent = categories.find((c) => c.id === newParentCategoryId);
      if (!parent) return sendError(res, 400, `Parent category ${newParentCategoryId} not found.`);
      category.parentCategoryId = newParentCategoryId;
      category.depth = parent.depth + 1;
    } else {
      category.parentCategoryId = null;
      category.depth = 0;
    }
  }

  res.json(category);
});

router.get('/assets', (req, res) => {
  const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 12, 1), 30);
  const { categoryId, minPrice, maxPrice, keyword } = req.query;

  let filtered = assets;
  if (categoryId) filtered = filtered.filter((a) => a.categoryId === categoryId);
  if (minPrice) filtered = filtered.filter((a) => a.price >= Number(minPrice));
  if (maxPrice) filtered = filtered.filter((a) => a.price <= Number(maxPrice));
  if (keyword) {
    const needle = String(keyword).toLowerCase();
    filtered = filtered.filter((a) => a.title.toLowerCase().includes(needle));
  }

  const startIndex = req.query.nextPageToken ? Number(req.query.nextPageToken) : 0;
  const page = filtered.slice(startIndex, startIndex + pageSize);
  const endIndex = startIndex + page.length;

  res.json({
    // Summary shape only (id/title/price/categoryId/status) - real AssetSummaryResponse doesn't
    // include description/ownerId/createdAt, those are GetAssetById-only fields.
    items: page.map(({ id, title, price, categoryId, status }) => ({ id, title, price, categoryId, status })),
    nextPageToken: endIndex < filtered.length ? String(endIndex) : null,
  });
});

// Must come before '/assets/:id' below - Express route matching is order-sensitive and ':id'
// would otherwise greedily match the literal segment 'admin-search'.
router.get('/assets/admin-search', requireAuth, requireAdmin, (req, res) => {
  const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 12, 1), 30);
  const { categoryId, minPrice, maxPrice, keyword, status } = req.query;

  const statusNumber = ASSET_STATUS_BY_NAME[status] ?? Number(status);
  let filtered = assets.filter((a) => a.status === statusNumber);
  if (categoryId) filtered = filtered.filter((a) => a.categoryId === categoryId);
  if (minPrice) filtered = filtered.filter((a) => a.price >= Number(minPrice));
  if (maxPrice) filtered = filtered.filter((a) => a.price <= Number(maxPrice));
  if (keyword) {
    const needle = String(keyword).toLowerCase();
    filtered = filtered.filter((a) => a.title.toLowerCase().includes(needle));
  }

  const startIndex = req.query.nextPageToken ? Number(req.query.nextPageToken) : 0;
  const page = filtered.slice(startIndex, startIndex + pageSize);
  const endIndex = startIndex + page.length;

  res.json({
    items: page.map(({ id, title, price, categoryId: catId, ownerId, status: assetStatus, createdAt }) => ({
      id,
      title,
      price,
      categoryId: catId,
      ownerId,
      status: assetStatus,
      createdAt,
    })),
    nextPageToken: endIndex < filtered.length ? String(endIndex) : null,
  });
});

router.get('/assets/:id', requireAuth, (req, res) => {
  const asset = assets.find((a) => a.id === req.params.id);
  if (!asset) {
    return sendError(res, 404, `Asset ${req.params.id} not found.`);
  }

  const isOwner = asset.ownerId === req.mockUser.id;
  const isAdmin = req.mockUser.role === 'Admin';
  if (asset.status !== ASSET_STATUS_ACTIVE && !isOwner && !isAdmin) {
    return sendError(res, 403, 'Not authorized to view this asset.');
  }

  res.json(asset);
});

router.post('/assets', requireAuth, (req, res) => {
  const { title, description, price, categoryId, idempotencyKey } = req.body ?? {};

  const existingAssetId = idempotencyKeys.get(idempotencyKey);
  if (existingAssetId) {
    const existing = assets.find((a) => a.id === existingAssetId);
    if (existing) {
      return res.status(201).json({ assetId: existing.id, status: existing.status, createdAt: existing.createdAt });
    }
  }

  const errors = {};
  if (!title || title.length < 3 || title.length > 100) errors.title = ['Title must be 3-100 characters.'];
  if (!description || description.length < 10 || description.length > 2000) errors.description = ['Description must be 10-2000 characters.'];
  if (!categoryId) errors.categoryId = ['Category is required.'];
  if (Object.keys(errors).length > 0) {
    return sendValidation(res, 'Validation failed', errors);
  }

  const asset = {
    id: randomUUID(),
    title,
    description,
    price: Number(price),
    categoryId,
    ownerId: req.mockUser.id,
    status: ASSET_STATUS_DRAFT,
    createdAt: now(),
  };
  assets.push(asset);
  idempotencyKeys.set(idempotencyKey, asset.id);

  res.status(201).json({ assetId: asset.id, status: asset.status, createdAt: asset.createdAt });
});

router.post('/assets/:id/media/upload-request', requireAuth, (req, res) => {
  const asset = assets.find((a) => a.id === req.params.id);
  if (!asset) return sendError(res, 404, `Asset ${req.params.id} not found.`);
  if (asset.ownerId !== req.mockUser.id) return sendError(res, 403, 'Not authorized to upload media for this asset.');

  const { mimeType, sizeBytes } = req.body ?? {};
  if (!ALLOWED_MEDIA_MIME_TYPES.has(mimeType)) {
    return sendValidation(res, 'Validation failed', { mimeType: ['Unsupported MIME type.'] });
  }
  if (!sizeBytes || sizeBytes <= 0) {
    return sendValidation(res, 'Validation failed', { sizeBytes: ['Size must be positive.'] });
  }

  const s3Key = `assets/${asset.id}/media/${randomUUID()}`;
  res.json({ uploadUrl: `http://localhost:${PORT}/api/v1/mock-s3/${encodeURIComponent(s3Key)}`, s3Key });
});

// Stands in for a real presigned S3 PUT - accepts any body, always succeeds.
router.put('/mock-s3/*splat', (req, res) => {
  res.status(200).send();
});

router.post('/assets/:id/media/confirm', requireAuth, (req, res) => {
  const asset = assets.find((a) => a.id === req.params.id);
  if (!asset) return sendError(res, 404, `Asset ${req.params.id} not found.`);
  if (asset.ownerId !== req.mockUser.id) return sendError(res, 403, 'Not authorized to confirm media for this asset.');

  const { s3Key } = req.body ?? {};
  asset.mediaS3Key = s3Key;
  res.json({ assetId: asset.id, s3Key });
});

router.post('/assets/:id/submit-for-moderation', requireAuth, (req, res) => {
  const asset = assets.find((a) => a.id === req.params.id);
  if (!asset) return sendError(res, 404, `Asset ${req.params.id} not found.`);
  if (asset.ownerId !== req.mockUser.id) return sendError(res, 403, 'Only the owner may submit this asset.');
  if (asset.status !== ASSET_STATUS_DRAFT) {
    return sendError(res, 400, 'Asset must be in Draft status to submit for moderation.');
  }

  asset.status = ASSET_STATUS_PENDING_MODERATION;
  res.json({ assetId: asset.id, status: asset.status });
});

router.post('/assets/:id/admin-review', requireAuth, requireAdmin, (req, res) => {
  const asset = assets.find((a) => a.id === req.params.id);
  if (!asset) return sendError(res, 404, `Asset ${req.params.id} not found.`);
  if (asset.status !== ASSET_STATUS_PENDING_MODERATION) {
    return sendValidation(res, 'Validation failed', {
      status: [`Asset must be in 'PendingModeration' status. Current status is '${asset.status}'.`],
    });
  }

  const { approve } = req.body ?? {};
  // Matches the real AdminReviewAssetHandler: reject archives the asset (terminal), it does not
  // revert to Draft despite that endpoint's own stale doc comment saying otherwise.
  asset.status = approve ? ASSET_STATUS_ACTIVE : ASSET_STATUS_ARCHIVED;
  res.json({ assetId: asset.id, status: asset.status });
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
  console.log('  admin@rentityx.com / Admin123!@#Demo  (Admin, Active)');
  console.log('Register/forgot-password links are logged here instead of being emailed.\n');
});
