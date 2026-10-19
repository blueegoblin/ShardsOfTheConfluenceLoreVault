import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { resolveWikiTarget } from './utils/wikilinks.mjs';

/**
 * Colección "blog": lee todos los Markdown de src/content/blog.
 * El id (y por tanto la URL) de cada entrada se deriva del nombre de archivo
 * con la misma función que resuelve los enlaces [[...]], garantizando que
 * ambos coincidan siempre.
 */
const blog = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/blog',
    generateId: ({ entry }) => resolveWikiTarget(entry),
  }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    cover_image: z.string().optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { blog };
