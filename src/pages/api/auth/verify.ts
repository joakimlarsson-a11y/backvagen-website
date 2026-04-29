import type { APIRoute } from 'astro';
import { getKv } from '@/lib/kv';
import {
  buildSessionCookie,
  decodeMagicLinkToken,
  generateRandomId,
  hashIp,
  isSecureRequest,
} from '@/lib/auth';

export const prerender = false;

export const GET: APIRoute = async ({ request, locals, url }) => {
  const kv = getKv(locals);
  const env = locals.runtime?.env;
  if (!kv || !env) {
    return html('Serverkonfiguration saknas.', 500);
  }

  const token = url.searchParams.get('token');
  if (!token) return redirectWithError('missing');

  const secret = env.HASH_SECRET;
  if (!secret) return html('Serverkonfiguration saknas.', 500);

  // Step 1: verify signature and decode payload.
  const decoded = await decodeMagicLinkToken(token, secret);
  if (!decoded) return redirectWithError('invalid');

  // Step 2: consume single-use token from KV (also verifies it hasn't expired).
  const stored = await kv.consumeMagicLink(token);
  if (!stored) return redirectWithError('expired');
  if (stored.email !== decoded.email) return redirectWithError('invalid');

  // Step 3: re-verify the user is still in the allow-list.
  const user = await kv.findUser(decoded.email);
  if (!user) return redirectWithError('not_allowed');

  // Step 4: create a fresh session.
  const sessionId = generateRandomId();
  const now = new Date().toISOString();
  await kv.putSession(sessionId, {
    email: user.email,
    role: user.role,
    createdAt: now,
    lastSeen: now,
  });

  // Step 5: record a login log entry with hashed IP (privacy-friendly).
  const ip =
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    '0.0.0.0';
  const ipHash = await hashIp(ip, secret);
  await kv.appendLog({ email: user.email, ts: now, ipHash });

  const redirectTo = user.role === 'admin' ? '/admin' : '/medlem';
  const headers = new Headers({
    location: redirectTo,
    'set-cookie': buildSessionCookie(sessionId, { secure: isSecureRequest(request) }),
  });
  return new Response(null, { status: 302, headers });
};

function redirectWithError(code: string): Response {
  return new Response(null, {
    status: 302,
    headers: { location: `/medlem/logga-in?error=${encodeURIComponent(code)}` },
  });
}

function html(message: string, status: number): Response {
  return new Response(message, {
    status,
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}
