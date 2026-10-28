import crypto from 'crypto';

function getJwtSecret() {
  return process.env.JWT_SECRET || 'tooltrunk_jwt_secret_dev_key_987654321';
}

function parseExpiresIn(expiresIn) {
  if (!expiresIn) return 60 * 60 * 24 * 7; // 7 days default
  if (typeof expiresIn === 'number') return expiresIn;
  const match = String(expiresIn).match(/^(\d+)([smhd])$/);
  if (!match) return 60 * 60 * 24 * 7;
  const val = parseInt(match[1], 10);
  const unit = match[2];
  switch (unit) {
    case 's': return val;
    case 'm': return val * 60;
    case 'h': return val * 3600;
    case 'd': return val * 86400;
    default: return 60 * 60 * 24 * 7;
  }
}

function base64UrlEncode(str) {
  const buf = typeof str === 'string' ? Buffer.from(str) : str;
  return buf.toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

/**
 * Sign a secure JSON Web Token with expiration.
 */
export function signJwt(payload, options = {}) {
  const secret = getJwtSecret();
  const expiresInSec = parseExpiresIn(options.expiresIn || process.env.JWT_EXPIRES_IN || '7d');

  const header = { alg: 'HS256', typ: 'JWT' };
  const headerStr = base64UrlEncode(JSON.stringify(header));
  const payloadStr = base64UrlEncode(JSON.stringify({
    ...payload,
    exp: Math.floor(Date.now() / 1000) + expiresInSec,
  }));
  const signatureInput = `${headerStr}.${payloadStr}`;
  const signature = crypto.createHmac('sha256', secret).update(signatureInput).digest();
  const signatureStr = base64UrlEncode(signature);
  return `${signatureInput}.${signatureStr}`;
}

/**
 * Verify JWT signature and check expiration.
 * Returns decoded payload on success, null on failure.
 */
export function verifyJwt(token) {
  try {
    const secret = getJwtSecret();
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerStr, payloadStr, signatureStr] = parts;
    const signatureInput = `${headerStr}.${payloadStr}`;
    const expectedSig = crypto.createHmac('sha256', secret).update(signatureInput).digest();
    const expectedSigStr = base64UrlEncode(expectedSig);
    if (signatureStr !== expectedSigStr) return null;
    const payload = JSON.parse(base64UrlDecode(payloadStr));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null; // Expired
    return payload;
  } catch {
    return null;
  }
}
