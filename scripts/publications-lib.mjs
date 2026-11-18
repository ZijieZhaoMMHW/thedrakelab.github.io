// Pure logic for building the publications list from ORCID + DOI metadata.
// No Node-specific imports, so the same code runs in Node (GitHub Actions) or a browser.

export const PREPRINT_DOI_PREFIXES = [
  '10.21203/rs.',          // Research Square
  '10.22541/',             // ESS Open Archive / Authorea
  '10.1002/essoar.',       // ESSOAr (legacy)
  '10.31223/',             // EarthArXiv
  '10.48550/',             // arXiv
  '10.5194/egusphere',     // EGUsphere
  '10.1101/',              // bioRxiv
  '10.2139/ssrn',          // SSRN
  '10.31219/',             // OSF Preprints
  '10.20944/preprints',    // Preprints.org
];
export const DATA_DOI_PREFIXES = [
  '10.5281/zenodo',        // Zenodo
  '10.6084/m9.figshare',   // figshare
  '10.5061/dryad',         // Dryad
  '10.7910/dvn',           // Harvard Dataverse
  '10.17632/',             // Mendeley Data
  '10.1594/pangaea',       // PANGAEA
  '10.26024/',             // NCAR/UCAR
  '10.5065/',              // NCAR/UCAR
];
// Display names for preprint servers (their DOI metadata often lists only the registrar).
export const PREPRINT_SERVERS = {
  '10.21203/rs.': 'Research Square',
  '10.22541/': 'ESS Open Archive',
  '10.1002/essoar.': 'ESS Open Archive',
  '10.31223/': 'EarthArXiv',
  '10.48550/': 'arXiv',
  '10.5194/egusphere': 'EGUsphere',
  '10.1101/': 'bioRxiv',
  '10.2139/ssrn': 'SSRN',
  '10.31219/': 'OSF Preprints',
  '10.20944/preprints': 'Preprints.org',
};
const DATA_TYPES = new Set(['data-set', 'software', 'data-management-plan']);
const PREPRINT_TYPES = new Set(['preprint', 'working-paper']);

