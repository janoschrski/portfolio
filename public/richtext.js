/* Formatierter Text: sicheres HTML (nur erlaubte Auszeichnungen) und die Werkzeugleiste beim Markieren.
   Wird von Website (Vorschau) und Editor gemeinsam benutzt. */
(function () {
  var RT = {};
  var TAGS = { B: 1, STRONG: 1, I: 1, EM: 1, U: 1, S: 1, SPAN: 1, A: 1, BR: 1, P: 1, MARK: 1 };
  var STYLES = ['color', 'background-color', 'font-size', 'font-weight', 'font-style', 'text-decoration'];
  var CLASSES = { 'ta-mark': 1, 'ta-ul': 1, 'ta-glow': 1, 'ta-pop': 1 };

  RT.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  RT.isRich = function (s) { return typeof s === 'string' && /<(b|strong|i|em|u|s|span|a|br|p|mark)\b[^>]*>/i.test(s); };

  function safeHref(h) {
    h = String(h || '').trim();
    if (/^(https?:|mailto:|tel:|#|\/)/i.test(h) || /^[\w.-]+\.html(#.*)?$/i.test(h)) return h;
    if (/^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(h)) return 'https://' + h;
    return '';
  }
  function clean(node, doc) {
    var kids = [].slice.call(node.childNodes);
    kids.forEach(function (c) {
      if (c.nodeType === 3) return;
      if (c.nodeType !== 1) { c.remove(); return; }
      var tag = c.tagName;
      if (tag === 'DIV') { var p = doc.createElement('p'); while (c.firstChild) p.appendChild(c.firstChild); c.replaceWith(p); c = p; tag = 'P'; }
      if (tag === 'FONT') { var sp = doc.createElement('span'); if (c.getAttribute('color')) sp.style.color = c.getAttribute('color'); while (c.firstChild) sp.appendChild(c.firstChild); c.replaceWith(sp); c = sp; tag = 'SPAN'; }
      clean(c, doc);
      if (!TAGS[tag]) { while (c.firstChild) c.parentNode.insertBefore(c.firstChild, c); c.remove(); return; }
      var keep = {};
      if (tag === 'SPAN' || tag === 'MARK') {
        var st = [];
        STYLES.forEach(function (k) { var v = c.style.getPropertyValue(k); if (v && !/url\(|expression/i.test(v)) st.push(k + ':' + v); });
        if (st.length) keep.style = st.join(';');
        var cl = (c.getAttribute('class') || '').split(/\s+/).filter(function (x) { return CLASSES[x]; });
        if (cl.length) keep['class'] = cl.join(' ');
      }
      if (tag === 'A') { var h = safeHref(c.getAttribute('href')); if (h) { keep.href = h; if (/^https?:/i.test(h)) { keep.target = '_blank'; keep.rel = 'noopener'; } } }
      [].slice.call(c.attributes).forEach(function (a) { c.removeAttribute(a.name); });
      for (var k in keep) c.setAttribute(k, keep[k]);
      if (tag === 'SPAN' && !c.attributes.length) { while (c.firstChild) c.parentNode.insertBefore(c.firstChild, c); c.remove(); }
    });
  }
  RT.sanitize = function (html) {
    var doc = document.implementation.createHTMLDocument('');
    var box = doc.createElement('div'); box.innerHTML = String(html || '');
    clean(box, doc);
    return box.innerHTML;
  };
  RT.plain = function (s) {
    if (!RT.isRich(s)) return String(s == null ? '' : s);
    var d = document.implementation.createHTMLDocument('').createElement('div');
    d.innerHTML = String(s).replace(/<br\s*\/?>/gi, ' ').replace(/<\/p>/gi, ' ');
    return d.textContent.replace(/\s+/g, ' ').trim();
  };
  // Einzeilig/inline anzeigen
  RT.inline = function (s) {
    if (!RT.isRich(s)) return RT.esc(s).replace(/\n/g, '<br>');
    return RT.sanitize(s).replace(/<p>/gi, '').replace(/<\/p>/gi, '<br>').replace(/(<br>)+$/i, '');
  };
  // Absätze anzeigen
  RT.block = function (s) {
    if (!RT.isRich(s)) {
      return String(s || '').split(/\n\s*\n/).filter(function (p) { return p.trim(); })
        .map(function (p) { return '<p>' + RT.esc(p.trim()).replace(/\n/g, '<br>') + '</p>'; }).join('');
    }
    var h = RT.sanitize(s);
    if (!/<p>/i.test(h)) h = h.split(/(?:<br>\s*){2,}/i).map(function (p) { return '<p>' + p + '</p>'; }).join('');
    return h;
  };
  // Wert aus einem bearbeitbaren Feld lesen: ohne Formatierung als einfacher Text, sonst als sicheres HTML
  RT.toValue = function (el, multiline) {
    var h = RT.sanitize(el.innerHTML);
    var hasFmt = /<(b|strong|i|em|u|s|span|a|mark)\b/i.test(h);
    if (!hasFmt) {
      var d = document.createElement('div'); d.innerHTML = h.replace(/<br\s*\/?>/gi, '\n').replace(/<p>/gi, '').replace(/<\/p>/gi, '\n\n');
      var t = d.textContent.replace(/ /g, ' ').replace(/\n{3,}/g, '\n\n').replace(/\n+$/, '');
      return multiline ? t : t.replace(/\n/g, ' ');
    }
    return multiline ? h.replace(/(<br>)+$/i, '') : h.replace(/<\/?p>/gi, '').replace(/<br>/gi, ' ');
  };
  RT.fill = function (el, v, multiline) {
    if (RT.isRich(v)) el.innerHTML = multiline ? RT.block(v) : RT.inline(v);
    else el.innerHTML = multiline ? RT.block(v) : RT.esc(v || '');
  };
  // Alle Farben, die im Inhalt schon vorkommen
  RT.usedColors = function (obj) {
    var s = JSON.stringify(obj || {}), seen = {}, out = [];
    (s.match(/#[0-9a-f]{6}\b/gi) || []).concat((s.match(/rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/gi) || []).map(rgbHex)).forEach(function (c) {
      c = c.toLowerCase(); if (!seen[c]) { seen[c] = 1; out.push(c); }
    });
    return out;
  };
  function rgbHex(r) { var m = r.match(/\d+/g); return '#' + m.slice(0, 3).map(function (n) { return ('0' + (+n).toString(16)).slice(-2); }).join(''); }

  // ---------- Werkzeugleiste ----------
  var CSS = '.rt-bar{position:fixed;z-index:2147483000;display:flex;align-items:center;gap:2px;padding:4px;background:#16191c;color:#ebe7e0;border:1px solid #333b40;box-shadow:0 10px 30px rgba(0,0,0,.45);font:13px/1 system-ui,sans-serif;border-radius:6px;user-select:none}' +
    '.rt-bar[hidden]{display:none}.rt-bar button{all:unset;box-sizing:border-box;min-width:28px;height:28px;padding:0 7px;display:inline-flex;align-items:center;justify-content:center;gap:4px;border-radius:4px;cursor:pointer;color:#ebe7e0;font:inherit;white-space:nowrap}' +
    '.rt-bar button:hover,.rt-bar button.on{background:#2a3136}.rt-bar .sep{width:1px;height:18px;background:#333b40;margin:0 3px}.rt-bar .sw{width:14px;height:14px;border-radius:3px;border:1px solid rgba(255,255,255,.35)}' +
    '.rt-pop{position:fixed;z-index:2147483001;background:#16191c;color:#ebe7e0;border:1px solid #333b40;box-shadow:0 10px 30px rgba(0,0,0,.45);padding:10px;border-radius:6px;font:12px/1.3 system-ui,sans-serif;width:236px}' +
    '.rt-pop h6{all:unset;display:block;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#8f999d;margin:2px 0 6px}.rt-pop .grid{display:grid;grid-template-columns:repeat(8,1fr);gap:5px;margin-bottom:10px}' +
    '.rt-pop .c{all:unset;box-sizing:border-box;width:22px;height:22px;border-radius:4px;cursor:pointer;border:1px solid rgba(255,255,255,.25)}.rt-pop .c:hover{outline:2px solid #fff;outline-offset:1px}' +
    '.rt-pop .row{display:flex;gap:6px;align-items:center;flex-wrap:wrap}.rt-pop .opt{all:unset;cursor:pointer;padding:6px 8px;border:1px solid #333b40;border-radius:4px}.rt-pop .opt:hover{border-color:#ebe7e0}' +
    '.rt-pop input[type=color]{width:30px;height:24px;border:0;padding:0;background:none;cursor:pointer}.rt-pop input[type=text]{all:unset;box-sizing:border-box;flex:1;min-width:0;padding:6px 8px;border:1px solid #333b40;border-radius:4px;background:#0e1113}' +
    '.rt-pop .list{display:flex;flex-direction:column;gap:4px}';

  RT.attach = function (doc, opts) {
    opts = opts || {};
    if (doc._rtBar) return;
    var st = doc.createElement('style'); st.textContent = CSS; doc.head.appendChild(st);
    var bar = doc.createElement('div'); bar.className = 'rt-bar'; bar.hidden = true; bar.setAttribute('role', 'toolbar'); bar.setAttribute('aria-label', 'Text formatieren');
    var pop = doc.createElement('div'); pop.className = 'rt-pop'; pop.hidden = true;
    doc.body.appendChild(bar); doc.body.appendChild(pop);
    doc._rtBar = bar;
    var saved = null, root = null;

    function b(label, title, fn, extra) {
      var x = doc.createElement('button'); x.type = 'button'; x.title = title; x.setAttribute('aria-label', title); x.innerHTML = label;
      x.addEventListener('mousedown', function (e) { e.preventDefault(); });
      x.addEventListener('click', function (e) { e.preventDefault(); restore(); fn(x); });
      if (extra) extra(x);
      bar.appendChild(x); return x;
    }
    function sep() { var s = doc.createElement('span'); s.className = 'sep'; bar.appendChild(s); }
    function sel() { return doc.getSelection(); }
    function restore() { if (saved) { var s = sel(); s.removeAllRanges(); s.addRange(saved); } }
    function editableRoot(node) { while (node && node !== doc.body) { if (node.nodeType === 1 && node.hasAttribute('data-rich') && node.isContentEditable) return node; node = node.parentNode; } return null; }
    function fire() { if (root) root.dispatchEvent(new Event('input', { bubbles: true })); }
    function wrap(style, cls) {
      var s = sel(); if (!s.rangeCount) return; var r = s.getRangeAt(0); if (r.collapsed) return;
      var span = doc.createElement('span');
      for (var k in style) span.style.setProperty(k, style[k]);
      if (cls) span.className = cls;
      span.appendChild(r.extractContents());
      [].forEach.call(span.querySelectorAll('span'), function (x) {
        for (var k in style) x.style.removeProperty(k);
        if (cls) x.classList.remove(cls);
        if (!x.getAttribute('style') && !x.className) { while (x.firstChild) x.parentNode.insertBefore(x.firstChild, x); x.remove(); }
      });
      r.insertNode(span);
      s.removeAllRanges(); var nr = doc.createRange(); nr.selectNodeContents(span); s.addRange(nr); saved = nr.cloneRange();
      fire(); place();
    }
    function exec(cmd, val) { try { doc.execCommand('styleWithCSS', false, false); } catch (e) {} doc.execCommand(cmd, false, val); saved = sel().rangeCount ? sel().getRangeAt(0).cloneRange() : null; fire(); }
    function clear() {
      var s = sel(); if (!s.rangeCount) return; var r = s.getRangeAt(0);
      var t = doc.createTextNode(r.toString()); r.deleteContents(); r.insertNode(t);
      s.removeAllRanges(); var nr = doc.createRange(); nr.selectNode(t); s.addRange(nr); saved = nr.cloneRange(); fire();
    }
    function palette() {
      var list = [], seen = {};
      (opts.palette ? opts.palette() : []).concat(['#ffffff', '#000000', '#e5483b', '#f2a33a', '#f5d547', '#5fbf8a', '#3fb8c9', '#5b8cff', '#a970ff', '#ff6fa8']).forEach(function (c) {
        c = String(c || '').toLowerCase(); if (/^#[0-9a-f]{6}$/.test(c) && !seen[c]) { seen[c] = 1; list.push(c); }
      });
      return list;
    }
    function showPop(anchor, build) {
      pop.innerHTML = ''; build(pop); pop.hidden = false;
      var r = anchor.getBoundingClientRect(), w = pop.offsetWidth, vw = doc.documentElement.clientWidth;
      pop.style.left = Math.max(8, Math.min(vw - w - 8, r.left)) + 'px';
      pop.style.top = (r.bottom + 6) + 'px';
    }
    function colorPop(anchor, prop, title) {
      showPop(anchor, function (p) {
        var used = opts.palette ? opts.palette() : [];
        p.innerHTML = '<h6>' + title + ' · Design & schon benutzt</h6>';
        var g = doc.createElement('div'); g.className = 'grid';
        palette().forEach(function (c, i) {
          if (i === used.length && i) { p.appendChild(g); var h = doc.createElement('h6'); h.textContent = 'Weitere'; p.appendChild(h); g = doc.createElement('div'); g.className = 'grid'; }
          var x = doc.createElement('button'); x.type = 'button'; x.className = 'c'; x.style.background = c; x.title = c;
          x.addEventListener('mousedown', function (e) { e.preventDefault(); });
          x.addEventListener('click', function () { restore(); var o = {}; o[prop] = c; wrap(o); pop.hidden = true; });
          g.appendChild(x);
        });
        p.appendChild(g);
        var row = doc.createElement('div'); row.className = 'row';
        var ci = doc.createElement('input'); ci.type = 'color'; ci.value = '#d6363d'; ci.title = 'Eigene Farbe';
        ci.addEventListener('change', function () { restore(); var o = {}; o[prop] = ci.value; wrap(o); pop.hidden = true; });
        var lbl = doc.createElement('span'); lbl.textContent = 'Eigene Farbe';
        var none = doc.createElement('button'); none.type = 'button'; none.className = 'opt'; none.textContent = 'Entfernen';
        none.addEventListener('mousedown', function (e) { e.preventDefault(); });
        none.addEventListener('click', function () { restore(); var o = {}; o[prop] = 'inherit'; if (prop === 'background-color') o[prop] = 'transparent'; wrap(o); pop.hidden = true; });
        row.appendChild(ci); row.appendChild(lbl); row.appendChild(none); p.appendChild(row);
      });
    }
    function optPop(anchor, title, items) {
      showPop(anchor, function (p) {
        p.innerHTML = '<h6>' + title + '</h6>';
        var l = doc.createElement('div'); l.className = 'list';
        items.forEach(function (it) {
          var x = doc.createElement('button'); x.type = 'button'; x.className = 'opt'; x.innerHTML = it[0];
          x.addEventListener('mousedown', function (e) { e.preventDefault(); });
          x.addEventListener('click', function () { restore(); it[1](); pop.hidden = true; });
          l.appendChild(x);
        });
        p.appendChild(l);
      });
    }

    b('<b>B</b>', 'Fett', function () { exec('bold'); });
    b('<i>I</i>', 'Kursiv', function () { exec('italic'); });
    b('<u>U</u>', 'Unterstrichen', function () { exec('underline'); });
    sep();
    b('<span class="sw" style="background:conic-gradient(#e5483b,#f5d547,#5fbf8a,#5b8cff,#a970ff,#e5483b)"></span>A', 'Textfarbe', function (x) { colorPop(x, 'color', 'Textfarbe'); });
    b('<span class="sw" style="background:#f5d547"></span>▮', 'Hinterlegen (Marker)', function (x) { colorPop(x, 'background-color', 'Hinterlegen'); });
    b('Aa ▾', 'Größe', function (x) {
      optPop(x, 'Größe', [['<span style="font-size:11px">Klein</span>', function () { wrap({ 'font-size': '.8em' }); }], ['Normal', function () { wrap({ 'font-size': '1em' }); }],
        ['<span style="font-size:16px">Groß</span>', function () { wrap({ 'font-size': '1.3em' }); }], ['<span style="font-size:20px">Sehr groß</span>', function () { wrap({ 'font-size': '1.7em' }); }]]);
    });
    b('✦ ▾', 'Animation', function (x) {
      optPop(x, 'Animation beim Einblenden', [
        ['<span style="background:linear-gradient(#d6363d88,#d6363d88) no-repeat 0 85%/100% 40%">Marker zieht durch</span>', function () { wrap({}, 'ta-mark'); }],
        ['<span style="border-bottom:2px solid currentColor">Linie zeichnet sich</span>', function () { wrap({}, 'ta-ul'); }],
        ['<span style="text-shadow:0 0 10px #fff">Leuchtet auf</span>', function () { wrap({}, 'ta-glow'); }],
        ['Springt hoch', function () { wrap({}, 'ta-pop'); }],
        ['Keine Animation', function () { var s = sel(); if (!s.rangeCount) return; var c = s.getRangeAt(0).commonAncestorContainer; var n = c.nodeType === 1 ? c : c.parentNode; [].concat(n.closest ? [n.closest('[class*=ta-]')] : []).concat([].slice.call(n.querySelectorAll ? n.querySelectorAll('[class*=ta-]') : [])).forEach(function (e) { if (e && root.contains(e)) e.className = ''; }); fire(); }]
      ]);
    });
    sep();
    b('Link', 'Link', function (x) {
      showPop(x, function (p) {
        p.innerHTML = '<h6>Link</h6>';
        var row = doc.createElement('div'); row.className = 'row';
        var i = doc.createElement('input'); i.type = 'text'; i.placeholder = 'https://… oder #kontakt';
        var ok = doc.createElement('button'); ok.type = 'button'; ok.className = 'opt'; ok.textContent = 'OK';
        function go() { var h = safeHref(i.value); restore(); if (h) exec('createLink', h); pop.hidden = true; }
        ok.addEventListener('click', go); i.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); go(); } });
        row.appendChild(i); row.appendChild(ok); p.appendChild(row); setTimeout(function () { i.focus(); }, 0);
      });
    });
    b('⌫', 'Formatierung entfernen', function () { clear(); });

    function place() {
      var s = sel();
      if (!s.rangeCount || s.isCollapsed) { if (!pop.contains(doc.activeElement)) { bar.hidden = true; pop.hidden = true; } return; }
      var r = s.getRangeAt(0), rr = editableRoot(r.commonAncestorContainer);
      if (!rr) { if (!pop.contains(doc.activeElement)) { bar.hidden = true; pop.hidden = true; } return; }
      root = rr; saved = r.cloneRange();
      var rect = r.getBoundingClientRect(); bar.hidden = false;
      var vw = doc.documentElement.clientWidth, w = bar.offsetWidth;
      bar.style.left = Math.max(8, Math.min(vw - w - 8, rect.left + rect.width / 2 - w / 2)) + 'px';
      var top = rect.top - bar.offsetHeight - 10; if (top < 6) top = rect.bottom + 10;
      bar.style.top = top + 'px';
    }
    doc.addEventListener('selectionchange', function () { clearTimeout(doc._rtT); doc._rtT = setTimeout(place, 30); });
    doc.addEventListener('mousedown', function (e) { if (!pop.contains(e.target) && !bar.contains(e.target)) pop.hidden = true; });
    (doc.defaultView || window).addEventListener('scroll', function () { if (!bar.hidden) place(); pop.hidden = true; }, true);
  };

  // Ein Element bearbeitbar machen (Enter verhindern bei einzeiligen Feldern, nur Text einfügen)
  RT.editable = function (el, multiline) {
    el.setAttribute('contenteditable', 'true');
    el.setAttribute('data-rich', '');
    el.setAttribute('spellcheck', 'true');
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !multiline) { e.preventDefault(); el.blur(); }
      if (e.key === 'Enter' && multiline && !e.shiftKey) { e.preventDefault(); el.ownerDocument.execCommand('insertParagraph'); }
    });
    el.addEventListener('paste', function (e) {
      e.preventDefault();
      var t = (e.clipboardData || window.clipboardData).getData('text/plain');
      if (!multiline) t = t.replace(/\s*\n\s*/g, ' ');
      el.ownerDocument.execCommand('insertText', false, t);
    });
  };

  window.RT = RT;
})();
