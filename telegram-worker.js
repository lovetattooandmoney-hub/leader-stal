/**
 * Cloudflare Worker: принимает заявки с сайта и шлёт в Telegram.
 *
 * Установка:
 * 1. Создайте бота в Telegram через @BotFather → /newbot → получите BOT_TOKEN
 * 2. Узнайте CHAT_ID: напишите боту, откройте https://api.telegram.org/bot<TOKEN>/getUpdates
 * 3. Создайте Worker в Cloudflare Dashboard → Workers → Create
 * 4. Вставьте этот код, в Settings → Variables добавьте Secrets:
 *    - BOT_TOKEN = токен вашего бота
 *    - CHAT_ID = ID чата (личного или группы)
 * 5. Deploy → скопируйте URL, например https://ваш-worker.workers.dev
 *
 * Endpoint: POST https://ваш-worker.workers.dev/lead
 * Тело: form-data (name, phone, message, file?, page?) или JSON
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return corsPreflight();

    if (request.method !== 'POST' || url.pathname !== '/lead') {
      return json({ ok: false, error: 'Not found' }, 404);
    }

    const ct = request.headers.get('content-type') || '';
    let data = {};
    let file = null;

    try {
      if (ct.includes('multipart/form-data') || ct.includes('application/x-www-form-urlencoded')) {
        const fd = await request.formData();
        data = Object.fromEntries(
          Array.from(fd.entries()).filter(([k, v]) => typeof v === 'string' && k !== 'file')
        );
        const maybeFile = fd.get('file');
        if (maybeFile && typeof maybeFile !== 'string' && maybeFile.size > 0) file = maybeFile;
      } else if (ct.includes('application/json')) {
        data = await request.json();
      } else {
        return json({ ok: false, error: 'Unsupported content-type' }, 415);
      }
    } catch (e) {
      return json({ ok: false, error: 'Bad request' }, 400);
    }

    const name = (data.name || '').toString().trim();
    const phone = (data.phone || '').toString().trim();
    const message = (data.message || '').toString().trim();
    const page = (data.page || '').toString().trim();

    const lines = [
      'Новая заявка с сайта',
      page ? `Страница: ${page}` : null,
      name ? `Имя: ${name}` : null,
      phone ? `Телефон: ${phone}` : null,
      message ? `Сообщение: ${message}` : null,
    ].filter(Boolean);

    const text = lines.join('\n');

    const botToken = (env.BOT_TOKEN || '').toString().trim();
    const chatId = (env.CHAT_ID || '').toString().trim();
    if (!botToken || !chatId) {
      return json({ ok: false, error: 'Worker env not configured' }, 500);
    }

    try {
      if (file) {
        // sendDocument
        const tfd = new FormData();
        tfd.set('chat_id', chatId);
        tfd.set('caption', text.slice(0, 1024)); // лимит caption
        tfd.set('document', file, file.name || 'file');

        const r = await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
          method: 'POST',
          body: tfd,
        });
        const jr = await r.json();
        if (!jr.ok) return json({
          ok: false,
          error: 'Telegram error',
          details: jr,
          hint: jr.description?.includes('chat') ? 'Проверьте CHAT_ID: напишите боту, затем getUpdates. Для группы — добавьте бота в группу.' : jr.description?.includes('token') ? 'Проверьте BOT_TOKEN в @BotFather.' : jr.description,
        }, 502);
      } else {
        // sendMessage
        const r = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text,
            disable_web_page_preview: true,
          }),
        });
        const jr = await r.json();
        if (!jr.ok) return json({
          ok: false,
          error: 'Telegram error',
          details: jr,
          hint: jr.description?.includes('chat') ? 'Проверьте CHAT_ID: напишите боту, затем getUpdates. Для группы — добавьте бота в группу.' : jr.description?.includes('token') ? 'Проверьте BOT_TOKEN в @BotFather.' : jr.description,
        }, 502);
      }
    } catch (e) {
      return json({ ok: false, error: 'Upstream failure' }, 502);
    }

    return withCors(json({ ok: true }));
  },
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

function withCors(res) {
  const h = new Headers(res.headers);
  h.set('access-control-allow-origin', '*');
  h.set('access-control-allow-methods', 'POST, OPTIONS');
  h.set('access-control-allow-headers', 'content-type');
  return new Response(res.body, { status: res.status, headers: h });
}

function corsPreflight() {
  return new Response(null, {
    status: 204,
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'POST, OPTIONS',
      'access-control-allow-headers': 'content-type',
      'access-control-max-age': '86400',
    },
  });
}

