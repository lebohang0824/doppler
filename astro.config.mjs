// @ts-check
import { defineConfig } from 'astro/config';

import alpinejs from '@astrojs/alpinejs';

import db from '@astrojs/db';

// https://astro.build/config
export default defineConfig({
  integrations: [alpinejs(), db()]
});