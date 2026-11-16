// Wo die Inhalte gespeichert sind (KV oder R2) – gemeinsam für mehrere Funktionen.
// Speicherort: KV "CONTENT" falls verbunden, sonst R2 "MEDIA" (Datei data/content.json)
export async function readSaved(env, key = 'content') {
  if (env.CONTENT) return env.CONTENT.get(key);
  if (env.MEDIA) { const o = await env.MEDIA.get('data/' + key + '.json'); return o ? o.text() : null; }
  return null;
}
export async function writeSaved(env, key, text) {
  if (env.CONTENT) return env.CONTENT.put(key, text);
  return env.MEDIA.put('data/' + key + '.json', text, { httpMetadata: { contentType: 'application/json' } });
}

export async function loadAll(request, env) {
  const saved = await readSaved(env);
  if (saved) return JSON.parse(saved);
  const res = await env.ASSETS.fetch(new URL('/content.json', request.url));
  return res.json();
}

export async function deleteSaved(env, key) {
  if (env.CONTENT) return env.CONTENT.delete(key);
  if (env.MEDIA) return env.MEDIA.delete('data/' + key + '.json');
}
// Frühere veröffentlichte Versionen (nur mit R2)
export async function saveVersion(env, text) {
  if (!env.MEDIA || !text) return;
  await env.MEDIA.put('data/versions/' + Date.now() + '.json', text, { httpMetadata: { contentType: 'application/json' } });
  const list = await env.MEDIA.list({ prefix: 'data/versions/', limit: 1000 });
  const keys = list.objects.map((o) => o.key).sort();
  for (const k of keys.slice(0, Math.max(0, keys.length - 20))) await env.MEDIA.delete(k);
}
export async function listVersions(env) {
  if (!env.MEDIA) return [];
  const list = await env.MEDIA.list({ prefix: 'data/versions/', limit: 1000 });
  return list.objects.map((o) => o.key.replace('data/versions/', '').replace('.json', '')).sort().reverse().map((id) => ({ id, at: new Date(+id).toISOString() }));
}
export async function readVersion(env, id) {
  if (!env.MEDIA) return null;
  const o = await env.MEDIA.get('data/versions/' + String(id).replace(/\D/g, '') + '.json');
  return o ? o.text() : null;
}
