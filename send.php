<?php
/**
 * Отправка заявок на почту через PHP mail() на вашем хостинге.
 * На GitHub Pages PHP не выполняется — там заявки уходят через mailto (см. script.js и config.js).
 *
 * НАСТРОЙКА:
 * 1. Укажите $MAIL_TO — ящик, куда приходят заявки.
 * 2. Укажите $MAIL_FROM — ящик на ТОМ ЖЕ домене, что и сайт (иначе письма часто в спам или отсекаются).
 *    Создайте такой ящик в панели хостинга или используйте noreply@ваш-домен.ru если хостинг разрешает.
 */
declare(strict_types=1);

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Method Not Allowed';
    exit;
}

// --- куда слать заявки (не путать с почтой на страницах сайта) ---
// Укажите рабочий ящик (как в config.js → ORDER_MAILTO для статического сайта).
$MAIL_TO = 'info.leader-steel@mail.ru,sales3_ls@mail.ru,sales2_ls@mail.ru';
$MAIL_FROM = 'noreply@example.com'; // замените на реальный ящик вашего домена сайта

$allowedReturn = ['index.html', 'callback.html', 'order.html', '25h17n2b-sh.html'];
$return = isset($_POST['_return']) ? (string) $_POST['_return'] : 'index.html';
if (!in_array($return, $allowedReturn, true)) {
    $return = 'index.html';
}

// антиспам: поле hp_field должно быть пустым (боты часто заполняют)
if (trim((string) ($_POST['hp_field'] ?? '')) !== '') {
    header('Location: ' . $return . '?sent=1');
    exit;
}

$name = trim((string) ($_POST['name'] ?? ''));
$phone = trim((string) ($_POST['phone'] ?? ''));
$message = trim((string) ($_POST['message'] ?? ''));
$subjectLine = trim((string) ($_POST['_subject'] ?? ''));
if ($subjectLine === '') {
    $subjectLine = 'Заявка с сайта КБ Лидер-Сталь';
}

$digits = preg_replace('/\D/', '', $phone) ?? '';
if (mb_strlen($name) < 2 || strlen($digits) < 10 || mb_strlen($message) < 10) {
    header('Location: ' . $return . '?error=1');
    exit;
}

$body = "Имя: {$name}\r\nТелефон: {$phone}\r\n\r\nСообщение:\r\n{$message}\r\n";
$body .= "\r\n---\r\nIP: " . ($_SERVER['REMOTE_ADDR'] ?? '') . "\r\n";

$subjectEncoded = '=?UTF-8?B?' . base64_encode($subjectLine) . '?=';
$fromHeader = $MAIL_FROM;
if (preg_match('/[<]/', $MAIL_FROM) === 0 && strpos($MAIL_FROM, '@') !== false) {
    $fromHeader = '=?UTF-8?B?' . base64_encode('КБ Лидер-Сталь') . '?= <' . $MAIL_FROM . '>';
}

$headers = [
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'From: ' . $fromHeader,
    'X-Mailer: PHP/' . PHP_VERSION,
];

$ok = @mail($MAIL_TO, $subjectEncoded, $body, implode("\r\n", $headers));

if ($ok) {
    header('Location: ' . $return . '?sent=1');
} else {
    header('Location: ' . $return . '?error=1');
}
exit;
