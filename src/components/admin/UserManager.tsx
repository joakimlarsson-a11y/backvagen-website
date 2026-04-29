import { useState, type ReactNode } from 'react';
import { Button as AriaButton, Radio, RadioGroup, Label } from 'react-aria-components';
import { Trash2, UserPlus, ShieldCheck, User as UserIcon } from 'lucide-react';
import { Dialog, ControlledDialog } from '../ui/Dialog';
import { TextField } from '../ui/TextField';
import { Form, FormActions } from '../ui/Form';
import '../ui/ReactAria.css';
import './UserManager.css';

type Role = 'member' | 'admin';

interface AllowedUser {
  email: string;
  role: Role;
  addedAt: string;
  addedBy: string;
}

interface Props {
  initialUsers: AllowedUser[];
  currentUserEmail: string;
}

const ERROR_COPY: Record<string, string> = {
  forbidden: 'Du saknar behörighet.',
  csrf_protection: 'Försök igen (säkerhetskontroll).',
  invalid_email: 'E-postadressen ser inte korrekt ut.',
  invalid_role: 'Rollen är ogiltig.',
  not_found: 'Användaren kunde inte hittas.',
  last_admin: 'Du är den enda administratören. Lägg till en till innan du ändrar din egen roll.',
  server_misconfigured: 'Serverkonfiguration saknas.',
};

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('sv-SE', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
}

async function callApi(
  method: 'POST' | 'PATCH' | 'DELETE',
  body: Record<string, unknown>,
): Promise<{ ok: boolean; users?: AllowedUser[]; error?: string }> {
  const response = await fetch('/api/admin/users', {
    method,
    headers: {
      'content-type': 'application/json',
      'x-requested-with': 'xmlhttprequest',
    },
    body: JSON.stringify(body),
  });
  return (await response.json()) as { ok: boolean; users?: AllowedUser[]; error?: string };
}

