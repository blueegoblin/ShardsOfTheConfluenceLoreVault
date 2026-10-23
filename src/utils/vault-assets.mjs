// @ts-check
import { existsSync, readdirSync, mkdirSync, copyFileSync, statSync, rmSync } from 'node:fs';
import { join, dirname, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { withBase } from './wikilinks.mjs';

export const MEDIA_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.webp',
  '.avif',
  '.bmp',
  '.ico',
]);

const BLOG_DIR = fileURLToPath(new URL('../content/blog', import.meta.url));
const PUBLIC_ASSETS_DIR = fileURLToPath(new URL('../../public/vault-assets', import.meta.url));

/**
 * Determina si una ruta corresponde a un archivo multimedia del baúl.
 * @param {string} file
 */
export function isVaultMedia(file) {
  const ext = extname(file).toLowerCase();
  return MEDIA_EXTENSIONS.has(ext);
}

/**
 * Escanea la carpeta del baúl de Obsidian (src/content/blog) para indexar
 * todos los archivos multimedia.
 */
export function scanVaultAssets() {
  if (!existsSync(BLOG_DIR)) {
    return {
      files: [],
      byBasename: new Map(),
      byPath: new Map(),
    };
  }

  const allFiles = readdirSync(BLOG_DIR, { recursive: true }).map(String);
  const mediaFiles = [];
  const byBasename = new Map();
  const byPath = new Map();

  for (const rel of allFiles) {
    const normalized = rel.replace(/\\/g, '/');
    if (
      normalized.startsWith('.') ||
      normalized.includes('/.') ||
      normalized.includes('.obsidian') ||
      normalized.includes('.git') ||
      normalized.includes('.trash')
    ) {
      continue;
    }

    if (isVaultMedia(normalized)) {
      mediaFiles.push(normalized);
      const name = basename(normalized).toLowerCase();
      // Si hay duplicados con el mismo nombre, el primero se preserva pero se registran
      if (!byBasename.has(name)) {
        byBasename.set(name, normalized);
      }
      byPath.set(normalized.toLowerCase(), normalized);
    }
  }

  return { files: mediaFiles, byBasename, byPath };
}

/**
 * Copia todos los archivos multimedia desde src/content/blog hacia public/vault-assets/
 * manteniendo la estructura de directorios relativa.
 */
export function syncVaultAssets() {
  if (!existsSync(BLOG_DIR)) return;

  const { files } = scanVaultAssets();
  if (!existsSync(PUBLIC_ASSETS_DIR)) {
    mkdirSync(PUBLIC_ASSETS_DIR, { recursive: true });
  }

  const existingInDest = new Set();

  for (const rel of files) {
    const srcPath = join(BLOG_DIR, rel);
    const destPath = join(PUBLIC_ASSETS_DIR, rel);
    existingInDest.add(destPath);

    const destDir = dirname(destPath);
    if (!existsSync(destDir)) {
      mkdirSync(destDir, { recursive: true });
    }

    // Copiar solo si no existe o si ha cambiado el tamaño o fecha de modificación
    let shouldCopy = true;
    if (existsSync(destPath)) {
      try {
        const srcStat = statSync(srcPath);
        const destStat = statSync(destPath);
        if (srcStat.size === destStat.size && Math.abs(srcStat.mtimeMs - destStat.mtimeMs) < 1000) {
          shouldCopy = false;
        }
      } catch {
        shouldCopy = true;
      }
    }

    if (shouldCopy) {
      copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Resuelve una referencia de imagen de Obsidian (como "[[Confluencia.png]]",
 * "Images/Confluencia.png" o "Confluencia.png") a una URL pública web (/vault-assets/...).
 *
 * @param {string | undefined | null} ref
 * @param {{ byBasename: Map<string, string>, byPath: Map<string, string> }} [maps]
 * @returns {string | undefined}
 */
export function resolveVaultAsset(ref, maps) {
  if (!ref || typeof ref !== 'string') return undefined;

  const trimmed = ref.trim();
  if (!trimmed) return undefined;

  // URLs remotas o ya absolutas web
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('//') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }

  // Eliminar sintaxis [[...]] de Obsidian si está presente
  let clean = trimmed;
  if (clean.startsWith('[[') && clean.endsWith(']]')) {
    clean = clean.slice(2, -2).trim();
  }

  // Si tiene un alias tipo [[imagen.png|alt o tamaño]], quedarse con el archivo destino
  if (clean.includes('|')) {
    clean = clean.split('|')[0].trim();
  }

  // Eliminar prefijo ./
  clean = clean.replace(/^\.\//, '').trim();

  // Si ya comienza por /vault-assets/
  if (clean.startsWith('/vault-assets/')) {
    return withBase(clean);
  }
  if (clean.startsWith('/')) {
    return clean;
  }

  const assetMaps = maps ?? scanVaultAssets();
  const lowerClean = clean.toLowerCase();

  // 1. Coincidencia por ruta relativa completa (ej: "images/confluencia.png")
  if (assetMaps.byPath.has(lowerClean)) {
    return withBase(`vault-assets/${assetMaps.byPath.get(lowerClean)}`);
  }

  // 2. Coincidencia por nombre de archivo (ej: "confluencia.png" -> "Images/Confluencia.png")
  const justFileName = basename(clean).toLowerCase();
  if (assetMaps.byBasename.has(justFileName)) {
    return withBase(`vault-assets/${assetMaps.byBasename.get(justFileName)}`);
  }

  // 3. Fallback directo
  return withBase(`vault-assets/${clean}`);
}
