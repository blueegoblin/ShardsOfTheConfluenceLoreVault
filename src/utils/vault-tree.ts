// @ts-check
import { readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getSortedPosts, type Post } from './posts';
import { slugify, toPostHref, resolveWikiTarget, withBase } from './wikilinks.mjs';
import { getFolderConfig, type FolderConfig } from './folder-config';
import { renderMarkdownContent } from './render-markdown';

function getBlogDir(): string {
  const fromCwd = join(process.cwd(), 'src', 'content', 'blog');
  if (existsSync(fromCwd)) return fromCwd;
  try {
    return fileURLToPath(new URL('../content/blog', import.meta.url));
  } catch {
    return fromCwd;
  }
}

const BLOG_DIR = getBlogDir();

export interface VaultArticle {
  id: string;
  title: string;
  fileName: string;
  relPath: string;
  href: string;
  cover_image?: string;
  description?: string;
  date: Date;
  minutes?: number;
}

export interface VaultFolder {
  name: string;
  slug: string;
  path: string; // "ambientacion" o "ambientacion/planos"
  href: string; // "/codices/ambientacion/"
  subfolders: VaultFolder[];
  articles: VaultArticle[];
  totalArticles: number;
  config: FolderConfig;
}

/**
 * Escanea de forma recursiva los archivos Markdown de src/content/blog
 * ignorando carpetas internas de Obsidian (.obsidian, .trash), control de versiones (.git),
 * carpetas de configuración (_configFolder) y carpetas sin archivos Markdown.
 */
export async function getVaultTree(): Promise<VaultFolder> {
  const posts = await getSortedPosts();
  const postBySlug = new Map<string, Post>();
  for (const post of posts) {
    postBySlug.set(post.id.toLowerCase(), post);
  }

  if (!existsSync(BLOG_DIR)) {
    return {
      name: 'Base de datos',
      slug: '',
      path: '',
      href: '/codices/',
      subfolders: [],
      articles: [],
      totalArticles: 0,
      config: getFolderConfig('Base de datos'),
    };
  }

  // Escanear todos los archivos .md con su ruta relativa desde BLOG_DIR
  const allEntries = readdirSync(BLOG_DIR, { recursive: true }).map(String);
  const markdownFiles: { relPath: string; parts: string[]; fileName: string }[] = [];

  for (const entry of allEntries) {
    const normalized = entry.replace(/\\/g, '/');
    const fileName = normalized.split('/').pop()?.toLowerCase() || '';

    // Filtrar ignorados
    if (
      normalized.startsWith('.') ||
      normalized.includes('/.') ||
      normalized.startsWith('_') ||
      normalized.includes('/_') ||
      normalized.includes('.obsidian') ||
      normalized.includes('.git') ||
      normalized.includes('.trash') ||
      fileName === 'readme.md' ||
      fileName.startsWith('readme.')
    ) {
      continue;
    }

    if (/\.mdx?$/i.test(normalized)) {
      const parts = normalized.split('/');
      const actualFileName = parts.pop() || '';
      markdownFiles.push({
        relPath: normalized,
        parts, // subcarpetas
        fileName: actualFileName,
      });
    }
  }

  // Construir el árbol a partir de las rutas
  interface TempNode {
    name: string;
    slug: string;
    path: string;
    subfolders: Map<string, TempNode>;
    articles: VaultArticle[];
  }

  const rootNode: TempNode = {
    name: 'Base de datos',
    slug: '',
    path: '',
    subfolders: new Map(),
    articles: [],
  };

  for (const item of markdownFiles) {
    let current = rootNode;
    let accumulatedPath = '';

    for (const folderPart of item.parts) {
      const folderSlug = slugify(folderPart);
      accumulatedPath = accumulatedPath ? `${accumulatedPath}/${folderSlug}` : folderSlug;

      if (!current.subfolders.has(folderPart)) {
        current.subfolders.set(folderPart, {
          name: folderPart,
          slug: folderSlug,
          path: accumulatedPath,
          subfolders: new Map(),
          articles: [],
        });
      }
      current = current.subfolders.get(folderPart)!;
    }

    const postSlug = resolveWikiTarget(item.fileName);
    const post = postBySlug.get(postSlug.toLowerCase());

    const title = post?.data.title || item.fileName.replace(/\.mdx?$/i, '');
    const article: VaultArticle = {
      id: postSlug,
      title,
      fileName: item.fileName,
      relPath: item.relPath,
      href: toPostHref(postSlug),
      cover_image: post?.data.cover_image,
      description: post?.data.description,
      date: post?.data.date ?? new Date(),
    };

    current.articles.push(article);
  }

  async function finalizeNode(node: TempNode): Promise<VaultFolder> {
    // Ordenar subcarpetas alfabéticamente
    const sortedSubNodes = Array.from(node.subfolders.values())
      .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));

    const subfolders: VaultFolder[] = [];
    for (const sub of sortedSubNodes) {
      subfolders.push(await finalizeNode(sub));
    }

    // Ordenar artículos por fecha más reciente
    const articles = node.articles.sort((a, b) => b.date.valueOf() - a.date.valueOf());

    const totalArticles = articles.length + subfolders.reduce((acc, s) => acc + s.totalArticles, 0);

    const config = getFolderConfig(node.name);
    if (config.body) {
      try {
        config.html = await renderMarkdownContent(config.body);
      } catch (err) {
        console.warn(`[vault-tree] Error al compilar markdown de carpeta ${node.name}:`, err);
      }
    }

    return {
      name: config.title || node.name,
      slug: node.slug,
      path: node.path,
      href: node.path ? withBase(`codices/${node.path}/`) : withBase('codices/'),
      subfolders,
      articles,
      totalArticles,
      config,
    };
  }

  return await finalizeNode(rootNode);
}

