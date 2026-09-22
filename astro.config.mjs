// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Fully static site — every page is rendered at build time and served as plain
// HTML. No server, no adapter, no runtime bindings to configure.
export default defineConfig({
  site: 'https://asabackvag.se',
  integrations: [sitemap()],
});
