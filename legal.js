/* Übernimmt Schriften und Farben aus dem Editor (Design) auch für Impressum und Datenschutz. */
(function () {
  var K = window.Kit; if (!K) return;
  fetch('/api/content').then(function (r) { return r.json(); }).then(function (d) {
    var t = d && d.theme; if (!t) return;
    var st = document.documentElement.style, set = function (k, v) { if (v) st.setProperty(k, v); };
    ['bg', 'panel', 'line', 'fg', 'muted'].forEach(function (k) { set('--' + k, t[k]); });
    set('--red', t.accent); set('--red-soft', t.accent);
    var fd = K.font('display', t.fontDisplay), fb = K.font('body', t.fontBody), fm = K.font('mono', t.fontMono);
    set('--display', '"' + fd.name + '",' + fd.fb); set('--body', '"' + fb.name + '",' + fb.fb); set('--mono', '"' + fm.name + '",' + fm.fb);
    set('--hweight', String(t.headingWeight || 800));
    set('--hstretch', (fd.stretch ? (t.headingStretch || 100) : 100) + '%');
    set('--hcase', t.headingUpper === false ? 'none' : 'uppercase');
    [['display', t.fontDisplay], ['body', t.fontBody], ['mono', t.fontMono]].forEach(function (x) {
      var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = K.fontCss(x[0], x[1]); document.head.appendChild(l);
    });
  }).catch(function () {});
})();