export function UserManager({ initialUsers, currentUserEmail }: Props): ReactNode {
  const [users, setUsers] = useState<AllowedUser[]>(initialUsers);
  const [banner, setBanner] = useState<{ variant: 'error' | 'success'; message: string } | null>(
    null,
  );
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  // Pending role change awaiting confirmation: { email, newRole }
  const [pendingRoleChange, setPendingRoleChange] = useState<
    { email: string; newRole: Role } | null
  >(null);

  function apply(result: Awaited<ReturnType<typeof callApi>>, successMessage: string): boolean {
    if (!result.ok) {
      setBanner({
        variant: 'error',
        message: ERROR_COPY[result.error ?? ''] ?? 'Något gick fel. Försök igen.',
      });
      return false;
    }
    if (result.users) setUsers(result.users);
    setBanner({ variant: 'success', message: successMessage });
    return true;
  }

  async function handleAdd(event: React.FormEvent<HTMLFormElement>): Promise<boolean> {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = (data.get('email') as string | null)?.trim().toLowerCase() ?? '';
    const role = (data.get('role') as Role | null) ?? 'member';
    if (!email) return false;
    setPendingEmail(email);
    try {
      const result = await callApi('POST', { email, role });
      return apply(result, `${email} har lagts till som ${role === 'admin' ? 'admin' : 'medlem'}.`);
    } finally {
      setPendingEmail(null);
    }
  }

  async function handleRoleChange(email: string, newRole: Role): Promise<void> {
    setPendingEmail(email);
    const previous = users;
    setUsers((list) => list.map((u) => (u.email === email ? { ...u, role: newRole } : u)));
    try {
      const result = await callApi('PATCH', { email, role: newRole });
      if (!result.ok) setUsers(previous);
      apply(result, `${email} är nu ${newRole === 'admin' ? 'admin' : 'medlem'}.`);
    } finally {
      setPendingEmail(null);
    }
  }

  async function handleRemove(email: string): Promise<void> {
    setPendingEmail(email);
    try {
      const result = await callApi('DELETE', { email });
      apply(result, `${email} har tagits bort.`);
    } finally {
      setPendingEmail(null);
    }
  }

  const adminCount = users.filter((u) => u.role === 'admin').length;
  const memberCount = users.length - adminCount;

  return (
    <div className="user-manager">
      <header className="user-manager__head">
        <dl className="user-manager__stats" aria-label="Sammanfattning av användarkonton">
          <div>
            <dt className="user-manager__stat-label">Användare</dt>
            <dd className="user-manager__stat-num">{users.length}</dd>
          </div>
          <div>
            <dt className="user-manager__stat-label">Admin</dt>
            <dd className="user-manager__stat-num">{adminCount}</dd>
          </div>
          <div>
            <dt className="user-manager__stat-label">Medlem</dt>
            <dd className="user-manager__stat-num">{memberCount}</dd>
          </div>
        </dl>

        <Dialog
          title="Lägg till användare"
          trigger={
            <AriaButton className="ra-btn ra-btn--primary">
              <UserPlus size={16} aria-hidden="true" />
              Lägg till
            </AriaButton>
          }
          footer={() => null}
        >
          {(close) => (
            <Form
              onSubmit={async (e) => {
                const ok = await handleAdd(e);
                if (ok) close();
              }}
              aria-label="Lägg till användare"
            >
              <TextField
                name="email"
                type="email"
                label="E-postadress"
                placeholder="granne@exempel.se"
                autoComplete="email"
                isRequired
              />
              <RadioGroup name="role" defaultValue="member" className="role-group">
                <Label className="ra-label">Roll</Label>
                <div className="role-group__options">
                  <Radio value="member" className="role-option">
                    <UserIcon size={16} aria-hidden="true" />
                    <span>Medlem — kan läsa medlemssidor</span>
                  </Radio>
                  <Radio value="admin" className="role-option">
                    <ShieldCheck size={16} aria-hidden="true" />
                    <span>Admin — kan även hantera användare</span>
                  </Radio>
                </div>
              </RadioGroup>
              <FormActions>
                <AriaButton
                  className="ra-btn ra-btn--ghost"
                  onPress={close}
                  isDisabled={pendingEmail !== null}
                >
                  Avbryt
                </AriaButton>
                <AriaButton
                  type="submit"
                  className="ra-btn ra-btn--primary"
                  isDisabled={pendingEmail !== null}
                >
                  {pendingEmail !== null ? 'Sparar…' : 'Lägg till'}
                </AriaButton>
              </FormActions>
            </Form>
          )}
        </Dialog>
      </header>

      {/* Permanent live regions so screen readers announce dynamic messages
          regardless of whether the banner existed on first render. */}
      <div
        className={
          banner && banner.variant === 'success'
            ? 'ra-form__banner ra-form__banner--success user-manager__banner'
            : 'visually-hidden'
        }
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {banner && banner.variant === 'success' ? banner.message : ''}
      </div>
      <div
        className={
          banner && banner.variant === 'error'
            ? 'ra-form__banner ra-form__banner--error user-manager__banner'
            : 'visually-hidden'
        }
        role="alert"
        aria-atomic="true"
      >
        {banner && banner.variant === 'error' ? banner.message : ''}
      </div>

      {users.length === 0 ? (
        <p className="user-manager__empty">
          Inga användare än. Lägg till minst en adress innan styrelsen kan logga in.
        </p>
      ) : (
        <ul className="user-list" role="list">
          {users.map((u) => {
            const isSelf = u.email === currentUserEmail;
            const busy = pendingEmail === u.email;
            return (
              <li key={u.email} className="user-list__row">
                <div className="user-list__main">
                  <span
                    className={`user-list__badge user-list__badge--${u.role}`}
                    aria-label={`Roll: ${u.role === 'admin' ? 'Admin' : 'Medlem'}`}
                  >
                    {u.role === 'admin' ? (
                      <ShieldCheck size={14} aria-hidden="true" />
                    ) : (
                      <UserIcon size={14} aria-hidden="true" />
                    )}
                    {u.role === 'admin' ? 'Admin' : 'Medlem'}
                  </span>
                  <div className="user-list__info">
                    <p className="user-list__email">
                      {u.email}
                      {isSelf && <span className="user-list__self"> (du)</span>}
                    </p>
                    <p className="user-list__meta">
                      Tillagd {formatDate(u.addedAt)} av {u.addedBy}
                    </p>
                  </div>
                </div>

                <div className="user-list__actions">
                  <select
                    className="user-list__role-swap"
                    value={u.role}
                    disabled={busy}
                    aria-label={`Ändra roll för ${u.email}`}
                    onChange={(e) => {
                      const newRole = e.target.value as Role;
                      if (newRole !== u.role) {
                        setPendingRoleChange({ email: u.email, newRole });
                      }
                    }}
                  >
                    <option value="member">Medlem</option>
                    <option value="admin">Admin</option>
                  </select>

                  <Dialog
                    title={`Ta bort ${u.email}?`}
                    trigger={
                      <AriaButton
                        className="ra-btn ra-btn--ghost user-list__delete"
                        aria-label={`Ta bort ${u.email}`}
                        isDisabled={busy}
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </AriaButton>
                    }
                    footer={(close) => (
                      <>
                        <AriaButton className="ra-btn ra-btn--ghost" onPress={close}>
                          Avbryt
                        </AriaButton>
                        <AriaButton
                          className="ra-btn ra-btn--danger"
                          onPress={async () => {
                            await handleRemove(u.email);
                            close();
                          }}
                        >
                          Ta bort användare
                        </AriaButton>
                      </>
                    )}
                  >
                    {() => (
                      <div>
                        <p>
                          Användaren <strong>{u.email}</strong> kommer inte längre kunna
                          logga in på medlemssidan. Pågående sessioner invalideras vid nästa
                          anrop.
                        </p>
                        {isSelf && (
                          <p style={{ color: 'var(--color-danger)', marginTop: '1rem' }}>
                            <strong>Varning:</strong> Du håller på att ta bort ditt eget
                            konto. Om det inte finns någon annan admin kommer ingen kunna
                            komma åt admin-sidan igen.
                          </p>
                        )}
                      </div>
                    )}
                  </Dialog>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {pendingRoleChange && (
        <RoleChangeConfirmation
          email={pendingRoleChange.email}
          newRole={pendingRoleChange.newRole}
          isSelf={pendingRoleChange.email === currentUserEmail}
          onCancel={() => setPendingRoleChange(null)}
          onConfirm={async () => {
            await handleRoleChange(pendingRoleChange.email, pendingRoleChange.newRole);
            setPendingRoleChange(null);
          }}
        />
      )}
    </div>
  );
}

interface ConfirmProps {
  email: string;
  newRole: Role;
  isSelf: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

/**
 * Controlled confirmation dialog for role changes. Shown whenever
 * `pendingRoleChange` is set; closes via cancel or confirm actions.
 */
function RoleChangeConfirmation({
  email,
  newRole,
  isSelf,
  onConfirm,
  onCancel,
}: ConfirmProps): ReactNode {
  const roleLabel = newRole === 'admin' ? 'admin' : 'medlem';
  const impact =
    newRole === 'admin'
      ? 'Admin-rollen ger tillgång till denna sida och kan lägga till/ta bort andra användare.'
      : 'Medlems-rollen tar bort tillgången till admin-sidorna men behåller inloggning till medlemsområdet.';

  return (
    <ControlledDialog
      isOpen={true}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
      title={`Ändra roll för ${email}?`}
      isDismissable={true}
      footer={() => (
        <>
          <AriaButton className="ra-btn ra-btn--ghost" onPress={onCancel}>
            Avbryt
          </AriaButton>
          <AriaButton className="ra-btn ra-btn--primary" onPress={onConfirm}>
            Bekräfta rolländring
          </AriaButton>
        </>
      )}
    >
      {() => (
        <div>
          <p>
            Användaren <strong>{email}</strong> kommer få rollen{' '}
            <strong>{roleLabel}</strong>.
          </p>
          <p style={{ marginTop: '0.75rem' }}>{impact}</p>
          {isSelf && (
            <p style={{ color: 'var(--color-danger)', marginTop: '1rem' }}>
              <strong>Notera:</strong> Du ändrar din egen roll. Ändringen tar effekt
              vid nästa sidomladdning.
            </p>
          )}
        </div>
      )}
    </ControlledDialog>
  );
}
