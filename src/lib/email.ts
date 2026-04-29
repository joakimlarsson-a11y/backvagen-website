interface SendMagicLinkOptions {
  to: string;
  link: string;
  apiKey: string | undefined;
  from: string;
  siteUrl: string;
}

interface SendResult {
  ok: boolean;
  error?: string;
  devLinkLogged?: boolean;
}

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

export async function sendMagicLink(options: SendMagicLinkOptions): Promise<SendResult> {
  const { to, link, apiKey, from, siteUrl } = options;

  if (!apiKey) {
    console.log('\n[dev] Magic link for %s:', to);
    console.log('      %s\n', link);
    return { ok: true, devLinkLogged: true };
  }

  const response = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: 'Din inloggningslänk till asabackvag.se',
      text: buildPlainText(link, siteUrl),
      html: buildHtml(link, siteUrl),
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    return { ok: false, error: `Resend ${response.status}: ${body}` };
  }
  return { ok: true };
}

function buildPlainText(link: string, siteUrl: string): string {
  return [
    'Hej!',
    '',
    'Klicka på länken nedan för att logga in på medlemssidan för',
    'Bäckvägens Samfällighetsförening. Länken är giltig i 15 minuter',
    'och kan bara användas en gång.',
    '',
    link,
    '',
    'Om du inte begärde den här länken kan du ignorera mejlet.',
    '',
    siteUrl,
    'Bäckvägens Samfällighetsförening',
  ].join('\n');
}

function buildHtml(link: string, siteUrl: string): string {
  const safeLink = escapeHtml(link);
  const safeSite = escapeHtml(siteUrl);
  return `<!doctype html>
<html lang="sv">
<head>
  <meta charset="utf-8">
  <title>Din inloggningslänk</title>
</head>
<body style="margin:0;padding:0;background:#F7F4EE;font-family:'Inter',Arial,sans-serif;color:#1A1A1A;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:8px;padding:40px;">
          <tr><td>
            <p style="font-size:11px;letter-spacing:0.15em;color:#4A4A4A;margin:0 0 24px;text-transform:uppercase;font-weight:700;">Bäckvägens samfällighet</p>
            <h1 style="font-size:24px;font-weight:900;color:#0F2A47;margin:0 0 16px;line-height:1.2;letter-spacing:-0.02em;">Din inloggningslänk</h1>
            <p style="margin:0 0 24px;line-height:1.6;">
              Klicka på knappen nedan för att logga in på medlemssidan.
              Länken är giltig i 15 minuter och kan bara användas en gång.
            </p>
            <p style="margin:0 0 32px;">
              <a href="${safeLink}" style="display:inline-block;background:#0F2A47;color:#F7F4EE;padding:14px 26px;border-radius:4px;text-decoration:none;font-weight:700;letter-spacing:0.03em;">Logga in &rarr;</a>
            </p>
            <p style="font-size:13px;color:#4A4A4A;margin:0 0 8px;">Fungerar inte knappen? Kopiera in den här adressen i din webbläsare:</p>
            <p style="font-size:12px;word-break:break-all;color:#0F2A47;margin:0 0 32px;">${safeLink}</p>
            <hr style="border:none;border-top:1px solid #E5E1D8;margin:0 0 16px;">
            <p style="font-size:12px;color:#4A4A4A;margin:0;">
              Om du inte begärde den här länken kan du ignorera mejlet.<br>
              <a href="${safeSite}" style="color:#0F2A47;">${safeSite}</a>
            </p>
          </td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
