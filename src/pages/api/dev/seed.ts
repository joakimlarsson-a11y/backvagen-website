import type { APIRoute } from 'astro';
import { getKv } from '@/lib/kv';

export const prerender = false;

/**
 * DEV ONLY — seed a known admin user into KV so we can walk the login flow locally.
 * This endpoint is only reachable when running against the dev platform proxy;
 * production deployments should never hit this path (no real user can reach it
 * because the first-time setup happens via wrangler CLI, see README).
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const url = new URL(request.url);
  if (url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
    return new Response('forbidden', { status: 403 });
  }
  const kv = getKv(locals);
  if (!kv) return new Response('kv missing', { status: 500 });

  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    role?: 'member' | 'admin';
  };
  const email = (body.email ?? '').trim().toLowerCase();
  if (!email) return new Response('email required', { status: 400 });

  await kv.addUser({
    email,
    role: body.role ?? 'admin',
    addedAt: new Date().toISOString(),
    addedBy: 'dev-seed',
  });

  const all = await kv.listUsers();
  return new Response(JSON.stringify({ ok: true, users: all }, null, 2), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
};
