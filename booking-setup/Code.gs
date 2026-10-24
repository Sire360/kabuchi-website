/**
 * KABUCHI SPA & BEAUTY — Online booking backend (Google Apps Script)
 * -------------------------------------------------------------------
 * What it does (free, runs on your Google account):
 *  1. Saves every booking as a new row in your Google Sheet
 *  2. Tells the website which times are already full
 *  3. Emails the customer a branded confirmation
 *  4. Emails Kabuchi about each new booking, with a one-tap link to
 *     WhatsApp the customer a confirmation
 *
 * Setup steps are in README.md ("Set up online bookings").
 * Only change the values in SETTINGS below.
 */

var SETTINGS = {
  BUSINESS_NAME: 'Kabuchi Spa & Beauty',
  NOTIFY_EMAIL: 'kapolyogiven@gmail.com',     // where new-booking alerts go (change to the spa's email)
  WHATSAPP: '260973879988',                  // Kabuchi WhatsApp number
  PHONE: '+260 973 879 988',
  ADDRESS: '13 Mwapona Road, Woodlands, Lusaka, Zambia',
  WEBSITE: 'https://YOUR-USERNAME.github.io/kabuchi-website/',  // change after you publish
  LOGO_URL: 'https://YOUR-USERNAME.github.io/kabuchi-website/images/logo.png',
  CLIENTS_PER_SLOT: 2,      // how many clients can be booked at the same time
  FIRST_SLOT: 9,            // 09:00
  LAST_SLOT: 17,            // 17:00 (closing 18:00)
  TIMEZONE: 'Africa/Lusaka',
  SHEET_NAME: 'Bookings'
};

var HEADERS = ['Received', 'Reference', 'Status', 'Service', 'Treatment', 'Date', 'Time',
               'Name', 'Phone', 'Email', 'WhatsApp confirm', 'Notes', 'WhatsApp link'];

/* Run this once from the editor (select "setup" and press Run) */
function setup() {
  var sheet = getSheet_();
  SpreadsheetApp.getActiveSpreadsheet().setSpreadsheetTimeZone(SETTINGS.TIMEZONE);
  Logger.log('Ready. Sheet "' + sheet.getName() + '" is set up.');
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SETTINGS.SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SETTINGS.SHEET_NAME);
  }
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#6B341F').setFontColor('#ffffff');
    sh.setFrozenRows(1);
    // Status dropdown: Confirmed / Completed / Cancelled
    var rule = SpreadsheetApp.newDataValidation().requireValueInList(['Confirmed', 'Completed', 'Cancelled', 'No-show'], true).build();
    sh.getRange('C2:C5000').setDataValidation(rule);
    sh.getRange('F2:G5000').setNumberFormat('@'); // keep date/time as plain text
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/* Returns the times that are already full: { full: { "2026-10-25": ["10:00","14:00"] } } */
function doGet(e) {
  try {
    var p = (e && e.parameter) || {};
    if (p.action !== 'slots') return json_({ ok: true, message: 'Kabuchi booking service is running.' });
    var from = String(p.from || today_());
    var days = Math.min(parseInt(p.days || '21', 10), 60);
    var end = addDays_(from, days);
    var counts = countBookings_(from, end);
    var full = {};
    Object.keys(counts).forEach(function (key) {
      if (counts[key] >= SETTINGS.CLIENTS_PER_SLOT) {
        var parts = key.split(' ');
        (full[parts[0]] = full[parts[0]] || []).push(parts[1]);
      }
    });
    return json_({ ok: true, full: full });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

/* Receives a booking from the website */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    var d = JSON.parse(e.postData.contents);
    var problem = validate_(d);
    if (problem) return json_({ ok: false, error: problem });

    lock.waitLock(20000);
    var counts = countBookings_(d.date, addDays_(d.date, 1));
    if ((counts[d.date + ' ' + d.time] || 0) >= SETTINGS.CLIENTS_PER_SLOT) {
      return json_({ ok: false, error: 'taken' });
    }
    var ref = makeRef_();
    var waLink = 'https://wa.me/' + d.phone + '?text=' + encodeURIComponent(customerWhatsAppText_(d, ref));
    getSheet_().appendRow([
      new Date(), ref, 'Confirmed', d.service, d.option || '', d.date, d.time,
      d.name, '+' + d.phone, d.email || '', d.whatsapp ? 'Yes' : 'No', d.notes || '', waLink
    ]);
    SpreadsheetApp.flush();
    lock.releaseLock();

    if (d.email) sendCustomerEmail_(d, ref);
    sendOwnerEmail_(d, ref, waLink);
    return json_({ ok: true, ref: ref });
  } catch (err) {
    try { lock.releaseLock(); } catch (x) {}
    return json_({ ok: false, error: 'server' });
  }
}

