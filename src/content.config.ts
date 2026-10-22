import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { resolveWikiTarget } from './utils/wikilinks.mjs';
import { resolveVaultAsset } from './utils/vault-assets.mjs';

/**
 * Colección "blog": lee todos los Markdown de src/content/blog.
 * El id (y por tanto la URL) de cada entrada se deriva del nombre de archivo
 * con la misma función que resuelve los enlaces [[...]], garantizando que
 * ambos coincidan siempre.
 *
 * Se ignoran explícitamente las carpetas internas de Obsidian (.obsidian, .trash)
 * y de control de versiones (.git).
 */
const blog = defineCollection({
  loader: glob({
    pattern: [
      '**/*.md',
      '!README.md',
      '!readme.md',
      '!Readme.md',
      '!**/README.md',
      '!**/readme.md',
      '!**/Readme.md',
      '![rR][eE][aA][dD][mM][eE].md',
      '!**/[rR][eE][aA][dD][mM][eE].md',
      '!.obsidian/**',
      '!**/.obsidian/**',
      '!.git/**',
      '!**/.git/**',
      '!.trash/**',
      '!**/.trash/**',
    ],
    base: './src/content/blog',
    generateId: ({ entry }) => resolveWikiTarget(entry),
  }),
  schema: z
    .object({
      title: z.string().optional(),
      date: z.coerce.date().optional(),
      cover_image: z.string().nullish(),
      description: z.string().nullish(),
      tags: z
        .array(z.string())
        .nullish()
        .transform((val) => val ?? []),
    })
    .transform((data) => ({
      ...data,
      title: data.title?.trim() || 'Sin título',
      date: data.date ?? new Date(),
      cover_image: resolveVaultAsset(data.cover_image),
      description: data.description ?? undefined,
    })),
});

export const collections = { blog };
