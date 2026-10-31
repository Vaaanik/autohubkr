/* Налаштування сайту АвтоХаб. Змінюйте лише значення в лапках, решту не чіпайте. */
window.AUTOHUB_CONFIG = {
  // Адреса веб-застосунку Google Apps Script (інструкція в README.md). Поки порожньо, форми не відправляють заявки.
  formEndpoint: "https://script.google.com/macros/s/AKfycbx1u_c42CSht90TSYOYSZ0bSXzQHrKEIgbvSXo6o5JUj2nDutfFp1ldkzwZ8KJBUIpA/exec",

  // Адреса сервера застосунку autohubkr.com/app/ (Apps Script таблиці «АвтоХаб MVP: дані застосунку»)
  appEndpoint: "",

  // Посилання на Telegram-групи, куди переходить людина після заявки
  tgDrivers:  "",   // група автоспільноти для водіїв
  tgServices: "",   // група партнерів для сервісів

  // Скільки місць у тесті
  driversTotal:  300,
  servicesTotal: 30,

  // Реальна кількість зайнятих місць. Число показує лічильник на сторінці, null ховає його.
  driversTaken:  null,
  servicesTaken: null
};
