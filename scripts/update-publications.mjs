#!/usr/bin/env node
// Pull publications from ORCID and write data/publications.json.
// Run with: npm run update-publications
// Configuration: data/publications-config.yaml
import fs from 'node:fs';
import { load as yamlLoad } from 'js-yaml';
import { buildPublications } from './publications-lib.mjs';

const OUT = 'data/publications.json';
const config = yamlLoad(fs.readFileSync('data/publications-config.yaml', 'utf8')) ?? {};
const orcids = (config.orcids ?? []).map(String);
if (!orcids.length) throw new Error('No ORCID iDs listed in data/publications-config.yaml');

const previous = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')).works ?? [] : [];

async function fetchJson(url, accept) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, { headers: { Accept: accept }, redirect: 'follow' });
    if (res.ok) return res.json();
    if (attempt >= 3 || (res.status < 500 && res.status !== 429)) throw new Error(`HTTP ${res.status} for ${url}`);
    await new Promise((r) => setTimeout(r, 2000 * attempt));
  }
}

const works = await buildPublications({ orcids, previous, fetchJson, log: console.log });
if (JSON.stringify(previous) === JSON.stringify(works)) {
  console.log(`No changes (${works.length} works).`);
} else {
  fs.writeFileSync(OUT, JSON.stringify({ generated_from: orcids, works }, null, 2) + '\n');
  const oldIds = new Set(previous.map((p) => p.id));
  console.log(`Wrote ${works.length} works to ${OUT} (${works.filter((w) => !oldIds.has(w.id)).length} new).`);
}
