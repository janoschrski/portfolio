/* Gemeinsame Logik für Website und Editor.
   "live" = veröffentlicht auf Cloudflare Pages mit Functions.
   "demo" = Vorschau ohne Server (Änderungen nur in diesem Browser). */
(function () {
  var API = {}, mode = null;
  var TOKEN_KEY = 'jr-token', DEMO_KEY = 'jr-demo-content', DEMO_DRAFT = 'jr-demo-draft', DEMO_VERS = 'jr-demo-versions';

  function store(kind) { try { return window[kind]; } catch (e) { return null; } }
  function sget(k) { try { return store('sessionStorage').getItem(k); } catch (e) { return API._mem && API._mem[k]; } }
  function sset(k, v) { try { v == null ? store('sessionStorage').removeItem(k) : store('sessionStorage').setItem(k, v); } catch (e) { API._mem = API._mem || {}; API._mem[k] = v; } }

  API.mode = function () {
    if (mode) return Promise.resolve(mode);
    return fetch('/api/health', { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (j) { API.health = j; mode = j && j.app === 'janosch-site' ? 'live' : 'demo'; return mode; })
      .catch(function () { mode = 'demo'; return mode; });
  };

  API.ytId = function (v) {
    v = (v || '').trim();
    if (!v) return '';
    if (/^[\w-]{11}$/.test(v)) return v;
    var m = v.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/|\/live\/)([\w-]{11})/);
    return m ? m[1] : '';
  };
  API.ytThumb = function (id) { return 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg'; };
  API.ytEmbed = function (id) { return 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&modestbranding=1&playsinline=1'; };

  API.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  };

  // Inhalte aus der ersten Editor-Version (Filme/Fotos/Showreel/Porträt) in den Baukasten übernehmen,
  // ohne dass Leistungen, Ablauf usw. verloren gehen.
  function upgrade(d) {
    if (!d || Array.isArray(d.sections)) return d;
    return fetch('content.json', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (base) {
      var sr = d.showreel || {}, ab = d.about || {};
      (base.sections || []).forEach(function (s) {
        if (s.type === 'hero') { if (sr.heroImage) s.image = sr.heroImage; if (sr.youtube) s.youtube = sr.youtube; if (sr.video) s.video = sr.video; }
        if (s.type === 'films' && Array.isArray(d.films)) s.items = d.films;
        if (s.type === 'photos' && Array.isArray(d.series)) s.items = d.series;
        if (s.type === 'textImage' && (ab.image || ab.caption != null)) { if (ab.image) s.image = ab.image; if (ab.caption != null) s.caption = ab.caption; }
      });
      return base;
    }).catch(function () { return d; });
  }

  // Freigeschaltete Kunden-Codes (nur in diesem Tab)
  var CODES_KEY = 'jr-codes';
  API.codes = function () { try { return JSON.parse(sget(CODES_KEY) || '[]'); } catch (e) { return []; } };
  function addCode(c) { var l = API.codes(); if (l.indexOf(c) < 0) l.push(c); sset(CODES_KEY, JSON.stringify(l)); }

  // opts.full: alles (Editor, nur mit Login). Sonst: was Besucher sehen dürfen.
  API.getContent = function (opts) {
    opts = opts || {};
    return API.mode().then(function (m) {
      if (m === 'live') {
        if (opts.full && API.token()) return fetch('/api/content?full=1', { cache: 'no-store', headers: { Authorization: 'Bearer ' + API.token() } }).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(upgrade);
        var codes = API.codes();
        if (codes.length) return fetch('/api/unlock', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ codes: codes }) }).then(function (r) { return r.json(); }).then(function (j) { return upgrade(j.view); });
        return API._getContent().then(upgrade);
      }
      if (opts.full) { try { var dr = store('localStorage').getItem(DEMO_DRAFT); if (dr) return upgrade(JSON.parse(dr)); } catch (e) {} }
      return API._getContent().then(upgrade).then(function (d) { return opts.full || !window.Kit ? d : window.Kit.publicView(window.Kit.normalize(d), API.codes()).view; });
    });
  };
  API.unlock = function (code) {
    code = String(code || '').trim();
    return API.mode().then(function (m) {
      var codes = API.codes().concat([code]);
      if (m === 'live') return fetch('/api/unlock', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ codes: API.codes(), code: code }) }).then(function (r) { return r.json(); });
      return API._getContent().then(upgrade).then(function (d) { var r = window.Kit.publicView(window.Kit.normalize(d), codes); var r1 = window.Kit.publicView(window.Kit.normalize(d), API.codes()); return { ok: r.unlocked > r1.unlocked, unlocked: r.unlocked, view: r.view, prev: r1.unlocked }; });
    }).then(function (j) {
      if (j.ok) addCode(code);
      return j;
    });
  };
  API._getContent = function () {
    return API.mode().then(function (m) {
      if (m === 'live') {
        return fetch('/api/content', { cache: 'no-store' }).then(function (r) { if (!r.ok) throw 0; return r.json(); })
          .catch(function () { return fetch('content.json', { cache: 'no-store' }).then(function (r) { return r.json(); }); });
      }
      try { var s = store('localStorage').getItem(DEMO_KEY); if (s) return JSON.parse(s); } catch (e) {}
      return fetch('content.json', { cache: 'no-store' }).then(function (r) { return r.json(); });
    });
  };

  API.token = function () { return sget(TOKEN_KEY); };
  API.logout = function () { sset(TOKEN_KEY, null); };

  API.login = function (pw) {
    return API.mode().then(function (m) {
      if (m === 'demo') {
        if (pw === 'demo') { sset(TOKEN_KEY, 'demo'); return true; }
        throw new Error('Falsches Passwort. In der Vorschau lautet es: demo');
      }
      return fetch('/api/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ password: pw }) })
        .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || 'Login fehlgeschlagen.'); sset(TOKEN_KEY, j.token); return true; }); });
    });
  };

  API.save = function (content) {
    return API.mode().then(function (m) {
      if (m === 'demo') {
        try { store('localStorage').setItem(DEMO_DRAFT, JSON.stringify(content)); }
        catch (e) { throw new Error('Der Browser-Speicher ist voll. In der Vorschau passen nur wenige hochgeladene Bilder hinein.'); }
        return { ok: true };
      }
      return fetch('/api/content?draft=1', { method: 'PUT', headers: { 'content-type': 'application/json', 'Authorization': 'Bearer ' + API.token() }, body: JSON.stringify(content) })
        .then(function (r) { return r.json().then(function (j) { if (!r.ok) { var e = new Error(j.error || 'Speichern fehlgeschlagen.'); e.status = r.status; throw e; } return j; }); });
    });
  };


  // ---------- Entwurf / Veröffentlichen / Versionen ----------
  function ls() { return store('localStorage'); }
  function authJ(url, opts) {
    opts = opts || {}; opts.headers = Object.assign({ Authorization: 'Bearer ' + API.token() }, opts.headers || {});
    return fetch(url, opts).then(function (r) { return r.json().then(function (j) { if (!r.ok) { var e = new Error(j.error || 'Fehler.'); e.status = r.status; throw e; } return j; }); });
  }
  API.publishStatus = function () {
    return API.mode().then(function (m) {
      if (m === 'live') return authJ('/api/publish', { cache: 'no-store' });
      var d = null, p = null, v = []; try { d = ls().getItem(DEMO_DRAFT); p = ls().getItem(DEMO_KEY); v = JSON.parse(ls().getItem(DEMO_VERS) || '[]'); } catch (e) {}
      return { hasDraft: !!d && d !== p, versions: v.map(function (x) { return { id: x.id, at: new Date(+x.id).toISOString() }; }) };
    });
  };
  API.publish = function () {
    return API.mode().then(function (m) {
      if (m === 'live') return authJ('/api/publish', { method: 'POST' });
      try {
        var d = ls().getItem(DEMO_DRAFT); if (!d) return { ok: true, nothing: true };
        var p = ls().getItem(DEMO_KEY), v = JSON.parse(ls().getItem(DEMO_VERS) || '[]');
        if (p) { v.unshift({ id: String(Date.now()), data: p }); v = v.slice(0, 5); try { ls().setItem(DEMO_VERS, JSON.stringify(v)); } catch (e) {} }
        ls().setItem(DEMO_KEY, d); ls().removeItem(DEMO_DRAFT);
      } catch (e) { throw new Error('Der Browser-Speicher ist voll.'); }
      return { ok: true };
    });
  };
  API.discard = function () {
    return API.mode().then(function (m) {
      if (m === 'live') return authJ('/api/publish?action=discard', { method: 'POST' });
      try { ls().removeItem(DEMO_DRAFT); } catch (e) {} return { ok: true };
    });
  };
  API.restore = function (id) {
    return API.mode().then(function (m) {
      if (m === 'live') return authJ('/api/publish?action=restore&id=' + encodeURIComponent(id), { method: 'POST' });
      var v = JSON.parse(ls().getItem(DEMO_VERS) || '[]').filter(function (x) { return x.id === id; })[0];
      if (v) ls().setItem(DEMO_DRAFT, v.data); return { ok: !!v };
    });
  };

  // Bilder vor dem Upload verkleinern (spart Speicher und Ladezeit)
  API.resizeImage = function (file, max, quality) {
    return new Promise(function (resolve) {
      if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return resolve(file);
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        var s = Math.min(1, max / Math.max(img.width, img.height));
        var c = document.createElement('canvas');
        c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(function (b) { resolve(b || file); }, 'image/jpeg', quality);
      };
      img.onerror = function () { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });
  };

  API.upload = function (file, onProgress) {
    var isImg = /^image\//.test(file.type), isVid = /^video\//.test(file.type), isPdf = file.type === 'application/pdf';
    if (!isImg && !isVid && !isPdf) return Promise.reject(new Error('Bitte ein Bild, Video oder PDF auswählen.'));
    return API.mode().then(function (m) {
      if (m === 'demo') {
        if (isVid || isPdf) throw new Error((isPdf ? 'PDF-Upload' : 'Video-Upload') + ' funktioniert erst auf der veröffentlichten Website.');
        return API.resizeImage(file, 1200, 0.78).then(function (b) {
          return new Promise(function (res) { var fr = new FileReader(); fr.onload = function () { res({ src: fr.result }); }; fr.readAsDataURL(b); });
        });
      }
      if (file.size > 90 * 1024 * 1024) return API.uploadLarge(file, onProgress);
      return (isImg ? API.resizeImage(file, 2400, 0.86) : Promise.resolve(file)).then(function (blob) {
        return new Promise(function (resolve, reject) {
          var x = new XMLHttpRequest();
          x.open('POST', '/api/upload');
          x.setRequestHeader('Authorization', 'Bearer ' + API.token());
          x.setRequestHeader('Content-Type', blob.type || file.type);
          x.upload.onprogress = function (e) { if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total); };
          x.onload = function () {
            var j = {}; try { j = JSON.parse(x.responseText); } catch (e) {}
            if (x.status >= 200 && x.status < 300 && j.src) resolve(j); else reject(new Error(j.error || 'Upload fehlgeschlagen.'));
          };
          x.onerror = function () { reject(new Error('Upload fehlgeschlagen. Verbindung prüfen.')); };
          x.send(blob);
        });
      });
    });
  };

  // Große Dateien in 50-MB-Stücken hochladen
  API.uploadLarge = function (file, onProgress) {
    var CHUNK = 50 * 1024 * 1024, auth = { 'Authorization': 'Bearer ' + API.token() };
    var base = '/api/upload-large?action=';
    function call(url, opts) {
      return fetch(url, opts).then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || 'Upload fehlgeschlagen.'); return j; }); });
    }
    function sendPart(info, n, blob, done) {
      return new Promise(function (resolve, reject) {
        var x = new XMLHttpRequest();
        x.open('PUT', base + 'part&key=' + encodeURIComponent(info.key) + '&uploadId=' + encodeURIComponent(info.uploadId) + '&part=' + n);
        x.setRequestHeader('Authorization', auth.Authorization);
        x.upload.onprogress = function (e) { if (onProgress) onProgress((done + e.loaded) / file.size); };
        x.onload = function () { var j = {}; try { j = JSON.parse(x.responseText); } catch (e) {} if (x.status === 200 && j.etag) resolve(j); else reject(new Error(j.error || 'Upload-Teil ' + n + ' fehlgeschlagen.')); };
        x.onerror = function () { reject(new Error('Verbindung abgebrochen bei Teil ' + n + '.')); };
        x.send(blob);
      });
    }
    return call(base + 'create', { method: 'POST', headers: Object.assign({ 'content-type': 'application/json' }, auth), body: JSON.stringify({ type: file.type }) })
      .then(function (info) {
        var parts = [], total = Math.ceil(file.size / CHUNK), n = 0;
        function next() {
          if (n >= total) return call(base + 'complete&key=' + encodeURIComponent(info.key) + '&uploadId=' + encodeURIComponent(info.uploadId), { method: 'POST', headers: Object.assign({ 'content-type': 'application/json' }, auth), body: JSON.stringify({ parts: parts }) });
          var start = n * CHUNK, blob = file.slice(start, Math.min(file.size, start + CHUNK));
          n++;
          var tryPart = function (attempt) {
            return sendPart(info, n, blob, start).catch(function (e) { if (attempt < 3) return tryPart(attempt + 1); throw e; });
          };
          return tryPart(1).then(function (p) { parts.push(p); return next(); });
        }
        return next().catch(function (e) {
          fetch(base + 'abort&key=' + encodeURIComponent(info.key) + '&uploadId=' + encodeURIComponent(info.uploadId), { method: 'POST', headers: auth });
          throw e;
        });
      });
  };

  window.SiteAPI = API;
})();
