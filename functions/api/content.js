import { json, isAuthed } from '../../lib/auth.js';

// Speicherort: KV "CONTENT" falls verbunden, sonst R2 "MEDIA" (Datei data/content.json)
async function readSaved(env, key = 'content') {
  if (env.CONTENT) return env.CONTENT.get(key);
  if (env.MEDIA) { const o = await env.MEDIA.get('data/' + key + '.json'); return o ? o.text() : null; }
  return null;
}
async function writeSaved(env, key, text) {
  if (env.CONTENT) return env.CONTENT.put(key, text);
  return env.MEDIA.put('data/' + key + '.json', text, { httpMetadata: { contentType: 'application/json' } });
}

// Inhalte lesen: erst aus dem KV-Speicher, sonst die content.json aus dem Repo
export async function onRequestGet({ request, env }) {
  const saved = await readSaved(env);
  if (saved) {
    return new Response(saved, { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
  }
  const res = await env.ASSETS.fetch(new URL('/content.json', request.url));
  return new Response(res.body, { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
}

// Inhalte speichern (nur mit Login)
export async function onRequestPut({ request, env }) {
  if (!(await isAuthed(request, env))) return json({ error: 'Nicht angemeldet oder Login abgelaufen.' }, 401);
  if (!env.CONTENT && !env.MEDIA) return json({ error: 'Kein Speicher verbunden: R2-Bucket "MEDIA" fehlt (siehe README).' }, 500);
  const text = await request.text();
  if (text.length > 1_000_000) return json({ error: 'Inhalt ist zu groß.' }, 413);
  let data;
  try { data = JSON.parse(text); } catch (e) { return json({ error: 'Ungültige Daten.' }, 400); }
  if (!data || !Array.isArray(data.films) || !Array.isArray(data.series)) return json({ error: 'Ungültige Daten.' }, 400);
  const prev = await readSaved(env);
  if (prev) await writeSaved(env, 'content-backup', prev); // letzte Version als Sicherung
  data.savedAt = new Date().toISOString();
  await writeSaved(env, 'content', JSON.stringify(data));
  return json({ ok: true, savedAt: data.savedAt });
}
