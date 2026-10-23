# Manual de Configuración de Códices y Orbes Líquidos

Esta guía detalla cómo personalizar las carpetas de tu baúl de **Obsidian** para que se muestren en la web con una **esfera líquida WebGPU interactiva**, con colores propios, velocidad, refracción de cristal y su icono personalizado en el interior.

---

## 📁 ¿Dónde se guardan los archivos?

Dentro de tu baúl de notas, en la carpeta:
```text
_configFolder/
  ├── Bestiario.md            <-- Configuración para la carpeta "Bestiario"
  ├── Magia.md                <-- Configuración para la carpeta "Magia"
  ├── Facciones.md            <-- Configuración para la carpeta "Facciones"
  ├── GUIA_ORBES.md           <-- Este manual de referencia
  └── icons/                  <-- Carpeta con los iconos en formato SVG
        ├── bestiario.svg
        ├── magia.svg
        └── corona.svg
```

> [!NOTE]
> - El archivo `.md` debe tener **exactamente el mismo nombre** que la carpeta que configura.
> - La carpeta `_configFolder` está configurada para **no publicarse jamás como un artículo en el blog**.
> - Puedes usar el cuerpo de texto del `.md` para escribir notas personales de diseño de juego que solo verás en Obsidian.

---

## 🔮 Estructura de un Archivo de Configuración

Cada archivo `.md` de configuración utiliza un bloque frontal **YAML (Frontmatter)** al principio del documento:

```markdown
---
title: "Bestiario Ancestral"
description: "Catálogo de entidades, aberraciones y quimeras que habitan los confines de los Fragmentos."
icon: "bestiario.svg"
orb:
  style: "violet-ember"
  speed: 0.85
  warp: 0.55
  zoom: 0.48
  exposure: 1.05
  edgeGlow: 0.45
  glass: true
  glassOpacity: 0.72
  colorA: "#0d0219"
  colorB: "#450a6b"
  colorC: "#8b1fe6"
  colorD: "#f09aff"
  highlightColor: "#ffffff"
  glowColor: "#a855f7"
  sheenColor: "#e9d5ff"
---

# Apuntes Internos (Opcional)
Aquí puedes anotar lore privado sobre este tomo. No se mostrará en la web.
```

---

## 🎨 Catálogo de Presets de Flujo (`orb.style`)

El motor WebGPU incluye múltiples modelos matemáticos de simulación de fluidos:

| Preset (`style`) | Código | Descripción Visual y Comportamiento |
| :--- | :---: | :--- |
| **`violet-ember`** | `21` | Núcleo ígneo en espiral y magma líquido viscoso. Ideal para monstruos, abismos o fuego arcano. |
| **`blue-drop`** | `20` | Gotas de fluido denso en advección lenta con ondas de cizallamiento. Perfecto para tomos etéreos o acuáticos. |
| **`plasma`** | `11` | Redes neuronales de energía de alta frecuencia y filamentos eléctricos en interferencia constante. Ideal para hechicería y telepatía. |
| **`aurora`** | `10` | Cortinas cósmicas fluidas con polvo estelar parpadeante en su interior. Excelente para cosmología y planos astrales. |
| **`chrome`** | `12` | Metal líquido brillante con reflejos duros y pliegues metálicos. Ideal para tecnología, artefactos y armas. |
| **`frost`** | `15` | Frentes de nubes gélidas y vetas de escarcha ascendente. Perfecto para reinos helados o necromancia. |
| **`siri`** | `9` | Haces de luz cromáticos que oscilan en un horizonte fluido con núcleo blanco. |
| **`opal`** | `13` | Interferencia óptica iridiscente de piedras preciosas y gemas míticas. |

> [!TIP]
> Puedes escribir el nombre del preset entre comillas (ej. `style: "plasma"`) o su número (ej. `style: 11`).

---

## ⚙️ Parámetros Físicos del Orbe (`orb.*`)

