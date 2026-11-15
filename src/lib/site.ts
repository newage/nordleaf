import { getEntry } from 'astro:content';
import type { z } from 'astro/zod';
import type { SiteSectionId, SiteSections } from './site-schemas';

export type SiteData<K extends SiteSectionId> = z.infer<SiteSections[K]>;

// Завантажує секцію `site` за ім'ям файлу (src/content/site/<id>.yaml)
export async function getSite<K extends SiteSectionId>(id: K): Promise<SiteData<K>> {
  const entry = await getEntry('site', id);
  if (!entry) throw new Error(`Немає секції site/${id}.yaml`);
  return entry.data as SiteData<K>;
}
