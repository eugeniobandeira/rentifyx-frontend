import { decodeJwtExpiry } from './decode-jwt-expiry.util';

function toBase64Url(value: string): string {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function buildToken(payload: Record<string, unknown>): string {
  const header = toBase64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const body = toBase64Url(JSON.stringify(payload));
  return `${header}.${body}.signature`;
}

describe('decodeJwtExpiry', () => {
  it('returns the exp claim for a well-formed JWT', () => {
    const token = buildToken({ sub: 'user-1', exp: 1735689600 });

    expect(decodeJwtExpiry(token)).toBe(1735689600);
  });

  it('returns null for a malformed/truncated token', () => {
    expect(decodeJwtExpiry('not-a-jwt')).toBeNull();
    expect(decodeJwtExpiry('a.b')).toBeNull();
    expect(decodeJwtExpiry('a.!!!not-base64!!!.c')).toBeNull();
  });

  it('returns null when the payload has no exp claim', () => {
    const token = buildToken({ sub: 'user-1' });

    expect(decodeJwtExpiry(token)).toBeNull();
  });
});
