/**
 * Получатели в поле «Кому» (через запятую, без пробелов).
 */
window.ORDER_MAILTO =
  'info.leader-steel@mail.ru,sales3_ls@mail.ru,sales2_ls@mail.ru';

/**
 * Куда открывать заявку:
 * 'chooser' — каждый раз окно выбора (Яндекс / Mail.ru / Gmail / почта на компьютере);
 * 'yandex' | 'mailru' | 'gmail' | 'mailto' — сразу этот вариант, без окна.
 */
window.ORDER_OPEN_MODE = 'chooser';

/**
 * Базовые URL веб-интерфейсов «Написать» (обычно не меняют).
 */
window.ORDER_YANDEX_COMPOSE = 'https://mail.yandex.ru/compose';
window.ORDER_MAILRU_COMPOSE = 'https://e.mail.ru/compose/?mailto=';
window.ORDER_GMAIL_COMPOSE = 'https://mail.google.com/mail/?view=cm&fs=1';

/**
 * Яндекс.Метрика:
 * укажите реальный ID счётчика (число), например 12345678.
 * Если оставить 0, Метрика и цели отправляться не будут.
 */
window.YM_COUNTER_ID = 0;

/**
 * Названия целей в Метрике (можно оставить как есть).
 */
window.YM_GOAL_FORM_SUBMIT = 'form_submit';
window.YM_GOAL_PHONE_CLICK = 'phone_click';
window.YM_GOAL_EMAIL_CLICK = 'email_click';

/**
 * Опционально: URL скрипта коллтрекинга.
 * Пример: 'https://example-calltracking.ru/widget.js'
 * Если пусто, коллтрекинг не подключается.
 */
window.CALLTRACKING_SCRIPT_URL = '';

/**
 * Ссылка на PDF «Актуальное наличие» (Google Диск или любой другой URL).
 *
 * Как настроить Google Диск:
 * 1. Загрузите PDF в Диск.
 * 2. ПКМ по файлу → «Настроить доступ» → «Все, у кого есть ссылка» (читатель).
 * 3. Скопируйте ссылку вида https://drive.google.com/file/d/XXXX/view?usp=sharing
 * 4. Вставьте её сюда (можно оставить как есть или заменить /view на /preview — откроется просмотр в браузере).
 *
 * Чтобы ссылка на сайте не менялась при обновлении файла: не удаляйте файл и не заливайте новый
 * с нуля — в Google Диск: ПКМ по файлу → «Управление версиями» → загрузите новую версию.
 *
 * Если оставить пустой строкой '', будет использоваться локальный файл ./media/nalichie_ooo_kb_lider-stal.pdf
 */
window.NALICHIE_PDF_URL =
  'https://drive.google.com/file/d/1PABzPzHyJi1axIcf1dJveH3yMbfn9LZR/view?usp=sharing';
