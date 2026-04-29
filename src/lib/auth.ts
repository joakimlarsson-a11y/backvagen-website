const SESSION_COOKIE = 'session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 180;

const enc = new TextEncoder();
const dec = new TextDecoder();

function toBase64Url(bytes: Uint8Array): string {
  let str = '';
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Convert a Uint8Array to a fresh ArrayBuffer for use with WebCrypto APIs that
 * require a strict ArrayBuffer (not SharedArrayBuffer). */
function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buf = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buf).set(bytes);
  return buf;
}

function fromBase64Url(input: string): Uint8Array {
  const pad = input.length % 4 === 0 ? '' : '='.repeat(4 - (input.length % 4));
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/') + pad;
  const raw = atob(b64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    toArrayBuffer(enc.encode(secret)),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

/** Sign a short opaque payload with HMAC-SHA256. Returns `<payload>.<sig>` in base64url. */
export async function signToken(payload: string, secret: string): Promise<string> {
  const key = await hmacKey(secret);
  const payloadBytes = enc.encode(payload);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, toArrayBuffer(payloadBytes)));
  return `${toBase64Url(payloadBytes)}.${toBase64Url(sig)}`;
}

/** Verify `<payload>.<sig>` and return the decoded payload, or null if invalid. */
export async function verifyToken(token: string, secret: string): Promise<string | null> {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, sigB64] = parts;
  let payloadBytes: Uint8Array;
  let sigBytes: Uint8Array;
  try {
    payloadBytes = fromBase64Url(payloadB64);
    sigBytes = fromBase64Url(sigB64);
  } catch {
    return null;
  }
  const key = await hmacKey(secret);
  const ok = await crypto.subtle.verify(
    'HMAC',
    key,
    toArrayBuffer(sigBytes),
    toArrayBuffer(payloadBytes),
  );
  if (!ok) return null;
  return dec.decode(payloadBytes);
}

/** Generate a 32-byte random value as base64url — used for session IDs and raw magic link tokens. */
export function generateRandomId(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return toBase64Url(bytes);
}

/** Compose a magic link token carrying (email, createdAt). HMAC-signed. */
export async function createMagicLinkToken(
  email: string,
  secret: string,
): Promise<{ token: string; payload: { email: string; nonce: string; createdAt: string } }> {
  const payload = {
    email: email.trim().toLowerCase(),
    nonce: generateRandomId(),
    createdAt: new Date().toISOString(),
  };
  const token = await signToken(JSON.stringify(payload), secret);
  return { token, payload };
}

export interface DecodedMagicLink {
  email: string;
  nonce: string;
  createdAt: string;
}

export async function decodeMagicLinkToken(
  token: string,
  secret: string,
): Promise<DecodedMagicLink | null> {
  const raw = await verifyToken(token, secret);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as DecodedMagicLink;
    if (!parsed.email || !parsed.nonce || !parsed.createdAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** SHA-256 hash of `${secret}:${ip}`, returned as the first 16 hex chars — enough to detect repeats without storing PII. */
export async function hashIp(ip: string, secret: string): Promise<string> {
  const bytes = new Uint8Array(
    await crypto.subtle.digest('SHA-256', toArrayBuffer(enc.encode(`${secret}:${ip}`))),
  );
  return Array.from(bytes.slice(0, 8), (b) => b.toString(16).padStart(2, '0')).join('');
}

// ===== Cookies =====

export function buildSessionCookie(
  sessionId: string,
  options: { secure: boolean; maxAgeSeconds?: number } = { secure: true },
): string {
  const parts = [
    `${SESSION_COOKIE}=${sessionId}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${options.maxAgeSeconds ?? SESSION_MAX_AGE}`,
  ];
  if (options.secure) parts.push('Secure');
  return parts.join('; ');
}

export function buildClearSessionCookie(secure: boolean): string {
  const parts = [`${SESSION_COOKIE}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

export function readSessionId(request: Request): string | null {
  const header = request.headers.get('cookie');
  if (!header) return null;
  const pairs = header.split(/;\s*/);
  for (const p of pairs) {
    const [name, ...rest] = p.split('=');
    if (name === SESSION_COOKIE) return decodeURIComponent(rest.join('='));
  }
  return null;
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
export const SESSION_DEFAULT_MAX_AGE = SESSION_MAX_AGE;

/** True when we're running over TLS (production) — used to gate the Secure cookie flag. */
export function isSecureRequest(request: Request): boolean {
  const url = new URL(request.url);
  return url.protocol === 'https:';
}
