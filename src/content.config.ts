import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Dates like 2025-09 or 2025 are kept as strings; YAML may also hand us numbers.
const yearMonth = z.union([z.string(), z.number()]).transform(String).nullish();

const people = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/people' }),
  schema: z.object({
    name: z.string(),
    role: z.enum(['pi', 'postdoc', 'phd', 'ms', 'postbac', 'undergrad', 'staff', 'visitor']),
    title: z.string().nullish(), // optional custom title, e.g. "Assistant Professor"
    status: z.enum(['current', 'alumni']),
    start: yearMonth,
    end: yearMonth,
    photo: z.string().nullish(),
    pronouns: z.string().nullish(),
    email: z.string().email().nullish(),
    website: z.string().url().nullish(),
    github: z.string().nullish(),
    orcid: z.string().regex(/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/, 'ORCID should look like 0000-0000-0000-0000').nullish(),
    scholar: z.string().regex(/^[\w-]{12}$/, 'Google Scholar should be the 12-character profile ID from the "user=" part of your profile URL').nullish(),
    cv: z.string().nullish(),
    projects: z.array(z.string()).default([]),
    next: z.string().nullish(),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/projects' }),
  schema: z.object({
    title: z.string(),
    short_title: z.string().nullish(),
    summary: z.string(),
    status: z.enum(['active', 'past']).default('active'),
    order: z.number().default(100),
    image: z.string().nullish(),
    video: z.string().nullish(),
    caption: z.string().nullish(),
    people: z.array(z.string()).default([]),
    funding: z.array(z.string()).default([]),
  }),
});

const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/news' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    type: z.enum(['paper', 'award', 'talk', 'event', 'outreach', 'news']).default('news'),
    people: z.array(z.string()).default([]),
    link: z.string().url().nullish(),
    image: z.string().nullish(),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string().nullish(),
    photos: z.array(z.object({ src: z.string(), caption: z.string() })).default([]),
    // Show buttons at the top of the page that jump to each "## " section.
    section_nav: z.boolean().default(false),
  }),
});

export const collections = { people, projects, news, pages };
