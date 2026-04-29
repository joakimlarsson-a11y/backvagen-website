import type { APIRoute } from 'astro';
import { getKv } from '@/lib/kv';
import { buildClearSessionCookie, isSecureRequest, readSessionId } from '@/lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const kv = getKv(locals);
  const sessionId = readSessionId(request);
  if (kv && sessionId) {
    await kv.deleteSession(sessionId);
  }

  const headers = new Headers({
    location: '/',
    'set-cookie': buildClearSessionCookie(isSecureRequest(request)),
  });
  return new Response(null, { status: 302, headers });
};
