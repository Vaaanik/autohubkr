/**
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
 */

// Якщо хочете отримувати листа про кожну нову заявку, впишіть свою пошту між лапками.
var NOTIFY_EMAIL = '';

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

    if (NOTIFY_EMAIL) {
      try {
        var who = data.type === 'service' ? (row[1] + ', ' + row[2]) : row[1];
        MailApp.sendEmail(
          NOTIFY_EMAIL,
          'АвтоХаб: нова заявка (' + cfg.name + ')',
          'Нова заявка в листі «' + cfg.name + '».\n' + who + '\nКонтакт: ' + (data.type === 'service' ? row[3] : row[2])
        );
      } catch (mailErr) { /* лист не вдалося надіслати, але заявка вже збережена */ }
    }

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

function clean_(v) {
  if (v === null || v === undefined) return '';
  return String(v).replace(/\s+$/g, '').slice(0, MAX_LEN);
}

function reply_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
