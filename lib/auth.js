// Gemeinsame Helfer für die Cloudflare-Functions (keine Geheimnisse in dieser Datei).
const enc = new TextEncoder();

function b64u(buf) {
  let s = '';
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function secret(env) {
  // Passwort ändern = alle alten Logins werden ungültig
  return (env.SESSION_SECRET || 'jr-site') + '|' + (env.ADMIN_PASSWORD || '');
}

async function hmac(env, text) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret(env)), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64u(await crypto.subtle.sign('HMAC', key, enc.encode(text)));
}

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export async function sha(text) {
  return b64u(await crypto.subtle.digest('SHA-256', enc.encode(text)));
}

export async function passwordOk(env, pw) {
  if (!env.ADMIN_PASSWORD || typeof pw !== 'string') return false;
  return safeEqual(await sha(pw), await sha(env.ADMIN_PASSWORD));
}

export async function makeToken(env, hours = 12) {
  const exp = String(Date.now() + hours * 3600 * 1000);
  return exp + '.' + (await hmac(env, exp));
}

export async function isAuthed(request, env) {
  if (!env.ADMIN_PASSWORD) return false;
  const t = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  const [exp, sig] = t.split('.');
  if (!exp || !sig || !(Number(exp) > Date.now())) return false;
  return safeEqual(await hmac(env, exp), sig);
}

export function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
  });
}
