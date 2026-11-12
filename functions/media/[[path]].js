// Liefert hochgeladene Bilder und Videos aus R2 aus (mit Range-Support zum Spulen in Videos)
export async function onRequestGet({ request, env, params }) {
  if (!env.MEDIA) return new Response('R2 nicht verbunden', { status: 500 });
  const key = [].concat(params.path || []).join('/');
  if (!key.startsWith('uploads/')) return new Response('Nicht gefunden', { status: 404 });
  const obj = await env.MEDIA.get(key, { range: request.headers, onlyIf: request.headers });
  if (obj === null) return new Response('Nicht gefunden', { status: 404 });
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('etag', obj.httpEtag);
  headers.set('accept-ranges', 'bytes');
  headers.set('cache-control', 'public, max-age=31536000, immutable');
  if (!('body' in obj) || !obj.body) return new Response(null, { status: 304, headers });
  const r = obj.range;
  if (r && request.headers.has('range')) {
    let start, end;
    if ('suffix' in r) { start = obj.size - r.suffix; end = obj.size - 1; }
    else { start = r.offset || 0; end = r.length != null ? start + r.length - 1 : obj.size - 1; }
    headers.set('content-range', `bytes ${start}-${end}/${obj.size}`);
    headers.set('content-length', String(end - start + 1));
    return new Response(obj.body, { status: 206, headers });
  }
  headers.set('content-length', String(obj.size));
  return new Response(obj.body, { headers });
}
