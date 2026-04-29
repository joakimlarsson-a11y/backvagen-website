import { defineMiddleware } from 'astro:middleware';
import { getKv } from '@/lib/kv';
import {
  readSessionId,
  buildSessionCookie,
  buildClearSessionCookie,
  isSecureRequest,
} from '@/lib/auth';

const LOGIN_PATH = '/medlem/logga-in';

function isProtectedPath(path: string): 'member' | 'admin' | null {
  if (path.startsWith('/admin')) return 'admin';
  if (path === LOGIN_PATH) return null;
  if (path.startsWith('/medlem')) return 'member';
  return null;
}

function isAuthApi(path: string): boolean {
  return path.startsWith('/api/auth/') || path.startsWith('/api/admin/');
}

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.user = null;

  // Skip all auth/session work for prerendered (static) pages. Astro still runs
  // middleware for them during `astro build`, but `request.headers` is not
  // available and no session handling is needed anyway.
  if (context.isPrerendered) {
    return next();
  }

  const path = new URL(context.request.url).pathname;
  const guard = isProtectedPath(path);
  const needsKv = guard !== null || isAuthApi(path);

  const kv = getKv(context.locals);

  // Try to hydrate the session regardless of whether this path is protected,
  // so that already-logged-in users see their nav state on any page.
  const sessionId = readSessionId(context.request);
  let sessionValid = false;
  if (kv && sessionId) {
    const session = await kv.getSession(sessionId);
    if (session) {
      // Re-verify that the user is still in the allow-list (admin may have removed them).
      const user = await kv.findUser(session.email);
      if (user) {
        context.locals.user = { email: user.email, role: user.role };
        await kv.touchSession(sessionId, { ...session, role: user.role });
        sessionValid = true;
      } else {
        // User removed while session was active — destroy it.
        await kv.deleteSession(sessionId);
      }
    }
  }

  if (needsKv && !kv) {
    return new Response(
      'Konfigurationsfel: KV-binding APP_KV saknas. Kör med `pnpm dev` via wranglers platform proxy.',
      { status: 500 },
    );
  }

  if (guard) {
    if (!sessionValid) {
      if (sessionId) {
        // Clear stale cookie before redirecting.
        const redirect = Response.redirect(new URL(LOGIN_PATH, context.request.url), 302);
        const headers = new Headers(redirect.headers);
        headers.append('set-cookie', buildClearSessionCookie(isSecureRequest(context.request)));
        return new Response(null, { status: 302, headers });
      }
      return context.redirect(LOGIN_PATH);
    }
    if (guard === 'admin' && context.locals.user?.role !== 'admin') {
      return new Response('Endast admin-behörighet.', {
        status: 403,
        headers: { 'content-type': 'text/plain; charset=utf-8' },
      });
    }
  }

  const response = await next();

  // If the middleware hydrated a session, make sure we re-emit the cookie with a
  // refreshed Max-Age so aktive användare never get logged out — UNLESS the
  // downstream handler has already set a session cookie (e.g. logout clearing
  // it, or verify issuing a fresh one).
  if (sessionValid && sessionId) {
    const existing = response.headers.getSetCookie?.() ?? [];
    const alreadyManaged = existing.some((c) => c.startsWith('session='));
    if (!alreadyManaged) {
      response.headers.append(
        'set-cookie',
        buildSessionCookie(sessionId, { secure: isSecureRequest(context.request) }),
      );
    }
  }

  return response;
});
