// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  site: 'https://asabackvag.se',
  output: 'static',
  adapter: cloudflare({
    imageService: 'compile',
  }),
  integrations: [react()],
  vite: {
    resolve: {
      alias: {
        '@': '/src',
      },
    },
  },
});
