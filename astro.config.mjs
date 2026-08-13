// @ts-check
import { defineConfig } from 'astro/config';

import vercel from '@astrojs/vercel';
import react from '@astrojs/react';
import keystatic from '@keystatic/astro';

// https://astro.build/config
export default defineConfig({
  // Keystatic's admin UI (/keystatic) and its API routes are server-rendered
  // on demand; the rest of the site stays statically prerendered.
  integrations: [react(), keystatic()],
  adapter: vercel(),
});
