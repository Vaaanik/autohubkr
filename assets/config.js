/* Налаштування сайту АвтоХаб. Змінюйте лише значення в лапках, решту не чіпайте. */
window.AUTOHUB_CONFIG = {
  // Куди надсилаються анкети з лендингів і перегляди сторінок (сервер Supabase)
  formEndpoint: "https://uukjizyksppxeakafsua.supabase.co/functions/v1/api",

  // Адреса сервера застосунку autohubkr.com/app/ (Supabase Edge Function api)
  appEndpoint: "https://uukjizyksppxeakafsua.supabase.co/functions/v1/api",

  // Єдиний Telegram-бот АвтоХабу (водії й сервіси). Ім'я бота сервер визначає сам після «Налаштувати Telegram-бота»,
  // тут можна вказати вручну без @ (наприклад autohubkr_bot), якщо потрібно.
  tgBot: "",

  // Скільки місць у тесті
  driversTotal:  300,
  servicesTotal: 30,

  // Кількість зайнятих місць вручну. null: число береться з бази автоматично (див. counterMin).
  driversTaken:  null,
  servicesTaken: null,

  // Поріг лічильника задається в застосунку: Адмінка → Налаштування. Тут можна перевизначити числом (наприклад 10).
  counterMin: null
};
