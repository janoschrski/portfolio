import { json, isAuthed } from '../../lib/auth.js';

// Anfragen aus dem Kontaktformular (nur mit Login)
export async function onRequestGet({ request, env }) {
  if (!(await isAuthed(request, env))) return json({ error: 'Nicht angemeldet.' }, 401);
  if (!env.MEDIA) return json({ items: [], mail: false });
  const list = await env.MEDIA.list({ prefix: 'data/inquiries/', limit: 200 });
  const keys = list.objects.map((o) => o.key).sort().reverse().slice(0, 100);
  const items = (await Promise.all(keys.map(async (k) => { const o = await env.MEDIA.get(k); return o ? JSON.parse(await o.text()) : null; }))).filter(Boolean);
  return json({ items, mail: !!(env.RESEND_API_KEY && env.CONTACT_TO), to: env.CONTACT_TO || '' });
}
export async function onRequestPatch({ request, env }) {
  if (!(await isAuthed(request, env))) return json({ error: 'Nicht angemeldet.' }, 401);
  const { id, read } = await request.json();
  const key = 'data/inquiries/' + String(id).replace(/[^\w-]/g, '') + '.json';
  const o = await env.MEDIA.get(key); if (!o) return json({ error: 'Nicht gefunden.' }, 404);
  const rec = JSON.parse(await o.text()); rec.read = !!read;
  await env.MEDIA.put(key, JSON.stringify(rec), { httpMetadata: { contentType: 'application/json' } });
  return json({ ok: true });
}
export async function onRequestDelete({ request, env }) {
  if (!(await isAuthed(request, env))) return json({ error: 'Nicht angemeldet.' }, 401);
  const id = new URL(request.url).searchParams.get('id') || '';
  await env.MEDIA.delete('data/inquiries/' + id.replace(/[^\w-]/g, '') + '.json');
  return json({ ok: true });
}