| Propiedad | Tipo | Rango Recomendado | Por defecto | Descripción |
| :--- | :---: | :---: | :---: | :--- |
| **`speed`** | `number` | `0.3` a `1.5` | `0.7` | Velocidad a la que fluye el líquido interior. |
| **`warp`** | `number` | `0.2` a `2.0` | `0.55` | Nivel de turbulencia y distorsión caótica de las corrientes. |
| **`zoom`** | `number` | `0.35` a `0.85` | `0.48` | Escala del detalle del fluido (menor = más grande; mayor = filamentos más finos). |
| **`exposure`** | `number` | `0.8` a `1.4` | `1.0` | Luminosidad y brillo general del orbe. |
| **`edgeGlow`** | `number` | `0.1` a `0.8` | `0.4` | Intensidad del resplandor y halo luminoso exterior. |
| **`glass`** | `boolean` | `true` / `false` | `true` | Activa o desactiva la cáscara de refracción óptica de vidrio exterior. |
| **`glassOpacity`** | `number` | `0.3` a `0.9` | `0.72` | Densidad y refracción del lente de cristal. |
| **`sheen`** | `number` | `0.1` a `0.6` | `0.25` | Brillo de los reflejos especulares tangenciales del cristal. |
| **`gloss`** | `number` | `0.2` a `0.7` | `0.42` | Separación cromática (efecto arcoíris) en los bordes de la lente. |
| **`contourDeform`** | `number` | `0.0` a `0.08` | `0.03` | Deformación orgánica del contorno de la esfera. |

---

## 🌈 Paleta de Colores

Cada orbe se mezcla a partir de cuatro capas de color principales más los reflejos:

- **`colorA`** (Color abisal / Fondo): Es el color base más profundo del orbe, visible en las zonas de sombra.
- **`colorB`** (Cuerpo líquido inferior): Otorga la tonalidad predominante del fluido.
- **`colorC`** (Crestas y filamentos activos): Color de las corrientes energéticas intermedias.
- **`colorD`** (Núcleo incandescente): Color de los puntos de máxima energía en el fluido.
- **`highlightColor`**: Destello blanco o tintado de los reflejos de luz especular (`#ffffff`).
- **`glowColor`**: Color del halo exterior y del resplandor que proyecta la esfera sobre la página.
- **`sheenColor`**: Reflejo secundario en la corona de vidrio.

Todos los colores se escriben en formato hexadecimal habitual (ej: `"#9333ea"` o `"#3b82f6"`).

---

## 🛡️ Sistema de Iconos SVG

Para asignar un icono al orbe:
1. Guarda un archivo `.svg` dentro de `_configFolder/icons/` (ej: `_configFolder/icons/bestiario.svg`).
2. En el archivo de configuración de la carpeta, añade `icon: "bestiario.svg"`.
3. El icono se adaptará automáticamente al tamaño del orbe, heredará el resplandor de la esfera y reaccionará cuando el usuario pase el cursor por encima.

---

## 📋 Ejemplos Listos para Copiar

### 1. Tomo de Magia Arcana / Cosmología
```markdown
---
title: "Ars Arcanum"
description: "Tratados de manipulación de la energía planar y hechizos de los Fragmentos."
icon: "magia.svg"
orb:
  style: "plasma"
  speed: 0.9
  warp: 0.8
  exposure: 1.15
  edgeGlow: 0.5
  colorA: "#02031a"
  colorB: "#1d054d"
  colorC: "#6318e8"
  colorD: "#00f0ff"
  glowColor: "#06b6d4"
---
```

### 2. Tomo de Facciones e Imperios
```markdown
---
title: "Facciones y Coronas"
description: "Las casas gobernantes, cultos secretos y ejércitos en pugna."
icon: "corona.svg"
orb:
  style: "chrome"
  speed: 0.65
  warp: 0.4
  exposure: 1.1
  edgeGlow: 0.4
  colorA: "#1a1202"
  colorB: "#5c3d05"
  colorC: "#d99718"
  colorD: "#ffea94"
  glowColor: "#eab308"
---
```

### 3. Tomo de Lugares y Planos
```markdown
---
title: "Cartografía de los Fragmentos"
description: "Atlas de planos, nexos dimensionales y ruinas ancestrales."
icon: "brujula.svg"
orb:
  style: "aurora"
  speed: 0.6
  warp: 0.5
  exposure: 1.0
  edgeGlow: 0.45
  colorA: "#02120e"
  colorB: "#04382c"
  colorC: "#0ea5e9"
  colorD: "#6ee7b7"
  glowColor: "#10b981"
---
```
