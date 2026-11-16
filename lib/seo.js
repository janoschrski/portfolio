// Seitentitel, Beschreibung, Vorschaubild (WhatsApp, Instagram, LinkedIn …) und Google-Daten
// werden hier direkt ins HTML geschrieben, damit sie auch ohne JavaScript ankommen.
import { publicView } from './visibility.js';
import { loadAll } from './store.js';

function plain(s) { return String(s || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim(); }

export async function renderPage(request, env) {
  const url = new URL(request.url), origin = url.origin;
  const res = await env.ASSETS.fetch(new URL('/app.html', origin));
  let data = {};
  try { data = publicView(await loadAll(request, env)).view || {}; } catch (e) {}
  const site = data.site || {}, sections = Array.isArray(data.sections) ? data.sections : [];
  const hero = sections.find((s) => s.type === 'hero') || {};
  const contact = sections.find((s) => s.type === 'contact') || {};
  const name = plain(site.name) || 'Janosch Rajewski';
  const city = plain(site.city);
  const title = plain(site.title) || (name + ' – Videograf & Editor' + (city ? ' in ' + city : ''));
  const desc = plain(site.description);
  const heroImg = hero.image || (data.showreel && data.showreel.heroImage) || '';
  const imgRel = site.shareImage || (heroImg && heroImg !== 'img/blame41.jpg' ? heroImg : '/img/og-default.jpg');
  const img = new URL(imgRel, origin + '/').href;
  const same = (contact.links || []).map((l) => l.url).filter((u) => /^https?:/i.test(u || ''));
  const ld = {
    '@context': 'https://schema.org', '@type': 'ProfessionalService', name, url: origin + '/', image: img,
    description: desc || undefined, email: plain(contact.email) || undefined,
    address: city ? { '@type': 'PostalAddress', addressLocality: city, addressCountry: 'DE' } : undefined,
    areaServed: city || undefined, sameAs: same.length ? same : undefined,
    founder: { '@type': 'Person', name, jobTitle: 'Videograf & Editor' }
  };
  const ldJson = JSON.stringify(ld).replace(/</g, '\\u003c');
  const meta = (attr) => ({ element(e) { e.setAttribute('content', attr); } });
  const out = new HTMLRewriter()
    .on('title', { element(e) { e.setInnerContent(title); } })
    .on('meta[name="description"]', desc ? meta(desc) : {})
    .on('meta[property="og:title"]', meta(title))
    .on('meta[property="og:description"]', desc ? meta(desc) : {})
    .on('meta[property="og:image"]', meta(img))
    .on('head', { element(e) {
      e.append('<link rel="canonical" href="' + origin + '/"><meta property="og:url" content="' + origin + '/"><meta property="og:site_name" content="' + name.replace(/"/g, '&quot;') + '"><meta name="twitter:image" content="' + img.replace(/"/g, '&quot;') + '"><script type="application/ld+json">' + ldJson + '</script>', { html: true });
    } })
    .transform(res);
  const h = new Headers(out.headers); h.set('content-type', 'text/html; charset=utf-8'); h.set('cache-control', 'public, max-age=60');
  return new Response(out.body, { status: 200, headers: h });
}

export function robots(request) {
  const o = new URL(request.url).origin;
  return new Response('User-agent: *\nAllow: /\nDisallow: /edit\nDisallow: /edit.html\nDisallow: /api/\n\nSitemap: ' + o + '/sitemap.xml\n', { headers: { 'content-type': 'text/plain; charset=utf-8' } });
}
export function sitemap(request) {
  const o = new URL(request.url).origin, d = new Date().toISOString().slice(0, 10);
  const urls = ['/', '/impressum.html', '/datenschutz.html'].map((p) => '<url><loc>' + o + p + '</loc><lastmod>' + d + '</lastmod></url>').join('');
  return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + urls + '</urlset>', { headers: { 'content-type': 'application/xml; charset=utf-8' } });
}
