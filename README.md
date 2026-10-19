# Confluencia

Confluencia es un blog estatico concebido como una red de conocimiento interconectada. En lugar de organizar las publicaciones de manera exclusivamente lineal o cronologica, cada articulo opera como un nodo dentro de una malla de ideas. Los articulos se enlazan entre si mediante hipervinculos contextuales de doble corchete, permitiendo recorrer el contenido a traves de sus conexiones tematicas.

El proyecto esta construido con Astro, incorporando un sistema de diseno solido y profesional, animaciones fluidas y un fondo tridimensional interactivo basado en fragmentos cromados.

---

## Caracteristicas principales

- **Red de conocimiento bidireccional**: Soporte nativo para enlaces de estilo wiki (`[[nombre-del-archivo]]`), resolviendo automaticamente rutas HTML limpias y rastreando conexiones entrantes y salientes.
- **Grafo interactivo de relaciones**: Mapa visual en la portada que representa la topologia de la red, los nodos existentes y el flujo de enlaces entre notas.
- **Seccion unificada de articulos relacionados**: Cada publicacion analiza el grafo en tiempo de construccion y presenta un bloque consolidado con todos los nodos conectados.
- **Fondo interactivo AeroShards**: Fondo geometrico con 800 fragmentos cromados en 3D que reaccionan a la posicion del cursor, pulsos de clic y agrupamiento, cubierto por una capa de desenfoque de cristal esmerilado que garantiza la legibilidad.
- **Identidad visual corporativa**: Paleta basada en Azul Electrico (`#2755ED`), Azul Profundo (`#1B399E`), blanco y negro puro, con componentes de bordes firmes y tipografia editorial limpia.
- **Transiciones nativas y animaciones cinematicas**: Integracion de View Transitions en el navegador y secuencias tipograficas orquestadas con Anime.js.

---

## Tecnologias utilizadas

- **Framework**: Astro 7 (modo estatico, Content Collections y rutas dinamicas).
- **Componentes interactivos**: React 19 (`@astrojs/react`).
- **Renderizado 3D y Shaders**: `vgpu` (WebGPU) con pipeline de contingencia automatico a Canvas 2D de alto rendimiento.
- **Animaciones**: Anime.js 4 (revelacion tipografica, pulsos y grafo vectorial SVG).
- **Procesamiento Markdown**: Unified, Remark y plugin personalizado de resolucion de enlaces bidireccionales.
- **Estilos**: CSS nativo con variables de diseno centralizadas y diseno responsivo.

---

## Arquitectura de datos y Content Collections

El contenido reside en el directorio:

```text
src/content/blog/
```

Cada publicacion es un archivo Markdown (`.md`) con metadatos estandarizados en el frontmatter:

```markdown
---
title: "El arte de conectar"
date: 2026-10-05
cover_image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80"
description: "Vincular ideas mediante dobles corchetes para tejer una red viva."
tags: ["metodo", "enlaces"]
---

Un parrafo inicial donde mencionamos [[jardines-digitales]] para vincular conceptos.
```

### Sintaxis de enlaces internos

Para crear una conexion hacia otra nota, escribe el identificador del archivo entre dobles corchetes:

- `[[nombre-del-archivo]]`: Se convierte automaticamente en un enlace con el titulo formateado del articulo destino.
- `[[nombre-del-archivo|Texto personalizado]]`: Permite definir un texto visible alternativo para el enlace.

El compilador procesa estos enlaces de forma estatica:
1. Elimina los corchetes sintacticos `[[ ]]`.
2. Genera una ruta HTML relativa valida (`/blog/nombre-del-archivo/`).
3. Registra la arista en el grafo de conocimiento para calcular las menciones mutuas.

---

## Fondo interactivo (AeroShards)

El fondo visual implementa el componente tridimensional `AeroShards`, adaptado a la identidad corporativa:

