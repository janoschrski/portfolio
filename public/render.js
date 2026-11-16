/* Baut die komplette Website aus den Inhalten (content.json bzw. gespeicherte Version). */
(function () {
  var A = window.SiteAPI, K = window.Kit, esc = A.esc;
  var PREVIEW = /[?&]preview\b/.test(location.search) || location.hash === '#jr-preview';
  var DATA = null, MODE = 'live', SELECTED = null, SELECTED_EL = null, ANIM_ON = !PREVIEW;
  var page = document.getElementById('page');

  // ---------- Hilfen ----------
  function safeLink(u) {
    u = String(u || '').trim();
    if (!u) return '';
    if (/^(https?:|mailto:|tel:|#|\/|[\w.-]+\.html)/i.test(u)) return u;
    if (/^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(u)) return 'https://' + u;
    return '';
  }
  function paras(t) {
    return String(t || '').split(/\n\s*\n/).filter(function (p) { return p.trim(); })
      .map(function (p) { return '<p>' + esc(p.trim()).replace(/\n/g, '<br>') + '</p>'; }).join('');
  }
  // Ein Button: Stil (gefüllt/umrandet/nur Text), Größe, eigene Farbe
  function btnHTML(b, defStyle, attrs) {
    if (!b || !b.label) return '';
    var act = K.btnAction(b), href = '#', ext = '', jcls = '', v = act.v;
    if (act.a === 'section') href = '#' + v;
    else if (act.a === 'url') { href = safeLink(v) || '#'; if (/^https?:/i.test(href)) ext = ' target="_blank" rel="noopener"'; }
    else if (act.a === 'mail') href = 'mailto:' + v;
    else if (act.a === 'phone') href = 'tel:' + String(v).replace(/[^\d+]/g, '');
    else if (act.a === 'copy') { jcls = ' js-copybtn'; ext = ' data-copy="' + esc(v) + '"'; }
    else if (act.a === 'showreel') jcls = ' js-reel';
    else if (act.a === 'file') { href = safeLink(v) || '#'; ext = ' download target="_blank" rel="noopener"'; }
    else if (act.a === 'code') jcls = ' js-code';
    if (PREVIEW) ext += ' title="' + esc('Klick: ' + K.btnSummary(b, DATA)) + '"';
    var st = b.style || defStyle || 'outline', css = '';
    if (/^#[0-9a-f]{6}$/i.test(b.color || '')) css += '--bc:' + b.color + ';--bt:' + (/^#[0-9a-f]{6}$/i.test(b.textColor || '') ? b.textColor : (lum(b.color) > .45 ? '#111111' : '#ffffff')) + ';';
    else if (/^#[0-9a-f]{6}$/i.test(b.textColor || '')) css += '--bt:' + b.textColor + ';';
    return '<a class="btn bs-' + esc(st) + ' bz-' + esc(b.size || 'm') + (st === 'primary' ? ' primary' : '') + (css ? ' has-c' : '') + jcls + '"' + (attrs || '') + (css ? ' style="' + css + '"' : '') + ' href="' + esc(href) + '"' + ext + '>' + esc(b.label) + '</a>';
  }
  function btn(b, primary) { return btnHTML(b, primary ? 'primary' : 'outline'); }
  function head(title, intro) {
    if (!title && !intro) return '';
    return '<div class="sec-head">' + (title ? '<h2>' + esc(title) + '<span class="dot">.</span></h2>' : '') + (intro ? (intro.length > 40 ? '<p>' + esc(intro) + '</p>' : '<span class="mono">' + esc(intro) + '</span>') : '') + '</div>';
  }
  function hexToRgb(h) { h = String(h || '').replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&'); var n = parseInt(h, 16); return isNaN(n) ? [0, 0, 0] : [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function lum(h) { var c = hexToRgb(h).map(function (v) { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; }
  function mix(a, b, p) { var x = hexToRgb(a), y = hexToRgb(b); return '#' + x.map(function (v, i) { return ('0' + Math.round(v * (1 - p) + y[i] * p).toString(16)).slice(-2); }).join(''); }

  // ---------- Design anwenden ----------
  var lastFonts = '';
  function applyTheme(t) {
    var r = document.documentElement, st = r.style;
    var set = function (k, v) { st.setProperty(k, v); };
    ['bg', 'panel', 'line', 'fg', 'muted', 'accent'].forEach(function (k) { set('--' + k, t[k]); });
    set('--base-bg', t.bg);
    set('--on-accent', lum(t.accent) > .45 ? '#111111' : '#ffffff');
    var fd = K.font('display', t.fontDisplay), fb = K.font('body', t.fontBody), fm = K.font('mono', t.fontMono);
    set('--display', '"' + fd.name + '",' + fd.fb);
    set('--body', '"' + fb.name + '",' + fb.fb);
    set('--mono', '"' + fm.name + '",' + fm.fb);
    set('--hcase', t.headingUpper ? 'uppercase' : 'none');
    set('--hweight', String(t.headingWeight || 800));
    set('--hstretch', (fd.stretch ? (t.headingStretch || 100) : 100) + '%');
    set('--hs', String((t.headingScale || 100) / 100));
    set('--radius', (t.radius || 0) + 'px');
    set('--maxw', (t.maxWidth || 1240) + 'px');
    set('--base', (t.baseSize || 16) + 'px');
    st.colorScheme = lum(t.bg) > .4 ? 'light' : 'dark';
    r.classList.toggle('no-motion', t.motion === false);
    [['display', t.fontDisplay], ['body', t.fontBody], ['mono', t.fontMono]].forEach(function (x) {
      var id = 'font-' + x[0], l = document.getElementById(id), href = K.fontCss(x[0], x[1]);
      if (!l) { l = document.createElement('link'); l.rel = 'stylesheet'; l.id = id; document.head.appendChild(l); }
      if (l.getAttribute('href') !== href) l.setAttribute('href', href);
    });
  }
  function invertedStyle(t) {
    return '--bg:' + t.fg + ';--fg:' + t.bg + ';--panel:' + mix(t.fg, t.bg, .08) + ';--line:' + mix(t.fg, t.bg, .18) + ';--muted:' + mix(t.bg, t.fg, .45) + ';';
  }

  // ---------- Abschnitte ----------
  var R = {};

  // data-f = welches Feld, data-item = welcher Eintrag einer Liste, data-list = welche Liste (für „Klick → Einstellung“ im Editor)
  function rt(v) { return RT.inline(v); }
  function fa(k) { return ' data-f="' + k + '"'; }
  function ia(i, list) { return ' data-item="' + i + '"' + (list && list !== 'items' ? ' data-list="' + list + '"' : ''); }
  function btnF(b, primary, k) { var h = btn(b, primary); return h ? h.replace('<a ', '<a' + fa(k) + ' ') : ''; }
  function headF(title, intro) {
    if (!title && !intro) return '';
    return '<div class="sec-head">' + (title ? '<h2><span' + fa('title') + ' data-rich>' + rt(title) + '</span><span class="dot">.</span></h2>' : '') + (intro ? (intro.length > 40 ? '<p' + fa('intro') + ' data-rich data-ml>' + rt(intro) + '</p>' : '<span class="mono"' + fa('intro') + ' data-rich>' + rt(intro) + '</span>') : '') + '</div>';
  }

  R.hero = function (s) {
    var playable = !!(A.ytId(s.youtube) || s.video);
    return '<div class="frame"' + fa('image') + ' style="--ratio:' + esc(s.ratio || '2.39/1') + '">' +
      (s.image ? '<img src="' + esc(s.image) + '" alt="" fetchpriority="high">' : '') +
      ((DATA.theme.grain !== false) ? '<canvas class="grain" aria-hidden="true"></canvas>' : '') +
      (s.viewfinder ? '<div class="vf" aria-hidden="true"><span class="c tl"></span><span class="c tr"></span><span class="c bl"></span><span class="c br"></span>' +
        '<div class="top"><span class="rec"><i></i>REC</span><span class="hide-s">4K · 25P · 180°</span><span>ISO 800</span></div>' +
        '<div class="bot"><span class="tc-run">00:00:00:00</span><span class="hide-s">3200K · REC.709</span><span>' + esc(String(s.ratio || '2.39/1').replace('/', ' : ')) + '</span></div></div>' : '') +
      (playable ? '<button class="play js-showreel"' + fa('youtube') + ' type="button" data-sid="' + esc(s.id) + '"><b></b>' + esc(s.playLabel || 'Abspielen') + '</button>' : '') +
      '</div>' +
      ((s.title || s.text || s.button1 && s.button1.label) ? '<div class="hero-text"><h1><span' + fa('title') + ' data-rich>' + rt(s.title) + '</span>' + (s.highlight ? ' <em' + fa('highlight') + ' data-rich>' + rt(s.highlight) + '</em>' : '') + '</h1>' +
        '<div>' + (s.text ? '<p class="lede"' + fa('text') + ' data-rich data-ml>' + rt(s.text) + '</p>' : '') + '<div class="btns">' + btnF(s.button1, true, 'button1') + btnF(s.button2, false, 'button2') + '</div></div></div>' : '') +
      ((s.facts || []).length ? '<div class="facts"' + fa('facts') + '>' + s.facts.map(function (f) { return '<span class="mono">' + esc(f) + '</span>'; }).join('') + '</div>' : '');
  };

  function stillHTML(f, key) {
    var id = A.ytId(f.youtube), playable = !!(id || f.video);
    var p = f.image || (id ? A.ytThumb(id) : '');
    return '<div class="still' + (playable ? ' playable' : '') + '" data-key="' + esc(key) + '"' + fa(f.image ? 'image' : 'youtube') + '>' +
      (playable ? '<button class="still-btn" type="button" aria-label="' + esc(f.title || 'Video') + ' abspielen"></button>' : '') +
      (p ? '<img src="' + esc(p) + '" alt="' + esc(f.title ? 'Standbild aus ' + RT.plain(f.title) : '') + '" loading="lazy">' : '<div class="noimg mono">Kein Bild</div>') +
      (playable ? '<span class="pb"></span>' : '') +
      (f.badge ? '<span class="fmt"' + fa('badge') + '>' + esc(f.badge).toUpperCase() + '</span>' : '') +
      (f.date ? '<span class="tc">' + esc(f.date) + '</span>' : '') + '</div>';
  }

  // ---------- NDA, geschützt, geplant ----------
  var LOCK = '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="4.5" y="10.5" width="15" height="10" rx="1.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/></svg>';
  function dmy(d) { var p = String(d || '').split('-'); return p.length === 3 ? p[2] + '.' + p[1] + '.' + p[0] : d; }
  function isNda(o) { return o.nda || o.visibility === 'nda'; }
  function visTag(o) {
    if (!PREVIEW) return '';
    var t = [];
    if (o.visibility === 'code') t.push('Nur mit Code' + (o.code ? ' · ' + esc(o.code) : ''));
    if (o.visibility === 'nda') t.push('NDA: Besucher sehen keine Bilder/Videos');
    if (o.publishAt && o.publishAt > K.today()) t.push('Erscheint am ' + esc(dmy(o.publishAt)));
    return t.length ? '<span class="vis-tag">' + t.join(' · ') + '</span>' : '';
  }
  function ndaBox(o, wide) {
    return '<div class="still ndabox' + (wide ? ' wide' : '') + '"' + fa('ndaNote') + '><div class="lk">' + LOCK + '<b>Vertraulich</b><span class="mono">' + esc(o.ndaNote || 'Release folgt') + '</span></div>' + visTag(o) + '</div>';
  }
  function lockBox(o, wide) {
    return '<div class="still lockbox' + (wide ? ' wide' : '') + '"><div class="lk">' + LOCK + '<b>Geschützt</b><span class="mono">Für Kunden mit Zugangscode</span><button class="btn bz-s js-code" type="button">Code eingeben</button></div></div>';
  }

  R.films = function (s) {
    return headF(s.title, s.intro) + '<div class="films ' + esc(s.layout || 'alternating') + '">' + (s.items || []).map(function (f, i) {
      var roles = (f.roles || []).filter(Boolean).map(function (r) { return '<span class="chip">' + esc(r) + '</span>'; }).join('');
      if (f.locked) return '<article class="film locked"' + ia(i) + '>' + lockBox(f) + '<div class="film-info">' +
        '<div class="kicker">' + (f.kind ? '<span class="mono">' + rt(f.kind) + '</span>' : '') + (f.date ? '<span class="mono">' + rt(f.date) + '</span>' : '') + '</div>' +
        '<h3>' + rt(f.title) + (f.subtitle ? '<small>' + rt(f.subtitle) + '</small>' : '') + '</h3><p class="crew">Dieses Projekt ist nur mit Zugangscode sichtbar.</p></div></article>';
      var stl = isNda(f) ? ndaBox(f) : stillHTML(f, s.id + ':' + i).replace('</div>', visTag(f) + '</div>');
      var pend = PREVIEW && f.publishAt && f.publishAt > K.today() ? ' pending' : '';
      return '<article class="film' + pend + '"' + ia(i) + '>' + stl + '<div class="film-info">' +
        '<div class="kicker">' + (f.kind ? '<span class="mono"' + fa('kind') + ' data-rich>' + rt(f.kind) + '</span>' : '') + (f.date ? '<span class="mono"' + fa('date') + '>' + esc(f.date) + '</span>' : '') + '</div>' +
        '<h3><span' + fa('title') + ' data-rich>' + rt(f.title) + '</span>' + (f.subtitle ? '<small' + fa('subtitle') + ' data-rich>' + rt(f.subtitle) + '</small>' : '') + '</h3>' +
        (f.text ? '<p' + fa('text') + ' data-rich data-ml>' + rt(f.text) + '</p>' : '') +
        (roles ? '<div class="role"' + fa('roles') + '><span class="mono">Meine Rolle</span>' + roles + '</div>' : '') +
        (f.crew ? '<p class="crew"' + fa('crew') + ' data-rich>' + rt(f.crew) + '</p>' : '') + '</div></article>';
    }).join('') + '</div>';
  };

  R.video = function (s) {
    var r = s.ratio || '16/9', cls = r === '9/16' ? ' portrait' : r === '1/1' ? ' square' : '';
    return headF(s.title) + (s.text ? '<p class="video-intro"' + fa('text') + ' data-rich data-ml>' + rt(s.text) + '</p>' : '') +
      '<div class="vbox' + cls + '" style="--ratio:' + esc(r) + '">' + stillHTML({ title: s.title, youtube: s.youtube, video: s.video, image: s.image }, s.id + ':v') + '</div>';
  };


  // ---------- Foto-Raster ohne Lücken, mit „Alle ansehen“ ----------
  var GALS = {};
  function gridHTML(photos, o) {
    var masonry = o.ratio === 'auto', q = String(o.ratio || '4/5').split('/'), a = +q[0] || 4, b = +q[1] || 5;
    var limit = +o.limit || 0, list = photos.slice(0, limit && photos.length > limit ? limit : photos.length);
    var units = list.reduce(function (n, p) { return n + (p.wide && !masonry ? 2 : 1); }, 0);
    var cols = Math.max(1, Math.min(+o.cols || 4, units || 1)), spans = list.map(function (p) { return p.wide && !masonry ? Math.min(2, cols) : 1; });
    if (!masonry) { // letzte Reihe auffüllen
      var pos = 0; spans.forEach(function (s, i) { if (pos + s > cols) pos = 0; pos = (pos + s) % cols; });
      if (pos) spans[spans.length - 1] += cols - pos;
    }
    var html = '<div class="grid' + (masonry ? ' masonry' : '') + '"' + fa('photos') + ' style="--cols:' + cols + ';--gap:' + (o.gap == null ? 10 : +o.gap) + 'px;--pr:' + a + '/' + b + ';--pb:' + a + '/' + b + ';--pb2:' + (2 * a) + '/' + b + '">' +
      list.map(function (p, i) {
        var st = !masonry && spans[i] > 1 ? ' style="grid-column:span ' + spans[i] + ';--pr:' + (spans[i] * a) + '/' + b + '"' : '';
        return '<button class="ph js-photo' + (spans[i] > 1 ? ' wide' : '') + '" type="button"' + st + '><img src="' + esc(p.src) + '" alt="' + esc(p.alt || RT.plain(o.title || '')) + '" loading="lazy"></button>';
      }).join('') + '</div>';
    if (list.length < photos.length) {
      var gid = 'g' + Object.keys(GALS).length; GALS[gid] = { title: RT.plain(o.title || ''), photos: photos };
      html += '<div class="more-row"><button class="btn js-more" type="button" data-g="' + gid + '">Alle ' + photos.length + ' Fotos ansehen</button></div>';
    }
    return html;
  }

  R.photos = function (s) {
    return headF(s.title, s.intro) + '<div class="series">' + (s.items || []).map(function (x, i) {
      var sh = (x.title || x.text) ? '<div class="series-head">' + (x.title ? '<h3' + fa('title') + ' data-rich>' + rt(x.title) + '</h3>' : '') + (x.text && !x.locked ? '<p' + fa('text') + ' data-rich data-ml>' + rt(x.text) + '</p>' : '') + '</div>' : '';
      if (x.locked) return '<div' + ia(i) + '>' + sh + lockBox(x, true) + '</div>';
      if (isNda(x)) return '<div' + ia(i) + '>' + sh + ndaBox(x, true) + '</div>';
      if (!(x.photos || []).length) return '';
      return '<div' + ia(i) + '>' + ((x.title || x.text) ? '<div class="series-head">' + (x.title ? '<h3' + fa('title') + ' data-rich>' + rt(x.title) + '</h3>' : '') + (x.text ? '<p' + fa('text') + ' data-rich data-ml>' + rt(x.text) + '</p>' : '') + '</div>' : '') +
        gridHTML(x.photos, { cols: s.columns, ratio: s.ratio, gap: s.gap, limit: s.limit, title: x.title }) + (PREVIEW && visTag(x) ? '<div style="margin-top:8px">' + visTag(x) + '</div>' : '') + '</div>';
    }).join('') + '</div>';
  };

  R.text = function (s) {
    return '<div class="text-block size-' + esc(s.size || 'm') + '">' + (s.eyebrow ? '<span class="mono accent"' + fa('eyebrow') + ' data-rich>' + rt(s.eyebrow) + '</span>' : '') +
      (s.title ? '<h2><span' + fa('title') + ' data-rich>' + rt(s.title) + '</span><span class="dot">.</span></h2>' : '') + '<div class="body"' + fa('body') + ' data-rich data-ml>' + RT.block(s.body) + '</div>' +
      (s.button1 && s.button1.label ? '<div class="btns">' + btnF(s.button1, true, 'button1') + '</div>' : '') + '</div>';
  };

  R.textImage = function (s) {
    var r = s.imageRatio || '4/5';
    return '<div class="ti ' + (s.imageSide === 'right' ? 'right' : 'left') + '">' +
      '<div class="ti-img' + (r === 'auto' ? ' auto' : '') + '"' + fa('image') + ' style="--ir:' + esc(r) + '">' + (s.image ? '<img src="' + esc(s.image) + '" alt="' + esc(RT.plain(s.caption || s.title || '')) + '" loading="lazy">' : '<div class="noimg mono" style="display:grid;place-items:center;height:100%">Bild einfügen</div>') +
        (s.caption ? '<span class="mono cap"' + fa('caption') + ' data-rich>' + rt(s.caption) + '</span>' : '') + '</div>' +
      '<div class="ti-text">' + (s.eyebrow ? '<span class="mono accent"' + fa('eyebrow') + ' data-rich>' + rt(s.eyebrow) + '</span>' : '') +
        (s.title ? '<h2><span' + fa('title') + ' data-rich>' + rt(s.title) + '</span><span class="dot">.</span></h2>' : '') + '<div class="body"' + fa('body') + ' data-rich data-ml>' + RT.block(s.body) + '</div>' +
        ((s.facts || []).length ? '<dl class="kit">' + s.facts.map(function (f, i) { return '<dt' + ia(i, 'facts') + fa('label') + ' data-rich>' + rt(f.label) + '</dt><dd' + ia(i, 'facts') + fa('value') + '>' + esc(f.value) + '</dd>'; }).join('') + '</dl>' : '') +
        (s.button1 && s.button1.label ? '<div class="btns">' + btnF(s.button1, true, 'button1') + '</div>' : '') + '</div></div>';
  };

  R.services = function (s) {
    return headF(s.title, s.intro) + '<div class="services" style="--cols:' + (+s.columns || 3) + '">' + (s.items || []).map(function (x, i) {
      return '<div class="svc"' + ia(i) + '>' + (x.label ? '<span class="mono"' + fa('label') + ' data-rich>' + rt(x.label) + '</span>' : '') + '<h3' + fa('title') + ' data-rich>' + rt(x.title) + '</h3>' + (x.text ? '<p' + fa('text') + ' data-rich data-ml>' + rt(x.text) + '</p>' : '') +
        ((x.tags || []).length ? '<div class="spec"' + fa('tags') + '>' + x.tags.map(function (t) { return '<span class="chip">' + esc(t) + '</span>'; }).join('') + '</div>' : '') + '</div>';
    }).join('') + '</div>';
  };

  R.steps = function (s) {
    var n = Math.max(1, Math.min(6, (s.items || []).length));
    return headF(s.title, s.intro) + '<div class="steps" style="--n:' + n + '">' + (s.items || []).map(function (x, i) {
      return '<div class="step"' + ia(i) + '>' + (x.label ? '<span class="mono"' + fa('label') + ' data-rich>' + rt(x.label) + '</span>' : '') + '<h3' + fa('title') + ' data-rich>' + rt(x.title) + '</h3>' + (x.text ? '<p' + fa('text') + ' data-rich data-ml>' + rt(x.text) + '</p>' : '') + '</div>';
    }).join('') + '</div>';
  };

  R.quote = function (s) {
    return '<blockquote class="quote"' + fa('text') + ' data-rich data-ml>' + rt(s.text) + '</blockquote>' + (s.author ? '<p class="mono quote-by"' + fa('author') + ' data-rich>' + rt(s.author) + '</p>' : '');
  };

  R.cta = function (s) {
    return '<div class="cta">' + (s.title ? '<h2' + fa('title') + ' data-rich>' + rt(s.title) + '</h2>' : '') + (s.text ? '<p' + fa('text') + ' data-rich data-ml>' + rt(s.text) + '</p>' : '') + (s.button1 && s.button1.label ? '<div class="btns">' + btnF(s.button1, true, 'button1') + '</div>' : '') + '</div>';
  };

  R.logos = function (s) {
    return (s.title ? '<p class="mono logos-title"' + fa('title') + ' data-rich>' + rt(s.title) + '</p>' : '') + '<div class="logos">' + (s.items || []).map(function (x, i) {
      var inner = x.image ? '<img src="' + esc(x.image) + '" alt="' + esc(x.name) + '" loading="lazy">' : esc(x.name);
      var href = safeLink(x.link);
      return href ? '<a class="lg"' + ia(i) + fa('name') + ' href="' + esc(href) + '" target="_blank" rel="noopener">' + inner + '</a>' : '<span class="lg"' + ia(i) + fa('name') + '>' + inner + '</span>';
    }).join('') + '</div>';
  };

  function contactForm(s) {
    var opt = function (l) { return (l || []).filter(Boolean).map(function (x) { return '<option>' + esc(x) + '</option>'; }).join(''); };
    var id = 'cf-' + esc(s.id);
    return '<form class="cform" novalidate data-sid="' + esc(s.id) + '">' +
      (s.formTitle ? '<h3' + fa('formTitle') + '>' + esc(s.formTitle) + '</h3>' : '') +
      '<div class="cf-row"><label class="cf"><span>Name *</span><input name="name" autocomplete="name" required id="' + id + '-n"></label>' +
      '<label class="cf"><span>E-Mail *</span><input name="email" type="email" autocomplete="email" required></label></div>' +
      '<div class="cf-row">' + ((s.formTypes || []).length ? '<label class="cf"><span>Was für ein Projekt?</span><select name="type"><option value="">Bitte wählen</option>' + opt(s.formTypes) + '</select></label>' : '') +
      '<label class="cf"><span>Wunschtermin</span><input name="date" placeholder="z. B. Mitte März"></label></div>' +
      '<div class="cf-row">' + ((s.formBudgets || []).length ? '<label class="cf"><span>Budget</span><select name="budget"><option value="">Bitte wählen</option>' + opt(s.formBudgets) + '</select></label>' : '') +
      '<label class="cf"><span>Telefon (optional)</span><input name="phone" type="tel" autocomplete="tel"></label></div>' +
      '<label class="cf"><span>Nachricht *</span><textarea name="message" rows="5" placeholder="Worum geht es? Gerne mit Links zu Referenzen oder Looks, die dir gefallen."></textarea></label>' +
      '<label class="cf-hp" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label>' +
      '<label class="cf-ok"><input type="checkbox" name="consent" required><span>Ich bin einverstanden, dass meine Angaben zur Bearbeitung der Anfrage gespeichert werden. Mehr in der <a href="datenschutz.html" target="_blank">Datenschutzerklärung</a>. *</span></label>' +
      '<p class="cf-err" role="alert"></p>' +
      '<button class="btn primary bz-l" type="submit">Anfrage senden</button>' +
      '</form><div class="cf-done" hidden role="status"' + fa('formSuccess') + '><b>✓</b><p>' + esc(s.formSuccess || 'Danke! Deine Anfrage ist angekommen.') + '</p></div>';
  }
  R.contact = function (s) {
    return (s.eyebrow ? '<span class="mono accent"' + fa('eyebrow') + ' data-rich>' + rt(s.eyebrow) + '</span>' : '') +
      '<h2 style="margin-top:14px"><span' + fa('title') + ' data-rich>' + rt(s.title) + '</span>' + (s.highlight ? '<br><em' + fa('highlight') + ' data-rich>' + rt(s.highlight) + '</em>' : '') + '</h2>' +
      '<div class="contact-grid' + (s.form !== false ? ' with-form' : '') + '">' + (s.form !== false ? '<div class="cf-wrap">' + contactForm(s) + '</div>' : '') + '<div class="cside">' +
        (s.email ? '<div class="mailbox"><span class="addr js-mail"' + fa('email') + '>' + esc(s.email) + '</span><button class="btn js-copy" type="button">Adresse kopieren</button></div>' : '') +
        (s.phone ? '<p class="mono" style="margin-top:14px"' + fa('phone') + '>Telefon: <span style="user-select:all">' + esc(s.phone) + '</span></p>' : '') +
        ((s.links || []).length ? '<div class="socials">' + s.links.map(function (l, i) { return safeLink(l.url) ? btnHTML(l, 'outline', ia(i, 'links') + fa('label')) : ''; }).join('') + '</div>' : '') +
      (s.form !== false ? '' : '</div>') + ((s.list || []).length && s.form === false ? '<div>' + (s.listTitle ? '<span class="mono"' + fa('listTitle') + ' data-rich>' + rt(s.listTitle) + '</span>' : '') + '<ul class="brief"' + fa('list') + '>' + s.list.map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') + '</ul></div>' : '') + (s.form !== false ? '</div>' : '') + '</div>';
  };

  // ---------- Freier Bereich ----------
  var E = {};
  E.heading = function (e) { return '<h2 class="hs-' + esc(e.size || 'l') + '"><span' + fa('text') + ' data-rich>' + rt(e.text) + '</span>' + (e.highlight ? ' <em' + fa('highlight') + ' data-rich>' + rt(e.highlight) + '</em>' : '') + '</h2>'; };
  E.eyebrow = function (e) { return '<span class="mono' + (e.accent ? ' accent' : '') + '"' + fa('text') + ' data-rich>' + rt(e.text) + '</span>'; };
  E.text = function (e) { return (e.title ? '<h3' + fa('title') + ' data-rich>' + rt(e.title) + '</h3>' : '') + '<div class="body ts-' + esc(e.size || 'm') + (e.muted ? ' muted' : '') + '"' + fa('text') + ' data-rich data-ml>' + RT.block(e.text) + '</div>'; };
  E.buttons = function (e) {
    return '<div class="btns">' + (e.items || []).map(function (b, i) { return btnHTML(b, 'outline', ia(i) + fa('label')); }).join('') + '</div>';
  };
  E.image = function (e) {
    var r = e.ratio || 'auto', st = r === 'auto' ? '' : ' style="--r:' + esc(r) + '"';
    if (!e.src) return '<div class="el-img empty"' + fa('src') + st + '><span class="mono">Bild hochladen</span></div>';
    var img = '<img src="' + esc(e.src) + '" alt="' + esc(e.caption || '') + '" loading="lazy">', link = safeLink(e.link), inner;
    if (link) inner = '<a class="el-img' + (r === 'auto' ? ' auto' : '') + '"' + fa('src') + ' href="' + esc(link) + '"' + (/^https?:/i.test(link) ? ' target="_blank" rel="noopener"' : '') + st + '>' + img + '</a>';
    else if (e.zoom) inner = '<button class="el-img ph js-photo' + (r === 'auto' ? ' auto' : '') + '"' + fa('src') + ' type="button"' + st + '>' + img + '</button>';
    else inner = '<div class="el-img' + (r === 'auto' ? ' auto' : '') + '"' + fa('src') + st + '>' + img + '</div>';
    return '<figure>' + inner + (e.caption ? '<figcaption class="mono"' + fa('caption') + ' data-rich>' + rt(e.caption) + '</figcaption>' : '') + '</figure>';
  };
  E.video = function (e, s) {
    var r = e.ratio || '16/9', cls = r === '9/16' ? ' portrait' : r === '1/1' ? ' square' : '';
    return '<figure><div class="vbox' + cls + '" style="--ratio:' + esc(r) + '">' + stillHTML({ title: e.caption || 'Video', youtube: e.youtube, video: e.video, image: e.image }, s.id + ':e:' + e.eid) + '</div>' + (e.caption ? '<figcaption class="mono"' + fa('caption') + ' data-rich>' + rt(e.caption) + '</figcaption>' : '') + '</figure>';
  };
  E.gallery = function (e) {
    var masonry = e.ratio === 'auto', ph = e.photos || [];
    if (!ph.length) return '<div class="el-img empty"' + fa('photos') + ' style="--r:3/1"><span class="mono">Fotos hochladen</span></div>';
    return gridHTML(ph, { cols: e.columns, ratio: e.ratio || '1/1', limit: e.limit });
  };
  E.stats = function (e) {
    return '<div class="stats">' + (e.items || []).map(function (x, i) {
      return '<div class="stat"' + ia(i) + '><b' + (e.count ? ' class="js-count"' : '') + fa('value') + ' data-v="' + esc(x.value) + '">' + esc(x.value) + '</b><span class="mono"' + fa('label') + ' data-rich>' + rt(x.label) + '</span></div>';
    }).join('') + '</div>';
  };
  E.list = function (e) { return '<ul class="elist ls-' + esc(e.style || 'dot') + '"' + fa('items') + '>' + (e.items || []).map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') + '</ul>'; };
  E.quote = function (e) { return '<blockquote class="quote"' + fa('text') + ' data-rich data-ml>' + rt(e.text) + '</blockquote>' + (e.author ? '<p class="mono quote-by"' + fa('author') + ' data-rich>' + rt(e.author) + '</p>' : ''); };
  var STATUS = { nda: 'Unter NDA', post: 'In Postproduktion', prod: 'In Produktion', soon: 'Release folgt' };
  E.project = function (e) {
    var vis = e.visual || 'tile', tags = function (l) { return (l || []).filter(Boolean).map(function (t) { return '<span class="chip">' + esc(t) + '</span>'; }).join(''); };
    var media = vis === 'none' ? '' : vis === 'image' && e.image
      ? '<div class="pj-media"' + fa('image') + '><img src="' + esc(e.image) + '" alt="' + esc(RT.plain(e.title)) + '" loading="lazy"><span class="pj-st mono">' + esc(STATUS[e.status] || '') + '</span></div>'
      : '<div class="pj-media still ndabox"' + fa('note') + '><div class="lk">' + LOCK + '<b>' + esc(STATUS[e.status] || 'Vertraulich') + '</b><span class="mono">' + esc(e.note || 'Video folgt nach Veröffentlichung') + '</span></div></div>';
    return '<article class="pj' + (vis === 'none' ? ' no-media' : '') + '">' + media + '<div class="pj-body">' +
      '<div class="kicker">' + (e.kind ? '<span class="mono"' + fa('kind') + ' data-rich>' + rt(e.kind) + '</span>' : '') + (e.date ? '<span class="mono"' + fa('date') + '>' + esc(e.date) + '</span>' : '') + (vis === 'none' ? '<span class="mono accent">' + esc(STATUS[e.status] || '') + '</span>' : '') + '</div>' +
      '<h3><span' + fa('title') + ' data-rich>' + rt(e.title) + '</span></h3>' +
      (e.client ? '<p class="pj-client"' + fa('client') + '>Für: ' + esc(e.client) + '</p>' : '') +
      (e.text ? '<p' + fa('text') + ' data-rich data-ml>' + rt(e.text) + '</p>' : '') +
      ((e.roles || []).length ? '<div class="role"' + fa('roles') + '><span class="mono">Meine Rolle</span>' + tags(e.roles) + '</div>' : '') +
      ((e.tasks || []).length ? '<ul class="elist ls-check"' + fa('tasks') + '>' + e.tasks.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' : '') +
      ((e.stats || []).length ? '<div class="pj-stats">' + e.stats.map(function (x, i) { return '<div' + ia(i, 'stats') + '><b' + fa('value') + '>' + esc(x.value) + '</b><span class="mono"' + fa('label') + ' data-rich>' + rt(x.label) + '</span></div>'; }).join('') + '</div>' : '') +
      ((e.tools || []).length ? '<div class="role"' + fa('tools') + '><span class="mono">Technik</span>' + tags(e.tools) + '</div>' : '') +
      (e.button && e.button.label ? '<div class="btns">' + btnF(e.button, false, 'button') + '</div>' : '') +
      '</div></article>';
  };
  E.spacer = function (e) { return '<div' + fa('height') + ' style="height:' + (+e.height || 0) + 'px"></div>'; };
  E.divider = function (e) { return '<hr class="el-hr' + (e.accent ? ' acc' : '') + '">'; };
  function elsHTML(s, extra) {
    return '<div class="free' + (extra ? ' extras' : '') + ' va-' + esc(s.valign || 'start') + '" data-els="' + esc(s.id) + '">' + (s.elements || []).map(function (e) {
      var inner; try { inner = E[e.type](e, s); } catch (x) { inner = ''; }
      return '<div class="el el-' + esc(e.type) + ' w-' + esc(e.width || 'full') + ' ta-' + esc(e.align || 'left') + (e.eid === SELECTED_EL ? ' el-sel' : '') + '" data-eid="' + esc(e.eid) + '">' + inner + '</div>';
    }).join('') + '</div>';
  }
  R.free = function (s) {
    if (!(s.elements || []).length) return '<p class="mono" style="text-align:center;padding:24px">Leerer Bereich: Füge im Editor Elemente hinzu.</p>' + (PREVIEW ? elsHTML(s) : '');
    return elsHTML(s);
  };

  R.spacer = function (s) {
    return '<div style="height:' + (+s.height || 0) + 'px;' + (s.line ? 'border-top:1px solid var(--line);' : '') + '"></div>';
  };

  function sectionHTML(s, i) {
    var t = DATA.theme, anchor = K.anchor(s);
    var cls = 'sec sec-' + s.type + ' ' + (s.type === 'hero' ? 'hero ' : '') + (s.type === 'contact' ? 'contact ' : '') +
      'pad-' + (s.spacing || 'm') + ' al-' + (s.align || 'left') + (s.divider && i > 0 ? ' divider' : '') +
      (s.background === 'panel' ? ' bg-panel' : s.background === 'accent' ? ' bg-accent' : '') + (s.visible === false ? ' is-hidden-preview' : '') +
      (s.id === SELECTED ? ' selected' : '');
    var foldable = (s.collapsible === 'yes' || (s.collapsible !== 'no' && t.collapsible !== false));
    if (foldable) cls += ' foldable';
    var style = s.background === 'inverted' ? ' style="' + invertedStyle(t) + '"' : '';
    var inner;
    try { inner = R[s.type](s); } catch (e) { inner = '<p class="mono">Abschnitt konnte nicht angezeigt werden.</p>'; }
    if (s.type !== 'free' && ((s.elements || []).length || PREVIEW)) inner += elsHTML(s, true);
    // Einklappen: Überschrift bleibt, der Rest klappt weg
    var canFold = (s.collapsible === 'yes' || (s.collapsible !== 'no' && t.collapsible !== false)) && inner.indexOf('<div class="sec-head">') === 0;
    if (canFold) {
      var cut = inner.indexOf('</div>') + 6, bid = 'b-' + esc(s.id);
      var tog = '<button class="sec-toggle" type="button" aria-expanded="true" aria-controls="' + bid + '" title="Ein- oder ausklappen"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg><span class="sr">Abschnitt ein- oder ausklappen</span></button>';
      inner = inner.slice(0, cut - 6) + tog + '</div><div class="sec-body" id="' + bid + '"><div>' + inner.slice(cut) + '</div></div>';
    }
    var vt = visTag(s); if (vt) inner = '<div class="vis-sec">' + vt + '</div>' + inner;
    return '<section class="' + cls + '" id="' + esc(anchor) + '" data-sid="' + esc(s.id) + '"' + style + '><div class="wrap">' + inner + '</div></section>';
  }

  // ---------- Seite rendern ----------
  function render(d) {
    GALS = {};
    DATA = K.normalize(d);
    applyTheme(DATA.theme);
    var site = DATA.site;
    document.getElementById('brandName').textContent = site.name || '';
    document.getElementById('footText').textContent = site.footer || '';
    if (site.description) document.getElementById('metaDesc').setAttribute('content', site.description);
    if (!PREVIEW) document.title = RT.plain(site.title) || site.name || document.title;
    var hasCode = DATA.hasLocked || (PREVIEW && JSON.stringify(DATA.sections).indexOf('"visibility":"code"') >= 0);
    document.getElementById('clientLink').hidden = !hasCode;
    var secs = DATA.sections.filter(function (s) { return PREVIEW || s.visible !== false; });
    page.innerHTML = secs.length ? secs.map(sectionHTML).join('') : '<div class="wrap empty-page mono">Noch keine Abschnitte. Füge im Editor welche hinzu.</div>';
    // Menü
    var nav = DATA.sections.filter(function (s) { return s.visible !== false && s.navLabel && K.anchor(s) !== site.ctaTarget; })
      .map(function (s) { return '<a href="#' + esc(K.anchor(s)) + '">' + esc(s.navLabel) + '</a>'; }).join('');
    if (site.ctaLabel) nav += '<a class="cta-link" href="#' + esc(site.ctaTarget || '') + '">' + esc(site.ctaLabel) + '</a>';
    document.getElementById('nav').innerHTML = nav;
    var ph = DATA.theme.photoHover || 'zoom';
    document.documentElement.className = document.documentElement.className.replace(/\bph-\w+/g, '').trim() + ' ph-' + ph;
    bindPhotos(); startHero(); setupAnim(); textAnims();
    if (PREVIEW) makeEditable();
  }



  // Text-Animationen (Marker, Linie, Leuchten, Springen) beim Sichtbarwerden starten
  var taObs = null;
  function textAnims() {
    var spans = [].slice.call(document.querySelectorAll('.ta-mark,.ta-ul,.ta-glow,.ta-pop'));
    if (!spans.length) return;
    if (PREVIEW || DATA.theme.motion === false || !('IntersectionObserver' in window)) { spans.forEach(function (x) { x.classList.add('on'); }); return; }
    if (!taObs) taObs = new IntersectionObserver(function (en) { en.forEach(function (e) { if (e.isIntersecting) { setTimeout(function () { e.target.classList.add('on'); }, 250); taObs.unobserve(e.target); } }); }, { threshold: 0.6 });
    spans.forEach(function (x) { taObs.observe(x); });
  }

  // ---------- Animationen beim Scrollen ----------
  var STAG = '.sec-head,.series-head,.film,.ph,.svc,.step,.lg,.el,.ti-img,.ti-text,.hero-text,.frame,.facts,.vbox,.video-intro,.quote,.quote-by,.cta,.contact-grid,.text-block,.logos-title,.contact>.wrap>h2,.contact>.wrap>.mono';
  var SPEED = { s: 450, m: 800, l: 1300 }, animObs = null, countObs = null;
  function setupAnim(onlyId) {
    var t = DATA.theme, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!animObs && 'IntersectionObserver' in window) animObs = new IntersectionObserver(function (entries) {
      var i = 0;
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target, stag = el.closest('[data-stagger]');
        el.style.setProperty('--d', (stag ? Math.min(i++, 10) * 90 : 0) + 'ms');
        el.classList.add('in'); animObs.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    [].forEach.call(document.querySelectorAll('.sec'), function (sec) {
      var s = DATA.sections.filter(function (x) { return x.id === sec.getAttribute('data-sid'); })[0];
      if (!s || (onlyId && s.id !== onlyId)) return;
      var a = s.anim && s.anim !== 'auto' ? s.anim : t.anim;
      if (!animObs || reduce || t.motion === false || !a || a === 'none' || !ANIM_ON) return;
      var sp = SPEED[s.animSpeed && s.animSpeed !== 'auto' ? s.animSpeed : t.animSpeed] || 800;
      sec.setAttribute('data-anim', a); sec.style.setProperty('--as', sp + 'ms');
      var targets;
      if (s.animStagger !== false) {
        sec.setAttribute('data-stagger', '');
        targets = [].slice.call(sec.querySelectorAll(STAG)).filter(function (el, _, all) {
          for (var p = el.parentElement; p && p !== sec; p = p.parentElement) if (all.indexOf(p) >= 0) return false;
          return true;
        });
      } else targets = [sec.querySelector('.wrap')];
      targets.forEach(function (el) { el.classList.add('a-t'); animObs.observe(el); });
    });
    // Zahlen hochzählen
    if (!countObs && 'IntersectionObserver' in window) countObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { countUp(en.target); countObs.unobserve(en.target); } });
    }, { threshold: 0.4 });
    [].forEach.call(document.querySelectorAll('.js-count'), function (el) { if (countObs && !reduce && t.motion !== false) countObs.observe(el); });
  }
  function countUp(el) {
    var v = el.getAttribute('data-v') || '', m = v.match(/^(\D*)(\d+(?:[.,]\d+)?)(.*)$/);
    if (!m) return;
    var target = parseFloat(m[2].replace(',', '.')), dec = (m[2].split(/[.,]/)[1] || '').length, t0 = performance.now(), dur = 1400;
    (function step(now) {
      var p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = m[1] + (target * e).toFixed(dec).replace('.', m[2].indexOf(',') >= 0 ? ',' : '.') + m[3];
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }

  // Sucher: Timecode + Filmkorn
  var heroLoop = null;
  function startHero() {
    var tcs = [].slice.call(document.querySelectorAll('.tc-run')), cs = [].slice.call(document.querySelectorAll('canvas.grain'));
    if (heroLoop) cancelAnimationFrame(heroLoop);
    if (!tcs.length && !cs.length) return;
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches || DATA.theme.motion === false;
    var t0 = performance.now(), last = 0, ctxs = cs.map(function (c) { c.width = 320; c.height = 180; return c.getContext('2d'); });
    var img = ctxs.length ? ctxs[0].createImageData(320, 180) : null;
    function pad(n) { return n < 10 ? '0' + n : '' + n; }
    function loop(now) {
      var f = Math.floor((now - t0) / 40), tc = pad(Math.floor(f / 90000)) + ':' + pad(Math.floor(f / 1500) % 60) + ':' + pad(Math.floor(f / 25) % 60) + ':' + pad(f % 25);
      tcs.forEach(function (e) { e.textContent = tc; });
      if (img && now - last > 60) {
        last = now;
        for (var i = 0; i < img.data.length; i += 4) { var v = Math.random() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 70; }
        ctxs.forEach(function (c) { c.putImageData(img, 0, 0); });
      }
      if (!reduce) heroLoop = requestAnimationFrame(loop);
    }
    heroLoop = requestAnimationFrame(loop);
  }

  function findItem(key) {
    var p = key.split(':'), s = DATA.sections.filter(function (x) { return x.id === p[0]; })[0];
    if (!s) return null;
    if (p[1] === 'v') return s;
    if (p[1] === 'e') return (s.elements || []).filter(function (e) { return e.eid === p[2]; })[0];
    return (s.items || [])[+p[1]];
  }
  function previewNote(id) {
    return '<div class="yt-note"><span class="rec"><i></i>Vorschau</span><p>Der YouTube-Link funktioniert. Hier läuft gerade kein eigener Server, deshalb darf kein fremder Videoplayer laden. Auf deiner veröffentlichten Website läuft das Video genau hier.</p>' +
      '<a class="btn primary" href="https://youtu.be/' + id + '" target="_blank" rel="noopener">Testweise auf YouTube öffnen</a></div>';
  }
  function playerHTML(f) {
    var id = A.ytId(f.youtube);
    if (id) return '<iframe src="' + A.ytEmbed(id) + '" title="' + esc(f.title || 'Video') + '" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>';
    return '<video src="' + esc(f.video) + '" ' + (f.image ? 'poster="' + esc(f.image) + '" ' : '') + 'controls autoplay playsinline></video>';
  }

  // ---------- Klicks ----------
  page.addEventListener('click', function (e) {
    var cb = e.target.closest('.js-copybtn');
    if (cb) {
      e.preventDefault();
      var txt = cb.getAttribute('data-copy') || '', old = cb.textContent;
      var ok = function () { cb.textContent = 'Kopiert ✓'; setTimeout(function () { cb.textContent = old; }, 1800); };
      try { navigator.clipboard.writeText(txt).then(ok, function () { cb.textContent = txt; }); } catch (x) { cb.textContent = txt; }
      return;
    }
    var rl = e.target.closest('.js-reel');
    if (rl) {
      e.preventDefault();
      var hs = DATA.sections.filter(function (x) { return x.type === 'hero' && x.visible !== false && (A.ytId(x.youtube) || x.video); })[0];
      if (!hs) return;
      var hid = A.ytId(hs.youtube);
      media.innerHTML = '<div class="video">' + (hid && MODE === 'demo' ? '<img src="' + A.ytThumb(hid) + '" alt="" style="width:100%;height:100%;object-fit:cover">' + previewNote(hid) : playerHTML({ youtube: hs.youtube, video: hs.video, title: 'Showreel' })) + '</div>';
      cap.textContent = hs.playLabel || 'Showreel'; nav.hidden = true; openBox(lb);
      return;
    }
    var cp = e.target.closest('.js-copy');
    if (cp) {
      var mail = cp.parentNode.querySelector('.js-mail');
      var done = function () { cp.textContent = 'Kopiert'; setTimeout(function () { cp.textContent = 'Adresse kopieren'; }, 1800); };
      var fb = function () { var r = document.createRange(); r.selectNodeContents(mail); var s = getSelection(); s.removeAllRanges(); s.addRange(r); cp.textContent = 'Markiert, jetzt kopieren'; };
      try { navigator.clipboard.writeText(mail.textContent).then(done, fb); } catch (x) { fb(); }
      return;
    }
    var sr = e.target.closest('.js-showreel');
    if (sr) {
      var s = DATA.sections.filter(function (x) { return x.id === sr.getAttribute('data-sid'); })[0], id = A.ytId(s.youtube);
      media.innerHTML = '<div class="video">' + (id && MODE === 'demo' ? '<img src="' + A.ytThumb(id) + '" alt="" style="width:100%;height:100%;object-fit:cover">' + previewNote(id) : playerHTML({ youtube: s.youtube, video: s.video, title: 'Showreel' })) + '</div>';
      cap.textContent = s.playLabel || 'Showreel'; nav.hidden = true; openBox(lb);
      return;
    }
    var st = e.target.closest('.still.playable');
    if (st && !st.classList.contains('playing')) {
      var f = findItem(st.getAttribute('data-key')); if (!f) return;
      var yid = A.ytId(f.youtube);
      if (yid && MODE === 'demo') { st.insertAdjacentHTML('beforeend', previewNote(yid)); st.classList.add('playing'); return; }
      st.classList.add('playing'); st.innerHTML = playerHTML(f);
    }
  });


  // Im Editor: Klick auf irgendetwas öffnet genau diese Einstellung
  if (PREVIEW) document.addEventListener('click', function (e) {
    if (e.target.closest('.lb,.jr-ui,.rt-bar,.rt-pop,.sec-toggle')) return;
    e.preventDefault(); e.stopPropagation();
    var t = e.target;
    if (t.closest('#brandName,.brand')) return parent.postMessage({ type: 'jr-select-site', f: 'name' }, '*');
    if (t.closest('footer')) return parent.postMessage({ type: 'jr-select-site', f: 'footer' }, '*');
    if (t.closest('.cta-link')) return parent.postMessage({ type: 'jr-select-site', f: 'ctaLabel' }, '*');
    var navA = t.closest('#nav a');
    if (navA) { var tg = document.getElementById(navA.getAttribute('href').slice(1)); if (tg) parent.postMessage({ type: 'jr-select', id: tg.getAttribute('data-sid'), f: 'navLabel' }, '*'); return; }
    var sec = t.closest('.sec'); if (!sec) return;
    var scope = t.closest('.el') || sec;
    var fEl = t.closest('[data-f]'), itEl = t.closest('[data-item]');
    if (fEl && !scope.contains(fEl)) fEl = null;
    if (itEl && !scope.contains(itEl)) itEl = null;
    parent.postMessage({ type: 'jr-select', id: sec.getAttribute('data-sid'), eid: scope !== sec ? scope.getAttribute('data-eid') : null,
      f: fEl ? fEl.getAttribute('data-f') : null, item: itEl ? +itEl.getAttribute('data-item') : null, list: itEl ? (itEl.getAttribute('data-list') || 'items') : null,
      inline: !!(fEl && fEl.isContentEditable) }, '*');
  }, true);


  // ---------- Vorschau im Editor: direkt bearbeiten, Leisten, Ziehen ----------
  var EDITING = null, PENDING = null;
  function info(node) {
    var sec = node.closest('.sec'); if (!sec) return null;
    var scope = node.closest('.el') || sec, it = node.closest('[data-item]');
    if (it && !scope.contains(it)) it = null;
    var base = scope !== sec ? scope.getAttribute('data-eid') : sec.getAttribute('data-sid');
    var list = it ? (it.getAttribute('data-list') || 'items') : null, item = it ? +it.getAttribute('data-item') : null;
    return { id: sec.getAttribute('data-sid'), eid: scope !== sec ? base : null, list: list, item: item, f: node.getAttribute('data-f'),
      path: base + (it ? ':' + list + ':' + item : '') + '.' + node.getAttribute('data-f') };
  }
  function makeEditable() {
    [].forEach.call(document.querySelectorAll('[data-rich][data-f]'), function (n) {
      if (n._ed) return; n._ed = true;
      var ml = n.hasAttribute('data-ml');
      RT.editable(n, ml);
      n.addEventListener('focus', function () { EDITING = n; });
      n.addEventListener('input', function () {
        var i = info(n); if (!i) return;
        clearTimeout(n._t); n._t = setTimeout(function () { parent.postMessage({ type: 'jr-edit', path: i.path, value: RT.toValue(n, ml) }, '*'); }, 120);
      });
      n.addEventListener('blur', function () {
        var i = info(n);
        if (i) parent.postMessage({ type: 'jr-edit', path: i.path, value: RT.toValue(n, ml), end: true }, '*');
        setTimeout(function () {
          if (EDITING === n) EDITING = null;
          if (!EDITING && PENDING) { var m = PENDING; PENDING = null; window.postMessage(m, '*'); }
        }, 60);
      });
    });
  }

  if (PREVIEW) (function () {
    RT.attach(document, { palette: function () {
      var t = DATA.theme; return [t.accent, t.fg, t.muted, t.bg, t.panel].concat(RT.usedColors(DATA.sections));
    } });
    function ui(tag, cls, html) { var x = document.createElement(tag); x.className = 'jr-ui ' + cls; if (html) x.innerHTML = html; document.body.appendChild(x); return x; }
    function btn(parent, label, title, fn) {
      var b = document.createElement('button'); b.type = 'button'; b.innerHTML = label; b.title = title; b.setAttribute('aria-label', title);
      b.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); fn(); });
      parent.appendChild(b); return b;
    }
    function send(m) { parent.postMessage(m, '*'); }
    var secBar = ui('div', 'jr-secbar'), elBar = ui('div', 'jr-elbar'), insTop = ui('button', 'jr-ins', '+ Abschnitt einfügen'), insBot = ui('button', 'jr-ins', '+ Abschnitt einfügen');
    var dropLine = ui('div', 'jr-drop'), curSec = null, curEl = null, DRAG = null;
    insTop.type = insBot.type = 'button';
    var secGrip = document.createElement('span'); secGrip.className = 'grip'; secGrip.textContent = '⋮⋮'; secGrip.title = 'Ziehen zum Verschieben'; secGrip.draggable = true;
    var secName = document.createElement('span'); secName.className = 'nm';
    secBar.appendChild(secGrip); secBar.appendChild(secName);
    btn(secBar, '↑', 'Nach oben', function () { send({ type: 'jr-sec-action', id: curSec.getAttribute('data-sid'), act: 'up' }); });
    btn(secBar, '↓', 'Nach unten', function () { send({ type: 'jr-sec-action', id: curSec.getAttribute('data-sid'), act: 'down' }); });
    btn(secBar, '+ Element', 'Element in diesen Abschnitt einfügen', function () { send({ type: 'jr-add-el', id: curSec.getAttribute('data-sid') }); });
    btn(secBar, '⧉', 'Duplizieren', function () { send({ type: 'jr-sec-action', id: curSec.getAttribute('data-sid'), act: 'dup' }); });
    btn(secBar, '◌', 'Ausblenden', function () { send({ type: 'jr-sec-action', id: curSec.getAttribute('data-sid'), act: 'hide' }); });
    btn(secBar, '✕', 'Löschen', function () { send({ type: 'jr-sec-action', id: curSec.getAttribute('data-sid'), act: 'del' }); });
    var elGrip = document.createElement('span'); elGrip.className = 'grip'; elGrip.textContent = '⋮⋮'; elGrip.title = 'Ziehen zum Verschieben, auch in andere Abschnitte'; elGrip.draggable = true;
    var elName = document.createElement('span'); elName.className = 'nm';
    elBar.appendChild(elGrip); elBar.appendChild(elName);
    btn(elBar, '↑', 'Davor setzen', function () { send({ type: 'jr-el-action', eid: curEl.getAttribute('data-eid'), act: 'up' }); });
    btn(elBar, '↓', 'Dahinter setzen', function () { send({ type: 'jr-el-action', eid: curEl.getAttribute('data-eid'), act: 'down' }); });
    btn(elBar, '⧉', 'Duplizieren', function () { send({ type: 'jr-el-action', eid: curEl.getAttribute('data-eid'), act: 'dup' }); });
    btn(elBar, '✕', 'Löschen', function () { send({ type: 'jr-el-action', eid: curEl.getAttribute('data-eid'), act: 'del' }); });
    insTop.addEventListener('click', function (e) { e.stopPropagation(); send({ type: 'jr-insert-at', index: idxOf(curSec) }); });
    insBot.addEventListener('click', function (e) { e.stopPropagation(); send({ type: 'jr-insert-at', index: idxOf(curSec) + 1 }); });
    // Leiste für Einträge in Listen (Filme, Leistungen, Schritte, Zahlen, Buttons, Links …)
    var itemBar = ui('div', 'jr-elbar jr-itembar'), curItem = null;
    var itGrip = document.createElement('span'); itGrip.className = 'grip'; itGrip.textContent = '⋮⋮'; itGrip.title = 'Ziehen zum Verschieben'; itGrip.draggable = true;
    var itName = document.createElement('span'); itName.className = 'nm';
    itemBar.appendChild(itGrip); itemBar.appendChild(itName);
    function itemPath(n) { var i = info(n); return i ? i.path.replace(/\.[^.]*$/, '') : null; }
    function iinfo(n) {
      var sec = n.closest('.sec'), scope = n.closest('.el') || sec;
      return { base: scope !== sec ? scope.getAttribute('data-eid') : sec.getAttribute('data-sid'), list: n.getAttribute('data-list') || 'items', i: +n.getAttribute('data-item') };
    }
    function itemSend(act, extra) { var x = iinfo(curItem); var m = { type: 'jr-item', base: x.base, list: x.list, i: x.i, act: act }; for (var k in extra) m[k] = extra[k]; send(m); }
    btn(itemBar, '↑', 'Davor setzen', function () { itemSend('up'); });
    btn(itemBar, '↓', 'Dahinter setzen', function () { itemSend('down'); });
    btn(itemBar, '⧉', 'Duplizieren', function () { itemSend('dup'); });
    btn(itemBar, '✕', 'Löschen', function () { itemSend('del'); });
    itGrip.addEventListener('dragstart', function (e) { var x = iinfo(curItem); DRAG = { kind: 'item', base: x.base, list: x.list, from: x.i, node: curItem }; e.dataTransfer.setData('text/plain', 'item'); e.dataTransfer.effectAllowed = 'move'; curItem.classList.add('jr-dragging'); });
    itGrip.addEventListener('dragend', function () { endDrag(); });
    var LISTNAME = { items: 'Eintrag', links: 'Link', facts: 'Fakt' };

    // Button-Leiste: Klick auf einen Button
    var btnBar = ui('div', 'jr-btnbar'), btnPathCur = null;
    btnBar.style.display = 'none';
    function btnPath(a) {
      var sec = a.closest('.sec'), elx = a.closest('.el'), f = a.getAttribute('data-f');
      if (f && /^button\d*$/.test(f)) return (elx ? elx.getAttribute('data-eid') : sec.getAttribute('data-sid')) + '.' + f;
      if (a.hasAttribute('data-item')) return (elx ? elx.getAttribute('data-eid') : sec.getAttribute('data-sid')) + ':' + (a.getAttribute('data-list') || 'items') + ':' + a.getAttribute('data-item');
      return null;
    }
    function getP(path) {
      var dot = path.indexOf('.'), segs = (dot >= 0 ? path.slice(0, dot) : path).split(':'), key = dot >= 0 ? path.slice(dot + 1) : null;
      var o = DATA.sections.filter(function (x) { return x.id === segs[0]; })[0];
      if (!o) DATA.sections.some(function (x) { return (x.elements || []).some(function (e) { if (e.eid === segs[0]) { o = e; return true; } }); });
      for (var i = 1; o && i + 1 < segs.length; i += 2) o = (o[segs[i]] || [])[+segs[i + 1]];
      return o && key ? o[key] : o;
    }
    function openBtnBar(a) {
      var path = btnPath(a); if (!path) return;
      var b = getP(path) || {}; btnPathCur = path;
      var t = DATA.theme, isLink = /:links:/.test(path), def = /button2$/.test(path) || isLink || /:items:/.test(path) ? 'outline' : 'primary';
      var cur = { style: b.style || def, color: (b.color || '').toLowerCase(), size: b.size || 'm' };
      btnBar.innerHTML = '';
      function row(cls) { var r = document.createElement('div'); r.className = 'row ' + (cls || ''); btnBar.appendChild(r); return r; }
      function pb(r, html, title, on, fn) { var x = document.createElement('button'); x.type = 'button'; x.innerHTML = html; x.title = title; if (on) x.className = 'on'; x.addEventListener('click', function (e) { e.stopPropagation(); fn(); }); r.appendChild(x); return x; }
      function patch(p) { send({ type: 'jr-patch', path: path, patch: p }); for (var k in p) cur[k] = p[k]; setTimeout(function () { var na = findBtn(path); if (na) openBtnBar(na); }, 180); }
      var h = row('head'); h.innerHTML = '<span class="nm">Button</span>';
      var lab = document.createElement('input'); lab.type = 'text'; lab.value = b.label || ''; lab.placeholder = 'Beschriftung';
      lab.addEventListener('input', function () { clearTimeout(lab._t); var v = lab.value; lab._t = setTimeout(function () { send({ type: 'jr-patch', path: path, patch: { label: v } }); }, 250); });
      var r0 = row('fields'); r0.appendChild(lab);
      var act = K.btnAction(b);
      var asel = document.createElement('select'); asel.title = 'Was passiert beim Klick?';
      (isLink ? [['url', 'Webseite öffnen']] : K.BTN_ACTIONS).forEach(function (o) { var op = document.createElement('option'); op.value = o[0]; op.textContent = o[1]; asel.appendChild(op); });
      asel.value = act.a === 'none' ? 'section' : act.a;
      var val;
      if ((asel.value) === 'section') {
        val = document.createElement('select');
        DATA.sections.forEach(function (x) { var op = document.createElement('option'); op.value = K.anchor(x); op.textContent = RT.plain(x.navLabel || x.title || K.TYPES[x.type].label); val.appendChild(op); });
        val.value = act.v;
      } else if (/^(url|mail|phone|copy)$/.test(asel.value) || isLink) {
        val = document.createElement('input'); val.type = 'text'; val.value = act.v; val.placeholder = { url: 'https://…', mail: 'name@mail.de', phone: '+49 …', copy: 'Text, der kopiert wird' }[asel.value] || '';
      }
      function sendAct() { var p = isLink ? { url: val ? val.value : '' } : { action: asel.value, value: val ? val.value : '' }; send({ type: 'jr-patch', path: path, patch: p }); sum.textContent = '→ ' + K.btnSummary(isLink ? { url: p.url } : p, DATA); }
      asel.addEventListener('change', function () {
        var p = { action: asel.value, value: '' };
        if (asel.value === 'section') p.value = 'kontakt';
        if (asel.value === 'mail' || asel.value === 'copy') { var c = DATA.sections.filter(function (x) { return x.type === 'contact' && x.email; })[0]; if (c) p.value = c.email; }
        send({ type: 'jr-patch', path: path, patch: p }); setTimeout(function () { var na = findBtn(path); if (na) openBtnBar(na); }, 220);
      });
      r0.appendChild(asel);
      if (val) { r0.appendChild(val); val.addEventListener(val.tagName === 'SELECT' ? 'change' : 'input', function () { clearTimeout(val._t); val._t = setTimeout(sendAct, 300); }); }
      var sum = document.createElement('div'); sum.className = 'sum'; sum.textContent = '→ ' + K.btnSummary(b, DATA); r0.appendChild(sum);
      if (asel.value === 'file') { var fh = document.createElement('div'); fh.className = 'sum'; fh.textContent = 'Datei lädst du links im Editor hoch.'; r0.appendChild(fh); }
      var r1 = row(); [['primary', 'Gefüllt'], ['outline', 'Umrandet'], ['text', 'Nur Text']].forEach(function (x) { pb(r1, x[1], 'Stil: ' + x[1], cur.style === x[0], function () { patch({ style: x[0] }); }); });
      [['s', 'S'], ['m', 'M'], ['l', 'L']].forEach(function (x) { pb(r1, x[1], 'Größe ' + x[1], cur.size === x[0], function () { patch({ size: x[0] }); }); });
      var r2 = row('sw'); pb(r2, 'Std', 'Standardfarbe', !cur.color, function () { patch({ color: '' }); });
      var seen = {};
      [t.accent, t.fg, t.bg, t.muted].concat(RT.usedColors(DATA.sections)).concat(['#ffffff', '#000000', '#f2a33a', '#5fbf8a', '#5b8cff']).forEach(function (c) {
        c = String(c || '').toLowerCase(); if (!/^#[0-9a-f]{6}$/.test(c) || seen[c]) return; seen[c] = 1;
        var x = pb(r2, '', c, cur.color === c, function () { patch({ color: c }); }); x.className += ' c'; x.style.background = c;
      });
      var ci = document.createElement('input'); ci.type = 'color'; ci.title = 'Eigene Farbe'; ci.value = cur.color || t.accent;
      ci.addEventListener('change', function () { patch({ color: ci.value }); }); r2.appendChild(ci);
      var r3 = row('foot');
      pb(r3, 'Button löschen', 'Button löschen', false, function () { send({ type: 'jr-remove', path: path }); btnBar.style.display = 'none'; }).className = 'danger';
      pb(r3, 'Fertig', 'Schließen', false, function () { btnBar.style.display = 'none'; });
      var r = a.getBoundingClientRect(); btnBar.style.display = '';
      var w = btnBar.offsetWidth, vw = document.documentElement.clientWidth;
      btnBar.style.left = Math.max(8, Math.min(vw - w - 8, r.left)) + scrollX + 'px';
      btnBar.style.top = (r.bottom + 10 + scrollY) + 'px';
    }
    function findBtn(path) { var all = document.querySelectorAll('.sec a.btn'); for (var i = 0; i < all.length; i++) if (btnPath(all[i]) === path) return all[i]; return null; }
    window.addEventListener('click', function (e) {
      if (e.target.closest('.jr-ui')) return;
      var a = e.target.closest('.sec a.btn');
      if (a) openBtnBar(a); else btnBar.style.display = 'none';
    }, true);

    function idxOf(sec) { var id = sec.getAttribute('data-sid'); for (var i = 0; i < DATA.sections.length; i++) if (DATA.sections[i].id === id) return i; return DATA.sections.length; }
    function hideAll() { secBar.style.display = elBar.style.display = insTop.style.display = insBot.style.display = 'none'; if (typeof itemBar !== 'undefined') itemBar.style.display = 'none'; }
    hideAll();
    function place(el, x, y) { el.style.display = ''; el.style.left = x + 'px'; el.style.top = y + 'px'; }
    document.addEventListener('mousemove', function (e) {
      if (DRAG) return;
      var t = e.target; if (t.closest && t.closest('.jr-ui,.rt-bar,.rt-pop')) return;
      var sec = t.closest && t.closest('.sec'), el = t.closest && t.closest('.el');
      if (!sec) { hideAll(); curSec = curEl = null; return; }
      if (sec !== curSec) {
        curSec = sec; var s = DATA.sections.filter(function (x) { return x.id === sec.getAttribute('data-sid'); })[0];
        secName.textContent = s ? K.TYPES[s.type].label : '';
      }
      var r = sec.getBoundingClientRect(), sx = scrollX, sy = scrollY;
      var navH = (document.querySelector('header.nav') || { offsetHeight: 0 }).offsetHeight;
      place(secBar, r.left + sx + 8, Math.min(Math.max(r.top, navH) + 8, r.bottom - 40) + sy);
      place(insTop, r.left + sx + r.width / 2 - insTop.offsetWidth / 2, r.top + sy - insTop.offsetHeight / 2);
      if (sec === [].slice.call(document.querySelectorAll('.sec')).pop()) place(insBot, r.left + sx + r.width / 2 - insBot.offsetWidth / 2, r.bottom + sy - insBot.offsetHeight / 2); else insBot.style.display = 'none';
      if (el) {
        curEl = el; var er = el.getBoundingClientRect(), type = (el.className.match(/el-(\w+)/) || [])[1];
        elName.textContent = (K.ELEMENTS[type] || {}).label || 'Element';
        place(elBar, er.right + sx - elBar.offsetWidth, er.top + sy - elBar.offsetHeight - 4);
      } else { elBar.style.display = 'none'; curEl = null; }
      var it = t.closest('[data-item]');
      if (it && /^(DT|DD)$/.test(it.tagName)) it = null;
      if (it) {
        curItem = it; var ir = it.getBoundingClientRect(), x = iinfo(it);
        itName.textContent = (LISTNAME[x.list] || 'Eintrag') + ' ' + (x.i + 1);
        var navH2 = (document.querySelector('header.nav') || { offsetHeight: 0 }).offsetHeight, ih = itemBar.offsetHeight || 34;
        var iy = ir.top - ih - 4; if (iy < navH2 + 4) iy = ir.bottom + 4;
        place(itemBar, ir.left + sx, iy + sy);
      } else { itemBar.style.display = 'none'; curItem = null; }
    });
    // Ziehen
    secGrip.addEventListener('dragstart', function (e) { DRAG = { kind: 'sec', id: curSec.getAttribute('data-sid') }; e.dataTransfer.setData('text/plain', 'sec'); e.dataTransfer.effectAllowed = 'move'; curSec.classList.add('jr-dragging'); });
    elGrip.addEventListener('dragstart', function (e) { DRAG = { kind: 'el', eid: curEl.getAttribute('data-eid'), node: curEl }; e.dataTransfer.setData('text/plain', 'el'); e.dataTransfer.effectAllowed = 'move'; curEl.classList.add('jr-dragging'); });
    function endDrag() { [].forEach.call(document.querySelectorAll('.jr-dragging,.jr-target'), function (x) { x.classList.remove('jr-dragging', 'jr-target'); }); dropLine.style.display = 'none'; DRAG = null; hideAll(); }
    [secGrip, elGrip].forEach(function (g) { g.addEventListener('dragend', endDrag); });
    function line(x, y, w, h) { dropLine.style.display = ''; dropLine.style.left = x + 'px'; dropLine.style.top = y + 'px'; dropLine.style.width = w + 'px'; dropLine.style.height = h + 'px'; }
    document.addEventListener('dragover', function (e) {
      if (!DRAG) return; e.preventDefault();
      // automatisch scrollen, wenn man an den Rand zieht
      var edge = 70, vh = innerHeight;
      if (e.clientY < edge) scrollBy(0, -Math.ceil((edge - e.clientY) / 3));
      else if (e.clientY > vh - edge) scrollBy(0, Math.ceil((e.clientY - (vh - edge)) / 3));
      var t = e.target.closest ? e.target : e.target.parentElement;
      var sx = scrollX, sy = scrollY;
      [].forEach.call(document.querySelectorAll('.jr-target'), function (x) { x.classList.remove('jr-target'); });
      if (DRAG.kind === 'item') {
        var it = t.closest('[data-item]'); DRAG.to = null;
        if (!it || it === DRAG.node) { dropLine.style.display = 'none'; return; }
        var x = iinfo(it); if (x.base !== DRAG.base || x.list !== DRAG.list) { dropLine.style.display = 'none'; return; }
        var r0 = it.getBoundingClientRect(), dr = DRAG.node.getBoundingClientRect();
        var horiz = Math.abs(r0.top - dr.top) < Math.min(r0.height, dr.height) / 2;
        var aft = horiz ? e.clientX > r0.left + r0.width / 2 : e.clientY > r0.top + r0.height / 2;
        DRAG.to = x.i; DRAG.after = aft;
        if (horiz) line((aft ? r0.right + 4 : r0.left - 6) + sx, r0.top + sy, 4, r0.height); else line(r0.left + sx, (aft ? r0.bottom + 4 : r0.top - 6) + sy, r0.width, 4);
        return;
      }
      if (DRAG.kind === 'sec') {
        var sec = t.closest('.sec'); if (!sec) return;
        var r = sec.getBoundingClientRect(), after = e.clientY > r.top + r.height / 2;
        DRAG.target = sec.getAttribute('data-sid'); DRAG.after = after;
        line(r.left + sx, (after ? r.bottom : r.top) + sy - 2, r.width, 4);
      } else {
        var el = t.closest('.el'), sec2 = t.closest('.sec');
        if (el && el !== DRAG.node && !DRAG.node.contains(el)) {
          var er = el.getBoundingClientRect(), full = el.classList.contains('w-full');
          var aft = full ? e.clientY > er.top + er.height / 2 : e.clientX > er.left + er.width / 2;
          DRAG.toEid = el.getAttribute('data-eid'); DRAG.toSid = el.closest('.sec').getAttribute('data-sid'); DRAG.after = aft;
          if (full) line(er.left + sx, (aft ? er.bottom + 12 : er.top - 12) + sy - 2, er.width, 4); else line((aft ? er.right + 18 : er.left - 18) + sx - 2, er.top + sy, 4, er.height);
        } else if (sec2) {
          DRAG.toEid = null; DRAG.toSid = sec2.getAttribute('data-sid'); DRAG.after = true;
          sec2.classList.add('jr-target'); dropLine.style.display = 'none';
        }
      }
    });
    document.addEventListener('drop', function (e) {
      if (!DRAG) return; e.preventDefault();
      if (DRAG.kind === 'sec' && DRAG.target && DRAG.target !== DRAG.id) send({ type: 'jr-move-sec', id: DRAG.id, target: DRAG.target, after: DRAG.after });
      if (DRAG.kind === 'item' && DRAG.to != null) send({ type: 'jr-item', base: DRAG.base, list: DRAG.list, i: DRAG.from, act: 'move', to: DRAG.to, after: DRAG.after });
      if (DRAG.kind === 'el' && DRAG.toSid) send({ type: 'jr-move-el', eid: DRAG.eid, toSid: DRAG.toSid, toEid: DRAG.toEid, after: DRAG.after });
      endDrag();
    });
    document.addEventListener('mouseleave', function () { if (!DRAG) hideAll(); });
  })();

  // ---------- Lightbox ----------
  var lb = document.getElementById('lb'), media = document.getElementById('lbMedia'), cap = document.getElementById('lbCap'), nav = document.getElementById('lbNav');
  var photos = [], idx = 0, lastFocus = null;
  function openBox(box, focusEl) { lastFocus = document.activeElement; box.hidden = false; document.body.style.overflow = 'hidden'; (focusEl || box.querySelector('button')).focus(); }
  function closeBox(box) { box.hidden = true; if (box === lb) media.innerHTML = ''; var gb = document.getElementById('galBox'); if (!(gb && !gb.hidden)) document.body.style.overflow = ''; if (lastFocus && lastFocus.focus && box !== lb) lastFocus.focus(); }
  function showPhoto(i) {
    idx = (i + photos.length) % photos.length;
    var im = photos[idx].querySelector('img');
    media.innerHTML = ''; var big = document.createElement('img'); big.src = im.src; big.alt = im.alt; media.appendChild(big);
    cap.textContent = (im.alt ? im.alt + '  ·  ' : '') + (idx + 1) + ' / ' + photos.length; nav.hidden = false;
  }
  function bindPhotos() {
    photos = [].slice.call(document.querySelectorAll('.js-photo'));
    photos.forEach(function (p, i) { p.onclick = function (e) { e.stopPropagation(); showPhoto(i); openBox(lb); }; });
  }
  document.getElementById('lbPrev').onclick = function () { showPhoto(idx - 1); };
  document.getElementById('lbNext').onclick = function () { showPhoto(idx + 1); };
  document.getElementById('lbClose').onclick = function () { closeBox(lb); };
  lb.addEventListener('click', function (e) { if (e.target === lb) closeBox(lb); });



  // ---------- Abschnitte ein-/ausklappen ----------
  function fold(sec, open) {
    var btn = sec.querySelector('.sec-toggle'), body = sec.querySelector('.sec-body'); if (!btn || !body) return;
    if (open == null) open = sec.classList.contains('collapsed');
    body.classList.add('clipping');
    sec.classList.toggle('collapsed', !open);
    btn.setAttribute('aria-expanded', String(open));
    var done = function () { if (!sec.classList.contains('collapsed')) body.classList.remove('clipping'); body.removeEventListener('transitionend', done); };
    body.addEventListener('transitionend', done);
    if (DATA.theme.motion === false || matchMedia('(prefers-reduced-motion: reduce)').matches) done();
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.sec-toggle');
    if (b) { e.preventDefault(); e.stopPropagation(); fold(b.closest('.sec')); return; }
    if (!PREVIEW) {
      var h = e.target.closest('.sec.foldable .sec-head h2');
      if (h) { fold(h.closest('.sec')); return; }
      var a = e.target.closest('a[href^="#"]');
      if (a) { var tg = document.getElementById(a.getAttribute('href').slice(1)); if (tg && tg.classList.contains('collapsed')) fold(tg, true); }
    }
  }, true);


  // ---------- „Alle Fotos“-Fenster ----------
  var galBox = document.getElementById('galBox'), galGrid = document.getElementById('galGrid'), galTitle = document.getElementById('galTitle');
  document.addEventListener('click', function (e) {
    var m = e.target.closest('.js-more'); if (!m || PREVIEW) return;
    e.preventDefault();
    var g = GALS[m.getAttribute('data-g')]; if (!g) return;
    galTitle.textContent = (g.title ? g.title + ' · ' : '') + g.photos.length + ' Fotos';
    galGrid.innerHTML = g.photos.map(function (p) { return '<button class="ph js-gphoto" type="button"><img src="' + esc(p.src) + '" alt="' + esc(p.alt || g.title || '') + '" loading="lazy"></button>'; }).join('');
    openBox(galBox, document.getElementById('galClose'));
    galBox.scrollTop = 0;
  });
  galGrid.addEventListener('click', function (e) {
    var t = e.target.closest('.js-gphoto'); if (!t) return;
    var tiles = [].slice.call(galGrid.querySelectorAll('.js-gphoto'));
    photos = tiles; showPhoto(tiles.indexOf(t)); lb.hidden = false;
  });
  document.getElementById('galClose').onclick = function () { closeBox(galBox); bindPhotos(); };
  galBox.addEventListener('click', function (e) { if (e.target === galBox) { closeBox(galBox); bindPhotos(); } });


  // ---------- Kontaktformular senden ----------
  var formStart = Date.now();
  document.addEventListener('submit', function (e) {
    var f = e.target.closest('.cform'); if (!f) return;
    e.preventDefault();
    var err = f.querySelector('.cf-err'), btn = f.querySelector('button[type=submit]'); err.textContent = '';
    var data = {}; [].forEach.call(f.elements, function (x) { if (x.name) data[x.name] = x.type === 'checkbox' ? x.checked : x.value; });
    if (!data.name || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email || '')) { err.textContent = 'Bitte gib deinen Namen und eine gültige E-Mail-Adresse an.'; return; }
    if (!data.message && !data.type) { err.textContent = 'Bitte schreib kurz, worum es geht.'; return; }
    if (!data.consent) { err.textContent = 'Bitte bestätige den Datenschutz-Hinweis.'; return; }
    if (PREVIEW || MODE === 'demo') { err.textContent = 'Vorschau: Das Formular wird hier nicht gesendet. Auf deiner veröffentlichten Website kommt die Anfrage bei dir an.'; return; }
    data.t = Date.now() - formStart;
    btn.disabled = true; btn.textContent = 'Wird gesendet …';
    fetch('/api/contact', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || 'Senden fehlgeschlagen.'); return j; }); })
      .then(function () { f.hidden = true; var d = f.parentNode.querySelector('.cf-done'); if (d) d.hidden = false; })
      .catch(function (x) { err.textContent = x.message + ' Du kannst mir auch direkt eine E-Mail schreiben.'; btn.disabled = false; btn.textContent = 'Anfrage senden'; });
  });

  // ---------- Kundenzugang (Code eingeben) ----------
  var codeBox = document.getElementById('codeBox'), codeForm = document.getElementById('codeForm'), codeIn = document.getElementById('codeIn'), codeErr = document.getElementById('codeErr');
  function openCode() { if (PREVIEW) return; codeErr.textContent = ''; codeIn.value = ''; openBox(codeBox, codeIn); }
  document.addEventListener('click', function (e) {
    if (e.target.closest('.js-code') || e.target.closest('#clientLink')) { e.preventDefault(); openCode(); }
  });
  document.getElementById('codeClose').onclick = function () { closeBox(codeBox); };
  codeBox.addEventListener('click', function (e) { if (e.target === codeBox) closeBox(codeBox); });
  codeForm.addEventListener('submit', function (e) {
    e.preventDefault(); var b = document.getElementById('codeBtn'); b.disabled = true; b.textContent = 'Prüfe …'; codeErr.textContent = '';
    A.unlock(codeIn.value).then(function (j) {
      b.disabled = false; b.textContent = 'Freischalten';
      if (!j.ok) { codeErr.textContent = 'Dieser Code passt zu keinem Projekt.'; codeIn.select(); return; }
      closeBox(codeBox); render(j.view);
      var first = document.querySelector('.film:not(.locked), .sec'); 
      var msg = document.getElementById('unlockMsg'); msg.textContent = j.unlocked === 1 ? '1 Projekt freigeschaltet.' : j.unlocked + ' Projekte freigeschaltet.'; msg.hidden = false; setTimeout(function () { msg.hidden = true; }, 4000);
    }).catch(function () { b.disabled = false; b.textContent = 'Freischalten'; codeErr.textContent = 'Das hat nicht geklappt. Bitte nochmal versuchen.'; });
  });

  // ---------- Login über den roten Punkt ----------
  var login = document.getElementById('login'), form = document.getElementById('loginForm'), pw = document.getElementById('pw'), err = document.getElementById('loginErr');
  document.getElementById('recDot').addEventListener('click', function () {
    if (PREVIEW) return;
    if (A.token()) { location.href = 'edit.html'; return; }
    err.textContent = ''; pw.value = '';
    document.getElementById('loginHint').textContent = MODE === 'demo' ? 'Vorschau-Modus: Passwort ist „demo“. Änderungen bleiben nur in diesem Browser.' : 'Passwort eingeben, um die Website zu bearbeiten.';
    openBox(login, pw);
  });
  document.getElementById('loginClose').onclick = function () { closeBox(login); };
  login.addEventListener('click', function (e) { if (e.target === login) closeBox(login); });
  form.addEventListener('submit', function (e) {
    e.preventDefault(); var b = document.getElementById('loginBtn'); b.disabled = true; b.textContent = 'Prüfe …'; err.textContent = '';
    A.login(pw.value).then(function () { location.href = 'edit.html'; })
      .catch(function (x) { err.textContent = x.message; b.disabled = false; b.textContent = 'Anmelden'; pw.select(); });
  });
  document.addEventListener('keydown', function (e) {
    if (!login.hidden && e.key === 'Escape') return closeBox(login);
    if (!codeBox.hidden && e.key === 'Escape') return closeBox(codeBox);
    if (lb.hidden && !galBox.hidden && e.key === 'Escape') { closeBox(galBox); bindPhotos(); return; }
    if (lb.hidden) return;
    if (e.key === 'Escape') closeBox(lb);
    if (!nav.hidden && e.key === 'ArrowRight') showPhoto(idx + 1);
    if (!nav.hidden && e.key === 'ArrowLeft') showPhoto(idx - 1);
  });

  // ---------- Live-Vorschau im Editor ----------
  if (PREVIEW) {
    document.documentElement.classList.add('preview-mode');
    window.addEventListener('message', function (e) {
      var m = e.data || {};
      if (m.type === 'jr-content' && EDITING) { PENDING = m; return; }
      if (m.type === 'jr-content') { var y = scrollY; SELECTED = m.selected || null; SELECTED_EL = m.selectedEl || null; render(JSON.parse(JSON.stringify(m.content))); scrollTo(0, y); }
      if (m.type === 'jr-replay') {
        ANIM_ON = true; render(DATA); ANIM_ON = false;
        var tgt = m.id ? document.querySelector('.sec[data-sid="' + m.id + '"]') : null;
        if (tgt) { [].forEach.call(tgt.querySelectorAll('.a-t'), function (x) { x.classList.remove('in'); }); scrollTo(0, tgt.offsetTop - 80); }
        else scrollTo(0, 0);
      }
      if (m.type === 'jr-focus') {
        SELECTED = m.id;
        [].forEach.call(document.querySelectorAll('.sec'), function (el) { el.classList.toggle('selected', el.getAttribute('data-sid') === m.id); });
        var el = document.querySelector('.sec[data-sid="' + m.id + '"]');
        if (el && m.scroll !== false) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  A.mode().then(function (m) { MODE = m; });
  var qcode = (location.search.match(/[?&]code=([^&#]+)/) || [])[1];
  (qcode && !PREVIEW ? A.unlock(decodeURIComponent(qcode)).then(function (j) { try { history.replaceState(null, '', location.pathname + location.hash); } catch (x) {} return j.view; }) : A.getContent({ full: PREVIEW })).then(function (d) {
    render(d);
    if (PREVIEW) parent.postMessage({ type: 'jr-ready' }, '*');
    if (location.hash && !PREVIEW) { var t = document.getElementById(location.hash.slice(1)); if (t) t.scrollIntoView(); }
  }).catch(function () { page.innerHTML = '<div class="wrap empty-page mono">Inhalte konnten nicht geladen werden.</div>'; });

  window.SiteRender = { render: render };
})();
