/* Website-Editor (vereinfacht): Seite, Design, Einstellungen. Speichert automatisch. */
(function () {
  var A = window.SiteAPI, K = window.Kit;
  var D = null, MODE = 'demo', dirty = false, TAB = 'page', OPEN = null, OPEN_EL = null, PICK = null;
  var hist = [], fut = [], histTimer = null, prevTimer = null, saveTimer = null, frameReady = false, saving = false;
  var open = {};            // welche Unterpunkte aufgeklappt sind
  var PATH = new WeakMap(); // Pfad jedes bearbeiteten Objekts, damit ein Klick in der Vorschau das passende Feld findet
  function tagP(node, path) { if (node && node.setAttribute) node.setAttribute('data-path', path); return node; }
  function advKey(path, fields) { return 'adv:' + path + ':' + fields.filter(function (f) { return f.adv; }).map(function (f) { return f.k; }).join(); }
  var $ = function (id) { return document.getElementById(id); };
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  var AUTOSAVE = ls('jr-autosave') !== '0';

  // ---------- DOM-Hilfe ----------
  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      var v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k === 'text') e.textContent = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), v);
      else if (k === 'style') e.setAttribute('style', v);
      else if (k === 'value') e.value = v;
      else if (k in e && typeof v !== 'string') e[k] = v;
      else e.setAttribute(k, v === true ? '' : v);
    }
    (kids || []).forEach(function (c) { if (c == null || c === false) return; e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }
  function toast(msg, isErr) { var t = $('toast'); t.textContent = msg; t.className = 'toast' + (isErr ? ' err' : ''); t.hidden = false; clearTimeout(t._h); t._h = setTimeout(function () { t.hidden = true; }, isErr ? 6000 : 2400); }
  function setStatus(txt, cls) { var s = $('status'); s.textContent = txt; s.className = 'status' + (cls ? ' ' + cls : ''); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function moveTo(arr, from, to) { if (from === to || from < 0) return; var x = arr.splice(from, 1)[0]; arr.splice(to > from ? to - 1 : to, 0, x); }
  function armDelete(btn, fn) {
    if (btn.classList.contains('armed')) { fn(); return; }
    btn.classList.add('armed'); var old = btn.textContent; btn.textContent = 'Wirklich löschen?';
    setTimeout(function () { if (btn.isConnected) { btn.classList.remove('armed'); btn.textContent = old; } }, 3000);
  }
  function sec(id) { return D.sections.filter(function (s) { return s.id === id; })[0]; }
  function secName(s) { return RT.plain(secName0(s)); }
  function secName0(s) {
    if (s.type === 'free') { var h = (s.elements || []).filter(function (e) { return e.text || e.title; })[0]; return s.navLabel || (h ? (h.title || h.text).slice(0, 40) : 'Freier Bereich'); }
    if (s.type === 'hero' || s.type === 'contact') return ((s.title || '') + ' ' + (s.highlight || '')).trim() || K.TYPES[s.type].label;
    return s.title || s.navLabel || K.TYPES[s.type].label;
  }
  var ICON = { hero: '▣', films: '▶', video: '▶', photos: '▦', text: '¶', textImage: '◧', services: '☰', steps: '→', quote: '„', cta: '!', logos: '★', contact: '@', spacer: '↕', free: '+' };

  // ---------- Ziehen zum Sortieren ----------
  // rows: Elemente mit data-i; Griff: [data-handle]. Funktioniert mit Maus und Touch-Pads (HTML5 Drag & Drop).
  function sortable(container, arr, done, horizontal) {
    var from = -1;
    [].forEach.call(container.querySelectorAll(':scope > [data-i]'), function (row) {
      var i = +row.getAttribute('data-i');
      var h = row.querySelector('[data-handle]') || row;
      h.setAttribute('draggable', 'true');
      h.addEventListener('dragstart', function (e) { from = i; row.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', String(i)); e.dataTransfer.setDragImage(row, 20, 20); } catch (x) {} });
      h.addEventListener('dragend', function () { row.classList.remove('dragging'); clear(); from = -1; });
      row.addEventListener('dragover', function (e) {
        if (from < 0) return; e.preventDefault();
        var r = row.getBoundingClientRect(), after = horizontal ? (e.clientX > r.left + r.width / 2) : (e.clientY > r.top + r.height / 2);
        clear(); row.classList.add(after ? 'drop-after' : 'drop-before'); row._after = after;
      });
      row.addEventListener('drop', function (e) {
        if (from < 0) return; e.preventDefault();
        var to = i + (row._after ? 1 : 0); clear(); moveTo(arr, from, to); from = -1; done();
      });
    });
    function clear() { [].forEach.call(container.querySelectorAll('.drop-before,.drop-after'), function (x) { x.classList.remove('drop-before', 'drop-after'); }); }
  }

  // ---------- Änderungen, Verlauf, Vorschau, Auto-Speichern ----------
  function changed(opts) {
    dirty = true; if (typeof updPub === 'function') try { updPub(); } catch (x) {}
    setStatus(AUTOSAVE ? 'Änderung …' : '● Nicht gespeichert', 'dirty');
    clearTimeout(histTimer); histTimer = setTimeout(snapshot, 500);
    clearTimeout(prevTimer); prevTimer = setTimeout(pushPreview, (opts && opts.now) ? 0 : 120);
    if (AUTOSAVE) { clearTimeout(saveTimer); saveTimer = setTimeout(function () { save(true); }, 1600); }
  }
  var lastSnap = '';
  function snapshot() {
    var s = JSON.stringify(D);
    if (s === lastSnap) return;
    if (lastSnap) { hist.push(lastSnap); if (hist.length > 80) hist.shift(); fut = []; }
    lastSnap = s; updUndo();
  }
  function updUndo() { $('undoBtn').disabled = !hist.length; $('redoBtn').disabled = !fut.length; }
  function undo() { snapshot(); if (!hist.length) return; fut.push(lastSnap); lastSnap = hist.pop(); D = JSON.parse(lastSnap); afterRestore(); toast('Rückgängig gemacht'); }
  function redo() { if (!fut.length) return; hist.push(lastSnap); lastSnap = fut.pop(); D = JSON.parse(lastSnap); afterRestore(); }
  function afterRestore() { if (OPEN && !sec(OPEN)) OPEN = null; updUndo(); renderPane(); changed({ now: true }); }
  function pushPreview() {
    var f = $('frame');
    if (frameReady && f.contentWindow) f.contentWindow.postMessage({ type: 'jr-content', content: D, selected: OPEN, selectedEl: OPEN_EL }, '*');
  }
  function post(m) { var f = $('frame'); if (frameReady && f.contentWindow) f.contentWindow.postMessage(m, '*'); }
  function focusPreview(id) { post({ type: 'jr-focus', id: id }); }
  window.addEventListener('message', function (e) {
    var m = e.data || {};
    if (e.source !== $('frame').contentWindow) return;
    if (m.type === 'jr-ready') { frameReady = true; pushPreview(); if (OPEN) focusPreview(OPEN); }
    if (m.type === 'jr-select' && sec(m.id)) reveal(m);
    if (m.type === 'jr-edit') {
      var r = resolve(m.path); if (!r) return;
      r.obj[r.key] = m.value;
      var node = document.querySelector('[data-path="' + m.path + '"] .rich');
      if (node && document.activeElement !== node) RT.fill(node, m.value, node.classList.contains('ml'));
      changed();
    }
    if (m.type === 'jr-sec-action') secAction(m.id, m.act);
    if (m.type === 'jr-patch') {
      var tg = target(m.path); if (!tg) return;
      for (var pk in m.patch) tg[pk] = m.patch[pk];
      changed({ now: true }); if (!document.activeElement || !document.activeElement.closest('#pane')) renderPane();
    }
    if (m.type === 'jr-remove') {
      var dot = m.path.indexOf('.');
      if (dot >= 0) { var tb = target(m.path); if (tb) tb.label = ''; }
      else { var p = listOf(m.path); if (p) p.list.splice(p.i, 1); }
      changed({ now: true }); renderPane(); toast('Button gelöscht. ⌘Z macht es rückgängig.');
    }
    if (m.type === 'jr-item') {
      var L = listOf(m.base + ':' + m.list + ':' + m.i); if (!L) return;
      var arr = L.list, i0 = L.i;
      if (m.act === 'up' && i0 > 0) moveTo(arr, i0, i0 - 1);
      if (m.act === 'down' && i0 < arr.length - 1) moveTo(arr, i0, i0 + 2);
      if (m.act === 'dup') arr.splice(i0 + 1, 0, clone(arr[i0]));
      if (m.act === 'del') { arr.splice(i0, 1); toast('Gelöscht. ⌘Z macht es rückgängig.'); }
      if (m.act === 'move') moveTo(arr, i0, m.to + (m.after ? 1 : 0));
      changed({ now: true }); renderPane();
    }
    if (m.type === 'jr-el-action') elAction(m.eid, m.act);
    if (m.type === 'jr-insert-at') { TAB = 'page'; OPEN = null; PICK = Math.max(0, Math.min(D.sections.length, m.index)); renderTabs(); renderPane(); $('work').classList.remove('show-preview'); }
    if (m.type === 'jr-add-el' && sec(m.id)) {
      var s0 = sec(m.id); TAB = 'page'; OPEN = m.id; PICK = null;
      open[s0.type === 'free' ? 'g:content' : 'g:extras'] = true; open['elpick:' + m.id] = true;
      renderTabs(); renderPane(); pushPreview(); $('work').classList.remove('show-preview');
      jump(null, '.epick');
    }
    if (m.type === 'jr-move-sec') {
      var from = D.sections.indexOf(sec(m.id)), to = D.sections.indexOf(sec(m.target)) + (m.after ? 1 : 0);
      if (from >= 0) { moveTo(D.sections, from, to); changed({ now: true }); renderPane(); toast('Abschnitt verschoben.'); }
    }
    if (m.type === 'jr-move-el') {
      var src = findEl(m.eid), dst = sec(m.toSid); if (!src || !dst) return;
      var item = src.s.elements.splice(src.i, 1)[0];
      dst.elements = dst.elements || [];
      var at = dst.elements.length;
      if (m.toEid) { for (var k = 0; k < dst.elements.length; k++) if (dst.elements[k].eid === m.toEid) at = k + (m.after ? 1 : 0); }
      dst.elements.splice(at, 0, item);
      changed({ now: true }); renderPane(); toast(src.s === dst ? 'Element verschoben.' : 'Element in anderen Abschnitt verschoben.');
    }
    if (m.type === 'jr-select-site') {
      TAB = 'settings'; OPEN = null; open[m.f === 'ctaLabel' ? 'g:s-menu' : 'g:s-site'] = true;
      renderTabs(); renderPane(); pushPreview(); $('work').classList.remove('show-preview');
      jump('[data-path="site.' + m.f + '"]');
    }
  });



  function findEl(eid) {
    for (var a = 0; a < D.sections.length; a++) { var l = D.sections[a].elements || []; for (var b = 0; b < l.length; b++) if (l[b].eid === eid) return { s: D.sections[a], i: b, el: l[b] }; }
    return null;
  }
  function resolve(path) {
    var dot = path.lastIndexOf('.'), key = path.slice(dot + 1), segs = path.slice(0, dot).split(':');
    var obj = segs[0] === 'site' ? D.site : (sec(segs[0]) || (findEl(segs[0]) || {}).el);
    for (var i = 1; obj && i + 1 < segs.length; i += 2) obj = obj[segs[i]] && obj[segs[i]][+segs[i + 1]];
    return obj ? { obj: obj, key: key } : null;
  }
  // Objekt hinter einem Pfad (z. B. "sid.button1" oder "eid:items:2")
  function target(path) {
    var dot = path.indexOf('.');
    if (dot >= 0) { var r = resolve(path); return r ? (r.obj[r.key] = r.obj[r.key] || {}) : null; }
    var L = listOf(path); return L ? L.list[L.i] : null;
  }
  function listOf(path) {
    var segs = path.split(':'); if (segs.length < 3) return null;
    var obj = sec(segs[0]) || (findEl(segs[0]) || {}).el;
    for (var i = 1; obj && i + 3 < segs.length + 0; i += 2) obj = obj[segs[i]] && obj[segs[i]][+segs[i + 1]];
    var k = segs[segs.length - 2], idx = +segs[segs.length - 1];
    if (!obj || !Array.isArray(obj[k]) || !obj[k][idx]) return null;
    return { list: obj[k], i: idx };
  }
  function secAction(id, act) {
    var s = sec(id), i = D.sections.indexOf(s); if (!s) return;
    if (act === 'up') moveTo(D.sections, i, i - 1);
    if (act === 'down') moveTo(D.sections, i, i + 2);
    if (act === 'dup') { var c = clone(s); c.id = K.uid(); c.navLabel = ''; (c.elements || []).forEach(function (x) { x.eid = K.uid(); }); D.sections.splice(i + 1, 0, c); }
    if (act === 'hide') { s.visible = s.visible === false; toast(s.visible === false ? 'Ausgeblendet. Besucher sehen den Abschnitt nicht mehr.' : 'Wieder eingeblendet.'); }
    if (act === 'del') { D.sections.splice(i, 1); if (OPEN === id) OPEN = null; toast('Abschnitt gelöscht. ⌘Z macht es rückgängig.'); }
    changed({ now: true }); renderPane();
  }
  function elAction(eid, act) {
    var r = findEl(eid); if (!r) return;
    if (act === 'dup') { var c = clone(r.el); c.eid = K.uid(); r.s.elements.splice(r.i + 1, 0, c); }
    if (act === 'up' && r.i > 0) moveTo(r.s.elements, r.i, r.i - 1);
    if (act === 'down' && r.i < r.s.elements.length - 1) moveTo(r.s.elements, r.i, r.i + 2);
    if (act === 'del') { r.s.elements.splice(r.i, 1); toast('Element gelöscht. ⌘Z macht es rückgängig.'); }
    changed({ now: true }); renderPane();
  }

  // ---------- Klick in der Vorschau → passendes Feld öffnen ----------
  function find(arr, fn) { for (var i = 0; i < (arr || []).length; i++) if (fn(arr[i])) return arr[i]; return null; }
  function reveal(m) {
    var s = sec(m.id), T = K.TYPES[s.type];
    TAB = 'page'; OPEN = m.id; PICK = null; OPEN_EL = m.eid || null;
    var obj = m.eid ? find(s.elements, function (x) { return x.eid === m.eid; }) : s;
    if (m.eid && !obj) { obj = s; m.eid = null; }
    var base = m.eid || m.id, fields = m.eid ? K.ELEMENTS[obj.type].fields : T.fields;
    if (m.eid) open['el:' + m.eid] = true;
    var path = base, tf = fields, grp = (m.eid && s.type !== 'free') ? 'extras' : 'content';
    if (m.item != null && m.list) {
      var lf = find(fields, function (f) { return f.k === m.list; });
      if (lf && lf.fields) {
        open['it:' + base + m.list + m.item] = true;
        if (lf.adv) open[advKey(base, fields)] = true;
        path = base + ':' + m.list + ':' + m.item; tf = lf.fields;
      }
    }
    if (m.f) {
      if (find(K.LOOK, function (f) { return f.k === m.f; })) grp = 'look';
      else if (find(K.MENU, function (f) { return f.k === m.f; })) grp = 'menu';
      var fd = find(tf, function (f) { return f.k === m.f; });
      if (fd && fd.adv) open[advKey(path, tf)] = true;
    }
    open['g:' + grp] = true;
    renderTabs(); renderPane(); pushPreview(); $('work').classList.remove('show-preview');
    jump(m.f ? '[data-path="' + path + '.' + m.f + '"]' : null, '[data-path="' + path + '"]', m.inline);
  }
  function jump(sel, fallback, noFocus) {
    setTimeout(function () {
      var node = (sel && document.querySelector(sel)) || (fallback && document.querySelector(fallback));
      if (!node) return;
      node.scrollIntoView({ block: 'center', behavior: 'smooth' });
      node.classList.remove('flash'); void node.offsetWidth; node.classList.add('flash');
      var inp = node.matches('input,textarea,.rich') ? node : node.querySelector('.rich,input[type=text],input[type=url],textarea');
      if (inp && sel && !noFocus) { try { inp.focus({ preventScroll: true }); } catch (x) { inp.focus(); } }
    }, 40);
  }

  // ---------- Uploads ----------
  function uploadFile(file, prog) {
    if (prog) { prog.hidden = false; prog.firstChild.style.width = '4%'; }
    return A.upload(file, function (p) { if (prog) prog.firstChild.style.width = Math.round(p * 100) + '%'; })
      .then(function (r) { if (prog) prog.hidden = true; return r.src; })
      .catch(function (e) { if (prog) prog.hidden = true; toast(e.message, true); throw e; });
  }
  function progBar() { return el('div', { class: 'prog', hidden: true }, [el('i')]); }

  // ---------- Feld-Bausteine ----------
  var F = {};
  function wrap(f, input, extra) { return el('div', { class: 'field' }, [f.l ? el('label', { text: f.l }) : null, input].concat(extra || []).concat(f.help ? [el('span', { class: 'help', text: f.help })] : [])); }
  function fieldsBlock(o, fields, refresh) {
    fields = [].concat.apply([], fields.map(function (f) { return f.t === 'vis' ? K.VIS_ITEM : [f]; })).filter(function (f) {
      if (!f.when) return true;
      for (var wk in f.when) { var cv = o[wk]; if (f.when[wk] === true) { if (cv === false) return false; continue; } if ((cv || 'public') !== f.when[wk]) return false; }
      return true;
    });
    var main = fields.filter(function (f) { return !f.adv; }), adv = fields.filter(function (f) { return f.adv; });
    var p = PATH.get(o) || '';
    function mk(f) { return tagP(F[f.t](o, f, refresh), p + '.' + f.k); }
    var box = el('div', { class: 'form' }, main.map(mk));
    if (adv.length) {
      var key = advKey(p, fields);
      var d = el('details', { class: 'more' }, [el('summary', { text: 'Mehr Optionen' }), el('div', { class: 'form' }, adv.map(mk))]);
      if (open[key]) d.open = true;
      d.addEventListener('toggle', function () { open[key] = d.open; });
      box.appendChild(d);
    }
    return box;
  }

  function richField(o, f, ml) {
    var d = el('div', { class: 'rich' + (ml ? ' ml' : ''), role: 'textbox', 'aria-multiline': ml ? 'true' : 'false', 'aria-label': f.l || f.k, 'data-ph': f.ph || '' });
    RT.fill(d, o[f.k], ml); RT.editable(d, ml);
    d.addEventListener('input', function () { o[f.k] = RT.toValue(d, ml); d.classList.toggle('empty', !d.textContent); changed(); if (f.onInput) f.onInput(); });
    d.classList.toggle('empty', !d.textContent);
    return wrap(f, d, [el('span', { class: 'help hint', text: 'Text markieren → Farbe, Größe, Animation …' })]);
  }
  F.text = function (o, f) {
    if (K.isRich(f)) return richField(o, f, false);
    return wrap(f, el('input', { type: 'text', value: o[f.k] || '', placeholder: f.ph || '', oninput: function () { o[f.k] = this.value; changed(); if (f.onInput) f.onInput(); } }));
  };
  F.textarea = function (o, f) {
    if (K.isRich(f)) return richField(o, f, true);
    return wrap(f, el('textarea', { rows: 3, value: o[f.k] || '', oninput: function () { o[f.k] = this.value; changed(); if (f.onInput) f.onInput(); } }));
  };
  F.select = function (o, f) {
    var s = el('select', { onchange: function () { o[f.k] = this.value; changed({ now: true }); if (f.after) f.after(); } }, f.o.map(function (x) { return el('option', { value: x[0], text: x[1] }); }));
    s.value = o[f.k] == null ? f.o[0][0] : o[f.k];
    return wrap(f, s);
  };
  F.choice = function (o, f, refresh) {
    var cur = o[f.k] == null ? f.o[0][0] : o[f.k];
    var seg = el('div', { class: 'seg', role: 'radiogroup', 'aria-label': f.l });
    f.o.forEach(function (x) {
      seg.appendChild(el('button', { type: 'button', role: 'radio', 'aria-checked': String(String(cur) === String(x[0])), class: String(cur) === String(x[0]) ? 'on' : '', text: x[1], onclick: function () {
        o[f.k] = x[0]; [].forEach.call(seg.children, function (b) { b.classList.toggle('on', b === this); b.setAttribute('aria-checked', String(b === this)); }, this);
        changed({ now: true }); if (f.after) f.after(); if (f.refresh && refresh) refresh();
      } }));
    });
    return wrap(f, seg);
  };
  F.toggle = function (o, f, refresh) {
    return el('label', { class: 'tog' }, [el('input', { type: 'checkbox', checked: f.defTrue ? o[f.k] !== false : !!o[f.k], onchange: function () { o[f.k] = this.checked; changed({ now: true }); if (f.after) f.after(); if (f.refresh && refresh) refresh(); } }), el('span', { text: f.l })]);
  };
  F.range = function (o, f) {
    var v = o[f.k] == null ? f.min : o[f.k];
    var out = el('output', { text: v + (f.unit || '') });
    var r = el('input', { type: 'range', min: f.min, max: f.max, step: f.step || 1, value: v, disabled: !!f.disabled,
      oninput: function () { o[f.k] = +this.value; out.textContent = this.value + (f.unit || ''); changed(); } });
    return wrap(f, el('div', { class: 'rng' }, [r, out]));
  };
  F.date = function (o, f, refresh) {
    var inp = el('input', { type: 'date', value: o[f.k] || '', onchange: function () { o[f.k] = this.value; changed({ now: true }); refresh && refresh(); } });
    var extra = o[f.k] ? [el('div', { class: 'media-tools' }, [
      el('span', { class: 'help' + (o[f.k] > K.today() ? ' warn' : ' ok'), text: o[f.k] > K.today() ? 'Noch versteckt, erscheint automatisch am ' + o[f.k].split('-').reverse().join('.') : 'Datum erreicht, ist sichtbar' }),
      el('button', { class: 'btn small', type: 'button', text: 'Datum entfernen', onclick: function () { o[f.k] = ''; changed({ now: true }); refresh && refresh(); } })])] : [];
    return wrap(f, inp, extra);
  };
  function newCode() { var a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', s = ''; var r = new Uint8Array(8); (window.crypto || {}).getRandomValues ? crypto.getRandomValues(r) : r.forEach(function (_, i) { r[i] = Math.random() * 255; }); for (var i = 0; i < 8; i++) s += a[r[i] % a.length]; return s.slice(0, 4) + '-' + s.slice(4); }
  F.code = function (o, f, refresh) {
    if (!o[f.k]) { o[f.k] = newCode(); changed(); }
    var inp = el('input', { type: 'text', value: o[f.k] || '', spellcheck: 'false', oninput: function () { o[f.k] = this.value.trim(); changed(); } });
    var link = location.origin + '/?code=' + encodeURIComponent(o[f.k] || '');
    return wrap(f, el('div', { class: 'row2' }, [inp, el('div', { class: 'media-tools' }, [
      el('button', { class: 'btn small', type: 'button', text: 'Neuer Code', onclick: function () { o[f.k] = newCode(); changed({ now: true }); refresh && refresh(); } }),
      el('button', { class: 'btn small', type: 'button', text: 'Link kopieren', onclick: function () {
        var l = location.origin + '/?code=' + encodeURIComponent(o[f.k] || ''), b = this;
        var ok = function () { b.textContent = 'Kopiert ✓'; setTimeout(function () { b.textContent = 'Link kopieren'; }, 1800); };
        try { navigator.clipboard.writeText(l).then(ok, function () { toast(l); }); } catch (x) { toast(l); }
      } })
    ])]), [el('span', { class: 'help', text: 'Schick Kunden den Code oder den Link. Mit dem Link sind die Projekte sofort freigeschaltet.' })]);
  };
  F.tags = function (o, f) { return wrap(f, el('input', { type: 'text', value: (o[f.k] || []).join(', '), oninput: function () { o[f.k] = this.value.split(',').map(function (x) { return x.trim(); }).filter(Boolean); changed(); } })); };
  F.lines = function (o, f) { return wrap(f, el('textarea', { rows: 4, value: (o[f.k] || []).join('\n'), oninput: function () { o[f.k] = this.value.split('\n').map(function (x) { return x.trim(); }).filter(Boolean); changed(); } })); };
  function linkInput(get, set, ph) {
    return el('input', { type: 'text', list: 'anchors', placeholder: ph || 'Abschnitt wählen oder https://…', value: get() || '', oninput: function () { set(this.value); changed(); } });
  }
  F.link = function (o, f) { return wrap(f, linkInput(function () { return o[f.k]; }, function (v) { o[f.k] = v; })); };
  function palette() { var t = D.theme; var seen = {}, out = []; [t.accent, t.fg, t.bg, t.muted, t.panel].concat(RT.usedColors(D.sections)).forEach(function (c) { c = String(c || '').toLowerCase(); if (/^#[0-9a-f]{6}$/.test(c) && !seen[c]) { seen[c] = 1; out.push(c); } }); return out; }
  F.color = function (o, f) {
    var row = el('div', { class: 'swatches' });
    function draw() {
      row.innerHTML = '';
      row.appendChild(el('button', { type: 'button', class: 'swatch none' + (!o[f.k] ? ' on' : ''), title: 'Standard (Akzentfarbe)', text: 'Std', onclick: function () { o[f.k] = ''; changed({ now: true }); draw(); } }));
      palette().concat(['#ffffff', '#000000', '#f2a33a', '#5fbf8a', '#5b8cff']).filter(function (c, i, a) { return a.indexOf(c) === i; }).forEach(function (c) {
        row.appendChild(el('button', { type: 'button', class: 'swatch' + (String(o[f.k]).toLowerCase() === c ? ' on' : ''), title: c, style: 'background:' + c, onclick: function () { o[f.k] = c; changed({ now: true }); draw(); } }));
      });
      row.appendChild(el('label', { class: 'swatch pick', title: 'Eigene Farbe' }, ['+', el('input', { type: 'color', value: /^#[0-9a-f]{6}$/i.test(o[f.k] || '') ? o[f.k] : '#d6363d', oninput: function () { o[f.k] = this.value; changed(); }, onchange: function () { draw(); } })]));
    }
    draw();
    return wrap(f, row);
  };
  F.btnaction = function (o, f, refresh) {
    var cur = K.btnAction(o);
    if (!o.action && cur.a !== 'none') { o.action = cur.a; o.value = cur.v; }
    var a = o.action || 'section';
    var sum = el('span', { class: 'help ok sum' });
    function upd() { sum.textContent = '→ ' + K.btnSummary(o, D); }
    var contact = D.sections.filter(function (x) { return x.type === 'contact' && x.email; })[0];
    var sel = el('select', { 'aria-label': 'Aktion', onchange: function () {
      o.action = this.value; o.value = '';
      if (o.action === 'section') o.value = 'kontakt';
      if ((o.action === 'mail' || o.action === 'copy') && contact) o.value = RT.plain(contact.email);
      delete o.link; changed({ now: true }); refresh && refresh();
    } }, K.BTN_ACTIONS.map(function (x) { return el('option', { value: x[0], text: x[1] }); }));
    sel.value = a;
    var v = null;
    if (a === 'section') {
      v = el('select', { 'aria-label': 'Abschnitt', onchange: function () { o.value = this.value; delete o.link; changed(); upd(); } }, D.sections.map(function (x) { return el('option', { value: K.anchor(x), text: secName(x) + ' (' + K.TYPES[x.type].label + ')' }); }));
      v.value = o.value;
    } else if (/^(url|mail|phone|copy)$/.test(a)) {
      v = el('input', { type: 'text', value: o.value || '', placeholder: { url: 'https://…', mail: 'name@mail.de', phone: '+49 151 …', copy: 'Text, der kopiert wird' }[a], oninput: function () { o.value = this.value.trim(); delete o.link; changed(); upd(); } });
    } else if (a === 'file') {
      var prog = progBar();
      v = el('div', { class: 'media-tools' }, [
        el('label', { class: 'btn small upl' }, [o.value ? 'Datei ersetzen' : 'Datei hochladen (PDF, Bild)', el('input', { type: 'file', accept: 'application/pdf,image/*', onchange: function () {
          var file = this.files[0]; if (!file) return;
          uploadFile(file, prog).then(function (src) { o.value = src; changed({ now: true }); refresh && refresh(); }).catch(function () {});
        } })]),
        o.value ? el('span', { class: 'help ok', text: '✓ Datei vorhanden' }) : null, prog]);
    } else if (a === 'showreel') {
      var hasReel = D.sections.some(function (x) { return x.type === 'hero' && (A.ytId(x.youtube) || x.video); });
      if (!hasReel) v = el('span', { class: 'help bad', text: 'Im Startbereich ist noch kein Showreel eingetragen.' });
    } else if (a === 'code') {
      if (JSON.stringify(D.sections).indexOf('"visibility":"code"') < 0) v = el('span', { class: 'help bad', text: 'Es gibt noch kein Projekt mit „Nur mit Code“.' });
    }
    upd();
    return wrap(f, el('div', { class: 'actbox' }, [sel, v, sum]));
  };
  F.button = function (o, f, refresh) {
    var b = o[f.k] = o[f.k] || { label: '', link: '' };
    if (!b.label) return wrap(f, el('button', { class: 'btn small add-item', type: 'button', text: '+ Button hinzufügen', onclick: function () { b.label = 'Neuer Button'; b.link = b.link || '#kontakt'; changed({ now: true }); refresh(); } }));
    var def = f.k === 'button2' ? 'outline' : 'primary';
    if (!b.style) b.style = def;
    return el('div', { class: 'field btnfield' }, [
      el('div', { class: 'bfhead' }, [el('label', { text: f.l }), el('button', { class: 'btn small danger', type: 'button', text: 'Button entfernen', onclick: function () { b.label = ''; changed({ now: true }); refresh(); toast('Button entfernt. ⌘Z macht es rückgängig.'); } })]),
      el('div', {}, [
        el('input', { type: 'text', placeholder: 'Beschriftung', value: b.label || '', 'aria-label': 'Beschriftung', oninput: function () { b.label = this.value; changed(); } })
      ]),
      F.btnaction(b, { l: 'Was passiert beim Klick?' }, refresh),
      F.choice(b, { k: 'style', l: 'Stil', o: [['primary', 'Gefüllt'], ['outline', 'Umrandet'], ['text', 'Nur Text →']] }),
      F.color(b, { k: 'color', l: 'Farbe' })
    ]);
  };
  F.youtube = function (o, f) {
    var help = el('span', { class: 'help' });
    function upd() {
      var v = o[f.k];
      if (!v) { help.className = 'help'; help.textContent = 'Link aus YouTube („Teilen“) einfügen.'; }
      else if (A.ytId(v)) { help.className = 'help ok'; help.textContent = '✓ Video erkannt. Es läuft direkt auf deiner Website.'; }
      else { help.className = 'help bad'; help.textContent = 'Link nicht erkannt. Kopiere ihn bei YouTube über „Teilen“.'; }
    }
    upd();
    return wrap(f, el('input', { type: 'url', placeholder: 'https://youtu.be/…', value: o[f.k] || '', oninput: function () { o[f.k] = this.value.trim(); upd(); changed(); if (f.onInput) f.onInput(); } }), [help]);
  };
  F.image = function (o, f, refresh) {
    var prog = progBar();
    var input = el('input', { type: 'file', accept: 'image/*', onchange: function () {
      var file = this.files[0]; if (!file) return;
      uploadFile(file, prog).then(function (src) { o[f.k] = src; changed({ now: true }); refresh(); }).catch(function () {});
    } });
    var drop = el('label', { class: 'imgdrop' + (o[f.k] ? ' has' : '') }, [
      o[f.k] ? el('img', { src: o[f.k], alt: '' }) : el('span', { class: 'mono', text: '+ Bild hochladen' }),
      o[f.k] ? el('span', { class: 'swap mono', text: 'Bild ersetzen' }) : null,
      input
    ]);
    dropFiles(drop, function (files) { input.files = files; input.onchange && input.dispatchEvent(new Event('change')); });
    return wrap(f, drop, [prog, o[f.k] ? el('button', { class: 'btn small danger', type: 'button', text: 'Bild entfernen', onclick: function () { o[f.k] = ''; changed({ now: true }); refresh(); } }) : null]);
  };
  function dropFiles(target, cb) {
    target.addEventListener('dragover', function (e) { if (e.dataTransfer && [].indexOf.call(e.dataTransfer.types || [], 'Files') >= 0) { e.preventDefault(); target.classList.add('over'); } });
    target.addEventListener('dragleave', function () { target.classList.remove('over'); });
    target.addEventListener('drop', function (e) { if (!e.dataTransfer || !e.dataTransfer.files.length) return; e.preventDefault(); target.classList.remove('over'); cb(e.dataTransfer.files); });
  }
  F.video = function (o, f, refresh) {
    var prog = progBar();
    return wrap(f, el('div', { class: 'media-tools' }, [
      el('label', { class: 'btn small upl' }, [o[f.k] ? 'Video ersetzen' : 'Video hochladen', el('input', { type: 'file', accept: 'video/mp4,video/webm,video/quicktime', onchange: function () {
        var file = this.files[0]; if (!file) return; setStatus('Lade Video hoch …');
        uploadFile(file, prog).then(function (src) { o[f.k] = src; changed({ now: true }); toast('Video hochgeladen.'); refresh(); }).catch(function () { setStatus('Upload fehlgeschlagen', 'err'); });
      } })]),
      o[f.k] ? el('span', { class: 'help ok', text: '✓ Video vorhanden' }) : el('span', { class: 'help', text: 'MP4, auch mehrere GB' }),
      o[f.k] ? el('button', { class: 'btn small danger', type: 'button', text: 'Entfernen', onclick: function () { o[f.k] = ''; changed({ now: true }); refresh(); } }) : null
    ]), [prog]);
  };
  F.photos = function (o, f, refresh) {
    var list = o[f.k] = o[f.k] || [], prog = progBar();
    var grid = el('div', { class: 'photos' });
    list.forEach(function (p, i) {
      var tile = el('div', { class: 'photo', 'data-i': i }, [
        el('div', { class: 'pimg', 'data-handle': '', title: 'Ziehen zum Sortieren' }, [el('img', { src: p.src, alt: '', draggable: false }), p.wide ? el('span', { class: 'badge', text: '2×' }) : null]),
        el('div', { class: 'pctl' }, [
          el('button', { class: 'pbtn', type: 'button', text: p.wide ? '1×' : '2×', title: p.wide ? 'Normale Breite' : 'Doppelt breit', onclick: function () { p.wide = !p.wide; changed({ now: true }); refresh(); } }),
          el('button', { class: 'pbtn' + (open['alt:' + p.src] ? ' on' : ''), type: 'button', text: '✎', title: 'Bildbeschreibung', onclick: function () { open['alt:' + p.src] = !open['alt:' + p.src]; refresh(); } }),
          el('button', { class: 'pbtn danger', type: 'button', text: '✕', title: 'Löschen', onclick: function () { list.splice(i, 1); changed({ now: true }); refresh(); toast('Foto gelöscht. ⌘Z macht es rückgängig.'); } })
        ]),
        open['alt:' + p.src] ? el('input', { type: 'text', class: 'palt', placeholder: 'Beschreibung', value: p.alt || '', 'aria-label': 'Bildbeschreibung', oninput: function () { p.alt = this.value; changed(); } }) : null
      ]);
      grid.appendChild(tile);
    });
    var input = el('input', { type: 'file', accept: 'image/*', multiple: true, hidden: true, onchange: function () { addFiles([].slice.call(this.files)); } });
    var add = el('label', { class: 'addph' }, [el('span', { html: '+ Fotos<br><small>oder hierher ziehen</small>' }), input]);
    grid.appendChild(add);
    dropFiles(grid, function (files) { addFiles([].slice.call(files)); });
    function addFiles(files) {
      files = files.filter(function (x) { return /^image\//.test(x.type); }); var done = 0; if (!files.length) return;
      setStatus('Lade ' + files.length + ' Foto(s) hoch …');
      files.reduce(function (ch, file) {
        return ch.then(function () { return uploadFile(file, prog).then(function (src) { list.push({ src: src, alt: '', wide: false }); done++; }).catch(function () {}); });
      }, Promise.resolve()).then(function () { if (done) toast(done + ' Foto(s) hinzugefügt.'); changed({ now: true }); refresh(); });
    }
    sortable(grid, list, function () { changed({ now: true }); refresh(); }, true);
    return wrap(f, grid, [prog, list.length > 1 ? el('span', { class: 'help', text: 'Fotos zum Sortieren ziehen.' }) : null]);
  };
  F.items = function (o, f, refresh) {
    var list = o[f.k] = o[f.k] || [];
    var box = el('div', { class: 'items' });
    list.forEach(function (it, i) {
      var key = 'it:' + (o.id || o.eid || '') + f.k + i, isOpen = !!open[key];
      PATH.set(it, (PATH.get(o) || '') + ':' + f.k + ':' + i);
      var thumb = it.image ? it.image : (it.youtube && A.ytId(it.youtube) ? A.ytThumb(A.ytId(it.youtube)) : (it.photos && it.photos[0] ? it.photos[0].src : ''));
      var head = el('div', { class: 'ih', onclick: function (e) { if (e.target.closest('[data-handle]')) return; open[key] = !isOpen; refresh(); } }, [
        el('span', { class: 'grip', 'data-handle': '', title: 'Ziehen zum Sortieren', text: '⋮⋮' }),
        thumb ? el('img', { class: 'mini', src: thumb, alt: '' }) : null,
        el('span', { class: 'nm', text: RT.plain(it[f.titleKey]) || f.item }),
        it.visibility === 'nda' ? el('span', { class: 'vtag', text: 'NDA' }) : null,
        it.visibility === 'code' ? el('span', { class: 'vtag', text: 'Code' }) : null,
        it.publishAt && it.publishAt > K.today() ? el('span', { class: 'vtag', text: 'ab ' + it.publishAt.split('-').reverse().join('.') }) : null,
        el('span', { class: 'chev', text: isOpen ? '−' : '+' })
      ]);
      var body = isOpen ? el('div', { class: 'ib' }, [
        fieldsBlock(it, f.fields.map(function (sf) { var x = Object.assign({}, sf); if (sf.k === f.titleKey) x.onInput = function () { head.querySelector('.nm').textContent = RT.plain(it[f.titleKey]) || f.item; }; return x; }), refresh),
        el('div', { class: 'itools' }, [
          el('button', { class: 'btn small', type: 'button', text: 'Duplizieren', onclick: function () { list.splice(i + 1, 0, clone(it)); changed({ now: true }); refresh(); } }),
          el('button', { class: 'btn small danger', type: 'button', text: f.item + ' löschen', onclick: function () { armDelete(this, function () { list.splice(i, 1); open[key] = false; changed({ now: true }); refresh(); }); } })
        ])
      ]) : null;
      box.appendChild(el('div', { class: 'item' + (isOpen ? ' open' : ''), 'data-i': i, 'data-path': PATH.get(it) }, [head, body]));
    });
    sortable(box, list, function () { changed({ now: true }); refresh(); });
    box.appendChild(el('button', { class: 'btn small add-item', type: 'button', text: '+ ' + f.item + ' hinzufügen', onclick: function () {
      list.push(clone(f.newItem)); open['it:' + (o.id || o.eid || '') + f.k + (list.length - 1)] = true; changed({ now: true }); refresh();
    } }));
    return el('div', { class: 'field' }, [el('span', { class: 'flabel', text: f.l + ' · ' + list.length }), box]);
  };
  F.elements = function (o, f, refresh) {
    var list = o[f.k] = o[f.k] || [];
    var box = el('div', { class: 'items' });
    list.forEach(function (e, i) {
      var T = K.ELEMENTS[e.type]; if (!T) return;
      var key = 'el:' + e.eid, isOpen = !!open[key];
      PATH.set(e, e.eid);
      var summary = e.text || e.title || (e.items && e.items.length ? e.items.length + '×' : '') || (e.photos ? e.photos.length + ' Fotos' : '') || (e.youtube ? 'YouTube' : '');
      var head = el('div', { class: 'ih', onclick: function (ev) { if (ev.target.closest('[data-handle]')) return; open[key] = !isOpen; OPEN_EL = !isOpen ? e.eid : null; refresh(); pushPreview(); } }, [
        el('span', { class: 'grip', 'data-handle': '', title: 'Ziehen zum Sortieren', text: '⋮⋮' }),
        el('span', { class: 'eicon', text: T.icon }),
        el('span', { class: 'nm' }, [el('b', { text: T.label }), summary ? el('small', { text: ' ' + RT.plain(String(summary)).slice(0, 40) }) : null]),
        el('span', { class: 'wtag mono', text: { full: '', twothird: '2/3', half: '1/2', third: '1/3' }[e.width || 'full'] }),
        el('span', { class: 'chev', text: isOpen ? '−' : '+' })
      ]);
      var body = isOpen ? el('div', { class: 'ib' }, [
        fieldsBlock(e, T.fields, refresh),
        el('div', { class: 'itools' }, [
          el('button', { class: 'btn small', type: 'button', text: 'Duplizieren', onclick: function () { var c = clone(e); c.eid = K.uid(); list.splice(i + 1, 0, c); changed({ now: true }); refresh(); } }),
          el('button', { class: 'btn small danger', type: 'button', text: 'Element löschen', onclick: function () { armDelete(this, function () { list.splice(i, 1); changed({ now: true }); refresh(); }); } })
        ])
      ]) : null;
      box.appendChild(el('div', { class: 'item' + (isOpen ? ' open' : ''), 'data-i': i, 'data-eid-row': e.eid, 'data-path': e.eid }, [head, body]));
    });
    sortable(box, list, function () { changed({ now: true }); refresh(); });
    var pk = 'elpick:' + o.id;
    box.appendChild(el('button', { class: 'btn small add-item', type: 'button', text: open[pk] ? 'Abbrechen' : '+ Element hinzufügen', onclick: function () { open[pk] = !open[pk]; refresh(); } }));
    if (open[pk]) box.appendChild(el('div', { class: 'epick' }, Object.keys(K.ELEMENTS).map(function (t) {
      return el('button', { type: 'button', class: 'etile', onclick: function () { var n = K.newElement(t); list.push(n); open[pk] = false; open['el:' + n.eid] = true; OPEN_EL = n.eid; changed({ now: true }); refresh(); } }, [el('span', { class: 'eicon', text: K.ELEMENTS[t].icon }), el('span', { text: K.ELEMENTS[t].label })]);
    })));
    return el('div', { class: 'field' }, [el('span', { class: 'flabel', text: 'Elemente · ' + list.length }), box,
      list.length > 1 ? el('span', { class: 'help', text: 'Tipp: Mit „Breite“ 1/2 oder 1/3 stehen Elemente nebeneinander.' }) : null]);
  };

  // ---------- Tabs ----------
  function renderTabs() { [].forEach.call(document.querySelectorAll('.tabs button'), function (b) { b.classList.toggle('on', b.getAttribute('data-tab') === TAB); }); }
  document.querySelector('.tabs').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    TAB = b.getAttribute('data-tab'); if (TAB !== 'page') { OPEN = null; OPEN_EL = null; pushPreview(); }
    renderTabs(); renderPane();
  });
  function renderPane() {
    var pane = $('pane'), y = pane.scrollTop; pane.innerHTML = '';
    // Sprungziele für Link-Felder
    var dl = el('datalist', { id: 'anchors' }, D.sections.map(function (s) { return el('option', { value: '#' + K.anchor(s), text: secName(s) }); }).concat([el('option', { value: 'impressum.html', text: 'Impressum' })]));
    pane.appendChild(dl);
    notices().forEach(function (n) { pane.appendChild(n); });
    if (TAB === 'page') pane.appendChild(OPEN ? sectionForm(sec(OPEN)) : (PICK != null ? picker(PICK) : pageList()));
    if (TAB === 'design') pane.appendChild(designForm());
    if (TAB === 'settings') pane.appendChild(settingsForm());
    if (TAB === 'inbox') pane.appendChild(inboxView());
    pane.scrollTop = y;
  }
  function notices() {
    var n = [];
    if (MODE === 'demo') {
      var live = !/claude|localhost|127\.0\.0\.1/.test(location.hostname) && location.protocol !== 'file:';
      n.push(el('div', { class: 'notice warn', html: live
        ? '<b>Der Server-Teil läuft nicht.</b> Speichern wirkt nur in diesem Browser. Prüfe in der README, ob <code>worker.js</code> und <code>wrangler.jsonc</code> hochgeladen sind.'
        : '<b>Vorschau-Modus.</b> Änderungen bleiben nur in diesem Browser.' }));
    }
    var h = A.health || {};
    if (MODE === 'live' && (!h.r2 || !h.password)) n.push(el('div', { class: 'notice warn', html: '<b>Noch nicht fertig eingerichtet:</b> ' + (!h.r2 ? 'R2-Bucket „MEDIA“ fehlt. ' : '') + (!h.password ? 'Passwort ADMIN_PASSWORD fehlt. ' : '') + 'Siehe README.' }));
    return n;
  }

  // ---------- Seite: Liste der Abschnitte ----------
  function pageList() {
    var box = el('div');
    if (ls('jr-help') !== '0') box.appendChild(el('div', { class: 'helpcard' }, [
      el('b', { text: 'So geht’s' }),
      el('ol', {}, [el('li', { text: 'Abschnitt anklicken, hier oder direkt in der Vorschau.' }), el('li', { text: 'Ändern. Alles wird automatisch als Entwurf gesichert.' }), el('li', { text: 'Fertig? Oben auf „Veröffentlichen“, erst dann sehen es Besucher.' }), el('li', { html: 'Am Griff <span class="grip">⋮⋮</span> ziehen zum Sortieren, <b>+</b> zum Einfügen.' })]),
      el('button', { class: 'btn small', type: 'button', text: 'Verstanden', onclick: function () { ls('jr-help', '0'); renderPane(); } })
    ]));
    var list = el('div', { class: 'slist' });
    D.sections.forEach(function (s, i) {
      list.appendChild(el('div', { class: 'srow' + (s.visible === false ? ' off' : ''), 'data-i': i, onclick: function (e) { if (e.target.closest('.eye,[data-handle],.ins')) return; OPEN = s.id; OPEN_EL = null; renderPane(); focusPreview(s.id); pushPreview(); } }, [
        el('button', { class: 'ins', type: 'button', title: 'Hier einfügen', 'aria-label': 'Abschnitt davor einfügen', text: '+', onclick: function () { PICK = i; renderPane(); } }),
        el('span', { class: 'grip', 'data-handle': '', title: 'Ziehen zum Sortieren', text: '⋮⋮' }),
        el('span', { class: 'sicon', text: ICON[s.type] || '·' }),
        el('div', { class: 'nm' }, [el('b', { text: secName(s) }), el('span', { class: 'mono', text: K.TYPES[s.type].label + (s.visible === false ? ' · ausgeblendet' : '') + (s.navLabel ? ' · im Menü' : '') + (s.visibility === 'code' ? ' · nur mit Code' : '') + (s.publishAt && s.publishAt > K.today() ? ' · ab ' + s.publishAt.split('-').reverse().join('.') : '') })]),
        el('button', { class: 'eye', type: 'button', title: s.visible === false ? 'Einblenden' : 'Ausblenden', 'aria-label': s.visible === false ? 'Einblenden' : 'Ausblenden', html: s.visible === false ? eyeOff : eyeOn, onclick: function () { s.visible = s.visible === false; changed({ now: true }); renderPane(); } })
      ]));
    });
    sortable(list, D.sections, function () { changed({ now: true }); renderPane(); });
    box.appendChild(list);
    box.appendChild(el('button', { class: 'btn add-btn', type: 'button', text: '+ Neuer Abschnitt', onclick: function () { PICK = D.sections.length; renderPane(); } }));
    return box;
  }
  var eyeOn = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
  var eyeOff = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 3l18 18M10.6 6.1A10 10 0 0 1 12 6c6.4 0 10 6 10 6a17 17 0 0 1-3.2 3.9M6.2 6.6C3.6 8.4 2 12 2 12s3.6 6 10 6c1.6 0 3-.3 4.3-.9"/></svg>';

  function picker(at) {
    function insert(s) { D.sections.splice(at, 0, s); PICK = null; OPEN = s.id; OPEN_EL = null; open['g:content'] = true; changed({ now: true }); renderPane(); setTimeout(function () { focusPreview(s.id); }, 300); }
    return el('div', {}, [
      el('div', { class: 'dhead' }, [el('h2', { text: 'Einfügen' }), el('button', { class: 'btn small', type: 'button', text: 'Abbrechen', onclick: function () { PICK = null; renderPane(); } })]),
      el('p', { class: 'mono', text: at >= D.sections.length ? 'Kommt ans Ende der Seite' : 'Kommt vor „' + secName(D.sections[at]) + '“' }),
      el('h3', { class: 'ph3', text: 'Schnell einfügen' }),
      el('div', { class: 'qgrid' }, K.QUICK.map(function (q) {
        return el('button', { class: 'qtile', type: 'button', onclick: function () { var s = K.quickSection(q); insert(s); s.elements.forEach(function (e) { open['el:' + e.eid] = true; }); renderPane(); } }, [el('span', { class: 'qicon', text: q.icon }), el('span', { text: q.label })]);
      })),
      el('h3', { class: 'ph3', text: 'Fertige Abschnitte' }),
      el('div', { class: 'picker' }, Object.keys(K.TYPES).filter(function (t) { return t !== 'free'; }).map(function (t) {
        return el('button', { class: 'pick', type: 'button', onclick: function () { insert(K.newSection(t)); } }, [el('span', { class: 'sicon', text: ICON[t] }), el('span', {}, [el('b', { text: K.TYPES[t].label }), el('span', { text: K.TYPES[t].desc })])]);
      }))
    ]);
  }

  // ---------- Seite: ein Abschnitt ----------
  function group(id, title, kids, defOpen, extra) {
    var key = 'g:' + id, d = el('details', { class: 'grp-box' }, [el('summary', {}, [el('span', { text: title }), extra || null]), el('div', { class: 'gbody' }, kids)]);
    if (open[key] != null ? open[key] : defOpen) d.open = true;
    d.addEventListener('toggle', function () { open[key] = d.open; });
    return d;
  }
  function sectionForm(s) {
    if (!s) { OPEN = null; return pageList(); }
    var T = K.TYPES[s.type], box = el('div'), i = D.sections.indexOf(s);
    function refresh() { renderPane(); }
    PATH.set(s, s.id);
    function lay(f) { return tagP(F[f.t](s, f, refresh), s.id + '.' + f.k); }
    box.appendChild(el('div', { class: 'crumb' }, [
      el('button', { class: 'btn small', type: 'button', text: '← Alle Abschnitte', onclick: function () { OPEN = null; OPEN_EL = null; renderPane(); pushPreview(); } }),
      el('span', { class: 'mono', text: (i + 1) + ' / ' + D.sections.length })
    ]));
    box.appendChild(el('div', { class: 'dhead' }, [el('div', {}, [el('span', { class: 'mono', text: T.label }), el('h2', { text: secName(s) })]),
      el('button', { class: 'eye big', type: 'button', html: (s.visible === false ? eyeOff : eyeOn) + '<span>' + (s.visible === false ? 'Ausgeblendet' : 'Sichtbar') + '</span>', onclick: function () { s.visible = s.visible === false; changed({ now: true }); refresh(); } })]));
    box.appendChild(group('content', 'Inhalt', [fieldsBlock(s, T.fields, refresh)], true));
    if (s.type !== 'free') box.appendChild(group('extras', 'Zusätzliche Elemente' + ((s.elements || []).length ? ' · ' + s.elements.length : ''), [
      el('p', { class: 'help', text: 'Buttons, Bilder, Texte, Zahlen … unter den Inhalt dieses Abschnitts setzen.' }),
      F.elements(s, { k: 'elements', l: 'Elemente' }, refresh)], false));
    box.appendChild(group('look', 'Aussehen', [el('div', { class: 'form' }, K.LOOK.map(lay))], false));
    box.appendChild(group('anim', 'Animation', [el('div', { class: 'form' }, K.ANIM.map(lay).concat([
      el('button', { class: 'btn small', type: 'button', text: '▶ Animation in der Vorschau ansehen', onclick: function () { pushPreview(); setTimeout(function () { post({ type: 'jr-replay', id: s.id }); }, 60); $('work').classList.add('show-preview'); } })
    ]))], false));
    box.appendChild(group('vis', 'Sichtbarkeit' + (s.visibility === 'code' ? ' · nur mit Code' : '') + (s.publishAt && s.publishAt > K.today() ? ' · geplant' : ''), [fieldsBlock(s, K.VIS_SEC, refresh)], false));
    box.appendChild(group('menu', 'Menü', [el('div', { class: 'form' }, K.MENU.map(lay))], false));
    box.appendChild(el('div', { class: 'actions' }, [
      el('button', { class: 'btn small', type: 'button', text: '↑ Nach oben', disabled: i === 0, onclick: function () { moveTo(D.sections, i, i - 1); changed({ now: true }); refresh(); setTimeout(function () { focusPreview(s.id); }, 200); } }),
      el('button', { class: 'btn small', type: 'button', text: '↓ Nach unten', disabled: i === D.sections.length - 1, onclick: function () { moveTo(D.sections, i, i + 2); changed({ now: true }); refresh(); setTimeout(function () { focusPreview(s.id); }, 200); } }),
      el('button', { class: 'btn small', type: 'button', text: '+ Darunter einfügen', onclick: function () { OPEN = null; PICK = i + 1; renderPane(); } }),
      el('button', { class: 'btn small', type: 'button', text: 'Duplizieren', onclick: function () { var c = clone(s); c.id = K.uid(); c.navLabel = ''; (c.elements || []).forEach(function (e) { e.eid = K.uid(); }); D.sections.splice(i + 1, 0, c); OPEN = c.id; changed({ now: true }); refresh(); } }),
      el('button', { class: 'btn small danger', type: 'button', text: 'Löschen', onclick: function () { armDelete(this, function () { D.sections.splice(i, 1); OPEN = null; changed({ now: true }); refresh(); toast('Abschnitt gelöscht. ⌘Z macht es rückgängig.'); }); } })
    ]));
    return box;
  }

  // ---------- Design ----------
  function designForm() {
    var t = D.theme, box = el('div', { class: 'form' });
    function refresh() { renderPane(); }
    box.appendChild(el('div', { class: 'field' }, [el('span', { class: 'flabel', text: 'Farbvorlage' }), el('div', { class: 'presets' }, Object.keys(K.PRESETS).map(function (n) {
      var p = K.PRESETS[n], on = ['bg', 'fg', 'accent'].every(function (k) { return String(t[k]).toLowerCase() === p[k].toLowerCase(); });
      return el('button', { class: 'preset' + (on ? ' on' : ''), type: 'button', onclick: function () { Object.assign(t, p); changed({ now: true }); refresh(); } }, [
        el('span', { class: 'sw', style: 'background:' + p.bg }, [el('i', { style: 'background:' + p.fg }), el('i', { style: 'background:' + p.accent })]),
        el('span', { class: 'mono', text: n })
      ]);
    }))]));
    var acc = el('div', { class: 'field' }, [el('label', { text: 'Akzentfarbe' }), colorInput(t, 'accent', 'Akzentfarbe')]);
    box.appendChild(acc);
    function fontSel(role, key, label) {
      var s = el('select', { onchange: function () { t[key] = this.value; changed({ now: true }); refresh(); } }, K.FONTS[role].map(function (f) { return el('option', { value: f.name, text: f.name }); }));
      s.value = t[key];
      var f = K.font(role, t[key]);
      return el('div', { class: 'field' }, [el('label', { text: label }), s, el('div', { class: 'fontsample', style: 'font-family:"' + f.name + '",' + f.fb + (role === 'display' ? ';font-weight:' + t.headingWeight + ';text-transform:' + (t.headingUpper ? 'uppercase' : 'none') + (f.stretch ? ';font-stretch:' + t.headingStretch + '%' : '') : ';font-size:16px'), text: role === 'display' ? 'Bilder, die bleiben' : role === 'body' ? 'Ich drehe, schneide und grade Filme.' : 'REC · 00:01:24:12' })]);
    }
    box.appendChild(group('d-fonts', 'Schriften', [el('div', { class: 'form' }, [fontSel('display', 'fontDisplay', 'Überschriften'), fontSel('body', 'fontBody', 'Fließtext'), fontSel('mono', 'fontMono', 'Kleine Zeilen')])], true));
    box.appendChild(group('d-anim', 'Animation & Effekte', [el('div', { class: 'form' }, [
      F.select(t, { k: 'anim', l: 'Wie erscheinen Abschnitte beim Scrollen?', o: K.ANIMS }),
      F.choice(t, { k: 'animSpeed', l: 'Tempo', o: [['s', 'Schnell'], ['m', 'Normal'], ['l', 'Langsam']] }),
      F.choice(t, { k: 'photoHover', l: 'Fotos beim Drüberfahren', o: [['zoom', 'Zoom'], ['lift', 'Anheben'], ['color', 'S/W → Farbe'], ['dim', 'Andere abdunkeln'], ['none', 'Nichts']] }),
      F.toggle(t, { k: 'collapsible', l: 'Abschnitte an der Überschrift einklappbar (startet ausgeklappt)' }),
      F.toggle(t, { k: 'grain', l: 'Filmkorn im Startbereich' }),
      F.toggle(t, { k: 'motion', l: 'Animationen insgesamt an' }),
      el('button', { class: 'btn small', type: 'button', text: '▶ Animationen in der Vorschau ansehen', onclick: function () { post({ type: 'jr-replay' }); $('work').classList.add('show-preview'); } })
    ])], true));
    var names = { bg: 'Hintergrund', panel: 'Flächen', line: 'Linien', fg: 'Text', muted: 'Text gedämpft', accent: 'Akzent' };
    var disp = K.font('display', t.fontDisplay);
    box.appendChild(group('d-fine', 'Feineinstellungen', [el('div', { class: 'form' }, [
      el('div', { class: 'field' }, [el('span', { class: 'flabel', text: 'Alle Farben' }), el('div', { class: 'colors' }, Object.keys(names).map(function (k) { return colorInput(t, k, names[k]); }))]),
      F.toggle(t, { k: 'headingUpper', l: 'Überschriften in Großbuchstaben', after: refresh }),
      F.range(t, { k: 'headingScale', l: 'Größe der Überschriften', min: 60, max: 140, step: 5, unit: '%' }),
      F.range(t, { k: 'headingWeight', l: 'Stärke der Überschriften', min: 300, max: 900, step: 100 }),
      disp.stretch ? F.range(t, { k: 'headingStretch', l: 'Breite der Überschriften', min: 62, max: 125, unit: '%' }) : null,
      F.range(t, { k: 'baseSize', l: 'Textgröße', min: 14, max: 20, unit: 'px' }),
      F.range(t, { k: 'maxWidth', l: 'Inhaltsbreite', min: 900, max: 1600, step: 20, unit: 'px' }),
      F.range(t, { k: 'radius', l: 'Ecken-Rundung', min: 0, max: 24, unit: 'px' }),
      el('button', { class: 'btn small danger', type: 'button', text: 'Design zurücksetzen', onclick: function () { armDelete(this, function () { D.theme = clone(K.DEFAULT_THEME); changed({ now: true }); refresh(); }); } })
    ].filter(Boolean))], false));
    return box;
  }
  function colorInput(t, k, name) {
    var hex = el('input', { type: 'text', value: t[k], 'aria-label': name + ' als Hex', oninput: function () { if (/^#[0-9a-f]{6}$/i.test(this.value)) { t[k] = this.value; pick.value = this.value; changed(); } } });
    var pick = el('input', { type: 'color', value: t[k], 'aria-label': name, oninput: function () { t[k] = this.value; hex.value = this.value; changed(); } });
    return el('label', { class: 'color' }, [pick, el('div', {}, [el('span', { class: 'mono', text: name }), hex])]);
  }


  // ---------- Anfragen aus dem Kontaktformular ----------
  var INBOX = null;
  function loadInbox() {
    if (MODE !== 'live') { INBOX = { items: [], mail: false, demo: true }; return Promise.resolve(INBOX); }
    return fetch('/api/inquiries', { headers: { Authorization: 'Bearer ' + A.token() }, cache: 'no-store' }).then(function (r) { return r.json(); })
      .then(function (j) { INBOX = j; var n = (j.items || []).filter(function (x) { return !x.read; }).length; $('inboxCount').textContent = n ? String(n) : ''; return j; })
      .catch(function () { INBOX = { items: [], error: true }; return INBOX; });
  }
  function inboxView() {
    var box = el('div');
    if (!INBOX) { box.appendChild(el('p', { class: 'mono', text: 'Lade Anfragen …' })); loadInbox().then(function () { if (TAB === 'inbox') renderPane(); }); return box; }
    if (INBOX.demo) box.appendChild(el('div', { class: 'notice warn', html: '<b>Vorschau-Modus.</b> Anfragen kommen erst auf deiner veröffentlichten Website an.' }));
    else if (!INBOX.mail) box.appendChild(el('div', { class: 'notice warn', html: '<b>E-Mail-Benachrichtigung noch nicht eingerichtet.</b> Anfragen werden trotzdem gespeichert und erscheinen hier. Wie du sie zusätzlich per E-Mail bekommst, steht in der README unter „Kontaktformular“.' }));
    else box.appendChild(el('p', { class: 'help ok', text: '✓ Neue Anfragen werden zusätzlich an ' + INBOX.to + ' geschickt.' }));
    var items = INBOX.items || [];
    if (!items.length) box.appendChild(el('p', { class: 'mono', style: 'margin-top:14px', text: 'Noch keine Anfragen.' }));
    items.forEach(function (q) {
      var dt = new Date(q.at);
      var rows = [['E-Mail', q.email], ['Telefon', q.phone], ['Projekt', q.type], ['Wunschtermin', q.date], ['Budget', q.budget]].filter(function (x) { return x[1]; });
      box.appendChild(el('div', { class: 'inq' + (q.read ? '' : ' unread') }, [
        el('div', { class: 'ih2' }, [el('b', { text: q.name }), el('span', { class: 'mono', text: dt.toLocaleDateString('de-DE') + ' · ' + dt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + (q.mailed ? ' · gemailt' : '') })]),
        el('dl', {}, [].concat.apply([], rows.map(function (x) { return [el('dt', { text: x[0] }), el('dd', { text: x[1] })]; }))),
        q.message ? el('div', { class: 'msg', text: q.message }) : null,
        el('div', { class: 'media-tools' }, [
          el('a', { class: 'btn small', href: 'mailto:' + q.email + '?subject=' + encodeURIComponent('Deine Anfrage' + (q.type ? ': ' + q.type : '')), text: 'Antworten' }),
          el('button', { class: 'btn small', type: 'button', text: q.read ? 'Als ungelesen markieren' : 'Als gelesen markieren', onclick: function () {
            fetch('/api/inquiries', { method: 'PATCH', headers: { Authorization: 'Bearer ' + A.token(), 'content-type': 'application/json' }, body: JSON.stringify({ id: q.id, read: !q.read }) }).then(function () { q.read = !q.read; loadInbox().then(renderPane); });
          } }),
          el('button', { class: 'btn small danger', type: 'button', text: 'Löschen', onclick: function () { var b = this; armDelete(b, function () {
            fetch('/api/inquiries?id=' + encodeURIComponent(q.id), { method: 'DELETE', headers: { Authorization: 'Bearer ' + A.token() } }).then(function () { loadInbox().then(renderPane); });
          }); } })
        ])
      ]));
    });
    box.appendChild(el('button', { class: 'btn small', type: 'button', text: 'Aktualisieren', onclick: function () { INBOX = null; renderPane(); } }));
    return box;
  }

  // ---------- Einstellungen ----------
  function settingsForm() {
    var s = D.site, box = el('div', { class: 'form' });
    function refresh() { renderPane(); }
    box.appendChild(group('s-site', 'Website', [el('div', { class: 'form' }, [
      tagP(F.text(s, { k: 'name', l: 'Name oben links' }), 'site.name'),
      tagP(F.text(s, { k: 'footer', l: 'Text in der Fußzeile' }), 'site.footer'),
      tagP(F.text(s, { k: 'city', l: 'Stadt', ph: 'z. B. Berlin', help: 'Wichtig für Google („Videograf Berlin“).' }), 'site.city')
    ])], true));
    // Google & Teilen
    var hero = D.sections.filter(function (x) { return x.type === 'hero'; })[0] || {};
    var card = el('div', { class: 'sharecard' });
    function drawCard() {
      var img = s.shareImage || hero.image || 'img/og-default.jpg';
      card.innerHTML = '';
      card.appendChild(el('div', { class: 'sc-img', style: 'background-image:url(' + JSON.stringify(img) + ')' }));
      card.appendChild(el('div', { class: 'sc-txt' }, [el('span', { class: 'sc-host', text: location.host }), el('b', { text: s.title || (s.name + ' – Videograf & Editor' + (s.city ? ' in ' + s.city : '')) }), el('span', { text: s.description || '' })]));
    }
    drawCard();
    box.appendChild(group('s-seo', 'Google & Teilen', [el('div', { class: 'form' }, [
      el('p', { class: 'help', text: 'So sieht dein Link aus, wenn du ihn per WhatsApp, Instagram oder LinkedIn schickst:' }), card,
      tagP(F.text(s, { k: 'title', l: 'Seitentitel (Google & Teilen)', ph: s.name + ' – Videograf & Editor in Berlin', plain: true, onInput: drawCard }), 'site.title'),
      tagP(F.textarea(s, { k: 'description', l: 'Beschreibung (Google & Teilen)', help: '1–2 Sätze, ideal 120–155 Zeichen.', onInput: drawCard }), 'site.description'),
      tagP(F.image(s, { k: 'shareImage', l: 'Vorschaubild beim Teilen', help: 'Am besten 1200 × 630 Pixel. Leer = Bild aus dem Startbereich.' }, refresh), 'site.shareImage')
    ])], true));
    var targets = D.sections.map(function (x) { return [K.anchor(x), secName(x)]; });
    box.appendChild(group('s-menu', 'Menü', [el('div', { class: 'form' }, [
      el('p', { class: 'help', text: 'Welche Abschnitte im Menü stehen, stellst du beim Abschnitt unter „Menü“ ein.' }),
      tagP(F.text(s, { k: 'ctaLabel', l: 'Roter Menüpunkt rechts', ph: 'z. B. Anfragen' }), 'site.ctaLabel'),
      F.select(s, { k: 'ctaTarget', l: 'Springt zu', o: targets.length ? targets : [['', '—']] })
    ])], true));
    var asObj = { v: AUTOSAVE };
    box.appendChild(group('s-save', 'Speichern', [el('div', { class: 'form' }, [
      F.toggle(asObj, { k: 'v', l: 'Automatisch speichern', after: function () { AUTOSAVE = asObj.v; ls('jr-autosave', AUTOSAVE ? '1' : '0'); updSaveBtn(); if (AUTOSAVE && dirty) save(true); } }),
      el('p', { class: 'help', text: 'An: Jede Änderung wird nach 1–2 Sekunden als Entwurf gesichert. Online geht sie erst mit „Veröffentlichen“. Aus: Du sicherst den Entwurf selbst.' })
    ])], true));
    var usage = el('p', { class: 'help', text: MODE === 'live' ? 'Wird geladen …' : 'Nur auf der veröffentlichten Website verfügbar.' });
    if (MODE === 'live') fetch('/api/usage', { headers: { Authorization: 'Bearer ' + A.token() } }).then(function (r) { return r.json(); }).then(function (j) {
      if (j.bytes == null) { usage.textContent = j.error || 'Nicht verfügbar.'; return; }
      var gb = j.bytes / 1073741824, pct = Math.min(100, gb / 10 * 100);
      usage.innerHTML = '<span class="meter"><i style="width:' + pct.toFixed(1) + '%"></i></span><b style="color:var(--fg)">' + (gb < 1 ? (j.bytes / 1048576).toFixed(1) + ' MB' : gb.toFixed(2) + ' GB') + '</b> von 10 GB kostenlos belegt · ' + j.count + ' Dateien';
    }).catch(function () { usage.textContent = 'Nicht verfügbar.'; });
    box.appendChild(group('s-store', 'Speicherplatz', [usage], false));
    var imp = el('input', { type: 'file', accept: 'application/json', hidden: true, onchange: function () {
      var f = this.files[0]; if (!f) return;
      var r = new FileReader(); r.onload = function () {
        try { D = K.normalize(JSON.parse(r.result)); OPEN = null; changed({ now: true }); renderPane(); toast('Sicherung geladen.'); }
        catch (e) { toast('Die Datei ist keine gültige Sicherung.', true); }
      }; r.readAsText(f);
    } });
    box.appendChild(group('s-backup', 'Sicherung', [el('div', { class: 'form' }, [
      el('div', { class: 'media-tools' }, [
        el('button', { class: 'btn small', type: 'button', text: 'Herunterladen', onclick: function () {
          var a = el('a', { href: URL.createObjectURL(new Blob([JSON.stringify(D, null, 1)], { type: 'application/json' })), download: 'website-sicherung-' + new Date().toISOString().slice(0, 10) + '.json' });
          document.body.appendChild(a); a.click(); a.remove();
        } }),
        el('label', { class: 'btn small upl' }, ['Sicherung laden', imp])
      ]),
      el('p', { class: 'help', text: 'Enthält Texte, Links und Design. Hochgeladene Bilder bleiben im Speicher.' }),
      el('button', { class: 'btn small', type: 'button', text: 'Neue Textvorschläge übernehmen (Berlin)', title: 'Ersetzt nur Texte im Startbereich, bei Filme, Über mich, Kontakt sowie Seitentitel/Beschreibung. Filme, Fotos, Links und Design bleiben.', onclick: function () {
        fetch('content.json', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (c) {
          c = K.normalize(c);
          ['title', 'description', 'city', 'footer'].forEach(function (k) { if (c.site[k]) D.site[k] = c.site[k]; });
          function pick(type) { return c.sections.filter(function (x) { return x.type === type; })[0]; }
          D.sections.forEach(function (s) {
            var n = pick(s.type); if (!n) return;
            if (s.type === 'hero') { s.text = n.text; s.facts = n.facts; }
            if (s.type === 'films') s.intro = n.intro;
            if (s.type === 'textImage' && /kamera/i.test(RT.plain(s.title))) { s.body = n.body; s.facts = n.facts; }
            if (s.type === 'contact') s.eyebrow = n.eyebrow;
          });
          changed({ now: true }); renderPane(); toast('Textvorschläge übernommen (als Entwurf). Prüfen und dann „Veröffentlichen“.');
        });
      } }),
      el('button', { class: 'btn small danger', type: 'button', text: 'Alles auf Startinhalt zurücksetzen', onclick: function () {
        armDelete(this, function () { fetch('content.json', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (c) { D = K.normalize(c); OPEN = null; changed({ now: true }); renderPane(); toast('Zurückgesetzt.'); }); });
      } })
    ])], false));
    var vbox = el('div', { class: 'form' }, [el('p', { class: 'help', text: 'Bei jedem Veröffentlichen wird die vorherige Fassung aufgehoben (die letzten 20). Wiederherstellen lädt sie als Entwurf, online geht sie erst mit „Veröffentlichen“.' })]);
    (PUB.versions || []).slice(0, 20).forEach(function (v) {
      var d = new Date(v.at);
      vbox.appendChild(el('div', { class: 'vers' }, [el('span', { text: d.toLocaleDateString('de-DE') + ', ' + d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr' }),
        el('button', { class: 'btn small', type: 'button', text: 'Als Entwurf laden', onclick: function () {
          A.restore(v.id).then(function () { return A.getContent({ full: true }); }).then(function (dd) { D = K.normalize(dd); lastSnap = JSON.stringify(D); PUB.hasDraft = true; updPub(); renderPane(); pushPreview(); toast('Version geladen. Prüfen, dann „Veröffentlichen“.'); });
        } })]));
    });
    if (!(PUB.versions || []).length) vbox.appendChild(el('p', { class: 'mono', text: 'Noch keine früheren Versionen.' }));
    box.appendChild(group('s-vers', 'Frühere Versionen', [vbox], false));
    box.appendChild(el('button', { class: 'btn', type: 'button', text: 'Abmelden', onclick: function () { (dirty ? save(true) : Promise.resolve()).then(function () { A.logout(); location.href = 'index.html'; }); } }));
    return box;
  }


  // ---------- Entwurf & Veröffentlichen ----------
  var PUB = { hasDraft: false, versions: [] };
  function updPub() {
    var b = $('pubBtn'); b.disabled = !PUB.hasDraft && !dirty; b.classList.toggle('has', PUB.hasDraft || dirty);
    b.textContent = PUB.hasDraft || dirty ? 'Veröffentlichen' : 'Alles online';
    $('discardBtn').hidden = !PUB.hasDraft;
  }
  function loadPub() { return A.publishStatus().then(function (s) { PUB = s; updPub(); if (PUB.hasDraft) setStatus('Entwurf vorhanden · noch nicht online', 'dirty'); }).catch(function () {}); }
  $('pubBtn').onclick = function () {
    var b = this; b.disabled = true; b.textContent = 'Wird veröffentlicht …';
    (dirty ? save(true) : Promise.resolve()).then(function () { return A.publish(); }).then(function () {
      PUB.hasDraft = false; updPub(); setStatus('✓ Online · ' + new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }), 'ok');
      toast('Veröffentlicht. Deine Website ist jetzt aktuell.'); loadPub();
    }).catch(function (x) { toast(x.message, true); updPub(); });
  };
  $('discardBtn').onclick = function () {
    var b = this;
    armDelete(b, function () {
      A.discard().then(function () { return A.getContent({ full: true }); }).then(function (d) {
        D = K.normalize(d); dirty = false; lastSnap = JSON.stringify(D); hist = []; fut = []; updUndo();
        PUB.hasDraft = false; updPub(); OPEN = null; renderPane(); pushPreview();
        setStatus('Entwurf verworfen · zeigt die Online-Fassung', 'ok'); toast('Entwurf verworfen. Du siehst wieder, was online ist.');
        b.textContent = 'Verwerfen';
      }).catch(function (x) { toast(x.message, true); });
    });
  };

  // ---------- Speichern ----------
  function updSaveBtn() { $('saveBtn').hidden = AUTOSAVE; }
  function save(quiet) {
    if (saving) { clearTimeout(saveTimer); saveTimer = setTimeout(function () { save(quiet); }, 800); return Promise.resolve(); }
    saving = true; clearTimeout(saveTimer);
    var b = $('saveBtn'); b.disabled = true; setStatus('Speichert …');
    var snap = JSON.stringify(D);
    return A.save(D).then(function () {
      if (JSON.stringify(D) === snap) dirty = false;
      PUB.hasDraft = true; updPub();
      setStatus(dirty ? 'Änderung …' : '✓ Entwurf gespeichert · noch nicht online', dirty ? 'dirty' : 'ok');
      if (!quiet) toast('Entwurf gespeichert. Besucher sehen ihn erst nach „Veröffentlichen“.');
    }).catch(function (e) {
      setStatus('Nicht gespeichert', 'err'); toast(e.message, true);
      if (e.status === 401) { A.logout(); showGate('Login abgelaufen. Bitte neu anmelden, deine Änderungen bleiben erhalten.'); }
    }).then(function () { saving = false; b.disabled = false; });
  }
  $('saveBtn').onclick = function () { save(false); };
  $('undoBtn').onclick = undo;
  $('redoBtn').onclick = redo;
  $('viewBtn').onclick = function (e) { if (!dirty) return; e.preventDefault(); save(true).then(function () { location.href = 'index.html'; }); };
  $('mobPrev').onclick = function () { $('work').classList.add('show-preview'); };
  $('closePrev').onclick = function () { $('work').classList.remove('show-preview'); };
  $('devBtns').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    [].forEach.call(this.children, function (x) { x.classList.toggle('on', x === b); });
    $('pstage').className = 'pstage ' + b.getAttribute('data-dev');
  });
  window.addEventListener('beforeunload', function (e) { if (dirty) { if (AUTOSAVE) save(true); e.preventDefault(); e.returnValue = ''; } });
  document.addEventListener('keydown', function (e) {
    var mod = e.metaKey || e.ctrlKey;
    if (mod && e.key.toLowerCase() === 's') { e.preventDefault(); save(false); }
    var typing = /INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '');
    if (mod && e.key.toLowerCase() === 'z' && !typing) { e.preventDefault(); e.shiftKey ? redo() : undo(); }
    if (e.key === 'Escape' && !typing && (OPEN || PICK != null)) { OPEN = null; PICK = null; OPEN_EL = null; renderPane(); pushPreview(); }
  });

  // ---------- Start ----------
  function showGate(msg) {
    $('gate').hidden = false; $('bar').hidden = true; $('work').hidden = true; $('gateErr').textContent = msg || '';
    $('gateHint').textContent = MODE === 'demo' ? 'Vorschau-Modus: Passwort ist „demo“.' : 'Passwort eingeben.';
    $('gatePw').focus();
  }
  $('gateForm').onsubmit = function (e) {
    e.preventDefault(); $('gateErr').textContent = '';
    A.login($('gatePw').value).then(function () { $('gate').hidden = true; start(); }).catch(function (x) { $('gateErr').textContent = x.message; });
  };
  function start() {
    $('bar').hidden = false; $('work').hidden = false; updSaveBtn();
    if (D) return;
    A.getContent({ full: true }).then(function (d) {
      D = K.normalize(d); lastSnap = JSON.stringify(D); updUndo(); loadInbox(); loadPub();
      setStatus('Geladen');
      RT.attach(document, { palette: function () { var t = D.theme; return [t.accent, t.fg, t.muted, t.bg, t.panel].concat(RT.usedColors(D.sections)); } });
      renderPane();
      $('frame').src = 'index.html?preview=1#jr-preview';
      ['display', 'body', 'mono'].forEach(function (role) { K.FONTS[role].forEach(function (f) { var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = K.fontCss(role, f.name); document.head.appendChild(l); }); });
    }).catch(function () { toast('Inhalte konnten nicht geladen werden.', true); });
  }
  A.mode().then(function (m) { MODE = m; if (A.token()) start(); else showGate(); });
})();