const norm = (doi) => doi.trim().toLowerCase().replace(/^https?:\/\/(dx\.)?doi\.org\//, '');
const isPreprintDoi = (d) => PREPRINT_DOI_PREFIXES.some((p) => d.startsWith(p));
const isDataDoi = (d) => DATA_DOI_PREFIXES.some((p) => d.startsWith(p));
const normTitle = (t = '') => t.toLowerCase().replace(/<[^>]+>/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const serverName = (d) => Object.entries(PREPRINT_SERVERS).find(([p]) => d.startsWith(p))?.[1];
const isCorrection = (t = '') => /^(correction|corrigendum|erratum|retraction)\b/i.test(t.trim());

/** Classify one ORCID work group into a single entry (before fetching metadata). */
export function classifyGroup(group) {
  const summaries = [...group['work-summary']].sort((a, b) => Number(b['display-index']) - Number(a['display-index']));
  const preferred = summaries[0];
  const dois = [];
  for (const s of summaries) {
    for (const id of s['external-ids']?.['external-id'] ?? []) {
      if (id['external-id-type'] === 'doi' && id['external-id-relationship'] !== 'part-of') {
        const d = norm(id['external-id-value']);
        if (!dois.includes(d)) dois.push(d);
      }
    }
  }
  const types = summaries.map((s) => s.type);
  const anyData = types.some((t) => DATA_TYPES.has(t));
  const published = dois.filter((d) => !isPreprintDoi(d) && !isDataDoi(d));
  const preprints = dois.filter(isPreprintDoi);
  const data = dois.filter(isDataDoi);

  let kind, candidates;
  if (anyData || (data.length && !published.length && !preprints.length)) {
    kind = types.includes('software') ? 'software' : 'data';
    candidates = data.length ? data : dois;
  } else if (published.length) {
    kind = 'article';
    candidates = published;
  } else if (preprints.length || PREPRINT_TYPES.has(preferred.type)) {
    kind = 'preprint';
    candidates = preprints.length ? preprints : dois;
  } else {
    kind = 'other';
    candidates = dois;
  }
  const date = preferred['publication-date'] ?? {};
  return {
    kind,
    candidates,
    allDois: dois,
    title: preferred.title?.title?.value ?? '',
    venue: preferred['journal-title']?.value ?? '',
    year: date.year?.value ? Number(date.year.value) : null,
    month: date.month?.value ? Number(date.month.value) : null,
    url: preferred.url?.value ?? null,
    putCode: preferred['put-code'],
  };
}

/** Convert CSL-JSON (from doi.org content negotiation) into our entry fields. */
export function fromCsl(csl) {
  const parts = csl.issued?.['date-parts']?.[0] ?? csl.published?.['date-parts']?.[0] ?? [];
  const venue = Array.isArray(csl['container-title']) ? csl['container-title'][0] : csl['container-title'];
  return {
    title: String(Array.isArray(csl.title) ? csl.title[0] : csl.title ?? '').replace(/<[^>]+>/g, '').trim(),
    authors: (csl.author ?? []).map((a) => ({
      given: a.given ?? '',
      family: a.family ?? a.literal ?? a.name ?? '',
      ...(a.ORCID ? { orcid: String(a.ORCID).replace(/^https?:\/\/orcid\.org\//, '') } : {}),
    })),
    venue: venue || csl.publisher || '',
    year: parts[0] ?? null,
    month: parts[1] ?? null,
    volume: csl.volume ?? null,
    issue: csl.issue ?? null,
    pages: csl.page ?? csl['article-number'] ?? null,
    publisher: csl.publisher ?? null,
  };
}

/**
 * Build the full publication list.
 * @param {object} opts
 * @param {string[]} opts.orcids           ORCID iDs to pull works from
 * @param {object[]} opts.previous         entries from the existing publications.json (used as a cache)
 * @param {(url:string, accept:string)=>Promise<any>} opts.fetchJson  returns parsed JSON or throws
 * @param {(msg:string)=>void} [opts.log]
 */
export async function buildPublications({ orcids, previous = [], fetchJson, log = () => {} }) {
  const cache = new Map(previous.filter((p) => p.doi).map((p) => [p.doi, p]));
  const entries = [];
  const seen = new Set();

  for (const orcid of orcids) {
    const works = await fetchJson(`https://pub.orcid.org/v3.0/${orcid}/works`, 'application/json');
    for (const group of works.group ?? []) {
      const c = classifyGroup(group);
      // Skip groups already represented (e.g. the same paper on two group members' ORCID records).
      if (c.allDois.some((d) => seen.has(d))) continue;
      c.allDois.forEach((d) => seen.add(d));

      let chosen = null, meta = null;
      for (const doi of c.candidates) {
        if (cache.has(doi)) { chosen = doi; meta = cache.get(doi); break; }
      }
      if (!chosen && c.candidates.length) {
        const fetched = [];
        for (const doi of c.candidates) {
          try {
            const csl = await fetchJson(`https://doi.org/${doi}`, 'application/vnd.citationstyles.csl+json');
            fetched.push([doi, fromCsl(csl)]);
          } catch (e) {
            log(`  ! could not fetch metadata for ${doi}: ${e.message}`);
          }
        }
        const usable = fetched.filter(([, m]) => !isCorrection(m.title));
        const target = normTitle(c.title);
        const best = usable.find(([, m]) => normTitle(m.title) === target) ?? usable[0] ?? fetched[0];
        if (best) [chosen, meta] = best;
        else chosen = c.candidates[0];
        log(`  + ${c.kind}: ${chosen} ${(meta?.title ?? c.title).slice(0, 60)}`);
      }

      entries.push({
        id: chosen ?? `orcid-${c.putCode}`,
        kind: c.kind,
        doi: chosen ?? null,
        title: meta?.title || c.title,
        authors: meta?.authors ?? [],
        venue: (c.kind === 'preprint' && chosen && serverName(chosen)) || meta?.venue || c.venue || '',
        year: meta?.year ?? c.year,
        month: meta?.month ?? c.month,
        volume: meta?.volume ?? null,
        issue: meta?.issue ?? null,
        pages: meta?.pages ?? null,
        publisher: meta?.publisher ?? null,
        url: chosen ? `https://doi.org/${chosen}` : c.url,
        related_dois: c.allDois.filter((d) => d !== chosen),
      });
    }
  }

  return entries.sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || (b.month ?? 0) - (a.month ?? 0) || a.title.localeCompare(b.title));
}
