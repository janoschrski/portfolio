// Einstiegspunkt, wenn die Seite als Cloudflare Worker läuft (Adresse …workers.dev).
// Leitet /api/* und /media/* an die Funktionen weiter, alles andere sind die Dateien aus /public.
import * as health from './functions/api/health.js';
import * as login from './functions/api/login.js';
import * as content from './functions/api/content.js';
import * as upload from './functions/api/upload.js';
import * as uploadLarge from './functions/api/upload-large.js';
import * as media from './functions/media/[[path]].js';

const ROUTES = {
  '/api/health': health,
  '/api/login': login,
  '/api/content': content,
  '/api/upload': upload,
  '/api/upload-large': uploadLarge
};

function handlerFor(mod, method) {
  const m = method.charAt(0) + method.slice(1).toLowerCase();
  return mod['onRequest' + m] || mod.onRequest;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    let mod = ROUTES[url.pathname.replace(/\/$/, '')], params = {};
    if (!mod && url.pathname.startsWith('/media/')) {
      mod = media;
      params.path = url.pathname.slice('/media/'.length).split('/').map(decodeURIComponent);
    }
    if (mod) {
      const h = handlerFor(mod, request.method === 'HEAD' ? 'GET' : request.method);
      if (!h) return new Response('Methode nicht erlaubt', { status: 405 });
      return h({ request, env, params, waitUntil: ctx.waitUntil.bind(ctx) });
    }
    return env.ASSETS.fetch(request);
  }
};
