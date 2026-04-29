/// <reference path="../.astro/types.d.ts" />
/// <reference types="@astrojs/cloudflare" />
/// <reference types="@cloudflare/workers-types" />

type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

interface Env {
  APP_KV: KVNamespace;
  HASH_SECRET: string;
  RESEND_API_KEY?: string;
  PUBLIC_SITE_URL: string;
  EMAIL_FROM: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
}

declare namespace App {
  interface Locals extends Runtime {
    user: {
      email: string;
      role: 'member' | 'admin';
    } | null;
  }
}
