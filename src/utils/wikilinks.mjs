// @ts-check
/**
 * Utilidades compartidas para los enlaces de doble corchete ([[nombre-del-archivo]]).
 *
 * Este módulo es la única fuente de verdad para convertir un nombre de archivo
 * (o el destino de un enlace wiki) en un slug. Lo usan:
 *   - astro.config.mjs      → plugin remark que transforma [[...]] en <a href>
 *   - src/content.config.ts → generateId del loader, que define la URL de cada post
 *   - las páginas           → cálculo de backlinks y del grafo de conexiones
 *
 * Al compartir la misma función, un enlace [[Mi Nota]] siempre apunta a la URL
 * que Astro genera para el archivo `mi-nota.md`.
 */

// Ruta base del repositorio (definida en astro.config.mjs base)
export const SITE_BASE = '/ShardsOfTheConfluenceLoreVault';

/**
 * Añade la ruta base del sitio (base) a una URL interna.
 * Funciona tanto con subdirectorios de GitHub Pages como con raíz o dominios propios.
 * @param {string} [path]
 * @returns {string}
 */
export function withBase(path = '') {
  if (!path) return '';
  const str = String(path).trim();
  if (
    str.startsWith('http://') ||
    str.startsWith('https://') ||
    str.startsWith('//') ||
    str.startsWith('data:')
  ) {
    return str;
  }

  let rawBase =
    typeof import.meta !== 'undefined' &&
    import.meta.env?.BASE_URL &&
    import.meta.env.BASE_URL !== '/'
      ? import.meta.env.BASE_URL
      : SITE_BASE;

  const base = String(rawBase || '').replace(/\/+$/, '');
  const cleanPath = str.replace(/^\/+/, '');

  if (!base) {
    return cleanPath ? `/${cleanPath}` : '/';
  }

  const baseName = base.replace(/^\/+/, '');
  if (cleanPath === baseName) {
    return `${base}/`;
  }
  if (cleanPath.startsWith(`${baseName}/`)) {
    return `/${cleanPath}`;
  }

  return cleanPath ? `${base}/${cleanPath}` : `${base}/`;
}

/** Ruta base bajo la que se publican los artículos. */
export const BLOG_BASE_PATH = withBase('blog');

/** Detecta enlaces del tipo [[destino]], [[destino|alias]] o [[destino#seccion]]. */
export const WIKI_LINK_PATTERN = /\[\[([^[\]]+?)\]\]/g;

/**
 * Convierte cualquier texto en un slug seguro para URL.
 * "Jardines Digitales" → "jardines-digitales", "Árbol_de Ideas" → "arbol-de-ideas"
 * @param {string} input
 */
export function slugify(input) {
  return String(input)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // elimina tildes y diacríticos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s_-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Resuelve el destino de un enlace wiki (o una ruta de archivo) a un slug.
 * Ignora alias (|), anclas (#), carpetas y la extensión .md.
 *   "notas/Jardines Digitales.md" → "jardines-digitales"
 *   "jardines-digitales|un jardín" → "jardines-digitales"
 * @param {string} raw
 */
export function resolveWikiTarget(raw) {
  const target = String(raw).split('|')[0].split('#')[0].trim().replace(/\\/g, '/');
  const fileName = target.split('/').pop() ?? '';
  return slugify(fileName.replace(/\.mdx?$/i, ''));
}

/**
 * Devuelve la URL pública de un artículo a partir de su slug.
 * @param {string} slug
 */
export function toPostHref(slug) {
  return withBase(`blog/${slug}/`);
}

/**
 * Extrae los slugs (sin duplicados) de todos los enlaces wiki de un texto Markdown.
 * @param {string} [markdown]
 * @returns {string[]}
 */
export function extractWikiLinks(markdown = '') {
  const slugs = new Set();
  for (const match of markdown.matchAll(WIKI_LINK_PATTERN)) {
    const slug = resolveWikiTarget(match[1]);
    if (slug) slugs.add(slug);
  }
  return [...slugs];
}
