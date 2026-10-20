// @ts-check
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_URL = 'https://github.com/blueegoblin/ConfluenceLore.git';
const BLOG_DIR = fileURLToPath(new URL('../src/content/blog', import.meta.url));

/**
 * Sincroniza el contenido de ConfluenceLore en src/content/blog.
 * 1. Si existe un repositorio Git o submódulo en src/content/blog, intenta hacer git pull.
 * 2. Si no existe o está vacío, intenta clonar / inicializar submódulo.
 * 3. Si Git falla (por ejemplo en un entorno CI sin git), descarga el archivo ZIP desde GitHub.
 */
async function syncLore() {
  console.log('🔄 [sync-lore] Sincronizando contenido desde ConfluenceLore...');

  // 1. Si ya existe un repositorio git en src/content/blog
  const gitDirOrFile = join(BLOG_DIR, '.git');
  if (existsSync(gitDirOrFile)) {
    try {
      console.log('📦 [sync-lore] Actualizando repositorio existente (git pull)...');
      execSync('git pull origin main', { cwd: BLOG_DIR, stdio: 'inherit' });
      console.log('✅ [sync-lore] Contenido actualizado correctamente.');
      return;
    } catch (err) {
      console.warn('⚠️ [sync-lore] Falló git pull, comprobando si hay archivos locales...');
      if (hasMarkdownFiles(BLOG_DIR)) {
        console.log('ℹ️ [sync-lore] Usando archivos existentes en disco.');
        return;
      }
    }
  }

  // 2. Si es un submódulo Git no inicializado en el repositorio padre
  try {
    console.log('📦 [sync-lore] Inicializando submódulo Git...');
    execSync('git submodule update --init --recursive', { stdio: 'inherit' });
    if (hasMarkdownFiles(BLOG_DIR)) {
      console.log('✅ [sync-lore] Submódulo inicializado correctamente.');
      return;
    }
  } catch {
    // Si no estamos en un entorno con submódulos habilitados, continuamos
  }

  // 3. Si la carpeta está vacía o no existe, clonamos directamente
  if (!existsSync(BLOG_DIR) || !hasMarkdownFiles(BLOG_DIR)) {
    try {
      console.log(`📦 [sync-lore] Clonando repositorio ${REPO_URL}...`);
      if (existsSync(BLOG_DIR)) {
        // Limpiamos directorio si estaba vacío o corrupto
        rmSync(BLOG_DIR, { recursive: true, force: true });
      }
      execSync(`git clone --depth 1 ${REPO_URL} "${BLOG_DIR}"`, { stdio: 'inherit' });
      console.log('✅ [sync-lore] Repositorio clonado correctamente.');
      return;
    } catch (err) {
      console.warn('⚠️ [sync-lore] Falló git clone. Intentando descarga directa vía HTTP...');
    }

    // 4. Fallback: descarga directa vía fetch desde GitHub
    try {
      await downloadZipFallback();
      console.log('✅ [sync-lore] Contenido descargado vía HTTP.');
    } catch (fetchErr) {
      if (hasMarkdownFiles(BLOG_DIR)) {
        console.warn('⚠️ [sync-lore] No se pudo descargar la última versión, pero existen notas locales.');
      } else {
        console.error('❌ [sync-lore] No se pudo sincronizar el contenido:', fetchErr);
        throw fetchErr;
      }
    }
  }
}

/**
 * Verifica si un directorio contiene al menos un archivo Markdown.
 * @param {string} dir
 */
function hasMarkdownFiles(dir) {
  if (!existsSync(dir)) return false;
  try {
    const files = readdirSync(dir, { recursive: true });
    return files.some((f) => String(f).endsWith('.md'));
  } catch {
    return false;
  }
}

/**
 * Descarga y extrae el ZIP de main desde GitHub como contingencia.
 */
async function downloadZipFallback() {
  const zipUrl = 'https://github.com/blueegoblin/ConfluenceLore/archive/refs/heads/main.zip';
  console.log(`🌐 [sync-lore] Descargando ${zipUrl}...`);
  const response = await fetch(zipUrl);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Usamos utilidades de descompresión nativas de Node
  const AdmZip = await import('node:zlib');
  // Para evitar dependencias externas, guardamos el zip temporalmente y usamos tar / powershell
  const tempZip = join(BLOG_DIR, '..', '__confluence_lore_temp.zip');
  const { writeFileSync, unlinkSync } = await import('node:fs');
  writeFileSync(tempZip, buffer);

  mkdirSync(BLOG_DIR, { recursive: true });

  try {
    // En Windows powershell Expand-Archive está siempre disponible
    execSync(`powershell -NoProfile -Command "Expand-Archive -Path '${tempZip}' -DestinationPath '${BLOG_DIR}_temp' -Force"`);
    const tempExtracted = join(BLOG_DIR + '_temp', 'ConfluenceLore-main');
    
    // Mover archivos a BLOG_DIR
    const { cpSync } = await import('node:fs');
    cpSync(tempExtracted, BLOG_DIR, { recursive: true });
    rmSync(BLOG_DIR + '_temp', { recursive: true, force: true });
  } finally {
    if (existsSync(tempZip)) unlinkSync(tempZip);
  }
}

syncLore().catch((err) => {
  console.error('[sync-lore] Error fatal durante la sincronización:', err);
  process.exit(1);
});
