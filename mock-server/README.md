# Mock identity API

A standalone, in-memory mock of the RentifyX Identity backend, for running the frontend without the real backend. Not a substitute for it — no real password hashing, rate limiting, or persistence. Implements exactly the request/response shapes the frontend's `interfaces/` expect (see `.specs/features/identity/`).

## Run

```bash
npm run dev          # ng serve + mock API together
```

or separately:

```bash
npm run mock:api      # mock API only, http://localhost:5000/api/v1
npm start              # ng serve only, http://localhost:4200
```

## Seeded users

Already `Active`, ready to log in with:

| Email | Password | Role |
|---|---|---|
| `demo@rentityx.com` | `Demo123!@#Demo` | Renter |
| `owner@rentityx.com` | `Owner123!@#Demo` | Owner |

## Register / forgot-password flows

There's no real email delivery — when you register or request a password reset, the mock server logs the exact frontend link to click (with the real `email`/`token` query params) to its console. Watch the terminal running `npm run mock:api` (or `npm run dev`).

## Resetting state

The mock store is in-memory only — restart the mock server (`Ctrl+C`, rerun) to wipe all registered/modified users back to just the two seeded ones.