/* ---------- helpers ---------- */
function validate_(d) {
  if (!d || !d.service || !d.date || !d.time || !d.name || !d.phone) return 'missing';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.date) || !/^\d{2}:00$/.test(d.time)) return 'invalid';
  var h = parseInt(d.time, 10);
  if (h < SETTINGS.FIRST_SLOT || h > SETTINGS.LAST_SLOT) return 'invalid';
  if (d.date < today_()) return 'invalid';
  if (!/^\d{10,15}$/.test(String(d.phone))) return 'invalid';
  if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) return 'invalid';
  if (String(d.name).length > 80 || String(d.notes || '').length > 600) return 'invalid';
  return '';
}

function countBookings_(from, to) {
  var sh = getSheet_();
  var last = sh.getLastRow();
  var counts = {};
  if (last < 2) return counts;
  var rows = sh.getRange(2, 3, last - 1, 5).getValues(); // Status, Service, Treatment, Date, Time
  rows.forEach(function (r) {
    var status = String(r[0]);
    var date = r[3] instanceof Date ? Utilities.formatDate(r[3], SETTINGS.TIMEZONE, 'yyyy-MM-dd') : String(r[3]).trim();
    var time = r[4] instanceof Date ? Utilities.formatDate(r[4], SETTINGS.TIMEZONE, 'HH:mm') : String(r[4]).trim();
    if (status === 'Cancelled' || status === 'No-show') return;
    if (date >= from && date < to) counts[date + ' ' + time] = (counts[date + ' ' + time] || 0) + 1;
  });
  return counts;
}

