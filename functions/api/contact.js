import { json } from '../../lib/auth.js';

// Kontaktformular: jede Anfrage wird im Speicher abgelegt (im Editor unter „Anfragen“)
// und – wenn eingerichtet – per E-Mail an dich geschickt (Dienst: Resend).
const clip = (v, n) => String(v == null ? '' : v).replace(/\r/g, '').trim().slice(0, n);
const escH = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export async function onRequestPost({ request, env }) {
  let b = {};
  try { b = await request.json(); } catch (e) { return json({ error: 'Ungültige Anfrage.' }, 400); }
  if (b.website) return json({ ok: true }); // Spam-Falle: echtes Feld ist unsichtbar
  if (Number(b.t) && Number(b.t) < 2500) return json({ error: 'Bitte nimm dir einen Moment für das Formular.' }, 400);
  const d = {
    name: clip(b.name, 120), email: clip(b.email, 200), phone: clip(b.phone, 60), type: clip(b.type, 80),
    date: clip(b.date, 80), budget: clip(b.budget, 80), message: clip(b.message, 5000)
  };
  if (!d.name || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) return json({ error: 'Bitte gib deinen Namen und eine gültige E-Mail-Adresse an.' }, 400);
  if (!d.message && !d.type) return json({ error: 'Bitte schreib kurz, worum es geht.' }, 400);
  if (!b.consent) return json({ error: 'Bitte bestätige den Datenschutz-Hinweis.' }, 400);
  if (!env.MEDIA) return json({ error: 'Das Formular ist noch nicht eingerichtet. Bitte schreib eine E-Mail.' }, 500);

  const id = Date.now() + '-' + crypto.randomUUID().slice(0, 6);
  const rec = { id, at: new Date().toISOString(), read: false, mailed: false, ...d };

  let mailed = false, mailError = '';
  if (env.RESEND_API_KEY && env.CONTACT_TO) {
    const lines = [['Name', d.name], ['E-Mail', d.email], ['Telefon', d.phone], ['Projekt', d.type], ['Wunschtermin', d.date], ['Budget', d.budget]].filter((x) => x[1]);
    const text = lines.map((x) => x[0] + ': ' + x[1]).join('\n') + '\n\nNachricht:\n' + (d.message || '–');
    const html = '<table style="font:14px sans-serif">' + lines.map((x) => '<tr><td style="color:#777;padding:2px 12px 2px 0">' + x[0] + '</td><td>' + escH(x[1]) + '</td></tr>').join('') + '</table><p style="font:14px sans-serif;white-space:pre-wrap">' + escH(d.message || '–') + '</p>';
    try {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST', headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'content-type': 'application/json' },
        body: JSON.stringify({ from: env.MAIL_FROM || 'Website <onboarding@resend.dev>', to: [env.CONTACT_TO], reply_to: d.email, subject: 'Neue Anfrage: ' + (d.type || 'Website') + ' von ' + d.name, text, html })
      });
      mailed = r.ok; if (!r.ok) mailError = (await r.text()).slice(0, 300);
    } catch (e) { mailError = String(e).slice(0, 300); }
  }
  rec.mailed = mailed; if (mailError) rec.mailError = mailError;
  await env.MEDIA.put('data/inquiries/' + id + '.json', JSON.stringify(rec), { httpMetadata: { contentType: 'application/json' } });
  return json({ ok: true });
}
