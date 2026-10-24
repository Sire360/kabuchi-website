/* =========================================================
   KABUCHI BOOKING SETTINGS — the only file you need to edit
   ========================================================= */
window.KABUCHI_BOOKING = {
  // Paste your Google Apps Script "Web app URL" between the quotes
  // (see README, "Set up online bookings"). It looks like:
  // https://script.google.com/macros/s/AKfy..../exec
  // Leave it empty and bookings will be sent by WhatsApp instead.
  SCRIPT_URL: '',

  // Kabuchi WhatsApp number (country code, no + or spaces)
  WHATSAPP: '260973879988',

  // Opening hours: first and last appointment start times (24h)
  FIRST_SLOT: 9,   // 09:00
  LAST_SLOT: 17,   // 17:00 (shop closes 18:00)

  // How many days ahead customers can book
  DAYS_AHEAD: 21,

  // Address used in calendar invites
  ADDRESS: '13 Mwapona Road, Woodlands, Lusaka, Zambia'
};
