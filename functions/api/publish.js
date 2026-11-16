import { json, isAuthed } from '../../lib/auth.js';
import { readSaved, writeSaved, deleteSaved, saveVersion, listVersions, readVersion } from '../../lib/store.js';

// Entwurf veröffentlichen, verwerfen, frühere Versionen wiederherstellen (nur mit Login)
export async function onRequestGet({ request, env }) {
  if (!(await isAuthed(request, env))) return json({ error: 'Nicht angemeldet.' }, 401);
  const draft = await readSaved(env, 'draft'), pub = await readSaved(env, 'content');
  let draftAt = null, pubAt = null;
  try { draftAt = draft ? JSON.parse(draft).savedAt : null; } catch (e) {}
  try { pubAt = pub ? (JSON.parse(pub).publishedAt || JSON.parse(pub).savedAt) : null; } catch (e) {}
  return json({ hasDraft: !!draft && draft !== pub, draftAt, publishedAt: pubAt, versions: await listVersions(env) });
}
export async function onRequestPost({ request, env }) {
  if (!(await isAuthed(request, env))) return json({ error: 'Nicht angemeldet.' }, 401);
  if (!env.CONTENT && !env.MEDIA) return json({ error: 'Kein Speicher verbunden.' }, 500);
  const url = new URL(request.url), action = url.searchParams.get('action') || 'publish';
  if (action === 'discard') { await deleteSaved(env, 'draft'); return json({ ok: true }); }
  if (action === 'restore') {
    const v = await readVersion(env, url.searchParams.get('id')); if (!v) return json({ error: 'Version nicht gefunden.' }, 404);
    await writeSaved(env, 'draft', v); return json({ ok: true });
  }
  const draft = await readSaved(env, 'draft');
  if (!draft) return json({ ok: true, nothing: true });
  const prev = await readSaved(env, 'content');
  if (prev) { await writeSaved(env, 'content-backup', prev); await saveVersion(env, prev); }
  const data = JSON.parse(draft); data.publishedAt = new Date().toISOString();
  await writeSaved(env, 'content', JSON.stringify(data));
  await deleteSaved(env, 'draft');
  return json({ ok: true, publishedAt: data.publishedAt });
}
