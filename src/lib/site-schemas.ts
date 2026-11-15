import { z } from 'astro/zod';
import type { SchemaContext } from 'astro:content';

// Схеми секцій `site` — єдине джерело назв полів (дзеркалиться в public/admin/config.yml)
export const siteSchemas = ({ image }: SchemaContext) => ({
  hero: z.object({
    eyebrow: z.string(),
    titleEm: z.string(),
    title: z.string(),
    lead: z.string(),
    ctaPrimary: z.string(),
    ctaSecondary: z.string(),
    image: image(),
    imageAlt: z.string(),
  }),
  about: z.object({
    eyebrow: z.string(),
    heading: z.string(),
    headingEm: z.string(),
    lead: z.string(),
    features: z
      .array(z.object({ icon: z.enum(['sun', 'pot', 'set']), title: z.string(), text: z.string() }))
      .length(3),
  }),
  offer: z.object({
    eyebrow: z.string(),
    heading: z.string(),
    headingEm: z.string(),
    notePrefix: z.string(),
    noteStrong: z.string(),
    noteSuffix: z.string(),
  }),
  band: z.object({
    heading: z.string(),
    headingEm: z.string(),
    image: image(),
  }),
  steps: z.object({
    eyebrow: z.string(),
    heading: z.string(),
    headingEm: z.string(),
    lead: z.string(),
    items: z.array(z.object({ title: z.string(), text: z.string() })).length(4),
    ctaText: z.string(),
    ctaLabel: z.string(),
  }),
  contact: z.object({
    eyebrow: z.string(),
    heading: z.string(),
    headingEm: z.string(),
    lead: z.string(),
    email: z.string(),
    phone: z.string(),
    area: z.string(),
    hours: z.string(),
  }),
});

export type SiteSections = ReturnType<typeof siteSchemas>;
export type SiteSectionId = keyof SiteSections;
