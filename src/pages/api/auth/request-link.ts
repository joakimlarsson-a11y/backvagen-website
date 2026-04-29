import type { APIRoute } from 'astro';
import { getKv } from '@/lib/kv';
import { createMagicLinkToken } from '@/lib/auth';
import { sendMagicLink } from '@/lib/email';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const kv = getKv(locals);
  const env = locals.runtime?.env;
  if (!kv || !env) {
    return json({ ok: false, error: 'server_misconfigured' }, 500);
  }

  let email = '';
  try {
    const contentType = request.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      const body = (await request.json().catch(() => ({}))) as { email?: string };
      email = body.email ?? '';
    } else {
      const form = await request.formData();
      email = (form.get('email') as string | null) ?? '';
    }
  } catch {
    return json({ ok: false, error: 'invalid_body' }, 400);
  }

  email = email.trim().toLowerCase();
  if (!email || !email.includes('@') || !email.includes('.')) {
    return json({ ok: false, error: 'invalid_email' }, 400);
  }

  // Always respond with ok:true to avoid user-enumeration — a missing address
  // simply means no email is sent and the same neutral confirmation is returned.
  const user = await kv.findUser(email);
  if (!user) {
    return json({ ok: true });
  }

  const secret = env.HASH_SECRET;
  if (!secret) {
    return json({ ok: false, error: 'server_misconfigured' }, 500);
  }

  const { token, payload } = await createMagicLinkToken(email, secret);
  await kv.putMagicLink(token, {
    email: payload.email,
    createdAt: payload.createdAt,
  });

  const baseUrl = env.PUBLIC_SITE_URL || new URL(request.url).origin;
  const link = `${baseUrl.replace(/\/+$/, '')}/api/auth/verify?token=${encodeURIComponent(token)}`;

  const result = await sendMagicLink({
    to: email,
    link,
    apiKey: env.RESEND_API_KEY,
    from: env.EMAIL_FROM,
    siteUrl: baseUrl,
  });

  if (!result.ok) {
    return json({ ok: false, error: 'send_failed' }, 502);
  }

  return json({ ok: true, devLinkLogged: result.devLinkLogged ?? false });
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}
