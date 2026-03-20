# Деплой заявок в Telegram (Cloudflare Worker)

Браузер блокирует прямой запрос к Telegram API (CORS). Используем воркер как прокси.

## Шаги

### 1. Установите Wrangler (если ещё нет)
```bash
npm install -g wrangler
```

### 2. Войдите в Cloudflare
```bash
npx wrangler login
```

### 3. Задеплойте воркер
```bash
cd "сайт компании"
npx wrangler deploy
```

После деплоя скопируйте URL, например: `https://kb-lider-leads.xxx.workers.dev`

### 4. Задайте секреты (токен и Chat ID)
```bash
npx wrangler secret put BOT_TOKEN
# Вставьте: 8791946218:AAEkyuOHEeAZC_em0XzUMsnNi8J1UPydJ_w

npx wrangler secret put CHAT_ID
# Вставьте: 5847194974
```

### 5. Обновите config.js
```javascript
window.__LEAD_ENDPOINT__ = 'https://kb-lider-leads.ВАШ_АККАУНТ.workers.dev/lead';
```

Готово. Заявки будут приходить в ваш Telegram.
