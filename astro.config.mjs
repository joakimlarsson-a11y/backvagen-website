// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  site: 'https://asabackvag.se',
  output: 'server',
  adapter: cloudflare({
    imageService: 'compile',
    platformProxy: {
      enabled: true,
    },
  }),
  integrations: [react()],
  vite: {
    resolve: {
      alias: {
        '@': '/src',
        // Force the Workers-friendly React DOM server build. The default
        // "browser" build uses MessageChannel which isn't available during
        // worker initialisation; the "edge" build avoids that.
        'react-dom/server': 'react-dom/server.edge',
      },
    },
    ssr: {
      external: [],
    },
  },
});
