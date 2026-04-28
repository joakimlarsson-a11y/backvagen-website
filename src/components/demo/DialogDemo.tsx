import { useState, type ReactNode } from 'react';
import { Button as AriaButton } from 'react-aria-components';
import { Dialog } from '../ui/Dialog';
import { TextField } from '../ui/TextField';

export function DialogDemo(): ReactNode {
  const [status, setStatus] = useState<string | null>(null);

  return (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
      <Dialog
        title="Lägg till boende"
        trigger={
          <AriaButton className="ra-btn ra-btn--primary">Lägg till boende</AriaButton>
        }
        footer={(close) => (
          <>
            <AriaButton className="ra-btn ra-btn--ghost" onPress={close}>
              Avbryt
            </AriaButton>
            <AriaButton
              className="ra-btn ra-btn--primary"
              onPress={() => {
                setStatus('Kontot är tillagt.');
                close();
              }}
            >
              Lägg till
            </AriaButton>
          </>
        )}
      >
        {() => (
          <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <TextField
              label="E-postadress"
              type="email"
              autoComplete="email"
              placeholder="granne@exempel.se"
              isRequired
            />
            <TextField
              label="Namn (valfritt)"
              autoComplete="name"
              description="Används endast internt för styrelsen."
            />
          </form>
        )}
      </Dialog>
      {status && (
        <p role="status" style={{ margin: 0, color: 'var(--color-success)' }}>
          {status}
        </p>
      )}
    </div>
  );
}
