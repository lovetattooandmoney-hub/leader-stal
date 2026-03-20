// Конфиг: заявки в Telegram через Cloudflare Worker
// 1. Деплой: npx wrangler deploy
// 2. Секреты: npx wrangler secret put BOT_TOKEN
//             npx wrangler secret put CHAT_ID
// 3. Вставьте URL воркера + /lead (см. DEPLOY.md)
window.__LEAD_ENDPOINT__ = '';  // ← https://kb-lider-leads.xxx.workers.dev/lead
