import { useState, type ReactNode } from 'react';
import { Button as AriaButton } from 'react-aria-components';
import { TextField } from '../ui/TextField';
import { Form, FormActions } from '../ui/Form';

export function LoginFormDemo(): ReactNode {
  const [banner, setBanner] = useState<{ variant: 'error' | 'success'; message: string } | null>(
    null,
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = data.get('email');
    if (!email || typeof email !== 'string' || email.trim() === '') {
      setBanner({ variant: 'error', message: 'E-postadress saknas. Fyll i fältet för att fortsätta.' });
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      setBanner({
        variant: 'error',
        message: 'E-postadressen ser inte korrekt ut. Den ska innehålla ett @-tecken och en domän (t.ex. namn@exempel.se).',
      });
      return;
    }
    setBanner({
      variant: 'success',
      message: `Om ${email} är registrerad skickar vi en inloggningslänk inom kort.`,
    });
  }

  return (
    <Form onSubmit={handleSubmit} banner={banner} aria-label="Inloggning (demo)">
      <TextField
        name="email"
        type="email"
        label="E-postadress"
        description="Vi skickar en länk du klickar på för att logga in."
        placeholder="namn@exempel.se"
        autoComplete="email"
        isRequired
      />
      <FormActions>
        <AriaButton type="submit" className="ra-btn ra-btn--primary">
          Skicka inloggningslänk
        </AriaButton>
      </FormActions>
    </Form>
  );
}
