import { json } from '../../lib/auth.js';
import { publicView } from '../../lib/visibility.js';
import { loadAll } from '../../lib/store.js';

// Kundenzugang: Mit einem Code werden geschützte Projekte freigegeben.
export async function onRequestPost({ request, env }) {
  let body = {};
  try { body = await request.json(); } catch (e) {}
  const prev = [].concat(body.codes || []).map(String).slice(0, 10);
  const code = body.code ? String(body.code).slice(0, 100) : '';
  const data = await loadAll(request, env);
  const before = publicView(data, prev).unlocked;
  const r = publicView(data, code ? prev.concat([code]) : prev);
  const ok = r.unlocked > before;
  if (code && !ok) await new Promise((res) => setTimeout(res, 700)); // bremst Rateversuche
  return json({ ok, unlocked: r.unlocked, view: r.view });
}
