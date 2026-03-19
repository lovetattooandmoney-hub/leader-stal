// Конфиг для отправки заявок в Telegram (без секретов на фронтенде)
// 1) Разверните Cloudflare Worker (см. telegram-worker.js, wrangler.toml)
// 2) Добавьте секреты: BOT_TOKEN, CHAT_ID
// 3) Укажите URL вашего Worker ниже (обязательно с /lead)
// window.__LEAD_ENDPOINT__ = 'https://kb-lider-leads.ВАШ-АККАУНТ.workers.dev/lead';
window.__LEAD_ENDPOINT__ = '';

