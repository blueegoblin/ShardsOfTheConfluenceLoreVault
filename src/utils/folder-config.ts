// @ts-check
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';

export interface OrbConfig {
  preset?: string;
  style?: number | string;
  speed?: number;
  radius?: number;
  zoom?: number;
  warp?: number;
  ridgeAmt?: number;
  sharp?: number;
  shade?: number;
  sheen?: number;
  gloss?: number;
  shellMidAlpha?: number;
  shellEdgeAlpha?: number;
  exposure?: number;
  edgeSoftness?: number;
  edgeGlow?: number;
  glassEnabled?: boolean;
  glassOpacity?: number;
  contourDeform?: number;
  colorA?: string;
  colorB?: string;
  colorC?: string;
  colorD?: string;
  highlightColor?: string;
  glowColor?: string;
  sheenColor?: string;
  specColor?: string;
  canvasColor?: string;
}

export interface FolderConfig {
  title?: string;
  description?: string;
  icon?: string;
  iconSvg?: string;
  orb: OrbConfig;
}

export const STYLE_PRESETS: Record<string, number> = {
  siri: 9,
  aurora: 10,
  plasma: 11,
  chrome: 12,
  opal: 13,
  spectrum: 14,
  frost: 15,
  'voice-wave': 19,
  voicewave: 19,
  'blue-drop': 20,
  bluedrop: 20,
  'violet-ember': 21,
  violetember: 21,
  ember: 21,
  'chromatic-metal': 22,
  chromaticmetal: 22,
  metal: 22,
  'refractive-blob': 23,
  blob: 23,
  'particle-ribbon': 24,
  ribbon: 24,
};

function getBlogDir(): string {
  const fromCwd = join(process.cwd(), 'src', 'content', 'blog');
  if (existsSync(fromCwd)) return fromCwd;
  return join(process.cwd(), 'content', 'blog');
}

/**
 * Convierte un color hexadecimal '#RRGGBB' o '#RRGGBBAA' a un array [r, g, b, a] normalizado (0 a 1).
 */
export function hexToRgba(hex?: string, defaultRgba: [number, number, number, number] = [1, 1, 1, 1]): [number, number, number, number] {
  if (!hex || typeof hex !== 'string') return defaultRgba;
  let c = hex.replace('#', '').trim();
  if (c.length === 3) {
    c = c.split('').map((x) => x + x).join('');
  }
  if (c.length === 6) {
    const num = parseInt(c, 16);
    if (isNaN(num)) return defaultRgba;
    return [((num >> 16) & 255) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255, defaultRgba[3] ?? 1];
  }
  if (c.length === 8) {
    const num = parseInt(c, 16);
    if (isNaN(num)) return defaultRgba;
    return [
      ((num >> 24) & 255) / 255,
      ((num >> 16) & 255) / 255,
      ((num >> 8) & 255) / 255,
      ((num & 255) / 255),
    ];
  }
  return defaultRgba;
}

/**
 * Lee la configuración de una carpeta desde src/content/blog/_configFolder/<nombreCarpeta>.md
 */