/**
 * Retorna una lista plana de todas las carpetas (y subcarpetas) del árbol.
 */
export function getAllFolders(root: VaultFolder): VaultFolder[] {
  const result: VaultFolder[] = [];

  function traverse(node: VaultFolder) {
    if (node.path) {
      result.push(node);
    }
    for (const sub of node.subfolders) {
      traverse(sub);
    }
  }

  traverse(root);
  return result;
}

/**
 * Busca una carpeta específica por su ruta (ej: "ambientacion/planos").
 */
export function findFolderByPath(root: VaultFolder, targetPath: string): VaultFolder | null {
  const normalized = targetPath.replace(/^\/+|\/+$/g, '').toLowerCase();
  if (!normalized) return root;

  const all = getAllFolders(root);
  return all.find((f) => f.path.toLowerCase() === normalized) || null;
}

export interface ArticleParentInfo {
  parentHref: string;
  parentLabel: string;
}

/**
 * Encuentra la carpeta padre de un artículo para construir el enlace "Volver a...".
 * Por ejemplo, para un artículo en Bestiario/Angeles/Angel2.md retornará el códice Bestiario/Angeles.
 */
export function getArticleParentInfo(root: VaultFolder, articleId: string): ArticleParentInfo {
  function search(folder: VaultFolder): ArticleParentInfo | null {
    for (const art of folder.articles) {
      if (art.id.toLowerCase() === articleId.toLowerCase()) {
        if (folder.path) {
          return {
            parentHref: folder.href,
            parentLabel: `Volver a ${folder.name}`,
          };
        } else {
          return {
            parentHref: withBase('codices/'),
            parentLabel: 'Volver a Todos los Códices',
          };
        }
      }
    }

    for (const sub of folder.subfolders) {
      const match = search(sub);
      if (match) return match;
    }

    return null;
  }

  return search(root) || {
    parentHref: withBase('codices/'),
    parentLabel: 'Volver a Todos los Códices',
  };
}
