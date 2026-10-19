// Genera 3 artículos Markdown de prueba en src/content/blog, interconectados
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
      title: 'La red de ideas',
      date: '2026-09-02',
      cover_image: 'https://picsum.photos/seed/red-de-ideas/1920/1200',
      description: 'Lorem ipsum dolor sit amet: cómo una nota aislada se convierte en un nodo dentro de una red viva.',
      tags: ['conocimiento', 'notas'],
    },
    body: `
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante venenatis dapibus posuere velit aliquet. Cras mattis consectetur purus sit amet fermentum. Si quieres ver cómo crece esta idea, continúa en [[jardines-digitales]].

## Nodos y conexiones

Vestibulum id ligula porta felis euismod semper. Donec ullamcorper nulla non metus auctor fringilla. Maecenas sed diam eget risus varius blandit sit amet non magna. Nullam quis risus eget urna mollis ornare vel eu leo.

> Curabitur blandit tempus porttitor. Una nota sin enlaces es una isla; una nota enlazada es un puerto.

Aenean lacinia bibendum nulla sed consectetur. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. El método completo está descrito en [[el-arte-de-conectar|el arte de conectar]].

## Lorem en tres pasos

1. Etiam porta sem malesuada magna mollis euismod.
2. Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh.
3. Donec sed odio dui, consulta también [[Jardines Digitales]] (enlace escrito con espacios y mayúsculas).

Morbi leo risus, porta ac consectetur ac, vestibulum at eros. Este enlace apunta a una nota que todavía no existe: [[nota-pendiente]].
`,
  },
  {
    file: 'jardines-digitales.md',
    frontmatter: {
      title: 'Jardines digitales',
      date: '2026-09-18',
      cover_image: 'https://picsum.photos/seed/jardines-digitales/1920/1200',
      description: 'Sed posuere consectetur est at lobortis: cultivar notas que crecen, se podan y florecen con el tiempo.',
      tags: ['escritura', 'jardín'],
    },
    body: `
Sed posuere consectetur est at lobortis. Nulla vitae elit libero, a pharetra augue. Todo jardín empieza con una semilla, y la nuestra se plantó en [[la-red-de-ideas]].

## Sembrar

Donec id elit non mi porta gravida at eget metus. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Etiam porta sem malesuada magna mollis euismod.

- Maecenas faucibus mollis interdum.
- Cras justo odio, dapibus ac facilisis in, egestas eget quam.
- Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor.

## Podar y regar

Integer posuere erat a ante venenatis dapibus posuere velit aliquet. Duis mollis, est non commodo luctus, nisi erat porttitor ligula, eget lacinia odio sem nec elit. Para aprender a regar las conexiones, lee [[el-arte-de-conectar]].

\`\`\`text
semilla → brote → nota perenne → red
\`\`\`

Nullam id dolor id nibh ultricies vehicula ut id elit. Vestibulum id ligula porta felis euismod semper.
`,
  },
  {
    file: 'el-arte-de-conectar.md',
    frontmatter: {
      title: 'El arte de conectar',
      date: '2026-10-05',
      cover_image: 'https://picsum.photos/seed/arte-de-conectar/1920/1200',
      description: 'Vivamus sagittis lacus vel augue: enlazar ideas con dobles corchetes para tejer una red de conocimiento.',
      tags: ['método', 'enlaces'],
    },
    body: `
Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. Cada enlace es un hilo: este conecta con [[la-red-de-ideas|el origen de la red]] y este otro con [[jardines-digitales|el jardín de notas]].

## La sintaxis y enlaces activos

Cras mattis consectetur purus sit amet fermentum. Al escribir el nombre del archivo entre dobles corchetes, Astro lo procesa automáticamente para que sea un enlace HTML clicable y sin los corchetes:

- **Enlace directo por nombre de archivo**: [[la-red-de-ideas]] (muestra el título del artículo de destino y navega a su página).
- **Enlace con mayúsculas o espacios**: [[Jardines Digitales]].
- **Enlace con alias personalizado**: [[el-arte-de-conectar|este mismo artículo con un texto a medida]].
- **Enlace a nota futura**: [[nota-pendiente]] (se marca como referencia pendiente si aún no existe el archivo).

## Tejer

Aenean eu leo quam. Pellentesque ornare sem lacinia quam venenatis vestibulum. Maecenas sed diam eget risus varius blandit sit amet non magna. Donec ullamcorper nulla non metus auctor fringilla.

> Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus.

Etiam porta sem malesuada magna mollis euismod. Cum sociis natoque penatibus et magnis dis parturient montes. Vuelve al principio en [[la-red-de-ideas]].
`,
  },
];

/** Serializa un objeto plano a frontmatter YAML. */
function toFrontmatter(data) {
  const lines = Object.entries(data).map(([key, value]) => {
    if (Array.isArray(value)) return `${key}: [${value.map((v) => JSON.stringify(v)).join(', ')}]`;
    return `${key}: ${JSON.stringify(value)}`;
  });
  return `---\n${lines.join('\n')}\n---\n`;
}

mkdirSync(BLOG_DIR, { recursive: true });

for (const post of posts) {
  const target = join(BLOG_DIR, post.file);
  if (existsSync(target) && !force) {
    console.log(`• Omitido (ya existe): ${post.file}`);
    continue;
  }
  writeFileSync(target, `${toFrontmatter(post.frontmatter)}${post.body}`, 'utf8');
  console.log(`✔ Generado: ${post.file}`);
}
