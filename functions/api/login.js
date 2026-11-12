import { json, passwordOk, makeToken } from '../../lib/auth.js';

export async function onRequestPost({ request, env }) {
  if (!env.ADMIN_PASSWORD) return json({ error: 'Kein Passwort eingerichtet. Lege in Cloudflare die Variable ADMIN_PASSWORD an.' }, 500);
  let body = {};
  try { body = await request.json(); } catch (e) {}
  if (!(await passwordOk(env, body.password))) {
    await new Promise(r => setTimeout(r, 700)); // bremst Rateversuche
    return json({ error: 'Falsches Passwort.' }, 401);
  }
  return json({ token: await makeToken(env) });
}
