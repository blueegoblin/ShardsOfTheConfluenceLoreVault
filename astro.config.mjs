import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import wikiLinkPlugin from 'remark-wiki-link';
import { visit } from 'unist-util-visit';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { resolveWikiTarget, toPostHref } from './src/utils/wikilinks.mjs';
import {
  resolveVaultAsset,
  syncVaultAssets,
  isVaultMedia,
} from './src/utils/vault-assets.mjs';

/** Carpeta por defecto de la Content Collection "blog". */
const BLOG_CONTENT_DIR = fileURLToPath(new URL('./src/content/blog/', import.meta.url));

// Sincronización inicial de adjuntos
syncVaultAssets();

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
 * Plugin de Remark que transforma incrustaciones de imágenes de Obsidian (![[...]])
 * e imágenes relativas estándar en URLs web servibles (/vault-assets/...).
 */
function remarkObsidianImages() {
  return (tree) => {
    // 1. Transformar etiquetas de imagen estándar ![alt](ruta)
    visit(tree, 'image', (node) => {
      node.url = resolveVaultAsset(node.url);
    });

    // 2. Transformar nodos de texto que contengan ![[imagen.png]]
    visit(tree, (node) => {
      if (!node.children || !Array.isArray(node.children)) return;
      const newChildren = [];
      let modified = false;

      for (const child of node.children) {
        if (child.type === 'text' && child.value.includes('![[')) {
          const regex = /!\[\[([^\]]+)\]\]/g;
          let lastIndex = 0;
          let match;
          while ((match = regex.exec(child.value)) !== null) {
            modified = true;
            if (match.index > lastIndex) {
              newChildren.push({ type: 'text', value: child.value.slice(lastIndex, match.index) });
            }
            const parts = match[1].split('|').map((s) => s.trim());
            const target = parts[0];
            let alt = '';
            let width = '';
            let height = '';

            for (let i = 1; i < parts.length; i++) {
              const part = parts[i];
              const dimMatch = part.match(/^(\d+)(?:x(\d+))?$/);
              if (dimMatch) {
                width = dimMatch[1];
                if (dimMatch[2]) height = dimMatch[2];
              } else {
                alt = part;
              }
            }

            const resolvedUrl = resolveVaultAsset(target);
            newChildren.push({
              type: 'image',
              url: resolvedUrl,
              alt: alt || target,
              data: {
                hProperties: {
                  ...(width ? { width } : {}),
                  ...(height ? { height } : {}),
                  loading: 'lazy',
                  decoding: 'async',
                },
              },
            });
            lastIndex = regex.lastIndex;
          }
          if (lastIndex < child.value.length) {
            newChildren.push({ type: 'text', value: child.value.slice(lastIndex) });
          }
        } else {
          newChildren.push(child);
        }
      }
      if (modified) {
        node.children = newChildren;
      }
    });
  };
}

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
  output: 'static',
  site: 'https://blueegoblin.github.io', // Introduce aquí tu dominio final de GitHub Pages (ej: https://<usuario>.github.io o https://midominio.com)
  // base: '/ConfluenceVault', // Si no usas un dominio propio o raíz de usuario, descomenta y pon el nombre del repositorio (ej: /ConfluenceVault)
  integrations: [react()],
  markdown: {
    remarkPlugins: [
      remarkObsidianImages,
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
  },
  vite: {
    plugins: [
      {
        name: 'vault-assets-sync-plugin',
        buildStart() {
          syncVaultAssets();
        },
        configureServer(server) {
          syncVaultAssets();
          const handleFile = (file) => {
            const normalized = file.replace(/\\/g, '/');
            if (normalized.includes('/src/content/blog/') && isVaultMedia(normalized)) {
              syncVaultAssets();
            }
          };
          server.watcher.on('add', handleFile);
          server.watcher.on('change', handleFile);
          server.watcher.on('unlink', handleFile);
        },
      },
    ],
  },
});
