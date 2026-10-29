/**
 * АвтоХаб: розсилка запрошень автосервісам з адреси info@autohubkr.com.
 *
 * Як це працює:
 *  - лист «Сервіси»: надсилаються лише рядки, де в колонці «Розсилка» стоїть «надіслати» і є Email;
 *  - після відправки статус змінюється на «надіслано», ставиться дата;
 *  - за один запуск надсилається не більше BATCH листів, з паузою між ними;
 *  - лист іде від імені FROM, тому цю адресу треба один раз додати в Gmail:
 *    Налаштування → Акаунти та імпорт → «Надсилати листи як» → Додати іншу адресу.
 *
 * Меню «АвтоХаб» з'являється у таблиці після оновлення сторінки.
 */

var FROM = 'info@autohubkr.com';
var FROM_NAME = 'АвтоХаб';
var BATCH = 20;               // листів за один запуск
var PAUSE_MS = 4000;          // пауза між листами
var LINK = 'https://autohubkr.com/services/?s=email_sto';
var SUBJECT = 'Запрошення: станьте партнером-засновником АвтоХабу в Кривому Розі';

var COL = { name: 2, email: 6, status: 10, date: 11, note: 12 };

function onOpen() {
  SpreadsheetApp.getUi().createMenu('АвтоХаб')
    .addItem('1. Перевірити налаштування', 'checkSetup')
    .addItem('2. Надіслати тестовий лист собі', 'sendTest')
    .addItem('3. Надіслати наступну пачку (' + BATCH + ')', 'sendBatch')
    .addToUi();
}

function checkSetup() {
  var ui = SpreadsheetApp.getUi();
  var ok = GmailApp.getAliases().indexOf(FROM) !== -1;
  var quota = MailApp.getRemainingDailyQuota();
  var sh = SpreadsheetApp.getActive().getSheetByName('Сервіси');
  var data = sh.getRange(2, 1, Math.max(sh.getLastRow() - 1, 1), COL.note).getValues();
  var queue = data.filter(function (r) { return r[COL.status - 1] === 'надіслати' && r[COL.email - 1]; }).length;
  ui.alert(
    (ok ? '✅ Адресу ' + FROM + ' підключено в Gmail.' :
          '❌ Адресу ' + FROM + ' ще не додано в Gmail як «Надсилати листи як». Без цього розсилка не піде.') +
    '\n\nУ черзі: ' + queue + ' листів.\nЛіміт Gmail на сьогодні: ' + quota + '.');
}

function sendTest() {
  if (!aliasOk_()) return;
  var me = Session.getActiveUser().getEmail();
  send_(me, 'Тестовий СТО');
  SpreadsheetApp.getUi().alert('Тестовий лист надіслано на ' + me + '. Перевірте, як він виглядає.');
}

function sendBatch() {
  if (!aliasOk_()) return;
  var lock = LockService.getDocumentLock();
  if (!lock.tryLock(1000)) return;
  try {
    var sh = SpreadsheetApp.getActive().getSheetByName('Сервіси');
    var n = sh.getLastRow() - 1;
    if (n < 1) return;
    var data = sh.getRange(2, 1, n, COL.note).getValues();
    var sent = 0, errors = 0;
    var limit = Math.min(BATCH, MailApp.getRemainingDailyQuota());
    for (var i = 0; i < data.length && sent < limit; i++) {
      var row = data[i];
      var email = String(row[COL.email - 1]).trim();
      if (row[COL.status - 1] !== 'надіслати' || !email) continue;
      var r = i + 2;
      try {
        send_(email, String(row[COL.name - 1]).trim());
        sh.getRange(r, COL.status).setValue('надіслано');
        sh.getRange(r, COL.date).setValue(Utilities.formatDate(new Date(), 'Europe/Kiev', 'yyyy-MM-dd HH:mm'));
        sent++;
      } catch (e) {
        sh.getRange(r, COL.status).setValue('помилка');
        sh.getRange(r, COL.note).setValue(String(e).slice(0, 200));
        errors++;
      }
      SpreadsheetApp.flush();
      Utilities.sleep(PAUSE_MS);
    }
    SpreadsheetApp.getUi().alert('Надіслано: ' + sent + (errors ? '. Помилок: ' + errors + ' (див. колонку «Відповідь / примітка»).' : '.'));
  } finally {
    lock.releaseLock();
  }
}

function aliasOk_() {
  if (GmailApp.getAliases().indexOf(FROM) !== -1) return true;
  SpreadsheetApp.getUi().alert('Спочатку додайте ' + FROM + ' у Gmail: Налаштування → Акаунти та імпорт → «Надсилати листи як».');
  return false;
}

function send_(to, name) {
  GmailApp.sendEmail(to, SUBJECT, text_(name), {
    from: FROM, name: FROM_NAME, replyTo: FROM, htmlBody: html_(name)
  });
}

