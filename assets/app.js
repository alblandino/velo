/* Velo · documentación — comportamiento de la página.
   Sin dependencias. Todo es mejora progresiva: sin JS el documento se lee entero. */
(function () {
  'use strict';

  const doc = document.documentElement;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* almacenamiento no disponible */ } },
  };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- Tema (solo donde hay interruptor) ---------- */
  const themeKey = 'velo-docs:tema';
  const savedTheme = store.get(themeKey);
  if (savedTheme === 'light' || savedTheme === 'dark') doc.dataset.theme = savedTheme;
  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    const sync = () => {
      const dark = doc.dataset.theme ? doc.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
      btn.setAttribute('aria-pressed', String(dark));
      btn.setAttribute('aria-label', dark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro');
    };
    sync();
    btn.addEventListener('click', () => {
      const dark = btn.getAttribute('aria-pressed') === 'true';
      doc.dataset.theme = dark ? 'light' : 'dark';
      store.set(themeKey, doc.dataset.theme);
      sync();
    });
  });

  /* ---------- Índice: sección actual y "donde lo dejaste" ---------- */
  const sections = Array.from(document.querySelectorAll('.sec[id]'));
  const tocLinks = Array.from(document.querySelectorAll('[data-toc] a[href^="#"]'));
  const linksFor = (id) => tocLinks.filter((a) => a.getAttribute('href') === `#${id}`);
  const lastKey = 'velo-docs:ultima';
  const lastId = store.get(lastKey);

  if (lastId && sections.length && lastId !== sections[0].id && document.getElementById(lastId)) {
    linksFor(lastId).forEach((a) => {
      a.classList.add('left-here');
      a.setAttribute('title', 'Aquí lo dejaste la última vez');
    });
    const sec = document.getElementById(lastId);
    document.querySelectorAll('[data-resume]').forEach((el) => {
      const link = el.querySelector('a') || el;
      link.setAttribute('href', `#${lastId}`);
      const label = el.querySelector('[data-resume-t]');
      if (label) label.textContent = sec.dataset.title;
      el.hidden = false;
    });
  }

  let current = null;
  const running = document.querySelectorAll('[data-running]');
  function updateCurrent() {
    const line = Math.min(window.innerHeight * 0.3, 240);
    let found = sections[0];
    for (const s of sections) {
      if (s.getBoundingClientRect().top - line <= 0) found = s;
      else break;
    }
    if (!found || found === current) return;
    current = found;
    tocLinks.forEach((a) => a.removeAttribute('aria-current'));
    linksFor(found.id).forEach((a) => a.setAttribute('aria-current', 'location'));
    running.forEach((el) => {
      const n = el.querySelector('[data-running-n]');
      const t = el.querySelector('[data-running-t]');
      if (n) n.textContent = found.dataset.n;
      if (t) t.textContent = found.dataset.title;
    });
    document.querySelectorAll('[data-toc-scroll]').forEach((box) => {
      const a = box.querySelector('[aria-current]');
      if (!a) return;
      const r = a.getBoundingClientRect();
      const b = box.getBoundingClientRect();
      if (r.top < b.top + 40 || r.bottom > b.bottom - 40) box.scrollTop += r.top - b.top - b.height / 3;
    });
  }
  let ticking = false;
  let saveTimer = 0;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(() => { ticking = false; updateCurrent(); });
    }
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { if (current) store.set(lastKey, current.id); }, 600);
  }, { passive: true });
  updateCurrent();

  /* ---------- Navegación móvil ---------- */
  document.querySelectorAll('[data-nav-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      doc.classList.toggle('nav-open', open);
    });
  });
  tocLinks.forEach((a) => a.addEventListener('click', () => {
    doc.classList.remove('nav-open');
    document.querySelectorAll('[data-nav-toggle]').forEach((b) => b.setAttribute('aria-expanded', 'false'));
  }));

  /* ---------- Copiar bloques ---------- */
  document.querySelectorAll('pre.term, pre.code').forEach((pre) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'copy';
    btn.textContent = 'Copiar';
    btn.setAttribute('aria-label', 'Copiar este bloque');
    btn.addEventListener('click', async () => {
      let text = pre.querySelector('code').innerText;
      if (pre.classList.contains('term')) {
        const cmds = text.split('\n').filter((l) => l.startsWith('$ ')).map((l) => l.slice(2).replace(/\s+#.*$/, ''));
        if (cmds.length) text = cmds.join('\n');
      }
      try {
        await navigator.clipboard.writeText(text);
        btn.textContent = 'Copiado';
      } catch (e) {
        btn.textContent = 'No se pudo copiar';
      }
      setTimeout(() => { btn.textContent = 'Copiar'; }, 1600);
    });
    pre.appendChild(btn);
  });

  /* ---------- Filtro de la referencia de comandos ---------- */
  document.querySelectorAll('[data-filter]').forEach((input) => {
    const table = document.querySelector(input.dataset.filter);
    if (!table) return;
    const empty = document.querySelector('[data-filter-empty]');
    const rows = Array.from(table.querySelectorAll('tbody tr'));
    const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    input.addEventListener('input', () => {
      const q = norm(input.value.trim());
      let visible = 0;
      let group = null;
      const groupHasRows = new Map();
      rows.forEach((tr) => {
        if (tr.classList.contains('grp')) { group = tr; groupHasRows.set(tr, false); return; }
        const hit = !q || norm(tr.textContent).includes(q);
        tr.hidden = !hit;
        if (hit) { visible++; if (group) groupHasRows.set(group, true); }
      });
      groupHasRows.forEach((has, tr) => { tr.hidden = !has; });
      if (empty) empty.hidden = visible > 0;
    });
  });

  /* ---------- Búsqueda ---------- */
  document.querySelectorAll('[data-search]').forEach((wrap) => {
    const input = wrap.querySelector('input');
    const list = wrap.querySelector('[data-search-results]');
    const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const index = [];
    sections.forEach((s) => {
      index.push({ t: s.dataset.title, href: `#${s.id}`, k: 'Sección' });
      s.querySelectorAll('h3[id]').forEach((h) => index.push({ t: h.querySelector('.st').textContent, href: `#${h.id}`, k: s.dataset.title }));
    });
    document.querySelectorAll('#tabla-comandos tbody tr:not(.grp)').forEach((tr) => {
      const name = tr.querySelector('code').textContent.split(' ')[0];
      index.push({ t: name, href: '#comandos', k: 'Comando', d: tr.cells[2].textContent });
    });
    let active = -1;
    let hits = [];
    const render = () => {
      const q = norm(input.value.trim());
      hits = q ? index.filter((e) => norm(`${e.t} ${e.d || ''}`).includes(q)).slice(0, 8) : [];
      active = hits.length ? 0 : -1;
      list.innerHTML = hits.map((h, i) => `<li role="option" id="sr-${i}" aria-selected="${i === active}"><a href="${h.href}"><span class="sr-t">${esc(h.t)}</span><span class="sr-k">${esc(h.k)}</span></a></li>`).join('')
        || (q ? '<li class="sr-none">Sin resultados</li>' : '');
      list.hidden = !q;
      input.setAttribute('aria-expanded', String(Boolean(q)));
      if (active >= 0) input.setAttribute('aria-activedescendant', `sr-${active}`);
      else input.removeAttribute('aria-activedescendant');
    };
    const go = (i) => {
      const h = hits[i];
      if (!h) return;
      location.hash = h.href;
      if (h.k === 'Comando') {
        const f = document.getElementById('cmd-filter');
        if (f) { f.value = h.t; f.dispatchEvent(new Event('input')); }
      }
      input.value = '';
      render();
      input.blur();
    };
    input.addEventListener('input', render);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!hits.length) return;
        active = (active + (e.key === 'ArrowDown' ? 1 : hits.length - 1)) % hits.length;
        list.querySelectorAll('[role=option]').forEach((li, i) => li.setAttribute('aria-selected', String(i === active)));
        input.setAttribute('aria-activedescendant', `sr-${active}`);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        go(active);
      } else if (e.key === 'Escape') {
        input.value = '';
        render();
      }
    });
    list.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if (!a) return;
      const i = Array.from(list.querySelectorAll('a')).indexOf(a);
      e.preventDefault();
      go(i);
    });
    document.addEventListener('keydown', (e) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); input.focus(); }
      if (e.key === '/' && document.activeElement === document.body) { e.preventDefault(); input.focus(); }
    });
  });

  /* ---------- Simulador de Velo en el navegador ---------- */
  const MSG = {
    desconocido: "comando desconocido: '{comando}'",
    args: 'numero de argumentos incorrecto para el comando {comando}',
    pares: 'numero de argumentos incorrecto para el comando {comando} (se requieren pares clave-valor)',
    tipo: 'la operacion no es compatible con el tipo almacenado en esta clave',
    noEntero: 'el valor no es un entero o esta fuera del rango permitido',
    expNeg: 'el tiempo de expiracion no puede ser negativo',
    expPos: 'el tiempo de expiracion debe ser un entero positivo mayor que cero',
    optPos: 'el valor de {opcion} debe ser un entero positivo',
    optTs: 'el valor de {opcion} debe ser un timestamp unix positivo',
    optTsMs: 'el valor de {opcion} debe ser un timestamp unix en ms positivo',
    optDesc: 'opcion desconocida: {opcion}',
    optDescPara: 'opcion desconocida para {comando}: {opcion}',
    excl: 'las opciones {a} y {b} son mutuamente exclusivas',
    noClave: 'no existe la clave',
    dbRango: 'el indice de base de datos esta fuera de rango. Rango valido: 0 a {ultima}',
    vacio: 'comando vacio',
  };
  const fmt = (k, p = {}) => MSG[k].replace(/\{(\w+)\}/g, (m, n) => (p[n] !== undefined ? String(p[n]) : m));
  const E = (k, p) => ({ err: `ERR ${fmt(k, p)}` });
  const EA = (c) => E('args', { comando: c });
  const ET = () => ({ err: `WRONGTYPE ${fmt('tipo')}` });
  const OK = { ok: 'OK' };
  const DB_COUNT = 16;

  function createVelo() {
    const bases = Array.from({ length: DB_COUNT }, () => new Map());
    const expired = (e) => e.exp !== null && Date.now() >= e.exp;
    const S = {
      get(db, k) { const b = bases[db]; const e = b.get(k); if (!e) return null; if (expired(e)) { b.delete(k); return null; } return e; },
      set(db, k, e) { bases[db].set(k, e); },
      del(db, keys) { let n = 0; keys.forEach((k) => { if (bases[db].delete(k)) n++; }); return n; },
      exists(db, k) { return S.get(db, k) !== null; },
      keys(db, pat) {
        const re = new RegExp(`^${pat.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.')}$`, 'i');
        const out = [];
        for (const [k, e] of bases[db]) { if (expired(e)) { bases[db].delete(k); continue; } if (re.test(k)) out.push(k); }
        return out;
      },
      dbsize(db) { let n = 0; for (const [k, e] of bases[db]) { if (expired(e)) bases[db].delete(k); else n++; } return n; },
    };
    const entry = (value, exp = null) => ({ value, type: 'string', exp });
    const ttlS = (e) => (e.exp === null ? -1 : expired(e) ? -2 : Math.ceil((e.exp - Date.now()) / 1000));
    const bytes = (s) => new TextEncoder().encode(s).length;
    const counter = (name, delta) => (a, db) => {
      if (a.length !== 1) return EA(name);
      const e = S.get(db, a[0]);
      if (e && e.type !== 'string') return ET();
      const cur = e ? e.value : '0';
      const n = parseInt(cur, 10);
      if (isNaN(n) || String(n) !== cur) return E('noEntero');
      S.set(db, a[0], entry(String(n + delta), e ? e.exp : null));
      return n + delta;
    };

    const C = {
      SET(a, db) {
        if (a.length < 2) return EA('SET');
        const [k, v] = a;
        let exp = null; let nx = false; let xx = false;
        for (let i = 2; i < a.length; i++) {
          const o = a[i].toUpperCase();
          if (o === 'EX') { const s = parseInt(a[++i], 10); if (isNaN(s) || s <= 0) return E('optPos', { opcion: 'EX' }); exp = Date.now() + s * 1000; }
          else if (o === 'PX') { const ms = parseInt(a[++i], 10); if (isNaN(ms) || ms <= 0) return E('optPos', { opcion: 'PX' }); exp = Date.now() + ms; }
          else if (o === 'NX') nx = true;
          else if (o === 'XX') xx = true;
          else return E('optDesc', { opcion: a[i] });
        }
        if (nx && xx) return E('excl', { a: 'NX', b: 'XX' });
        const ex = S.exists(db, k);
        if ((nx && ex) || (xx && !ex)) return null;
        S.set(db, k, entry(v, exp));
        return OK;
      },
      GET(a, db) { if (a.length !== 1) return EA('GET'); const e = S.get(db, a[0]); if (!e) return null; if (e.type !== 'string') return ET(); return e.value; },
      DEL(a, db) { if (!a.length) return EA('DEL'); return S.del(db, a); },
      EXISTS(a, db) { if (!a.length) return EA('EXISTS'); return a.filter((k) => S.exists(db, k)).length; },
      EXPIRE(a, db) {
        if (a.length !== 2) return EA('EXPIRE');
        const s = parseInt(a[1], 10);
        if (isNaN(s)) return E('noEntero');
        if (s < 0) return E('expNeg');
        const e = S.get(db, a[0]); if (!e) return 0;
        e.exp = Date.now() + s * 1000; return 1;
      },
      TTL(a, db) { if (a.length !== 1) return EA('TTL'); const e = S.get(db, a[0]); return e ? ttlS(e) : -2; },
      INCR: counter('INCR', 1),
      DECR: counter('DECR', -1),
      MGET(a, db) { if (!a.length) return EA('MGET'); return a.map((k) => { const e = S.get(db, k); return !e || e.type !== 'string' ? null : e.value; }); },
      MSET(a, db) { if (!a.length || a.length % 2) return E('pares', { comando: 'MSET' }); for (let i = 0; i < a.length; i += 2) S.set(db, a[i], entry(a[i + 1])); return OK; },
      APPEND(a, db) {
        if (a.length !== 2) return EA('APPEND');
        const e = S.get(db, a[0]); if (e && e.type !== 'string') return ET();
        const v = (e ? e.value : '') + a[1];
        S.set(db, a[0], entry(v, e ? e.exp : null)); return bytes(v);
      },
      STRLEN(a, db) { if (a.length !== 1) return EA('STRLEN'); const e = S.get(db, a[0]); if (!e) return 0; if (e.type !== 'string') return ET(); return bytes(e.value); },
      SETNX(a, db) { if (a.length !== 2) return EA('SETNX'); if (S.exists(db, a[0])) return 0; S.set(db, a[0], entry(a[1])); return 1; },
      SETEX(a, db) {
        if (a.length !== 3) return EA('SETEX');
        const s = parseInt(a[1], 10); if (isNaN(s) || s <= 0) return E('expPos');
        S.set(db, a[0], entry(a[2], Date.now() + s * 1000)); return OK;
      },
      GETEX(a, db) {
        if (!a.length) return EA('GETEX');
        const e = S.get(db, a[0]); if (!e) return null; if (e.type !== 'string') return ET();
        if (a.length === 1) return e.value;
        const o = a[1].toUpperCase(); const n = parseInt(a[2], 10);
        if (o === 'EX') { if (isNaN(n) || n <= 0) return E('optPos', { opcion: 'EX' }); e.exp = Date.now() + n * 1000; }
        else if (o === 'PX') { if (isNaN(n) || n <= 0) return E('optPos', { opcion: 'PX' }); e.exp = Date.now() + n; }
        else if (o === 'EXAT') { if (isNaN(n) || n <= 0) return E('optTs', { opcion: 'EXAT' }); e.exp = n * 1000; }
        else if (o === 'PXAT') { if (isNaN(n) || n <= 0) return E('optTsMs', { opcion: 'PXAT' }); e.exp = n; }
        else if (o === 'PERSIST') e.exp = null;
        else return E('optDescPara', { comando: 'GETEX', opcion: a[1] });
        return e.value;
      },
      PING(a) { return a.length ? a.join(' ') : { ok: 'PONG' }; },
      ECHO(a) { return a.length !== 1 ? EA('ECHO') : a[0]; },
      DBSIZE(a, db) { return a.length ? EA('DBSIZE') : S.dbsize(db); },
      FLUSHALL() { bases.forEach((b) => b.clear()); return OK; },
      KEYS(a, db) { return a.length !== 1 ? EA('KEYS') : S.keys(db, a[0]); },
      TYPE(a, db) { if (a.length !== 1) return EA('TYPE'); const e = S.get(db, a[0]); return { ok: e ? e.type : 'none' }; },
      RENAME(a, db) {
        if (a.length !== 2) return EA('RENAME');
        const e = S.get(db, a[0]); if (!e) return E('noClave');
        S.set(db, a[1], e); S.del(db, [a[0]]); return OK;
      },
      SELECT(a) {
        if (a.length !== 1) return EA('SELECT');
        const i = parseInt(a[0], 10);
        if (isNaN(i) || i < 0 || i >= DB_COUNT) return E('dbRango', { ultima: DB_COUNT - 1 });
        return { nuevoDb: i };
      },
    };
    return {
      exec(tokens, db) {
        if (!tokens.length) return { err: `ERR ${fmt('vacio')}` };
        const name = tokens[0].toUpperCase();
        const h = C[name];
        if (!h) return E('desconocido', { comando: name.toLowerCase() });
        return h(tokens.slice(1), db);
      },
    };
  }

  function tokenize(line) {
    const out = []; let tok = ''; let q = '';
    for (const ch of line.trim()) {
      if ((ch === '"' || ch === "'") && !q) q = ch;
      else if (ch === q) q = '';
      else if (ch === ' ' && !q) { if (tok) { out.push(tok); tok = ''; } }
      else tok += ch;
    }
    if (tok) out.push(tok);
    return out;
  }

  const blen = (s) => new TextEncoder().encode(s).length;
  const bulk = (s) => `$${blen(s)}\r\n${s}\r\n`;
  function respOf(v) {
    if (v === null || v === undefined) return '$-1\r\n';
    if (Array.isArray(v)) return `*${v.length}\r\n${v.map(respOf).join('')}`;
    if (typeof v === 'object' && 'ok' in v) return `+${v.ok}\r\n`;
    if (typeof v === 'object' && 'err' in v) return `-${/^[A-Z]+\s/.test(v.err) ? v.err : `ERR ${v.err}`}\r\n`;
    if (typeof v === 'number') return `:${v}\r\n`;
    return bulk(String(v));
  }
  const wireHtml = (s) => esc(s).replace(/\r\n/g, '<span class="crlf">\\r\\n</span><wbr>');
  function pretty(v, lvl = 0) {
    if (v === null) return { k: 'nil', t: '(nil)' };
    if (typeof v === 'object' && !Array.isArray(v) && 'err' in v) return { k: 'err', t: `(error) ${v.err}` };
    if (typeof v === 'object' && !Array.isArray(v) && 'ok' in v) return { k: 'ok', t: v.ok };
    if (typeof v === 'number') return { k: 'int', t: `(integer) ${v}` };
    if (typeof v === 'string') return { k: 'str', t: `"${v}"` };
    if (Array.isArray(v)) {
      if (!v.length) return { k: 'arr', t: '(array vacio)' };
      const pad = '   '.repeat(lvl);
      return { k: 'arr', t: v.map((x, i) => `${pad}${i + 1}) ${pretty(x, lvl + 1).t}`).join('\n') };
    }
    return { k: 'str', t: String(v) };
  }

  document.querySelectorAll('[data-repl]').forEach((root) => {
    const velo = createVelo();
    const log = root.querySelector('[data-repl-log]');
    const form = root.querySelector('[data-repl-form]');
    const input = root.querySelector('[data-repl-input]');
    const dbEl = root.querySelector('[data-repl-db]');
    let db = 0;
    const hist = [];
    let hi = 0;

    function run(line, quiet) {
      const tokens = tokenize(line);
      if (!tokens.length) return;
      if (tokens.length === 1 && tokens[0].toLowerCase() === 'clear') { log.innerHTML = ''; return; }
      const req = `*${tokens.length}\r\n${tokens.map(bulk).join('')}`;
      let res = velo.exec(tokens, db);
      const prompt = `velo 127.0.0.1:6380[${db}]&gt;`;
      if (res && typeof res === 'object' && 'nuevoDb' in res) { db = res.nuevoDb; res = OK; dbEl.textContent = String(db); }
      const wire = respOf(res);
      const p = pretty(res);
      const ex = document.createElement('div');
      ex.className = 'ex';
      ex.innerHTML =
        `<div class="ex-in"><span class="ex-p">${prompt}</span> <span class="ex-c">${esc(line.trim())}</span></div>` +
        `<div class="ex-wire ex-req"><span class="ex-dir">envía</span><code>${wireHtml(req)}</code><span class="ex-b">${blen(req)} bytes</span></div>` +
        `<div class="ex-wire ex-res"><span class="ex-dir">recibe</span><code>${wireHtml(wire)}</code><span class="ex-b">${blen(wire)} bytes</span></div>` +
        `<pre class="ex-out" data-kind="${p.k}">${esc(p.t)}</pre>`;
      log.appendChild(ex);
      while (log.children.length > 40) log.removeChild(log.firstChild);
      if (!quiet) log.scrollTop = log.scrollHeight;
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const line = input.value;
      if (!line.trim()) return;
      hist.push(line);
      hi = hist.length;
      run(line);
      input.value = '';
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp' && hi > 0) { e.preventDefault(); input.value = hist[--hi]; }
      if (e.key === 'ArrowDown') { e.preventDefault(); hi = Math.min(hist.length, hi + 1); input.value = hist[hi] || ''; }
    });
    root.querySelectorAll('[data-cmd]').forEach((b) => b.addEventListener('click', () => {
      run(b.dataset.cmd);
      hist.push(b.dataset.cmd);
      hi = hist.length;
    }));
    const clear = root.querySelector('[data-repl-clear]');
    if (clear) clear.addEventListener('click', () => { log.innerHTML = ''; input.focus(); });

    run('SET saludo hola', true);
  });
})();
