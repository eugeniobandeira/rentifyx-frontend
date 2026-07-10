# RentifyX Identity API — Frontend Integration Contracts

Base URL: `http://localhost:{port}/api/v1` (local) | `https://{host}/api/v1` (production)

---

## Configuration

### CORS
| Setting | Value |
|---|---|
| Allowed Origins | `http://localhost:3000` |
| Allowed Methods | All |
| Allowed Headers | All |
| Allow Credentials | Yes |
| Exposed Headers | `X-Correlation-Id` |
| Preflight Max Age | 10 minutes |

### Rate Limiting
| Setting | Value |
|---|---|
| Limit | 100 requests per 60 seconds |
| Queue | 0 |
| Rejection status | `429 Too Many Requests` |

### JWT
| Setting | Value |
|---|---|
| Issuer | `rentifyx-identity` |
| Audience | `rentifyx-services` |
| Algorithm | RS256 |
| Access token lifetime | 15 minutes |
| Refresh token lifetime | 30 days |

---

## Request Headers

| Header | Required | Description |
|---|---|---|
| `Authorization` | Yes (authenticated routes) | `Bearer {accessToken}` |
| `Content-Type` | Yes (POST/PUT) | `application/json` |
| `X-Correlation-Id` | No | Alphanumeric + hyphen, max 64 chars. Auto-generated if omitted. Always echoed in the response. |

---

## Response Format

### Success

Endpoints return `200`, `201`, or `204` depending on the operation. Body is JSON or empty.

### Validation Error — `422 Unprocessable Entity`

```json
{
  "title": "One or more validation errors occurred.",
  "status": 422,
  "errors": {
    "Email": ["Email format is invalid."],
    "Password": ["Password must be at least 12 characters."]
  },
  "extensions": {
    "correlationId": "string | null"
  }
}
```

### Business / Server Error — `400 | 401 | 404 | 409 | 429 | 500`

```json
{
  "title": "Error description.",
  "status": 401,
  "extensions": {
    "correlationId": "string | null"
  }
}
```

### Security Headers (all responses)

| Header | Value |
|---|---|
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |

---

## Status Code Reference

| Code | Meaning |
|---|---|
| `200` | OK — response body present |
| `201` | Created — resource created, body present |
| `204` | No Content — success, no body |
| `400` | Bad Request — business logic error |
| `401` | Unauthorized — missing/invalid token or wrong credentials |
| `404` | Not Found |
| `409` | Conflict — duplicate resource |
| `422` | Unprocessable Entity — validation errors |
| `429` | Too Many Requests — rate limit exceeded |
| `500` | Internal Server Error |

---

## Shared Types

### `UserResponse`
```json
{
  "id": "uuid",
  "email": "string",
  "role": "Owner | Renter | Admin",
  "status": "PendingVerification | Active | Deleted",
  "createdAt": "ISO 8601 datetime with offset"
}
```

### `LoginResponse`
```json
{
  "accessToken": "string (JWT)",
  "refreshToken": "string",
  "user": { /* UserResponse */ }
}
```

### `AuditLogEntryRecord`
```json
{
  "eventType": "string",
  "occurredAt": "ISO 8601 datetime with offset"
}
```

---

## Endpoints

### Health

#### `GET /health`
Check if the API is running.

- Auth: No
- Response `200 OK`

---

### Auth — `POST /api/v1/auth/*`

#### `POST /api/v1/auth/register`
Create a new user account.

- Auth: No
- Response: `201 Created` → `UserResponse`

**Request body**
```json
{
  "email": "string",
  "taxId": "string",
  "password": "string",
  "role": "Owner | Renter | Admin",
  "consentGiven": true
}
```

**Validation rules**
| Field | Rules |
|---|---|
| `email` | Required · valid format · max 320 chars · no disposable domain (mailinator, guerrillamail, tempmail, throwam, yopmail) |
| `taxId` | Required |
| `password` | Required · 12–128 chars · must have uppercase, lowercase, digit, and symbol (`!@#$%^&*()-_=+[]{}|;:,.<>?`) |
| `role` | Required · one of `Owner`, `Renter`, `Admin` |
| `consentGiven` | Must be `true` |

**Business errors**
| Status | Description |
|---|---|
| `409` | Email already registered |
| `409` | Tax ID already registered |

---

#### `POST /api/v1/auth/login`
Authenticate and receive tokens.

- Auth: No
- Response: `200 OK` → `LoginResponse`

**Request body**
```json
{
  "email": "string",
  "password": "string"
}
```

**Validation rules**
| Field | Rules |
|---|---|
| `email` | Required · valid format |
| `password` | Required |

**Business errors**
| Status | Description |
|---|---|
| `401` | Invalid credentials |
| `401` | Account not active (pending verification or deleted) |
| `401` | Account locked — after 5 failed attempts, locked for 15 minutes |

