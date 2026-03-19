# Настройка бота для заявок в Telegram

Заявки с сайта отправляются в Telegram через Cloudflare Worker.

## 1. Создать Telegram‑бота

1. Откройте [@BotFather](https://t.me/BotFather) в Telegram
2. Отправьте `/newbot`
3. Введите имя бота (например: «КБ Лидер‑Сталь заявки»)
4. Введите username (например: `kb_lider_leads_bot`)
5. Скопируйте **токен** вида `123456789:ABCdefGHI...`

## 2. Узнать CHAT_ID

**Вариант A — личный чат**

1. Напишите боту любое сообщение
2. Откройте в браузере:  
   `https://api.telegram.org/bot<ВАШ_ТОКЕН>/getUpdates`
3. В JSON найдите `"chat":{"id":123456789}` — это ваш CHAT_ID

**Вариант B — группа**

1. Добавьте бота в группу и сделайте его админом
2. Напишите в группе что‑нибудь
3. Снова откройте `getUpdates` — `chat.id` группы будет отрицательным (например, `-1001234567890`)

## 3. Развернуть Cloudflare Worker

**Через Wrangler (CLI):**

```bash
# Установить Wrangler, если ещё не установлен
npm install -g wrangler

# Войти в Cloudflare (если не залогинены)
npx wrangler login

# Добавить секреты
npx wrangler secret put BOT_TOKEN
# Введите токен бота, когда попросит

npx wrangler secret put CHAT_ID
# Введите CHAT_ID, когда попросит

# Развернуть
npx wrangler deploy
```

**Через Dashboard Cloudflare:**

1. [Cloudflare Dashboard](https://dash.cloudflare.com) → Workers & Pages → Create Worker
2. Удалите код по умолчанию и вставьте содержимое `telegram-worker.js`
3. Save and Deploy
4. Settings → Variables → Add variable:
   - `BOT_TOKEN` (Encrypt) — токен бота
   - `CHAT_ID` (Encrypt) — ID чата
5. Скопируйте URL Worker (например, `https://kb-lider-leads.xxxx.workers.dev`)

## 4. Подключить сайт

В `config.js` укажите URL endpoint (с `/lead`):

```javascript
window.__LEAD_ENDPOINT__ = 'https://ваш-worker.workers.dev/lead';
```

## Проверка

1. Откройте сайт
2. Заполните и отправьте форму заявки
3. Сообщение должно прийти в Telegram

## Ошибка 404 "Not Found"

Если в ответе `{"ok":false,"error_code":404,"description":"Not Found"}`:

1. **Неверный BOT_TOKEN** — создайте бота заново в @BotFather, скопируйте токен без пробелов
2. **Неверный CHAT_ID:**
   - Для личного чата: сначала напишите боту любое сообщение, затем откройте `https://api.telegram.org/bot<ТОКЕН>/getUpdates` и возьмите `chat.id`
   - Для группы: добавьте бота в группу, напишите в группе, снова откройте getUpdates — `chat.id` группы (часто начинается с `-100`)
3. Обновите секреты: `npx wrangler secret put BOT_TOKEN` и `npx wrangler secret put CHAT_ID`
4. Задеплойте заново: `npx wrangler deploy`

## Формат данных

Worker принимает:

- **name** — имя
- **phone** — телефон  
- **message** — текст заявки
- **file** — файл (необязательно): PDF, DXF, DWG и др.
- **page** — URL страницы (подставляется автоматически)
