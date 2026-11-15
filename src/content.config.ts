import { defineCollection, type SchemaContext } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { siteSchemas } from './lib/site-schemas';

// Спільна схема картки каталогу: поля збігаються з колекціями Decap
const item = ({ image }: SchemaContext) =>
  z.object({
    name: z.string(),
    desc: z.string(),
    tag: z.string(),
    image: image(),
    alt: z.string(),
    order: z.number().default(0),
  });

const catalogue = (dir: string) =>
  defineCollection({
    loader: glob({ pattern: '*.md', base: `./src/content/${dir}` }),
    schema: (ctx) => item(ctx),
  });

const site = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/site' }),
  // Кожен файл відповідає одній секції; точна форма перевіряється в src/lib/site.ts
  schema: (ctx) => z.union(Object.values(siteSchemas(ctx)) as unknown as [z.ZodType, z.ZodType, ...z.ZodType[]]),
});

export const collections = {
  plants: catalogue('plants'),
  planters: catalogue('planters'),
  sets: catalogue('sets'),
  site,
};
