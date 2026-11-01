/* Налаштування сайту АвтоХаб. Змінюйте лише значення в лапках, решту не чіпайте. */
window.AUTOHUB_CONFIG = {
  // Куди надсилаються анкети з лендингів і перегляди сторінок (сервер Supabase)
  formEndpoint: "https://uukjizyksppxeakafsua.supabase.co/functions/v1/api",

  // Адреса сервера застосунку autohubkr.com/app/ (Supabase Edge Function api)
  appEndpoint: "https://uukjizyksppxeakafsua.supabase.co/functions/v1/api",

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
