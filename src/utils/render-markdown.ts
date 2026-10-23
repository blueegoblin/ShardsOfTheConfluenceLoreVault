// @ts-check
import { createMarkdownProcessor, type MarkdownProcessor } from '@astrojs/markdown-remark';
import wikiLinkPlugin from 'remark-wiki-link';
import { visit } from 'unist-util-visit';
import { resolveWikiTarget, toPostHref } from './wikilinks.mjs';
import { resolveVaultAsset } from './vault-assets.mjs';
import { getSortedPosts } from './posts';

let cachedProcessor: MarkdownProcessor | null = null;

/**
 * Plugin de Remark que transforma incrustaciones de imágenes de Obsidian (![[...]])
 * e imágenes relativas estándar en URLs web servibles (/vault-assets/...).
 */
function remarkObsidianImages() {
  return (tree: any) => {
    // 1. Transformar etiquetas de imagen estándar ![alt](ruta)
    visit(tree, 'image', (node: any) => {
      node.url = resolveVaultAsset(node.url);
    });

    // 2. Transformar nodos de texto que contengan ![[imagen.png]]
    visit(tree, (node: any) => {
      if (!node.children || !Array.isArray(node.children)) return;
      const newChildren: any[] = [];
      let modified = false;

      for (const child of node.children) {
        if (child.type === 'text' && child.value.includes('![[')) {
          const regex = /!\[\[([^\]]+)\]\]/g;
          let lastIndex = 0;
          let match: RegExpExecArray | null;
          while ((match = regex.exec(child.value)) !== null) {
            modified = true;
            if (match.index > lastIndex) {
              newChildren.push({ type: 'text', value: child.value.slice(lastIndex, match.index) });
            }
            const parts = match[1].split('|').map((s: string) => s.trim());
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
 * Plugin de Remark para mostrar títulos legibles en enlaces wiki sin alias.
 */
function remarkWikiLinkTitles(options?: { titles?: Map<string, string> }) {
  const titles = options?.titles ?? new Map();
  return (tree: any) => {
    if (!tree) return;
    visit(tree, 'wikiLink', (node: any) => {
      if (node && node.data) {
        if (!node.data.alias || node.data.alias === node.value) {
          const permalink = node.data.permalink;
          if (titles.has(permalink)) {
            const prettyTitle = titles.get(permalink);
            node.data.hChildren = [{ type: 'text', value: prettyTitle }];
          }
        }
      }
    });
  };
}

/**
 * Obtiene o inicializa el procesador de Markdown de Astro con soporte de wikilinks y adjuntos.
 */
async function getProcessor(): Promise<MarkdownProcessor> {
  if (cachedProcessor) return cachedProcessor;

  let permalinks: string[] = [];
  const titles = new Map<string, string>();
  try {
    const posts = await getSortedPosts();
    permalinks = posts.map((p) => p.id);
    for (const post of posts) {
      titles.set(post.id, post.data.title);
    }
  } catch (err) {
    console.warn('[render-markdown] No se pudieron cargar posts para permalinks:', err);
  }

  cachedProcessor = await createMarkdownProcessor({
    remarkPlugins: [
      remarkObsidianImages,
      [
        wikiLinkPlugin,
        {
          permalinks,
          pageResolver: (name: string) => [resolveWikiTarget(name)],
          hrefTemplate: (permalink: string) => toPostHref(permalink),
          aliasDivider: '|',
          wikiLinkClassName: 'wiki-link',
          newClassName: 'wiki-link--broken',
        },
      ],
      [remarkWikiLinkTitles, { titles }],
    ],
  });

  return cachedProcessor;
}

/**
 * Compila una cadena Markdown en HTML con soporte completo de Wikilinks e imágenes del baúl.
 */
export async function renderMarkdownContent(content: string): Promise<string> {
  if (!content || !content.trim()) return '';
  const processor = await getProcessor();
  const result = await processor.render(content);
  return result.code;
}
