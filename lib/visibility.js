// Was Besucher sehen dürfen. Gleiche Logik steht für die Vorschau auch in public/sections.js (Kit.publicView).
export function today() {
  try { return new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' }); } catch (e) { return new Date().toISOString().slice(0, 10); }
}
function codeOk(code, codes) {
  const c = String(code || '').trim().toLowerCase();
  return !!c && codes.some((x) => String(x || '').trim().toLowerCase() === c);
}
export function publicView(data, codes = []) {
  const t = today(), out = JSON.parse(JSON.stringify(data || {}));
  let locked = false, unlocked = 0;
  function item(it) {
    if (!it || typeof it !== 'object') return it;
    if (it.publishAt && it.publishAt > t) return null;
    if (it.visibility === 'code') {
      locked = true;
      if (codeOk(it.code, codes)) { delete it.code; it.unlocked = true; unlocked++; return it; }
      if (it.teaser === false) return null;
      return { locked: true, title: it.title || '', subtitle: it.subtitle || '', kind: it.kind || '', date: it.date || '', badge: it.badge || '' };
    }
    if (it.visibility === 'nda') { delete it.youtube; delete it.video; delete it.image; delete it.photos; it.nda = true; }
    delete it.code;
    return it;
  }
  if (Array.isArray(out.sections)) {
    out.sections = out.sections.filter((s) => {
      if (s.publishAt && s.publishAt > t) return false;
      if (s.visibility === 'code') { locked = true; if (!codeOk(s.code, codes)) return false; unlocked++; s.unlocked = true; }
      delete s.code;
      if (Array.isArray(s.items)) s.items = s.items.map(item).filter(Boolean);
      return true;
    });
  }
  out.hasLocked = locked;
  return { view: out, unlocked };
}
