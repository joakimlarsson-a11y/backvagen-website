import type { APIRoute } from 'astro';

export const prerender = false;

/**
 * Start of the Decap CMS GitHub OAuth popup flow.
 * Opens a popup that redirects to GitHub, then closes back to /admin
 * with a success/error message via postMessage (handled in callback.ts).
 */
export const GET: APIRoute = async ({ request, locals }) => {
  const env = locals.runtime?.env as (Env & { GITHUB_CLIENT_ID?: string }) | undefined;
  const clientId = env?.GITHUB_CLIENT_ID;
  if (!clientId) {
    return new Response('GITHUB_CLIENT_ID saknas i server-konfigurationen.', {
      status: 500,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  }

  const url = new URL(request.url);
  const origin = env?.PUBLIC_SITE_URL || url.origin;
  const redirectUri = `${origin.replace(/\/+$/, '')}/api/cms-auth/callback`;

  // Pass a random state to protect against CSRF during the OAuth dance.
  const state = crypto.randomUUID();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'repo,user',
    state,
    allow_signup: 'false',
  });

  const headers = new Headers({
    location: `https://github.com/login/oauth/authorize?${params.toString()}`,
    'set-cookie': `cms_oauth_state=${state}; Path=/api/cms-auth; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
  });

  return new Response(null, { status: 302, headers });
};
