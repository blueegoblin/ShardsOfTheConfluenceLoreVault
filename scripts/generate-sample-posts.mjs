// Genera 3 crónicas de Fragmentos de prueba en src/content/blog, interconectados
// mediante enlaces de doble corchete ([[...]]).
//
// Uso:  npm run generate:samples          (no sobrescribe archivos existentes)
//       npm run generate:samples -- --force
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BLOG_DIR = fileURLToPath(new URL('../src/content/blog/', import.meta.url));
const force = process.argv.includes('--force');

const posts = [
  {
    file: 'la-red-de-ideas.md',
    frontmatter: {
      title: 'El Gran Quebranto',
      date: '2026-09-02',
      cover_image: 'https://picsum.photos/seed/red-de-ideas/1920/1200',
      description: 'Antes de la Confluencia existía una única realidad armónica. Esta es la crónica de su colapso y el nacimiento de los infinitos Fragmentos de la realidad.',
      tags: ['cosmologia', 'fragmentos', 'lore'],
    },
    body: `
En el principio no existían las fronteras. El cosmos era un único tejido continuo, un tapiz primordial donde el tiempo, la materia y el éter fluían al unísono. Sin embargo, aquel orden ancestral no estaba destinado a perdurar: un cataclismo cósmico sin precedentes conocido como **El Gran Quebranto** hizo estallar la realidad en mil pedazos.

La onda de choque fracturó la creación como si de un espejo colosal se tratase. En lugar de un solo mundo, el vacío se pobló de incontables planos aislados: los llamados **Fragmentos**. Si deseas explorar cómo la vegetación primordial sobrevivió al desastre, contempla el testimonio de [[jardines-digitales]].

## Planos a la deriva

Cada Fragmento es un plano de la existencia independiente, con su propia bóveda celeste, leyes físicas inmutables y corrientes de magia singular (similar a la vasta diversidad de los planos del multiverso). Algunos Fragmentos son mundos enteros con continentes y civilizaciones milenarias; otros son apenas ciudadelas flotantes o ruinas suspendidas en un océano de sombras y cristal.

> "Un plano aislado del resto es un naufragio a la espera del olvido; pero cuando dos planos colisionan, el destino de ambos se reescribe."
> — *Archivista Malakor, Guardián del Nexo*

Con el paso de las eras, las corrientes gravitacionales del éter comenzaron a aproximar los Fragmentos entre sí. Esta convergencia periódica entre planos es lo que da nombre a nuestro sistema y a nuestra era: **La Confluencia**. Los métodos y rituales para atravesar estas fronteras se detallan en [[el-arte-de-conectar|Las Sendas Planares]].

## Las Tres Leyes de los Fragmentos

1. **Aislamiento Fundamental**: Ningún habitante ordinario puede percibir los planos adyacentes a menos que se abra un nexo o se manifieste una anomalía de Confluencia.
2. **Resonancia Planar**: La magia y la naturaleza de cada Fragmento rechazan las fuerzas exógenas, provocando tormentas de éter y alteraciones de la realidad en los puntos de contacto.
3. **Puntos Ciegos**: Existen planos sellados o consumidos que nadie ha logrado cartografiar, como las leyendas que hablan del temido [[vacio-entropico|Vacío Entrópico]].

Quienes logran sobrevivir al cruce entre dimensiones aprenden a navegar las grietas del espacio. La historia del multiverso apenas comienza a desvelarse en [[jardines-digitales|el estudio de los planos primordiales]].
`,
  },
  {
    file: 'jardines-digitales.md',
    frontmatter: {
      title: 'Aethelgard: El Fragmento Floreciente',
      date: '2026-09-18',
      cover_image: 'https://picsum.photos/seed/jardines-digitales/1920/1200',
      description: 'Un plano salvaje de archipiélagos flotantes suspendidos en éter esmeralda, donde la vegetación colosal desafía las leyes del vacío interplanar.',
      tags: ['planos', 'aethelgard', 'ecologia'],
    },
    body: `
Entre todos los mundos resultantes de [[la-red-de-ideas|El Gran Quebranto]], pocos poseen la ferocidad y la majestuosidad biológica de **Aethelgard**. En este Fragmento, la gravedad no responde a un núcleo planetario central, sino a colosales raíces arcanas que entrelazan miles de islas de tierra y roca flotantes sobre un mar de neblina esmeralda.

La atmósfera está impregnada de maná vegetal puro. Quienes llegan a Aethelgard por primera vez a través de [[el-arte-de-conectar|las sendas de tránsito]] suelen quedar sobrecogidos por la escala de su flora: hongos del tamaño de catedrales y secuoyas celestes cuyas copas rozan las fronteras exteriores del plano.

## Estructura del Fragmento

Aethelgard está dividido en tres estratos habitables:

- **La Corona del Éter**: Islas altas bañadas por una luz dorada perpétua, hogar de los Clanes Arbóreos y aves de viento.
- **El Bosque Intermedio**: El corazón del plano, donde las raíces vivientes forman puentes naturales transitables entre mundos insulares.
- **La Umbría del Velo**: El lecho inferior donde la realidad se difumina y los ecos de planos oscuros amenazan con devorar la tierra viva.

> "Aethelgard no lucha contra el vacío; crece a través de él. Sus raíces buscan incansablemente los otros Fragmentos para volver a unirlos."
> — *Silas el Druida errante, testigo del Nexo*

## Amenazas y Puntos de Confluencia

Aunque la vida brota en cada rincón, el plano experimenta tensiones constantes. Cuando un Fragmento hostil o metálico entra en resonancia orbital con Aethelgard, se desatan las llamadas **Tormentas de Savia**: vendavales que abren grietas temporales hacia otros puntos del cosmos.

\`\`\`text
semilla arcana → raíz flotante → nexo de confluencia → tapiz planar
\`\`\`

Para los aventureros que exploran el sistema de rol Confluencia, este plano ofrece un entorno ideal para expediciones de supervivencia, descubrimiento de reliquias pre-quebranto y combate contra monstruosidades primigenias. Para dominar las técnicas de viaje que permiten llegar a este rincón del multiverso, consulta las crónicas de [[el-arte-de-conectar]].
`,
  },
  {
    file: 'el-arte-de-conectar.md',
    frontmatter: {
      title: 'Las Sendas Planares',
      date: '2026-10-05',
      cover_image: 'https://picsum.photos/seed/arte-de-conectar/1920/1200',
      description: 'El viaje entre planos: cómo los caminantes y las grietas dimensionales permiten transitar entre los Fragmentos de la realidad.',
      tags: ['transito-planar', 'nexos', 'caminantes'],
    },
    body: `
El abismo que separa a los Fragmentos no es un simple vacío espacial; es una marea inerte de éter primordial capaz de desintegrar el cuerpo y la mente de quien intente cruzarlo sin protección. Sin embargo, a través de las edades, ciertas entidades han dominado el arte del tránsito planar: el paso entre los mundos nacidos tras [[la-red-de-ideas|El Gran Quebranto]].

Cada nexo dimensional es un filamento de energía que conecta dos planos distintos, permitiendo viajar, comerciar o librar guerras interplanares entre realidades tan opuestas como los páramos de cristal y los bosques flotantes de [[jardines-digitales|Aethelgard]].

## Los Caminantes de Fragmentos

En el sistema de juego de **Confluencia**, ciertos personajes poseen una afinidad innata conocida como la *Chispa de la Confluencia*. Aquellos que despiertan este don son conocidos como **Caminantes de Fragmentos**. A diferencia de los mortales confinados a su plano natal, un Caminante puede:

1. **Detectar grietas etéreas**: Localizar zonas donde el velo entre planos se adelgaza.
2. **Abrir portales de confluencia**: Canalizar maná para rasgar temporalmente el tejido dimensional.
3. **Sobrevivir a la travesía**: Resistir la corrosión del no-espacio interplanar mientras viaja de un Fragmento a otro.

> "No cruzamos el vacío porque seamos más veloces; lo cruzamos porque recordamos que antes del Quebranto todos los mundos eran uno."
> — *Iria de los Mil Ecos, Caminante del Velo*

## Cartografía y Registro de Nexos

En los códices del juego, los archivistas emplean la notación de doble corchete para registrar nexos activos en el mapa planar:

- **Nexo directo registrado**: [[la-red-de-ideas]] (muestra automáticamente el título y enlaza con la crónica del plano).
- **Tránsito hacia planos conocidos**: [[Jardines Digitales]] (resuelve el vínculo sin importar mayúsculas o espacios).
- **Rutas con denominación local**: [[el-arte-de-conectar|La Puerta de las Tormentas Planares]].
- **Grietas hacia planos perdidos**: [[vacio-entropico]] (se destaca como senda inexplorada o peligrosa).

Cuando un grupo de aventureros cruza un nexo, la aventura cambia de escala: las reglas mágicas, las facciones y las amenazas del nuevo Fragmento exigen adaptarse a una realidad completamente nueva. Para comprender el origen de estas fracturas, consulta las crónicas de [[la-red-de-ideas]].
`,
  },
];

mkdirSync(BLOG_DIR, { recursive: true });

let created = 0;
let skipped = 0;

for (const post of posts) {
  const target = join(BLOG_DIR, post.file);
  if (existsSync(target) && !force) {
    console.log(`[skip] ${post.file} ya existe (usa --force para sobrescribir)`);
    skipped += 1;
    continue;
  }

  const content = [
    '---',
    `title: ${JSON.stringify(post.frontmatter.title)}`,
    `date: ${JSON.stringify(post.frontmatter.date)}`,
    `cover_image: ${JSON.stringify(post.frontmatter.cover_image)}`,
    `description: ${JSON.stringify(post.frontmatter.description)}`,
    `tags: ${JSON.stringify(post.frontmatter.tags)}`,
    '---',
    post.body.trim(),
    '',
  ].join('\n');

  writeFileSync(target, content, 'utf8');
  console.log(`[write] ${post.file}`);
  created += 1;
}

console.log(`\nListo: ${created} creados, ${skipped} omitidos.`);
