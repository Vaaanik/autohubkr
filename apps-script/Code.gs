/**
 * @OnlyCurrentDoc
 *
 * АвтоХаб: приймає заявки з сайту й записує їх у Google Таблицю.
 *
 * Як підключити (3 хвилини, деталі в README.md):
 *  1. Відкрийте свою Google Таблицю -> меню «Розширення» -> «Apps Script».
 *  2. Видаліть усе, що там є, і вставте цей файл повністю.
 *  3. Натисніть «Розгорнути» -> «Нове розгортання» -> тип «Веб-застосунок».
 *     Виконувати від імені: «Я». Хто має доступ: «Усі».
 *  4. Дозвольте доступ (Google попросить підтвердити, це нормально для власного скрипта).
 *  5. Скопіюйте адресу веб-застосунку (закінчується на /exec) у assets/config.js, поле formEndpoint.
 *
 * Листи «Водії» й «Сервіси» та заголовки створюються автоматично під час першої заявки.
 * Про кожну нову заявку приходить лист на NOTIFY_EMAIL.
 */

var SHEETS = {
  driver: {
    name: 'Водії',
    keys:  ['ts', 'name', 'telegram', 'car', 'vin', 'plate', 'services', 'services_other', 'search_now', 'top_feature', 'fleet_size', 'wishes', 'utm', 'referrer'],
    heads: ['Дата і час', "Ім'я", 'Telegram', 'Авто', 'VIN', 'Номер авто', 'Послуги, які потрібні', 'Інші послуги', 'Як шукає сервіс зараз', 'Найважливіше', 'Скільки авто', 'Побажання до функцій', 'Джерело (UTM)', 'Звідки прийшов']
  },
  service: {
    name: 'Сервіси',
    keys:  ['ts', 'biz', 'name', 'telegram', 'social', 'district', 'services', 'services_other', 'posts', 'booking', 'capacity', 'ready', 'pay', 'crm_interest', 'crm_features', 'tools_now', 'wishes', 'utm', 'referrer'],
    heads: ['Дата і час', 'Назва сервісу', 'Контактна особа', 'Telegram або телефон', 'Instagram або сайт', 'Район', 'Послуги', 'Інші послуги', 'Постів або майстрів', 'Як приймає записи', 'Вільна завантаженість', 'Готовий приймати заявки', 'Модель оплати', 'Потрібна єдина система', 'Що найкорисніше в системі', 'Чим веде облік зараз', 'Побажання до функцій', 'Джерело (UTM)', 'Звідки прийшов']
  }
};

var MAX_LEN = 2000;

// Куди надсилати сповіщення про нові заявки. Щоб вимкнути, залиште порожнім: ''.
var NOTIFY_EMAIL = 'malykhinivan8@gmail.com';

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    var raw = (e && e.postData && e.postData.contents) ? e.postData.contents : '';
    var data = JSON.parse(raw);
    var cfg = SHEETS[data.type];
    if (!cfg) return reply_({ ok: false, error: 'unknown type' });

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName(cfg.name) || ss.insertSheet(cfg.name);

    if (sh.getLastRow() === 0) {
      sh.getRange(1, 1, 1, cfg.heads.length).setValues([cfg.heads]).setFontWeight('bold');
      sh.setFrozenRows(1);
    }

    var now = Utilities.formatDate(new Date(), 'Europe/Kiev', 'yyyy-MM-dd HH:mm:ss');
    var row = cfg.keys.map(function (k) {
      return k === 'ts' ? now : clean_(data[k]);
    });

    // Текстовий формат клітинок: введене людиною ніколи не стане формулою.
    var range = sh.getRange(sh.getLastRow() + 1, 1, 1, row.length);
    range.setNumberFormat('@');
    range.setValues([row]);

    // Лист про нову заявку. Помилка пошти не скасовує запис у таблицю.
    try { notify_(cfg, row, ss.getUrl() + '#gid=' + sh.getSheetId()); } catch (mailErr) { console.error(mailErr); }

    return reply_({ ok: true });
  } catch (err) {
    return reply_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (x) { /* ігноруємо */ }
  }
}

// Відкрийте адресу /exec у браузері: побачите «OK», отже розгортання працює.
function doGet() {
  return ContentService.createTextOutput('OK');
}

function notify_(cfg, row, url) {
  if (!NOTIFY_EMAIL) return;
  var who = cfg.name === 'Водії' ? row[1] : row[1] + ' (' + row[2] + ')';
  var subject = 'Нова заявка (' + cfg.name + '): ' + who;
  var lines = [], html = [];
  for (var i = 0; i < cfg.heads.length; i++) {
    if (!row[i]) continue;
    lines.push(cfg.heads[i] + ': ' + row[i]);
    html.push('<tr><td style="padding:4px 12px 4px 0;color:#555;vertical-align:top">' + esc_(cfg.heads[i]) +
              '</td><td style="padding:4px 0"><b>' + esc_(row[i]).replace(/\n/g, '<br>') + '</b></td></tr>');
  }
  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: subject,
    body: lines.join('\n') + '\n\nТаблиця: ' + url,
    htmlBody: '<p style="font:15px Arial">Нова заявка на сайті АвтоХаб, лист «' + esc_(cfg.name) + '».</p>' +
              '<table style="font:14px Arial;border-collapse:collapse">' + html.join('') + '</table>' +
              '<p style="font:14px Arial"><a href="' + url + '">Відкрити таблицю</a></p>',
    name: 'АвтоХаб заявки'
  });
}

function esc_(v) {
  return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function clean_(v) {
  if (v === null || v === undefined) return '';
  return String(v).replace(/\s+$/g, '').slice(0, MAX_LEN);
}

function reply_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
