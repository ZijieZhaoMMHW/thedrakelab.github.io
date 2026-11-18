#!/usr/bin/env node
// Check that every internal link and image in the built site (dist/) points to a file that exists.
import fs from 'node:fs';
import path from 'node:path';

const DIST = 'dist';
const base = (process.env.BASE_PATH || '/').replace(/\/$/, '');
const files = [];
(function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    fs.statSync(p).isDirectory() ? walk(p) : p.endsWith('.html') && files.push(p);
  }
})(DIST);

const exists = (u) => {
  let p = decodeURIComponent(u.split(/[?#]/)[0]);
  if (base && p.startsWith(base)) p = p.slice(base.length);
  const full = path.join(DIST, p);
  return fs.existsSync(full) && (fs.statSync(full).isFile() || fs.existsSync(path.join(full, 'index.html')));
};

let bad = 0;
for (const f of files) {
  const html = fs.readFileSync(f, 'utf8');
  for (const [, attr, u] of html.matchAll(/\s(href|src)="(\/[^"]*)"/g)) {
    if (u.startsWith('//') || u.startsWith('/_astro/')) continue;
    if (!exists(u)) { console.log(`✗ ${f}: broken ${attr} ${u}`); bad++; }
  }
}
if (bad) { console.log(`\n${bad} broken internal link(s). Missing images usually mean the file wasn't added under public/images/.`); process.exit(1); }
console.log(`✓ No broken internal links in ${files.length} pages.`);
