import { json } from '../../lib/auth.js';
// Zeigt dem Editor, ob alles in Cloudflare verbunden ist.
export const onRequestGet = ({ env }) =>
  json({ ok: true, app: 'janosch-site', kv: !!(env.CONTENT || env.MEDIA), r2: !!env.MEDIA, password: !!env.ADMIN_PASSWORD });
