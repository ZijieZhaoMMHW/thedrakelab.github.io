# Ocean and Climate Dynamics Group — Website

This repository is the source for our group website. The site is **fully static**: it is built automatically by GitHub Actions and served by GitHub Pages. There is no server and no database. Every page is generated from plain text files in this repo.

**Anyone in the group can update the site by opening a pull request (PR).** Most changes take a few minutes and can be done entirely in your web browser.

---

## Quick start: the most common changes

| I want to…                              | Edit / add this file                                  |
|----------------------------------------|-------------------------------------------------------|
| Add myself or update my bio             | `content/people/<firstname-lastname>.md`              |
| Add or update a research project        | `content/projects/<short-name>.md`                    |
| Edit the Opportunities or Resources page | `content/pages/opportunities.md`, `content/pages/resources.md` |
| Edit the lab mission / group photos     | `content/pages/home.md`                               |

Photos go in `public/images/` (see [Images](#images)). Publications are **automatic** — see [Publications](#publications).

---

## How to make a change (no installation required)

1. Navigate to the file on GitHub (or to the folder, if you're adding a new file).
2. Click the **pencil icon** (edit) or **Add file → Create new file**. To add a photo, use **Add file → Upload files** inside `public/images/people/`.
3. Make your edits. Copy an existing file as a template if you're unsure.
4. Click **Commit changes…**, choose **"Create a new branch for this commit and start a pull request"**, and give it a short description (e.g. "Add Jane Doe to people").
5. Open the pull request. GitHub automatically **builds the site and checks for errors** (typos in the header block, missing images, broken links). A green ✓ means everything is fine. The built site is attached to the check as a downloadable `site-preview` artifact if you want to look at it.
6. Henri (or a designated maintainer) reviews and merges. The live site updates a couple of minutes after merging.

If the check fails, click **Details** next to the red ✗. The error message points to the file and field with the problem — most often a typo in the `---` header block, or an image path that doesn't match the uploaded file name.

---

## File formats

Every content file is Markdown with a short **header block** ("front matter") between two `---` lines. The header holds structured info; everything below it is free text (Markdown, with LaTeX math between `$...$`).

### People — `content/people/<firstname-lastname>.md`

```markdown
---
name: Jane Doe
role: phd              # pi | postdoc | phd | ms | postbac | undergrad | staff | visitor
title: PhD Student in ESS            # optional; defaults to a label based on role
status: current        # current | alumni
start: 2025-09         # when you joined: YYYY-MM (or just YYYY)
end:                   # when you left (alumni only)
photo: /images/people/jane-doe.jpg   # optional; initials are shown if missing
pronouns: she/her      # optional
email: jdoe@uci.edu    # optional (displayed as "jdoe at uci.edu")
website: https://janedoe.github.io   # optional
github: janedoe        # optional (username only)
orcid: 0000-0000-0000-0000            # optional
scholar: AbCdEfGhIjKl # optional: the 12-character ID from the "user=" part of your Google Scholar URL
projects: [ice-ocean]  # optional: file names (without .md) from content/projects/
next:                  # alumni only: where you went next, e.g. "Postdoc, MIT"
---

Jane studies the dynamics of Antarctic Bottom Water using high-resolution
MOM6 simulations. Before joining the group she ... (2–5 sentences, third person)
```

**Leaving the group?** Change `status: current` to `status: alumni`, and fill in `end:` and `next:`. Please don't delete your file — it moves you to the Alumni list automatically.

### News & events — `content/news/YYYY-MM-DD-short-title.md`

> **Note:** the News tab is currently hidden from the site navigation, so these pages are built but not
> linked from anywhere. To bring it back, add `['News', 'news/']` to the `nav` list in `src/layouts/Base.astro`.

```markdown
---
title: Jane Doe receives NSF Graduate Research Fellowship
date: 2026-04-02
type: award            # paper | award | talk | event | outreach | news
people: [jane-doe]     # optional: file names from content/people/
link: https://...      # optional
---

Congratulations to Jane on her NSF GRFP award! (One short paragraph is plenty.)

![Optional image description](/images/news/2026-grfp.jpg)
```

For **upcoming events** (seminars, workshops), use `type: event` with the event date as `date:`. Future events show under "Upcoming events" on the News page and move into the regular list automatically once the date passes (the next time the site is rebuilt).

### Standalone pages — `content/pages/<name>.md`

These are the Overview (`home.md`), Opportunities, and Resources pages.

```markdown
---
title: Opportunities
description: One sentence used for search engines and link previews.   # optional
section_nav: true      # optional: show buttons at the top that jump to each "## " section
---
```

With `section_nav: true`, every `## ` heading on the page automatically becomes a button at the top — add,
rename, or reorder a section and the buttons follow. No other setup is needed.

### Research projects — `content/projects/<short-name>.md`

```markdown
---
title: Abyssal Ocean Warming
short_title: Abyssal warming          # optional, shown on cards and in the browser tab
summary: One sentence that appears on the Research overview page.
status: active         # active | past
order: 4               # position on the Research page (lower = first)
image: /images/projects/abyssal-warming.png   # optional (or use video: /images/projects/x.mp4)
caption: "Figure caption. [Source: [Author et al. (2025), *Journal*](https://doi.org/...)]"
funding: [NSF OCE-XXXXXXX]           # optional
---

A few paragraphs describing the scientific question, approach, and key results.
Equations work: $\partial_t b + \mathbf{u}\cdot\nabla b = \partial_z(\kappa \partial_z b)$.
```

The people on a project page come from each person's `projects:` list (or the project's optional `people:` list).

---

## Publications

The Publications page is **generated from ORCID** — you usually don't need to do anything.

- Every Monday, a GitHub Action pulls works from the ORCID iDs listed in `data/publications-config.yaml`, looks up full author lists from the DOIs, and opens a PR if anything is new. A maintainer reviews and merges it. (It can also be run by hand: **Actions → Update publications → Run workflow**.)
- Works are sorted into **Papers**, **Preprints**, and **Data & Code** (Zenodo, figshare, etc.) automatically.
- Preprints that have been published only show up once, *as long as the preprint and the paper are combined on ORCID* ("Combine" in the Works section of your ORCID record).
- Group members' names are **bolded** automatically when their name (or ORCID iD) matches a file in `content/people/`.
  Everyone except the PI (the person with `role: pi`) also gets a dagger, so the PI and the rest of the group are
  easy to tell apart. A work whose **first** author is in the group is marked with a blue rail in the left margin,
  and the "First author from the group" button filters the list down to those.
- `data/publications.json` is generated — **don't edit it by hand**; it gets overwritten.
- To **add** something ORCID doesn't have (e.g. a book chapter), add an entry to `data/publications-extra.yaml`.
- To **hide** something, add its DOI on a new line in `data/publications-exclude.txt`.
- To include another group member's ORCID works (e.g. papers from before they joined), add their ORCID iD to `data/publications-config.yaml`.

---

## Images

- People photos: `public/images/people/<firstname-lastname>.jpg` — square, at least 400×400 px, under 500 KB.
- News images: `public/images/news/`
- Project figures and videos: `public/images/projects/` (videos: `.mp4`, under ~10 MB)
- Group photos: `public/images/group/`

In front matter and Markdown, refer to images *without* `public`, e.g. `/images/people/jane-doe.jpg`. Please compress large images before uploading (e.g. https://squoosh.app), and only upload images you have the right to use.

---

## Working locally (optional, for bigger changes)

You only need this for layout/design changes or to preview many edits at once. Requires Node.js 20 or newer
(on macOS: `brew install node`).

```bash
git clone https://github.com/<owner>/<repo>.git
cd <repo>
npm install
npm run dev                  # live preview at http://localhost:4321
npm run build                # full production build (same as the PR check)
node scripts/check-links.mjs # check for broken internal links/images
npm run update-publications  # refresh data/publications.json from ORCID
```

---

## Repository layout

```
content/
  people/        one file per current or former group member
  projects/      one file per research area/project
  news/          one file per news item or event
  pages/         home.md (mission + group photos), opportunities.md, resources.md
data/
  publications.json          auto-generated from ORCID — do not edit
  publications-config.yaml   which ORCID iDs to pull from
  publications-extra.yaml    manual additions
  publications-exclude.txt   DOIs to hide
public/
  images/        photos, figures, videos
  files/         PDFs (CV, position ads)
scripts/         publication updater, link checker, one-time WordPress media import
src/             page templates and styles (rarely needs editing)
.github/workflows/  deploy (on merge), PR check, weekly publication update
```

---

## One-time setup (maintainer)

1. Create the GitHub repository and push this folder to its `main` branch.
2. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
3. **Settings → Actions → General → Workflow permissions:** check **"Allow GitHub Actions to create and approve pull requests"** (needed for the weekly publications PR).
4. Optional: **Settings → Branches → Add rule for `main`** requiring the "Check pull request" status and one review, so all changes go through PRs.
5. Optional: add a custom domain under **Settings → Pages**. The site handles both `https://<owner>.github.io/<repo>/` and custom domains automatically.

---

## Style guidelines

- Bios: third person, 2–5 sentences, focus on research (a fun fact at the end is welcome).
- Dates: `YYYY-MM-DD` for news, `YYYY-MM` (or `YYYY`) for start/end.
- File names: lowercase, hyphens instead of spaces, no special characters.
- Keep news items short; link out for details.

Questions? Open an issue on GitHub or ask Henri.