- **Paleta cromatica**: Tonos primarios `#2755ED` y secundarios `#1B399E`, con reflejos especulares blancos y sombras profundas.
- **Simulacion fisica**: 800 fragmentos orientados a lo largo de cintas matematicas continuas con alabeo, giro y dispersion en profundidad.
- **Interaccion de usuario**:
  - *Puntero*: Los fragmentos se apartan al paso del cursor (`mouseInteraction`, `mouseStrength: 0.75`).
  - *Clic*: Propaga una onda expansiva con destellos de luz sobre los fragmentos (`pulseOnClick`).
  - *Pulsacion sostenida*: Atrae los fragmentos cercanos hacia el punto de contacto (`holdToGather`).
- **Capa de difusion y desenfoque**: Una lamina fija con `backdrop-filter: blur(38px)` y un tono `rgba(0, 0, 0, 0.55)` reposa sobre el canvas. Esto produce un efecto de vidrio esmerilado que atenua los bordes de los fragmentos y garantiza un contraste optimo para los textos.

---

## Estructura del repositorio

```text
ConfluenceVault/
├── public/                     # Archivos estaticos y favicon
├── scripts/
│   └── generate-sample-posts.mjs   # Generador de notas de ejemplo
├── src/
│   ├── components/             # Componentes de interfaz y fondo AeroShards
│   │   ├── AeroShards.jsx      # Implementacion del fondo 3D interactivo
│   │   └── AeroShards.css      # Reglas de dimensionamiento del canvas
│   ├── content/
│   │   ├── config.ts           # Definicion del esquema de colecciones Astro
│   │   └── blog/               # Notas y articulos Markdown
│   ├── layouts/
│   │   ├── BaseLayout.astro    # Plantilla raiz con cabecera, pie y fondo
│   │   └── ArticleLayout.astro # Plantilla de lectura, metadatos y enlaces relacionados
│   ├── pages/
│   │   ├── index.astro         # Pagina principal con portada y grafo interactivo
│   │   └── blog/
│   │       └── [slug].astro    # Enrutamiento dinamico de cada articulo
│   ├── styles/
│   │   └── global.css          # Variables de color, tipografia y reset CSS
│   └── utils/
│       ├── posts.ts            # Utilidades de ordenacion y extraccion de grafos
│       └── wikilinks.mjs       # Resolucion y normalizacion de enlaces de corchetes
├── astro.config.mjs            # Configuracion de Astro, React y Unified
├── package.json                # Dependencias y scripts de ejecucion
└── tsconfig.json               # Configuracion de TypeScript
```

---

## Comandos disponibles

Todos los comandos se ejecutan desde la raiz del proyecto con Node.js 22 o superior:

### 1. Instalacion de dependencias
```bash
npm install
```

### 2. Entorno de desarrollo local
Inicia el servidor local con recarga en caliente:
```bash
npm run dev
```
La aplicacion estara disponible en `http://localhost:4321/`.

### 3. Generacion de articulos de prueba
Crea un conjunto inicial de notas interconectadas en `src/content/blog/`:
```bash
npm run generate:samples
```

### 4. Compilacion de produccion
Genera el paquete estatico optimizado en el directorio `dist/`:
```bash
npm run build
```

### 5. Previsualizacion local del build
Sirve el resultado compilado de la carpeta `dist/`:
```bash
npm run preview
```

---

## Guia de publicacion de contenido

Para agregar una publicacion al blog:

1. Crea un nuevo archivo `.md` dentro de `src/content/blog/` (por ejemplo, `mi-nuevo-articulo.md`).
2. Completa los metadatos de cabecera con el formato YAML:
   ```yaml
   ---
   title: "Mi nuevo articulo"
   date: 2026-10-20
   cover_image: "https://ejemplo.com/imagen.jpg"
   description: "Breve resumen para el indice y motores de busqueda."
   tags: ["investigacion", "tecnologia"]
   ---
   ```
3. Escribe el cuerpo de la nota utilizando Markdown estandar.
4. Para conectar esta publicacion con otra existente, anade un enlace con corchetes dobles usando el nombre del archivo sin extension:
   ```markdown
   Este concepto amplia lo discutido previamente en [[el-arte-de-conectar]].
   ```
5. Al reconstruir o iniciar el servidor de desarrollo, la conexion se indexara en el grafo de la portada y se listara automaticamente en el bloque de notas relacionadas de ambos articulos.