import { json, isAuthed } from '../../lib/auth.js';
import { publicView } from '../../lib/visibility.js';
import { readSaved, writeSaved, loadAll } from '../../lib/store.js';

// Inhalte lesen. Besucher bekommen nur, was sie sehen dürfen (NDA ohne Medien, keine gesperrten
// oder zukünftigen Projekte). Der Editor bekommt mit Login und ?full=1 alles.
export async function onRequestGet({ request, env }) {
  const full = new URL(request.url).searchParams.get('full') && await isAuthed(request, env);
  if (full) { // Editor: Entwurf, falls vorhanden, sonst die veröffentlichte Fassung
    const draft = await readSaved(env, 'draft');
    if (draft) return new Response(draft, { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
    return json(await loadAll(request, env));
  }
  return json(publicView(await loadAll(request, env)).view);
}

// Inhalte speichern (nur mit Login)
export async function onRequestPut({ request, env }) {
  if (!(await isAuthed(request, env))) return json({ error: 'Nicht angemeldet oder Login abgelaufen.' }, 401);
  if (!env.CONTENT && !env.MEDIA) return json({ error: 'Kein Speicher verbunden: R2-Bucket "MEDIA" fehlt (siehe README).' }, 500);
  const text = await request.text();
  if (text.length > 1_000_000) return json({ error: 'Inhalt ist zu groß.' }, 413);
  let data;
  try { data = JSON.parse(text); } catch (e) { return json({ error: 'Ungültige Daten.' }, 400); }
  if (!data || !(Array.isArray(data.sections) || (Array.isArray(data.films) && Array.isArray(data.series)))) return json({ error: 'Ungültige Daten.' }, 400);
  data.savedAt = new Date().toISOString();
  // Der Editor speichert in den Entwurf. Besucher sehen ihn erst nach „Veröffentlichen“.
  const asDraft = new URL(request.url).searchParams.get('draft');
  if (asDraft) { await writeSaved(env, 'draft', JSON.stringify(data)); return json({ ok: true, draft: true, savedAt: data.savedAt }); }
  const prev = await readSaved(env);
  if (prev) await writeSaved(env, 'content-backup', prev);
  await writeSaved(env, 'content', JSON.stringify(data));
  return json({ ok: true, savedAt: data.savedAt });
}
