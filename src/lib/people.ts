import fs from 'node:fs';
import type { CollectionEntry } from 'astro:content';

export const ROLE_LABELS: Record<string, string> = {
  pi: 'Principal Investigator',
  postdoc: 'Postdoctoral Scholar',
  phd: 'PhD Student',
  ms: 'MS Student',
  postbac: 'Postbaccalaureate Researcher',
  undergrad: 'Undergraduate Researcher',
  staff: 'Research Staff',
  visitor: 'Visiting Researcher',
};
export const ROLE_ORDER = Object.keys(ROLE_LABELS);

export function sortPeople(a: CollectionEntry<'people'>, b: CollectionEntry<'people'>) {
  const r = ROLE_ORDER.indexOf(a.data.role) - ROLE_ORDER.indexOf(b.data.role);
  if (r) return r;
  const s = (a.data.start ?? '9999').localeCompare(b.data.start ?? '9999');
  return s || a.data.name.localeCompare(b.data.name);
}

/** True if a site-relative photo path exists under public/. */
export function photoExists(p?: string | null) {
  return !!p && (/^https?:/.test(p) || fs.existsSync('public' + (p.startsWith('/') ? p : '/' + p)));
}

export function initials(name: string) {
  const w = name.split(/\s+/).filter(Boolean);
  return ((w[0]?.[0] ?? '') + (w.length > 1 ? w[w.length - 1][0] : '')).toUpperCase();
}

/** "Hanchao Chen" -> { family: "chen", initial: "h" } for matching author lists. */
export function nameKey(name: string) {
  const parts = name.replace(/\./g, '').trim().split(/\s+/);
  return { family: parts[parts.length - 1].toLowerCase(), initial: parts[0][0].toLowerCase() };
}
