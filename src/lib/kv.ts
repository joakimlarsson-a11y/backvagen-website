export type Role = 'member' | 'admin';

export interface AllowedUser {
  email: string;
  role: Role;
  addedAt: string;
  addedBy: string;
}

export interface Session {
  email: string;
  role: Role;
  createdAt: string;
  lastSeen: string;
}

export interface MagicLink {
  email: string;
  createdAt: string;
}

export interface LoginLogEntry {
  email: string;
  ts: string;
  ipHash: string;
}

const K_USERS = 'allowed-users';
const K_LOG = 'login-log';

const PREFIX_MAGIC = 'magic-links:';
const PREFIX_SESSION = 'sessions:';

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 180;
const MAGIC_LINK_TTL_SECONDS = 60 * 15;
const LOG_MAX_ENTRIES = 100;

export class Kv {
  constructor(private readonly ns: KVNamespace) {}

  // ===== Allowed users =====

  async listUsers(): Promise<AllowedUser[]> {
    const raw = await this.ns.get(K_USERS);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as AllowedUser[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  async findUser(email: string): Promise<AllowedUser | null> {
    const normalized = email.trim().toLowerCase();
    const all = await this.listUsers();
    return all.find((u) => u.email === normalized) ?? null;
  }

  async addUser(user: AllowedUser): Promise<void> {
    const all = await this.listUsers();
    const filtered = all.filter((u) => u.email !== user.email);
    filtered.push({ ...user, email: user.email.trim().toLowerCase() });
    await this.ns.put(K_USERS, JSON.stringify(filtered));
  }

  async removeUser(email: string): Promise<void> {
    const normalized = email.trim().toLowerCase();
    const all = await this.listUsers();
    const filtered = all.filter((u) => u.email !== normalized);
    await this.ns.put(K_USERS, JSON.stringify(filtered));
  }

  async updateUserRole(email: string, role: Role): Promise<boolean> {
    const normalized = email.trim().toLowerCase();
    const all = await this.listUsers();
    const idx = all.findIndex((u) => u.email === normalized);
    if (idx === -1) return false;
    all[idx] = { ...all[idx], role };
    await this.ns.put(K_USERS, JSON.stringify(all));
    return true;
  }

  // ===== Magic links =====

  async putMagicLink(token: string, link: MagicLink): Promise<void> {
    await this.ns.put(`${PREFIX_MAGIC}${token}`, JSON.stringify(link), {
      expirationTtl: MAGIC_LINK_TTL_SECONDS,
    });
  }

  async consumeMagicLink(token: string): Promise<MagicLink | null> {
    const key = `${PREFIX_MAGIC}${token}`;
    const raw = await this.ns.get(key);
    if (!raw) return null;
    await this.ns.delete(key);
    try {
      return JSON.parse(raw) as MagicLink;
    } catch {
      return null;
    }
  }

  // ===== Sessions =====

  async putSession(id: string, session: Session): Promise<void> {
    await this.ns.put(`${PREFIX_SESSION}${id}`, JSON.stringify(session), {
      expirationTtl: SESSION_TTL_SECONDS,
    });
  }

  async getSession(id: string): Promise<Session | null> {
    const raw = await this.ns.get(`${PREFIX_SESSION}${id}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Session;
    } catch {
      return null;
    }
  }

  async touchSession(id: string, session: Session): Promise<void> {
    const updated: Session = { ...session, lastSeen: new Date().toISOString() };
    await this.putSession(id, updated);
  }

  async deleteSession(id: string): Promise<void> {
    await this.ns.delete(`${PREFIX_SESSION}${id}`);
  }

  // ===== Login log =====

  async appendLog(entry: LoginLogEntry): Promise<void> {
    const raw = await this.ns.get(K_LOG);
    let list: LoginLogEntry[] = [];
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as LoginLogEntry[];
        if (Array.isArray(parsed)) list = parsed;
      } catch {
        // reset on parse error
      }
    }
    list.unshift(entry);
    if (list.length > LOG_MAX_ENTRIES) list = list.slice(0, LOG_MAX_ENTRIES);
    await this.ns.put(K_LOG, JSON.stringify(list));
  }

  async listLog(): Promise<LoginLogEntry[]> {
    const raw = await this.ns.get(K_LOG);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as LoginLogEntry[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}

export function getKv(locals: App.Locals): Kv | null {
  const ns = locals.runtime?.env?.APP_KV;
  if (!ns) return null;
  return new Kv(ns);
}
