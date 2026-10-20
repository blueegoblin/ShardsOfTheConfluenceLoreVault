import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import { unified } from '@astrojs/markdown-remark';
import wikiLinkPlugin from 'remark-wiki-link';
import { visit } from 'unist-util-visit';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { resolveWikiTarget, toPostHref } from './src/utils/wikilinks.mjs';

/** Carpeta por defecto de la Content Collection "blog". */
const BLOG_CONTENT_DIR = fileURLToPath(new URL('./src/content/blog/', import.meta.url));

/**
 * Escanea los archivos Markdown para obtener:
 * 1. La lista de permalinks existentes (para detectar enlaces válidos vs. rotos).
 * 2. El título de cada artículo a partir de su frontmatter, de modo que al escribir
 *    [[nombre-del-archivo]] se muestre directamente el título legible del artículo
 *    (sin corchetes y sin guiones), a menos que se defina un alias manual con |.
 */
function collectPostMetadata(dir) {
  if (!existsSync(dir)) return { permalinks: [], titles: new Map() };
  const permalinks = [];
  const titles = new Map();

  const files = readdirSync(dir, { recursive: true })
    .map(String)
    .filter((file) => {
      const normalized = file.replace(/\\/g, '/');
      const fileName = normalized.split('/').pop()?.toLowerCase() || '';
      const isReadme = fileName === 'readme.md' || fileName.startsWith('readme.');
      const isInternal =
        normalized.startsWith('.') ||
        normalized.includes('/.') ||
        normalized.includes('.obsidian') ||
        normalized.includes('.git') ||
        normalized.includes('.trash') ||
        isReadme;
      return /\.md$/i.test(file) && !isInternal;
    });

  for (const file of files) {
    const slug = resolveWikiTarget(file);
    permalinks.push(slug);
    try {
      const fullPath = join(dir, file);
      const content = readFileSync(fullPath, 'utf8');
      const titleMatch = content.match(/^title:\s*["']?([^"'\r\n]+)["']?/m);
      if (titleMatch && titleMatch[1]) {
        titles.set(slug, titleMatch[1].trim());
      } else {
        const h1Match = content.match(/^#\s+(.+)$/m);
        if (h1Match && h1Match[1]) {
          titles.set(slug, h1Match[1].trim());
        } else {
          const fileName = file.split(/[/\\]/).pop()?.replace(/\.md$/i, '') ?? slug;
          titles.set(slug, fileName);
        }
      }
    } catch {
      // Si falla la lectura, se usará el valor por defecto
    }
  }

  return { permalinks, titles };
}

const { permalinks, titles } = collectPostMetadata(BLOG_CONTENT_DIR);

/**
 * Plugin de Remark que embellece el texto de los enlaces wiki:
 * si no se especificó un alias manual ([[destino|mi texto]]), reemplaza
 * el texto del enlace por el título real del artículo de destino.
 */
function remarkWikiLinkTitles() {
  return (tree) => {
    visit(tree, 'wikiLink', (node) => {
      // Si no hay alias explícito o es idéntico al valor original, usa el título del post
      if (!node.data.alias || node.data.alias === node.value) {
        const permalink = node.data.permalink;
        if (titles.has(permalink)) {
          const prettyTitle = titles.get(permalink);
          node.data.hChildren = [{ type: 'text', value: prettyTitle }];
        }
      }
    });
  };
}

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  markdown: {
    processor: unified({
      remarkPlugins: [
        [
          wikiLinkPlugin,
          {
            permalinks,
            // [[Nombre del Archivo]] → "nombre-del-archivo"
            pageResolver: (/** @type {string} */ name) => [resolveWikiTarget(name)],
            // "nombre-del-archivo" → "/blog/nombre-del-archivo/"
            hrefTemplate: (/** @type {string} */ permalink) => toPostHref(permalink),
            // Permite [[destino|texto visible]]
            aliasDivider: '|',
            wikiLinkClassName: 'wiki-link',
            newClassName: 'wiki-link--broken',
          },
        ],
        remarkWikiLinkTitles,
      ],
    }),
  },
});
