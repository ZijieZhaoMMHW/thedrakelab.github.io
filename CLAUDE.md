# CLAUDE.md — group website

Static Astro 5 site for Henri Drake's Ocean and Climate Dynamics group (UCI ESS), replacing the
WordPress site at https://faculty.sites.uci.edu/drakelab/. It will be published from a public GitHub
repo via GitHub Pages, with group members contributing through pull requests. It must stay entirely
client-side: no servers, databases, or paid hosting.

`README.md` is the contributor guide: file formats, how to make a PR, and the one-time setup. Keep it in sync with any change to schemas or workflows.

## Status (handoff, 2026-11-18)

The site is complete and verified on Henri's Mac. Everything below has been built and tested locally:
- All text content migrated from WordPress into `content/` (people, projects, news, pages).
- Content schemas in `src/content.config.ts`. A bad front-matter value fails the build with a clear error.
- Publications pipeline. `scripts/publications-lib.mjs` is pure logic that runs in Node or a browser,
  and `scripts/update-publications.mjs` is the CLI wrapper. `data/publications.json` holds 28 works
  (18 papers, 4 preprints, 6 data/software), confirmed current against live ORCID on 2026-11-18.
- Publications page with search, filters (type tab / year / group member), bold group members, and Copy BibTeX.
- Workflows: `deploy.yml` (Pages on push to main and weekly; also compiles the CV from Overleaf), `check.yml` (PR build + link check + artifact),
  `update-publications.yml` (weekly ORCID → PR via peter-evans/create-pull-request).
- `scripts/check-links.mjs` verifies internal links and images in `dist/`.
- **Media imported** via `scripts/import-legacy-media.sh`: 24 files (10 people photos, 3 group photos,
  2 project figures/videos, 5 news figures, 2 PDFs), 16 MB total in `public/`. The BBTRE `.mov` was
  converted to `.mp4`. Every media reference in `content/` and `src/` resolves, and nothing in `public/`
  is unreferenced. The import script is idempotent (skips files that already exist) and does not need
  to be run again.
- **Build and link check pass with 0 broken links**, both at the root base path and with
  `BASE_PATH=/group-website`.

**Next step:** `git init`, first commit, create the GitHub repo, and push. Commit or push only when Henri
asks. Then set Pages source to GitHub Actions, and allow Actions to create PRs
(Settings → Actions → General). See "One-time setup (maintainer)" in `README.md`.

### Local environment notes (2026-11-18)
- Node and ffmpeg were not installed on this Mac; both were installed with Homebrew
  (`brew install node ffmpeg`). Homebrew lives at `/opt/homebrew/bin`, which is **not** on the `PATH` of
  non-interactive shells here, so prefix commands with `export PATH="/opt/homebrew/bin:$PATH"` if `npm`
  is not found.
- `node_modules/` was originally installed in a Linux sandbox, so the darwin-arm64 rollup binary was
  missing and the build failed. Fixed by `rm -rf node_modules && npm install`, which also regenerated
  `package-lock.json` on this machine. The lockfile still contains all 26 rollup and 26 esbuild platform
  variants, so `npm ci` on ubuntu CI is unaffected.
- `npm audit` reports 16 advisories, all in Astro 5.18.2 and its transitive deps (`@rollup/pluginutils`,
  `picomatch`, `zod`, `sharp`). The XSS ones require `define:vars`, server islands, or an SSR adapter —
  this site uses none of them and is fully static, so they do not apply; the rest are build-time only on
  trusted repo content. The fix is Astro 7.4.12, two major versions up. **Not upgraded** — that is
  Henri's call and would need retesting.

## Content questions waiting on Henri (don't guess)
- Rohan Vaswani and Aaron Wang are marked `status: alumni` because the old site listed them under Alumni, but
  they appear in the April 2026 group photo.
- Hanchao Chen: the bio says he joined in fall 2022, which is before Henri started at UCI in 2023.
- Zijie Zhao has no bio. Ran and Zijie have no `start`. Alumni have empty `next:`.
- People→project assignments (`projects:` in people files) were inferred from bios and need review.
- The latest news item is from Jan 2023. Henri may want to add recent items, e.g. his 2026 Packard Fellowship.
- Zenodo `10.5281/zenodo.15085089` and `zenodo.15086631` look like near-duplicates. Hide one via
  `data/publications-exclude.txt` if Henri confirms.
- Only Henri's ORCID is in `data/publications-config.yaml`. Ran and Zijie have ORCIDs (seen in DOI metadata)
  and could be added if Henri wants their earlier papers listed.

## Architecture notes
- Content lives in top-level `content/` (not `src/content/`) and is loaded with `glob()` loaders. Images go in `public/images/`
  and are referenced as `/images/...`.
- **Base path:** the site may be served from `/<repo>/`. Use `url()` from `src/lib/url.ts` for every internal
  link in `.astro` files. Root-relative paths in Markdown get the base prefix from `src/lib/rehype-base-path.mjs`.
  CI sets `BASE_PATH`/`SITE_URL` from `actions/configure-pages`. Test with
  `BASE_PATH=/group-website npm run build && BASE_PATH=/group-website node scripts/check-links.mjs`.
- `GITHUB_REPOSITORY` (set automatically in Actions) drives the footer's "Edit on GitHub" link. The link is hidden in local builds.
- Publications: ORCID work groups → one entry each, using the preferred version (`display-index`). DOIs are sorted by
  prefix lists in `publications-lib.mjs`: preprint servers → Preprints, Zenodo/figshare/etc. → Data & Code.
  "Correction/Erratum" DOIs are skipped when choosing the main DOI. Author metadata comes from doi.org CSL-JSON
  content negotiation and is cached by DOI, so only new DOIs are fetched. `publications-extra.yaml` and
  `publications-exclude.txt` are applied at build time in `src/lib/publications.ts`, not by the updater.
- CV: `deploy.yml` clones Henri's Overleaf project (secret `OVERLEAF_TOKEN`), compiles `Drake_main_CV.tex` with
  `xu-cheng/latex-action`, and overwrites `public/files/Drake_CV.pdf` in the build only (never committed). The
  CV steps are `continue-on-error`; on failure the committed PDF ships and the run shows a warning. Runs on push
  to main and weekly. Not yet exercised on GitHub (written 2026-11-17, before the repo had a remote).
- Group-member bolding (`matchMember`) matches by ORCID iD, then by family name + first initial against `content/people/`.
- Use `import { load } from 'js-yaml'`. There is no default export, and the build breaks with the default import.

## Conventions
- Henri prefers simple, contributor-friendly structures: one Markdown file per person/project/news item and
  no hand-edited HTML. Keep the dependency list small (astro, remark-math, rehype-katex, katex, js-yaml).
- Equations: KaTeX via `$...$` in Markdown.
- Paraphrase third-party text instead of copying it. The ExxonMobil news post paraphrases Supran et al. (2023)
  rather than quoting it at length.
