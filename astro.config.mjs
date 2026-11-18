// @ts-check
import { defineConfig } from 'astro/config';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeBasePath from './src/lib/rehype-base-path.mjs';

// SITE_URL and BASE_PATH are set automatically by the GitHub Pages workflow.
// Locally they default to serving the site from the root.
export default defineConfig({
  site: process.env.SITE_URL || 'http://localhost:4321',
  base: process.env.BASE_PATH || '/',
  trailingSlash: 'ignore',
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex, rehypeBasePath],
  },
});
