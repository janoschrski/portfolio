import { json, isAuthed } from '../../lib/auth.js';

// Große Videos in Stücken hochladen (R2 Multipart). Jedes Stück bleibt unter dem 100-MB-Limit von Cloudflare.
const EXT = { 'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov', 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

export async function onRequest({ request, env }) {
  if (!(await isAuthed(request, env))) return json({ error: 'Nicht angemeldet oder Login abgelaufen.' }, 401);
  if (!env.MEDIA) return json({ error: 'R2-Speicher "MEDIA" ist nicht verbunden (siehe README).' }, 500);
  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  const key = url.searchParams.get('key') || '';
  const uploadId = url.searchParams.get('uploadId') || '';
  if (action !== 'create' && !key.startsWith('uploads/')) return json({ error: 'Ungültiger Upload.' }, 400);

  if (action === 'create' && request.method === 'POST') {
    const { type } = await request.json();
    const ext = EXT[type];
    if (!ext) return json({ error: 'Dateityp nicht erlaubt.' }, 415);
    const newKey = 'uploads/' + Date.now() + '-' + crypto.randomUUID().slice(0, 8) + '.' + ext;
    const up = await env.MEDIA.createMultipartUpload(newKey, { httpMetadata: { contentType: type } });
    return json({ key: up.key, uploadId: up.uploadId });
  }

  const up = env.MEDIA.resumeMultipartUpload(key, uploadId);

  if (action === 'part' && request.method === 'PUT') {
    const n = parseInt(url.searchParams.get('part'), 10);
    if (!(n >= 1 && n <= 10000)) return json({ error: 'Ungültige Teilnummer.' }, 400);
    const part = await up.uploadPart(n, request.body);
    return json({ partNumber: part.partNumber, etag: part.etag });
  }
  if (action === 'complete' && request.method === 'POST') {
    const { parts } = await request.json();
    await up.complete(parts);
    return json({ src: '/media/' + key });
  }
  if (action === 'abort' && request.method === 'POST') {
    await up.abort();
    return json({ ok: true });
  }
  return json({ error: 'Unbekannte Aktion.' }, 400);
}