export function getFolderConfig(folderName: string): FolderConfig {
  const blogDir = getBlogDir();
  const configDir = join(blogDir, '_configFolder');
  const iconsDir = join(configDir, 'icons');

  // Valores por defecto (estilo cristal de Confluencia: zafiro y orbe etéreo)
  const defaultConfig: FolderConfig = {
    title: folderName,
    description: '',
    icon: '',
    iconSvg: '',
    orb: {
      preset: 'blue-drop',
      style: 20,
      speed: 0.7,
      radius: 0.74,
      zoom: 0.45,
      warp: 1.3,
      ridgeAmt: 0.2,
      sharp: 1.9,
      shade: 0.16,
      sheen: 0.22,
      gloss: 0.42,
      shellMidAlpha: 0.32,
      shellEdgeAlpha: 0.24,
      exposure: 0.9,
      edgeSoftness: 0.005,
      edgeGlow: 0.35,
      glassEnabled: true,
      glassOpacity: 0.66,
      contourDeform: 0.03,
      colorA: '#020817',
      colorB: '#0a2558',
      colorC: '#2755ed',
      colorD: '#7da0ff',
      highlightColor: '#ffffff',
      glowColor: '#3b82f6',
      sheenColor: '#93c5fd',
      specColor: '#60a5fa',
      canvasColor: '#010207',
    },
  };

  // Directorios de búsqueda: primero en el baúl (_configFolder), luego en el repositorio (src/configFolder)
  const candidateDirs = [
    join(blogDir, '_configFolder'),
    join(process.cwd(), 'src', 'configFolder'),
  ].filter(d => existsSync(d));

  if (candidateDirs.length === 0) {
    return defaultConfig;
  }

  // Buscar coincidencia sin distinguir mayúsculas
  const candidateFiles = [
    `${folderName}.md`,
    `${folderName.toLowerCase()}.md`,
    `${folderName.charAt(0).toUpperCase() + folderName.slice(1)}.md`,
  ];

  let configPath = '';
  let activeIconsDir = '';
  for (const dir of candidateDirs) {
    for (const candidate of candidateFiles) {
      const fullPath = join(dir, candidate);
      if (existsSync(fullPath)) {
        configPath = fullPath;
        activeIconsDir = join(dir, 'icons');
        break;
      }
    }
    if (configPath) break;
  }

  if (!configPath) {
    return defaultConfig;
  }

  try {
    const rawContent = readFileSync(configPath, 'utf-8');
    // Sanitizar espacios indivisibles (\u00A0) y tabuladores para evitar fallos de indentación en YAML
    const sanitizedYaml = rawContent
      .replace(/\u00A0/g, ' ')
      .replace(/\u200B/g, '')
      .replace(/\t/g, '  ');

    const frontmatterMatch = sanitizedYaml.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!frontmatterMatch) {
      return defaultConfig;
    }

    const parsed = YAML.parse(frontmatterMatch[1]);
    if (!parsed || typeof parsed !== 'object') {
      return defaultConfig;
    }

    const rawOrb = parsed.orb && typeof parsed.orb === 'object' ? parsed.orb : {};

    // Soportar alias glass <-> glassEnabled
    if (rawOrb.glass !== undefined && rawOrb.glassEnabled === undefined) {
      rawOrb.glassEnabled = Boolean(rawOrb.glass);
    }

    let resolvedStyle = 20;
    if (typeof rawOrb.style === 'number') {
      resolvedStyle = rawOrb.style;
    } else if (typeof rawOrb.style === 'string' && STYLE_PRESETS[rawOrb.style.toLowerCase().trim()] !== undefined) {
      resolvedStyle = STYLE_PRESETS[rawOrb.style.toLowerCase().trim()];
    } else if (typeof rawOrb.preset === 'string' && STYLE_PRESETS[rawOrb.preset.toLowerCase().trim()] !== undefined) {
      resolvedStyle = STYLE_PRESETS[rawOrb.preset.toLowerCase().trim()];
    }

    const mergedOrb: OrbConfig = {
      ...defaultConfig.orb,
      ...rawOrb,
      style: resolvedStyle,
    };

    let iconSvg = '';
    const iconFile = parsed.icon || '';
    if (iconFile) {
      const iconPath = join(activeIconsDir || iconsDir, iconFile);
      if (existsSync(iconPath)) {
        try {
          iconSvg = readFileSync(iconPath, 'utf-8');
          // Limpiar declaraciones XML si las hay
          iconSvg = iconSvg.replace(/<\?xml[\s\S]*?\?>/i, '').trim();
        } catch (e) {
          console.warn(`[folder-config] No se pudo leer el icono SVG: ${iconPath}`, e);
        }
      }
    }

    return {
      title: parsed.title || parsed.name || defaultConfig.title,
      description: parsed.description || defaultConfig.description,
      icon: iconFile,
      iconSvg,
      orb: mergedOrb,
    };
  } catch (error) {
    console.error(`[folder-config] Error al parsear ${configPath}:`, error);
    return defaultConfig;
  }
}
