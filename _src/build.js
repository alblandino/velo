#!/usr/bin/env node
// Ensambla la documentación: _src/content.html dentro de _src/pagina.html -> index.html
// Sin dependencias, igual que Velo:  node _src/build.js
'use strict';

const fs = require('fs');
const path = require('path');

const SRC = __dirname;
const OUT = path.resolve(SRC, '..', 'index.html');

const slug = (s) => s
  .replace(/<[^>]+>/g, '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const strip = (s) => s.replace(/<[^>]+>/g, '');

const raw = fs.readFileSync(path.join(SRC, 'content.html'), 'utf-8');

// 1. Secciones: ancla "#" y datos para el índice
const secRe = /<section class="sec" id="([^"]+)" data-group="([^"]+)">\s*<h2>([\s\S]*?)<\/h2>/g;
const sections = [];
for (const m of raw.matchAll(secRe)) sections.push({ id: m[1], group: m[2], title: m[3] });
const byId = Object.fromEntries(sections.map((s, i) => [s.id, { ...s, n: i + 1 }]));

let n = 0;
let html = raw.replace(secRe, (_, id, group, title) => {
  n++;
  return `<section class="sec" id="${id}" data-n="${n}" data-title="${strip(title)}"><h2><span class="st">${title}</span><a class="anchor" href="#${id}" aria-label="Enlace a esta sección">#</a></h2>`;
});

// 2. Apartados (h3) con id estable
html = html.replace(/<section class="sec" id="([^"]+)"([\s\S]*?)<\/section>/g, (block, id) =>
  block.replace(/<h3>([\s\S]*?)<\/h3>/g, (_, t) => `<h3 id="${id}-${slug(t)}"><span class="st">${t}</span></h3>`));

// 3. Referencias cruzadas: <a class="xref" href="#id"></a> toma el título de la sección
html = html.replace(/<a class="xref" href="#([^"]+)"><\/a>/g, (_, id) => {
  const s = byId[id];
  if (!s) throw new Error(`xref rota: #${id}`);
  return `<a class="xref" href="#${id}">${strip(s.title)}</a>`;
});

// 4. Figuras y tablas numeradas
let fig = 0;
let tab = 0;
html = html.replace(/<span class="fn">(Figura|Tabla)<\/span>\s*/g, (_, kind) =>
  `<span class="fn">${kind} ${kind === 'Figura' ? ++fig : ++tab}</span> `);

// 5. Hace visibles los \r\n dentro de los bytes de ejemplo
html = html.replace(/<code class="wire">([\s\S]*?)<\/code>/g, (_, inner) =>
  `<code class="wire">${inner.replace(/\\r\\n/g, '<span class="crlf">\\r\\n</span><wbr>')}</code>`);

// 6. Menú lateral agrupado
const groups = [];
for (const s of sections) {
  let g = groups.find((x) => x.name === s.group);
  if (!g) groups.push((g = { name: s.group, items: [] }));
  g.items.push(s);
}
const toc = groups.map((g) => `<div class="nav-group"><p class="nav-h">${g.name}</p><ul>${g.items.map((s) => `<li><a href="#${s.id}">${strip(s.title)}</a></li>`).join('')}</ul></div>`).join('\n');

const out = fs.readFileSync(path.join(SRC, 'pagina.html'), 'utf-8')
  .replace('{{TOC_GROUPED}}', toc)
  .replace('{{CONTENT}}', html);

fs.writeFileSync(OUT, out);
console.log(`index.html  ${sections.length} secciones · ${fig} figuras · ${tab} tablas`);
