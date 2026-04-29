import type { APIContext, APIRoute } from 'astro';
import { getKv, type Role } from '@/lib/kv';

export const prerender = false;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

function requireAdmin(locals: App.Locals): Response | null {
  if (!locals.user || locals.user.role !== 'admin') {
    return json({ ok: false, error: 'forbidden' }, 403);
  }
  return null;
}

// Require our own AJAX requests to include an X-Requested-With header so that
// classic cross-site form submissions can't trigger admin mutations.
function requireSameOrigin(request: Request): Response | null {
  if (request.headers.get('x-requested-with') !== 'xmlhttprequest') {
    return json({ ok: false, error: 'csrf_protection' }, 403);
  }
  return null;
}

function normalizeEmail(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed || !trimmed.includes('@') || !trimmed.includes('.')) return null;
  return trimmed;
}

export const GET: APIRoute = async ({ locals }: APIContext) => {
  const forbidden = requireAdmin(locals);
  if (forbidden) return forbidden;
  const kv = getKv(locals);
  if (!kv) return json({ ok: false, error: 'server_misconfigured' }, 500);
  const users = await kv.listUsers();
  return json({ ok: true, users });
};

export const POST: APIRoute = async ({ request, locals }: APIContext) => {
  const forbidden = requireAdmin(locals);
  if (forbidden) return forbidden;
  const csrf = requireSameOrigin(request);
  if (csrf) return csrf;

  const kv = getKv(locals);
  if (!kv) return json({ ok: false, error: 'server_misconfigured' }, 500);

  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    role?: Role;
  };
  const email = normalizeEmail(body.email);
  if (!email) return json({ ok: false, error: 'invalid_email' }, 400);

  const role: Role = body.role === 'admin' ? 'admin' : 'member';
  await kv.addUser({
    email,
    role,
    addedAt: new Date().toISOString(),
    addedBy: locals.user!.email,
  });

  const users = await kv.listUsers();
  return json({ ok: true, users });
};

export const PATCH: APIRoute = async ({ request, locals }: APIContext) => {
  const forbidden = requireAdmin(locals);
  if (forbidden) return forbidden;
  const csrf = requireSameOrigin(request);
  if (csrf) return csrf;

  const kv = getKv(locals);
  if (!kv) return json({ ok: false, error: 'server_misconfigured' }, 500);

  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    role?: Role;
  };
  const email = normalizeEmail(body.email);
  if (!email) return json({ ok: false, error: 'invalid_email' }, 400);
  if (body.role !== 'admin' && body.role !== 'member') {
    return json({ ok: false, error: 'invalid_role' }, 400);
  }

  // Prevent the last admin from accidentally demoting themselves to member —
  // that would lock everyone out of /admin.
  if (body.role === 'member' && email === locals.user!.email) {
    const users = await kv.listUsers();
    const remainingAdmins = users.filter((u) => u.role === 'admin' && u.email !== email).length;
    if (remainingAdmins === 0) {
      return json({ ok: false, error: 'last_admin' }, 400);
    }
  }

  const updated = await kv.updateUserRole(email, body.role);
  if (!updated) return json({ ok: false, error: 'not_found' }, 404);

  const users = await kv.listUsers();
  return json({ ok: true, users });
};

export const DELETE: APIRoute = async ({ request, locals }: APIContext) => {
  const forbidden = requireAdmin(locals);
  if (forbidden) return forbidden;
  const csrf = requireSameOrigin(request);
  if (csrf) return csrf;

  const kv = getKv(locals);
  if (!kv) return json({ ok: false, error: 'server_misconfigured' }, 500);

  const body = (await request.json().catch(() => ({}))) as { email?: string };
  const email = normalizeEmail(body.email);
  if (!email) return json({ ok: false, error: 'invalid_email' }, 400);

  // Same safeguard for deletion.
  if (email === locals.user!.email) {
    const users = await kv.listUsers();
    const remainingAdmins = users.filter((u) => u.role === 'admin' && u.email !== email).length;
    if (remainingAdmins === 0) {
      return json({ ok: false, error: 'last_admin' }, 400);
    }
  }

  await kv.removeUser(email);
  const users = await kv.listUsers();
  return json({ ok: true, users });
};
