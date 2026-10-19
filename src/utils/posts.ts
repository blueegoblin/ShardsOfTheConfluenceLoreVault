import { getCollection, type CollectionEntry } from 'astro:content';
import { extractWikiLinks } from './wikilinks.mjs';

export type Post = CollectionEntry<'blog'>;

/** Resumen ligero de un artículo para listas de enlaces y navegación. */
export interface PostSummary {
  id: string;
  title: string;
  cover_image?: string;
}

/** Todos los artículos, del más reciente al más antiguo. */
export async function getSortedPosts(): Promise<Post[]> {
  const posts = await getCollection('blog');
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/**
 * Construye la red de enlaces entre artículos a partir de los [[...]] de cada cuerpo.
 * - outgoing: a qué artículos enlaza cada uno
 * - incoming: qué artículos lo mencionan (backlinks)
 * Solo se cuentan enlaces a artículos existentes.
 */
export function buildLinkGraph(posts: Post[]) {
  const ids = new Set(posts.map((p) => p.id));
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>(posts.map((p) => [p.id, []]));

  for (const post of posts) {
    const targets = extractWikiLinks(post.body ?? '').filter((id) => ids.has(id) && id !== post.id);
    outgoing.set(post.id, targets);
    for (const target of targets) incoming.get(target)?.push(post.id);
  }

  return { outgoing, incoming };
}

export function toSummary(post: Post): PostSummary {
  return { id: post.id, title: post.data.title, cover_image: post.data.cover_image };
}

/** Minutos estimados de lectura (≈ 200 palabras/min). */
export function readingMinutes(body = ''): number {
  const words = body.replace(/[#>*_`[\]|-]/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

const dateFormatter = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

export function formatDate(date: Date): string {
  return dateFormatter.format(date);
}