function today_() { return Utilities.formatDate(new Date(), SETTINGS.TIMEZONE, 'yyyy-MM-dd'); }
function addDays_(ymd, n) {
  var p = ymd.split('-');
  var d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2] + n));
  return Utilities.formatDate(d, 'UTC', 'yyyy-MM-dd');
}
function niceDate_(ymd) {
  var p = ymd.split('-');
  return Utilities.formatDate(new Date(Date.UTC(+p[0], +p[1] - 1, +p[2], 12)), 'UTC', 'EEEE, d MMMM yyyy');
}
function makeRef_() {
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', s = '';
  for (var i = 0; i < 5; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
  return 'KB-' + s;
}
function esc_(s) { return String(s || '').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function serviceText_(d) { return d.service + (d.option ? ' – ' + d.option : ''); }

function customerWhatsAppText_(d, ref) {
  return 'Hello ' + d.name.split(' ')[0] + '! 🌸\n\nThis is ' + SETTINGS.BUSINESS_NAME + '. Your appointment is confirmed:\n\n' +
    '📌 Ref: ' + ref + '\n💆 Service: ' + serviceText_(d) + '\n📅 Date: ' + niceDate_(d.date) + '\n⏰ Time: ' + d.time + '\n📍 ' + SETTINGS.ADDRESS +
    '\n\nNeed to change your booking? Just reply to this message.\nSee you soon! Care • Beauty • A Brighter You';
}

function calendarLink_(d, ref) {
  var start = d.date.replace(/-/g, '') + 'T' + d.time.replace(':', '') + '00';
  var endH = ('0' + (parseInt(d.time, 10) + 1)).slice(-2);
  var end = d.date.replace(/-/g, '') + 'T' + endH + '0000';
  return 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(SETTINGS.BUSINESS_NAME + ' – ' + d.service) +
    '&dates=' + start + '/' + end + '&ctz=' + SETTINGS.TIMEZONE + '&location=' + encodeURIComponent(SETTINGS.ADDRESS) +
    '&details=' + encodeURIComponent('Booking ref ' + ref + '. Questions? Call ' + SETTINGS.PHONE);
}

function row_(label, value) {
  return '<tr><td style="padding:10px 0;border-bottom:1px solid #F0DCD2;color:#B9775B;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:bold;width:120px">' + label +
    '</td><td style="padding:10px 0;border-bottom:1px solid #F0DCD2;color:#4A2A1E;font-size:15px">' + value + '</td></tr>';
}

function sendCustomerEmail_(d, ref) {
  var wa = 'https://wa.me/' + SETTINGS.WHATSAPP + '?text=' + encodeURIComponent('Hello Kabuchi! About my booking ' + ref + ':');
  var html =
    '<div style="background:#FBF5F1;padding:30px 12px;font-family:Arial,Helvetica,sans-serif">' +
    '<div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #F0DCD2">' +
    '<div style="background:#6B341F;background:linear-gradient(120deg,#8E4A31,#6B341F,#4E2414);padding:28px;text-align:center">' +
    '<img src="' + SETTINGS.LOGO_URL + '" width="90" height="90" alt="Kabuchi" style="border-radius:50%;border:3px solid #EAB5A1">' +
    '<div style="color:#FFF1EA;font-family:Georgia,serif;font-size:26px;letter-spacing:5px;margin-top:10px">KABUCHI</div>' +
    '<div style="color:#EAB5A1;font-size:11px;letter-spacing:5px">SPA &amp; BEAUTY</div></div>' +
    '<div style="padding:30px 32px">' +
    '<div style="font-family:Georgia,serif;font-size:26px;color:#5E2E1C">You’re booked, ' + esc_(d.name.split(' ')[0]) + '! ✨</div>' +
    '<p style="color:#6B4A3C;font-size:15px;line-height:1.6">Thank you for booking with ' + SETTINGS.BUSINESS_NAME + '. Here are your appointment details:</p>' +
    '<table style="width:100%;border-collapse:collapse;margin:14px 0 22px">' +
    row_('Reference', '<b style="font-size:17px;color:#5E2E1C">' + ref + '</b>') +
    row_('Service', esc_(serviceText_(d))) + row_('Date', niceDate_(d.date)) + row_('Time', d.time) +
    row_('Where', SETTINGS.ADDRESS) + '</table>' +
    '<div style="text-align:center;margin:8px 0 6px">' +
    '<a href="' + calendarLink_(d, ref) + '" style="display:inline-block;background:#6B341F;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:30px;font-size:13px;font-weight:bold;letter-spacing:1px;margin:4px">ADD TO CALENDAR</a>' +
    '<a href="' + wa + '" style="display:inline-block;background:#25D366;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:30px;font-size:13px;font-weight:bold;letter-spacing:1px;margin:4px">WHATSAPP US</a></div>' +
    '<p style="color:#6B4A3C;font-size:14px;line-height:1.6;margin-top:22px">Need to change or cancel? Reply to this email, WhatsApp us or call <b>' + SETTINGS.PHONE + '</b>. We are open every day, 09:00 – 18:00.</p>' +
    '</div><div style="background:#F6DED3;padding:16px;text-align:center;color:#6B341F;font-size:11px;letter-spacing:4px">CARE • BEAUTY • A BRIGHTER YOU</div></div></div>';
  MailApp.sendEmail({
    to: d.email,
    subject: 'Booking confirmed: ' + d.service + ' on ' + niceDate_(d.date) + ' at ' + d.time + ' (' + ref + ')',
    htmlBody: html,
    body: 'Your booking is confirmed. Ref ' + ref + '. ' + serviceText_(d) + ', ' + niceDate_(d.date) + ' at ' + d.time + '. ' + SETTINGS.ADDRESS + '. Call ' + SETTINGS.PHONE,
    name: SETTINGS.BUSINESS_NAME,
    replyTo: SETTINGS.NOTIFY_EMAIL
  });
}

function sendOwnerEmail_(d, ref, waLink) {
  var html =
    '<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px">' +
    '<h2 style="color:#5E2E1C;font-family:Georgia,serif">New booking ' + ref + '</h2>' +
    '<table style="width:100%;border-collapse:collapse">' +
    row_('Service', esc_(serviceText_(d))) + row_('Date', niceDate_(d.date)) + row_('Time', d.time) +
    row_('Name', esc_(d.name)) + row_('Phone', '<a href="tel:+' + d.phone + '">+' + d.phone + '</a>') +
    row_('Email', esc_(d.email || '—')) + row_('Notes', esc_(d.notes || '—')) +
    row_('WhatsApp', d.whatsapp ? '<b>Customer asked for a WhatsApp confirmation</b>' : 'Not requested') + '</table>' +
    '<p style="margin-top:22px"><a href="' + waLink + '" style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;padding:13px 22px;border-radius:30px;font-weight:bold">Send WhatsApp confirmation to ' + esc_(d.name.split(' ')[0]) + '</a></p>' +
    '<p style="color:#888;font-size:12px">Tap the green button on your phone: WhatsApp opens with the confirmation already written, just press send. If WhatsApp says the number is not on WhatsApp, call or SMS them instead.<br>To cancel a booking, change its Status to "Cancelled" in the Google Sheet. The time becomes free again on the website.</p></div>';
  MailApp.sendEmail({
    to: SETTINGS.NOTIFY_EMAIL,
    subject: '🗓 New booking: ' + d.service + ', ' + niceDate_(d.date) + ' ' + d.time + ' – ' + d.name,
    htmlBody: html,
    body: 'New booking ' + ref + ': ' + serviceText_(d) + ', ' + d.date + ' ' + d.time + ', ' + d.name + ' +' + d.phone,
    name: 'Kabuchi Website',
    replyTo: d.email || SETTINGS.NOTIFY_EMAIL
  });
}
