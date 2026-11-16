import { json, isAuthed } from '../../lib/auth.js';
// Wie viel Speicher im R2-Bucket belegt ist (nur mit Login)
export async function onRequestGet({ request, env }) {
  if (!(await isAuthed(request, env))) return json({ error: 'Nicht angemeldet.' }, 401);
  if (!env.MEDIA) return json({ error: 'R2-Speicher nicht verbunden.' }, 500);
  let bytes = 0, count = 0, cursor;
  for (let i = 0; i < 50; i++) {
    const page = await env.MEDIA.list({ cursor, limit: 1000 });
    for (const o of page.objects) { bytes += o.size; count++; }
    if (!page.truncated) break;
    cursor = page.cursor;
  }
  return json({ bytes, count });
}