function esc_(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

function text_(name) {
  return 'Добрий день, команда ' + name + '!\n\n' +
    'Запрошуємо вас стати одним із 30 партнерів-засновників АвтоХабу.\n\n' +
    'Ми збираємо автомобільну спільноту Кривого Рогу: водії й автосервіси міста в одному місці, з чесними відгуками й зрозумілими заявками. ' +
    'Хочемо, щоб Кривий Ріг став прикладом для всієї країни, і починаємо з невеликого закритого тесту.\n\n' +
    'Перші 30 сервісів отримають:\n' +
    '• безкоштовну картку сервісу в каталозі для водіїв міста\n' +
    '• заявки від водіїв з описом проблеми й авто, без комісії на старті\n' +
    '• просту систему обліку: клієнти, замовлення, нагадування про ТО\n' +
    '• голос у розробці: функції робимо під реальні потреби сервісів-засновників\n\n' +
    'Анкета партнера (кілька хвилин): ' + LINK + '\n' +
    'Відповімо протягом 1–2 днів. Питання можна поставити у відповідь на цей лист.\n\n' +
    'З повагою,\nІван Малихін, команда АвтоХаб\nautohubkr.com · ' + FROM + '\n\n' +
    'Ми написали вам, бо ' + name + ' є у відкритому каталозі автосервісів Кривого Рогу. ' +
    'Якщо не хочете отримувати від нас листів, дайте відповідь словом «Відписатися».';
}

function html_(name) {
  var n = esc_(name);
  var li = function (b, t) {
    return '<tr><td style="padding:10px 14px;background:#F6F8FA;border-left:4px solid #FFC629;border-radius:6px;font-size:15px;line-height:1.5;"><b>' +
      b + '</b> ' + t + '</td></tr><tr><td style="height:8px;"></td></tr>';
  };
  return '' +
  '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EDF0F3;"><tr><td align="center" style="padding:24px 12px;">' +
  '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;color:#0E2433;">' +
  '<tr><td style="background:#0E2433;padding:22px 28px;"><span style="display:inline-block;width:14px;height:14px;background:#FFC629;border-radius:4px;vertical-align:middle;"></span>' +
  '<span style="color:#ffffff;font-size:18px;font-weight:bold;vertical-align:middle;margin-left:8px;">АвтоХаб</span>' +
  '<span style="color:#9fb0bd;font-size:13px;vertical-align:middle;margin-left:8px;">автомобільна спільнота Кривого Рогу</span></td></tr>' +
  '<tr><td style="padding:30px 28px 8px;"><p style="margin:0 0 14px;font-size:16px;">Добрий день, команда ' + n + '!</p>' +
  '<h1 style="margin:0 0 16px;font-size:24px;line-height:1.25;">Запрошуємо вас стати одним із 30 партнерів-засновників АвтоХабу</h1>' +
  '<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#33475a;">Ми збираємо автомобільну спільноту Кривого Рогу: водії й автосервіси міста в одному місці, з чесними відгуками й зрозумілими заявками. Хочемо, щоб Кривий Ріг став прикладом для всієї країни, і починаємо з невеликого закритого тесту.</p>' +
  '<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#33475a;">Шукаємо 30 сервісів, які першими отримають:</p></td></tr>' +
  '<tr><td style="padding:0 28px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">' +
  li('Безкоштовну картку сервісу', 'в каталозі для водіїв міста') +
  li('Заявки від водіїв', 'з описом проблеми й авто, без комісії на старті') +
  li('Просту систему обліку:', 'клієнти, замовлення, нагадування про ТО, без складних програм') +
  li('Голос у розробці:', 'функції робимо під реальні потреби сервісів-засновників') +
  '</table></td></tr>' +
  '<tr><td style="padding:24px 28px 6px;"><p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#33475a;">Щоб долучитися, заповніть коротку анкету. Це займе кілька хвилин, а ми відповімо протягом 1–2 днів.</p>' +
  '<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:#FFC629;border-radius:10px;"><a href="' + LINK + '" style="display:inline-block;padding:14px 26px;font-size:16px;font-weight:bold;color:#0E2433;text-decoration:none;">Заповнити анкету партнера</a></td></tr></table>' +
  '<p style="margin:14px 0 0;font-size:13px;color:#6b7c8a;">Або відкрийте посилання: <a href="' + LINK + '" style="color:#0E2433;">autohubkr.com/services</a></p></td></tr>' +
  '<tr><td style="padding:24px 28px 28px;"><p style="margin:0;font-size:15px;line-height:1.6;color:#33475a;">Якщо є питання, просто дайте відповідь на цей лист.<br>З повагою,<br><b>Іван Малихін</b>, команда АвтоХаб<br>' +
  '<a href="https://autohubkr.com" style="color:#0E2433;">autohubkr.com</a> · ' + FROM + '</p></td></tr>' +
  '<tr><td style="padding:14px 28px;background:#F6F8FA;font-size:12px;line-height:1.5;color:#7a8a97;">Ми написали вам, бо ' + n + ' є у відкритому каталозі автосервісів Кривого Рогу. Якщо не хочете отримувати від нас листів, дайте відповідь словом «Відписатися», і ми більше не писатимемо.</td></tr>' +
  '</table></td></tr></table>';
}
