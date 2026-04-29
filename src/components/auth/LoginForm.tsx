import { useState, type ReactNode } from 'react';
import { Button as AriaButton } from 'react-aria-components';
import { TextField } from '../ui/TextField';
import { Form, FormActions } from '../ui/Form';

interface Props {
  initialError?: string | null;
}

const ERROR_MESSAGES: Record<string, string> = {
  missing: 'Inloggningslänken saknar token. Begär en ny länk nedan.',
  invalid: 'Inloggningslänken är ogiltig. Begär en ny länk nedan.',
  expired: 'Länken har gått ut eller redan använts. Begär en ny länk nedan.',
  not_allowed:
    'E-postadressen finns inte längre i medlemslistan. Kontakta styrelsen om detta är fel.',
};

export function LoginForm({ initialError = null }: Props): ReactNode {
  const initialBanner = initialError
    ? { variant: 'error' as const, message: ERROR_MESSAGES[initialError] ?? ERROR_MESSAGES.invalid }
    : null;

  const [banner, setBanner] = useState<{
    variant: 'error' | 'success';
    message: string;
  } | null>(initialBanner);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    const email = (data.get('email') as string | null)?.trim() ?? '';

    if (!email) {
      setBanner({ variant: 'error', message: 'E-postadress saknas. Fyll i fältet för att fortsätta.' });
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      setBanner({
        variant: 'error',
        message:
          'E-postadressen ser inte korrekt ut. Kontrollera att du skrivit in den rätt.',
      });
      return;
    }

    setBusy(true);
    setBanner(null);
    try {
      const response = await fetch('/api/auth/request-link', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        setBanner({
          variant: 'error',
          message: 'Något gick fel på servern. Försök igen om en stund.',
        });
        return;
      }
      setSent(true);
      setBanner({
        variant: 'success',
        message: `Om ${email} är registrerad har vi skickat en inloggningslänk. Kontrollera din inkorg (och skräppost) inom de närmaste minuterna.`,
      });
    } catch {
      setBanner({
        variant: 'error',
        message: 'Kunde inte nå servern. Kontrollera din internetanslutning och försök igen.',
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Form onSubmit={handleSubmit} banner={banner} aria-label="Logga in">
      <TextField
        name="email"
        type="email"
        label="E-postadress"
        description="Vi skickar en länk du klickar på för att logga in. Länken är giltig i 15 minuter."
        placeholder="namn@exempel.se"
        autoComplete="email"
        isRequired
        isDisabled={sent}
      />
      <FormActions>
        <AriaButton
          type="submit"
          className="ra-btn ra-btn--primary"
          isDisabled={busy || sent}
        >
          {busy ? 'Skickar…' : sent ? 'Länk skickad' : 'Skicka inloggningslänk'}
        </AriaButton>
      </FormActions>
    </Form>
  );
}
