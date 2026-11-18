import fs from 'node:fs';
import { load as yamlLoad } from 'js-yaml';
import type { CollectionEntry } from 'astro:content';
import { nameKey } from './people';

export type Author = { given: string; family: string; orcid?: string };
export type Work = {
  id: string; kind: 'article' | 'preprint' | 'data' | 'software' | 'other';
  doi: string | null; title: string; authors: Author[]; venue: string;
  year: number | null; month?: number | null; volume?: string | null; issue?: string | null;
  pages?: string | null; publisher?: string | null; url: string | null; related_dois?: string[];
};

/** Load ORCID-derived works + manual extras, minus excluded DOIs. */
export function loadWorks(): Work[] {
  const auto: Work[] = JSON.parse(fs.readFileSync('data/publications.json', 'utf8')).works ?? [];
  const extraRaw = (yamlLoad(fs.readFileSync('data/publications-extra.yaml', 'utf8')) as any[]) ?? [];
  const extra: Work[] = extraRaw.map((e, i) => ({
    id: e.doi ?? `extra-${i}`,
    kind: e.kind ?? 'article',
    doi: e.doi ?? null,
    title: e.title,
    authors: (e.authors ?? []).map((a: string | Author) => {
      if (typeof a !== 'string') return a;
      const parts = a.trim().split(/\s+/);
      return { given: parts.slice(0, -1).join(' '), family: parts.at(-1) ?? '' };
    }),
    venue: e.venue ?? '',
    year: e.year ?? null,
    url: e.url ?? (e.doi ? `https://doi.org/${e.doi}` : null),
  }));
  const excluded = new Set(
    fs.readFileSync('data/publications-exclude.txt', 'utf8').split('\n')
      .map((l) => l.trim().toLowerCase()).filter((l) => l && !l.startsWith('#')),
  );
  const autoDois = new Set(auto.map((w) => w.doi));
  return [...auto, ...extra.filter((w) => !w.doi || !autoDois.has(w.doi))]
    .filter((w) => !w.doi || !excluded.has(w.doi.toLowerCase()))
    .sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || (b.month ?? 0) - (a.month ?? 0));
}

/** Return the id of the group member matching this author, if any. */
export function matchMember(a: Author, people: CollectionEntry<'people'>[]): string | undefined {
  for (const p of people) {
    if (a.orcid && p.data.orcid && a.orcid === p.data.orcid) return p.id;
  }
  const fullName = `${a.given} ${a.family}`.trim();
  const key = nameKey(a.given ? fullName : a.family);
  for (const p of people) {
    const k = nameKey(p.data.name);
    if (k.family === key.family && k.initial === key.initial) return p.id;
  }
  return undefined;
}

export const formatAuthor = (a: Author) => {
  if (!a.given) return a.family; // already a full name string
  const initials = a.given.split(/[\s.]+/).filter(Boolean).map((g) => g.includes('-') ? g.split('-').map((x) => x[0] + '.').join('-') : g[0] + '.').join(' ');
  return `${initials} ${a.family}`;
};

export function toBibtex(w: Work): string {
  const first = w.authors[0];
  const fam = (first ? (first.given ? first.family : first.family.split(' ').at(-1)) : 'anon') ?? 'anon';
  const key = (fam.normalize('NFD').replace(/[^A-Za-z]/g, '') || 'anon') + (w.year ?? '') +
    (w.title.split(/\s+/).find((t) => t.length > 3)?.replace(/[^A-Za-z]/g, '').toLowerCase() ?? '');
  const type = w.kind === 'article' ? 'article' : w.kind === 'data' ? 'misc' : w.kind === 'software' ? 'software' : w.kind === 'preprint' ? 'misc' : 'misc';
  const fields: [string, string | number | null | undefined][] = [
    ['title', `{${w.title}}`],
    ['author', w.authors.map((a) => (a.given ? `${a.family}, ${a.given}` : a.family)).join(' and ')],
    [w.kind === 'article' ? 'journal' : 'howpublished', w.venue],
    ['year', w.year], ['volume', w.volume], ['number', w.issue], ['pages', w.pages],
    ['doi', w.doi], ['url', w.url],
  ];
  return `@${type}{${key},\n` + fields.filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `  ${k} = {${v}}`).join(',\n') + '\n}';
}
