// @ts-check
import { defineConfig, envField } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://artewu.com',
  env: {
    schema: {
      // Google tag / GTM container ID. Override per environment via
      // the GTM_ID env var (e.g. in .env); set it empty to disable tracking.
      GTM_ID: envField.string({
        context: 'client',
        access: 'public',
        optional: true,
        default: 'GTM-TFLNJ33L',
      }),
    },
  },
  integrations: [react(), mdx(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
