import type { APIRoute } from 'astro';

export const prerender = false;

/**
 * GitHub OAuth callback for Decap CMS.
 *
 * GitHub redirects back here with `?code=...&state=...`. We:
 *   1. Verify state matches the cookie set in /api/cms-auth/auth
 *   2. Exchange the code for an access token via GitHub's token endpoint
 *   3. postMessage the token back to the opener window (the /admin popup)
 *      and close the popup — this is the protocol Decap CMS expects.
 */

interface TokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get('cookie');
  if (!header) return null;
  for (const part of header.split(/;\s*/)) {
    const [key, ...rest] = part.split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}

function popupHtml(payload: { type: 'success' | 'error'; data: unknown }): string {
  const body = JSON.stringify(payload);
  return `<!doctype html>
<html lang="sv">
<head><meta charset="utf-8"><title>Autentisering slutförd</title></head>
<body>
  <script>
    (function () {
      var payload = ${body};
      // Decap listens for two messages: "authorizing:github" then "authorization:github:<type>:<json>".
      function receive(event) {
        if (!event.data || event.data !== 'authorizing:github') return;
        window.opener.postMessage(
          'authorization:github:' + payload.type + ':' + JSON.stringify(payload.data),
          event.origin
        );
        window.removeEventListener('message', receive);
      }
      window.addEventListener('message', receive);
      // Kick off the handshake.
      window.opener && window.opener.postMessage('authorizing:github', '*');
      // Auto-close after a short delay in case opener is gone.
      setTimeout(function () { window.close(); }, 3000);
    })();
  </script>
  <noscript>
    <p>Aktivera JavaScript för att slutföra inloggningen.</p>
  </noscript>
</body>
</html>`;
}

export const GET: APIRoute = async ({ request, locals }) => {
  const env = locals.runtime?.env as
    | (Env & { GITHUB_CLIENT_ID?: string; GITHUB_CLIENT_SECRET?: string })
    | undefined;

  const clientId = env?.GITHUB_CLIENT_ID;
  const clientSecret = env?.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return new Response('GITHUB_CLIENT_ID eller GITHUB_CLIENT_SECRET saknas.', {
      status: 500,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  }

  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const expectedState = readCookie(request, 'cms_oauth_state');

  if (!code || !state || !expectedState || state !== expectedState) {
    return new Response(popupHtml({ type: 'error', data: { message: 'invalid_state' } }), {
      status: 400,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  }

  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  });

  if (!tokenResponse.ok) {
    return new Response(popupHtml({ type: 'error', data: { message: 'token_exchange_failed' } }), {
      status: 502,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  }

  const body = (await tokenResponse.json()) as TokenResponse;
  if (!body.access_token) {
    return new Response(
      popupHtml({ type: 'error', data: { message: body.error ?? 'no_token' } }),
      {
        status: 400,
        headers: { 'content-type': 'text/html; charset=utf-8' },
      },
    );
  }

  const html = popupHtml({
    type: 'success',
    data: {
      token: body.access_token,
      provider: 'github',
    },
  });

  // Clear the state cookie now that we're done.
  const headers = new Headers({
    'content-type': 'text/html; charset=utf-8',
    'set-cookie': 'cms_oauth_state=; Path=/api/cms-auth; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
  });

  return new Response(html, { status: 200, headers });
};