---

#### `POST /api/v1/auth/refresh`
Rotate the refresh token and get a new access token.

- Auth: No
- Response: `200 OK` → `LoginResponse`

**Request body**
```json
{
  "email": "string",
  "refreshToken": "string"
}
```

**Validation rules**
| Field | Rules |
|---|---|
| `email` | Required · valid format |
| `refreshToken` | Required · max 512 chars |

**Business errors**
| Status | Description |
|---|---|
| `401` | Token invalid or expired |

---

#### `POST /api/v1/auth/logout`
Invalidate the refresh token. Always returns `204` (idempotent).

- Auth: No
- Response: `204 No Content`

**Request body**
```json
{
  "email": "string",
  "refreshToken": "string"
}
```

**Validation rules**
| Field | Rules |
|---|---|
| `email` | Required · valid format |
| `refreshToken` | Required |

---

#### `POST /api/v1/auth/verify-email`
Verify a user's email using the token sent after registration.

- Auth: No
- Response: `200 OK` → `UserResponse`

**Request body**
```json
{
  "email": "string",
  "token": "string"
}
```

**Validation rules**
| Field | Rules |
|---|---|
| `email` | Required · valid format |
| `token` | Required · max 512 chars |

**Business errors**
| Status | Description |
|---|---|
| `404` | User not found |
| `400` | Token invalid or expired |

---

#### `POST /api/v1/auth/forgot-password`
Send a password reset email. Always returns `204` regardless of whether the email exists (prevents enumeration).

- Auth: No
- Response: `204 No Content`

**Request body**
```json
{
  "email": "string"
}
```

**Validation rules**
| Field | Rules |
|---|---|
| `email` | Required · valid format |

---

#### `POST /api/v1/auth/reset-password`
Set a new password using the token received by email.

- Auth: No
- Response: `204 No Content`

**Request body**
```json
{
  "email": "string",
  "token": "string",
  "newPassword": "string"
}
```

**Validation rules**
| Field | Rules |
|---|---|
| `email` | Required · valid format |
| `token` | Required · max 512 chars |
| `newPassword` | Required · 12–128 chars · must have uppercase, lowercase, digit, and symbol |

**Business errors**
| Status | Description |
|---|---|
| `404` | User not found |
| `400` | Token invalid or expired |

---

### Users — `* /api/v1/users/me`

All user endpoints require a valid JWT in the `Authorization: Bearer {token}` header. The `userId` is extracted from the `sub` claim of the token.

#### `GET /api/v1/users/me`
Get the authenticated user's profile.

- Auth: **Yes**
- Response: `200 OK` → `UserResponse`

**Business errors**
| Status | Description |
|---|---|
| `401` | Missing or invalid token |
| `404` | User not found |

---

#### `DELETE /api/v1/users/me`
Anonymize and soft-delete the authenticated user's account (LGPD Art. 18 VI).

- Auth: **Yes**
- Response: `204 No Content`

After deletion:
- Account status becomes `Deleted`
- Email replaced with `deleted_{id}@anonymized.local`
- Tax ID replaced with `ANONYMIZED`
- Password hash replaced with `ANONYMIZED`
- All refresh tokens invalidated

**Business errors**
| Status | Description |
|---|---|
| `401` | Missing or invalid token |

---

#### `GET /api/v1/users/me/data-export`
Export all personal data held about the authenticated user (LGPD Art. 18 IV).

- Auth: **Yes**
- Response: `200 OK`

```json
{
  "id": "uuid",
  "email": "string",
  "taxId": "string",
  "role": "string",
  "status": "string",
  "createdAt": "ISO 8601",
  "consentGivenAt": "ISO 8601 | null",
  "auditHistory": [
    {
      "eventType": "string",
      "occurredAt": "ISO 8601"
    }
  ]
}
```

**Business errors**
| Status | Description |
|---|---|
| `401` | Missing or invalid token |
| `404` | User not found |

---

## Token Flow

```
1. POST /auth/register        → receive UserResponse (status: PendingVerification)
2. POST /auth/verify-email    → receive UserResponse (status: Active)
3. POST /auth/login           → receive accessToken + refreshToken
4. GET  /users/me             → Authorization: Bearer {accessToken}
5. POST /auth/refresh         → rotate when accessToken expires (every 15 min)
6. POST /auth/logout          → invalidate refreshToken on sign-out
```

---

## Validation Constants

| Constant | Value |
|---|---|
| Email max length | 320 |
| Password min length | 12 |
| Password max length | 128 |
| Token max length | 512 |
| Max failed login attempts | 5 |
| Lockout duration | 15 minutes |
| Email verification token lifetime | 24 hours |
| Password reset token lifetime | 1 hour |
