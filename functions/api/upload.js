import { json, isAuthed } from '../../lib/auth.js';

const EXT = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif',
  'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov'
};

// Datei in den R2-Speicher hochladen (nur mit Login)
export async function onRequestPost({ request, env }) {
  if (!(await isAuthed(request, env))) return json({ error: 'Nicht angemeldet oder Login abgelaufen.' }, 401);
  if (!env.MEDIA) return json({ error: 'R2-Speicher "MEDIA" ist nicht verbunden (siehe README).' }, 500);
  const type = (request.headers.get('content-type') || '').split(';')[0].trim();
  const ext = EXT[type];
  if (!ext) return json({ error: 'Dateityp nicht erlaubt. Erlaubt: JPG, PNG, WebP, GIF, MP4, WebM, MOV.' }, 415);
  const key = 'uploads/' + Date.now() + '-' + crypto.randomUUID().slice(0, 8) + '.' + ext;
  await env.MEDIA.put(key, request.body, { httpMetadata: { contentType: type } });
  return json({ src: '/media/' + key });
}
