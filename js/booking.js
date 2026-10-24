/* Kabuchi Spa & Beauty — 4-step online booking
   Step 1 Service → Step 2 Date & time → Step 3 Your details → Step 4 Done */
(function () {
  var C = window.KABUCHI_BOOKING || {};
  var root = document.getElementById('booking');
  if (!root) return;

  var state = { step: 1, service: '', option: '', date: '', time: '', full: {}, ref: '' };
  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var DAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  var $ = function (s, el) { return (el || root).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || root).querySelectorAll(s)); };
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var ymd = function (d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  var parse = function (s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); };
  var niceDate = function (s) { var d = parse(s); return DAYS_LONG[d.getDay()] + ', ' + d.getDate() + ' ' + MONTHS_LONG[d.getMonth()] + ' ' + d.getFullYear(); };
  var online = !!(C.SCRIPT_URL && C.SCRIPT_URL.indexOf('script.google.com') > -1);

  /* ---------- step navigation ---------- */
  function go(n) {
    state.step = n;
    $$('.bk-panel').forEach(function (p) { p.hidden = +p.dataset.step !== n; });
    $$('.bk-steps li').forEach(function (li) {
      var s = +li.dataset.step;
      li.classList.toggle('done', s < n);
      li.classList.toggle('now', s === n);
    });
    updateSummary();
    var top = root.getBoundingClientRect().top + window.pageYOffset - 100;
    if (window.pageYOffset > top) window.scrollTo({ top: top, behavior: 'smooth' });
  }
  $$('[data-back]').forEach(function (b) { b.addEventListener('click', function () { go(state.step - 1); }); });

  function updateSummary() {
    $$('[data-sum="service"]').forEach(function (el) { el.textContent = state.service ? state.service + (state.option ? ' – ' + state.option : '') : '—'; });
    $$('[data-sum="date"]').forEach(function (el) { el.textContent = state.date ? niceDate(state.date) : '—'; });
    $$('[data-sum="time"]').forEach(function (el) { el.textContent = state.time || '—'; });
    $('#next-1').disabled = !state.service;
    $('#next-2').disabled = !(state.date && state.time);
  }

  /* ---------- step 1: service ---------- */
  var optBox = $('#bk-options');
  $$('.bk-svc').forEach(function (card) {
    card.addEventListener('click', function () {
      $$('.bk-svc').forEach(function (c) { c.classList.remove('sel'); c.setAttribute('aria-pressed', 'false'); });
      card.classList.add('sel'); card.setAttribute('aria-pressed', 'true');
      state.service = card.dataset.service; state.option = '';
      var opts = JSON.parse(card.dataset.options || '[]');
      optBox.innerHTML = opts.length ? '<p class="bk-label">Which treatment? <span>(optional)</span></p><div class="bk-opts">' +
        opts.map(function (o) { return '<button type="button" class="bk-opt">' + o + '</button>'; }).join('') + '</div>' : '';
      $$('.bk-opt', optBox).forEach(function (b) {
        b.addEventListener('click', function () {
          var on = b.classList.contains('sel');
          $$('.bk-opt', optBox).forEach(function (x) { x.classList.remove('sel'); });
          if (!on) { b.classList.add('sel'); state.option = b.textContent; } else state.option = '';
          updateSummary();
        });
      });
      updateSummary();
    });
  });
  // pre-select from link: booking.html?service=Massage
  var want = new URLSearchParams(location.search).get('service');
  if (want) {
    var m = $$('.bk-svc').filter(function (c) { return c.dataset.service.toLowerCase() === want.toLowerCase(); })[0];
    if (m) m.click();
  }
  $('#next-1').addEventListener('click', function () { buildDates(); go(2); });

  /* ---------- step 2: date & time ---------- */
  var datesEl = $('#bk-dates'), slotsEl = $('#bk-slots');
  var built = false;
  function buildDates() {
    if (built) { renderSlots(); return; }
    built = true;
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var html = '';
    for (var i = 0; i < (C.DAYS_AHEAD || 21); i++) {
      var d = new Date(today); d.setDate(today.getDate() + i);
      var label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : DAYS[d.getDay()];
      html += '<button type="button" class="bk-day" data-date="' + ymd(d) + '"><small>' + label + '</small><b>' + d.getDate() + '</b><small>' + MONTHS[d.getMonth()] + '</small></button>';
    }
    datesEl.innerHTML = html;
    $$('.bk-day', datesEl).forEach(function (b) {
      b.addEventListener('click', function () {
        $$('.bk-day', datesEl).forEach(function (x) { x.classList.remove('sel'); });
        b.classList.add('sel'); state.date = b.dataset.date; state.time = '';
        renderSlots();
      });
    });
    loadFull(ymd(today));
    // choose first day that still has time left
    var first = $$('.bk-day', datesEl).filter(function (b) { return freeSlots(b.dataset.date).length; })[0];
    (first || $('.bk-day', datesEl)).click();
  }
  $('#bk-prev').addEventListener('click', function () { datesEl.scrollBy({ left: -300, behavior: 'smooth' }); });
  $('#bk-nextd').addEventListener('click', function () { datesEl.scrollBy({ left: 300, behavior: 'smooth' }); });

  function allSlots() { var a = []; for (var h = C.FIRST_SLOT || 9; h <= (C.LAST_SLOT || 17); h++) a.push(pad(h) + ':00'); return a; }
  function isPast(date, t) {
    var now = new Date(), d = parse(date);
    d.setHours(+t.slice(0, 2), +t.slice(3), 0, 0);
    return d.getTime() < now.getTime() + 30 * 60000; // at least 30 minutes' notice
  }
  function freeSlots(date) { return allSlots().filter(function (t) { return !isPast(date, t) && (state.full[date] || []).indexOf(t) < 0; }); }

  function renderSlots() {
    if (!state.date) return;
    var groups = [['Morning', function (h) { return h < 12; }], ['Afternoon', function (h) { return h >= 12; }]];
    var html = '';
    groups.forEach(function (g) {
      var list = allSlots().filter(function (t) { return g[1](+t.slice(0, 2)) && !isPast(state.date, t); });
      if (!list.length) return;
      html += '<p class="bk-label">' + g[0] + '</p><div class="bk-times">' + list.map(function (t) {
        var taken = (state.full[state.date] || []).indexOf(t) > -1;
        return '<button type="button" class="bk-time' + (t === state.time ? ' sel' : '') + '" data-time="' + t + '"' + (taken ? ' disabled title="Already booked"' : '') + '>' + t + (taken ? '<small>Booked</small>' : '') + '</button>';
      }).join('') + '</div>';
    });
    slotsEl.innerHTML = html || '<p class="bk-empty">No more times available on this day. Please choose another date.</p>';
    $$('.bk-time', slotsEl).forEach(function (b) {
      b.addEventListener('click', function () {
        $$('.bk-time', slotsEl).forEach(function (x) { x.classList.remove('sel'); });
        b.classList.add('sel'); state.time = b.dataset.time; updateSummary();
      });
    });
    updateSummary();
  }

  function loadFull(from) {
    if (!online) return;
    slotsEl.classList.add('loading');
    fetch(C.SCRIPT_URL + '?action=slots&from=' + from + '&days=' + (C.DAYS_AHEAD || 21))
      .then(function (r) { return r.json(); })
      .then(function (j) { if (j && j.full) { state.full = j.full; renderSlots(); } })
      .catch(function () {})
      .then(function () { slotsEl.classList.remove('loading'); });
  }
  $('#next-2').addEventListener('click', function () { go(3); });

  /* ---------- step 3: details ---------- */
  var form = $('#bk-form');
  if (!online) {
    $('#bk-submit').innerHTML = $('#bk-submit').innerHTML.replace('Confirm Booking', 'Send Booking on WhatsApp');
    $('#bk-email-note').textContent = 'Optional';
    $('#bk-email').required = false;
  }
  function normPhone(p) {
    var d = (p || '').replace(/\D/g, '');
    if (d.indexOf('260') === 0) return d;
    if (d.charAt(0) === '0') return '260' + d.slice(1);
    if (d.length === 9) return '260' + d;
    return d;
  }
  function waText() {
    return 'Hello Kabuchi Spa & Beauty! I have booked an appointment' + (state.ref ? ' (ref ' + state.ref + ')' : '') + ':\n\n' +
      'Service: ' + state.service + (state.option ? ' – ' + state.option : '') + '\n' +
      'Date: ' + niceDate(state.date) + '\nTime: ' + state.time + '\n' +
      'Name: ' + $('#bk-name').value.trim() + '\nPhone: +' + normPhone($('#bk-phone').value) +
      ($('#bk-notes').value.trim() ? '\nNote: ' + $('#bk-notes').value.trim() : '') +
      '\n\nPlease confirm on WhatsApp. Thank you!';
  }
  function waLink() { return 'https://wa.me/' + C.WHATSAPP + '?text=' + encodeURIComponent(waText()); }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var err = $('#bk-error'); err.hidden = true;
    var phone = normPhone($('#bk-phone').value);
    if (phone.length < 11) { err.textContent = 'Please enter a valid phone number, e.g. 097 123 4567.'; err.hidden = false; return; }
    if ($('#bk-hp').value) return; // spam trap

    if (!online) {
      state.ref = '';
      window.open(waLink(), '_blank', 'noopener');
      finish(false);
      return;
    }
    var btn = $('#bk-submit'); btn.disabled = true; btn.classList.add('busy');
    var payload = {
      service: state.service, option: state.option, date: state.date, time: state.time,
      name: $('#bk-name').value.trim(), phone: phone, email: $('#bk-email').value.trim(),
      notes: $('#bk-notes').value.trim(), whatsapp: $('#bk-wa').checked
    };
    fetch(C.SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload) })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (j.ok) { state.ref = j.ref; state.waSent = j.whatsapp === 'sent'; state.emailed = j.email !== false; finish(true); return; }
        if (j.error === 'taken') {
          err.textContent = 'Sorry, someone has just booked ' + state.time + ' on that day. Please choose another time.';
          err.hidden = false; (state.full[state.date] = state.full[state.date] || []).push(state.time); state.time = '';
          renderSlots(); setTimeout(function () { go(2); }, 1800);
        } else { throw new Error(j.error || 'error'); }
      })
      .catch(function () {
        err.innerHTML = 'We could not complete your booking online. Please <a href="' + waLink() + '" target="_blank" rel="noopener">send it on WhatsApp</a> or call +260 973 879 988.';
        err.hidden = false;
      })
      .then(function () { btn.disabled = false; btn.classList.remove('busy'); });
  });

  /* ---------- step 4: done ---------- */
  function finish(sent) {
    var email = $('#bk-email').value.trim();
    $('#bk-done-title').textContent = sent ? 'You’re booked!' : 'Almost done!';
    var first = esc($('#bk-name').value.trim().split(' ')[0]);
    var phoneTxt = '+' + normPhone($('#bk-phone').value);
    var sentTo = [];
    if (sent && state.waSent) sentTo.push('your WhatsApp (<b>' + phoneTxt + '</b>)');
    if (sent && email && state.emailed) sentTo.push('your email (<b>' + esc(email) + '</b>)');
    $('#bk-done-text').innerHTML = sent
      ? 'Thank you, <b>' + first + '</b>. Your booking reference is <b class="bk-ref">' + state.ref + '</b>.' +
        (sentTo.length ? '<br>A confirmation has been sent to ' + sentTo.join(' and ') + '.' : '') +
        (email && state.emailed ? ' If you can’t see the email, check your spam folder.' : '')
      : 'WhatsApp has opened with your booking details. <b>Press send</b> and we will reply to confirm your appointment.';
    $('#bk-wa-btn').href = waLink();
    $('#bk-wa-btn').querySelector('span').textContent = !sent ? 'Open WhatsApp again' : (state.waSent ? 'Chat with us on WhatsApp' : 'Get confirmation on WhatsApp');
    var start = parse(state.date); start.setHours(+state.time.slice(0, 2), 0, 0, 0);
    var end = new Date(start.getTime() + 60 * 60000);
    var title = 'Kabuchi Spa & Beauty – ' + state.service;
    var details = 'Your ' + state.service + (state.option ? ' (' + state.option + ')' : '') + ' appointment' + (state.ref ? ', ref ' + state.ref : '') + '. Questions? Call +260 973 879 988.';
    var g = function (d) { return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + 'T' + pad(d.getHours()) + pad(d.getMinutes()) + '00'; };
    $('#cal-google').href = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(title) +
      '&dates=' + g(start) + '/' + g(end) + '&ctz=Africa/Lusaka&details=' + encodeURIComponent(details) + '&location=' + encodeURIComponent(C.ADDRESS);
    var ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Kabuchi Spa & Beauty//Booking//EN', 'BEGIN:VEVENT',
      'UID:' + (state.ref || Date.now()) + '@kabuchi', 'DTSTAMP:' + g(new Date()), 'DTSTART;TZID=Africa/Lusaka:' + g(start), 'DTEND;TZID=Africa/Lusaka:' + g(end),
      'SUMMARY:' + title, 'DESCRIPTION:' + details, 'LOCATION:' + C.ADDRESS.replace(/,/g, '\\,'),
      'BEGIN:VALARM', 'TRIGGER:-PT2H', 'ACTION:DISPLAY', 'DESCRIPTION:Reminder', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    $('#cal-ics').href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    go(4);
  }
  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  $('#bk-again').addEventListener('click', function () {
    state.time = ''; state.ref = ''; state.waSent = false; state.emailed = false; form.reset();
    $$('.bk-svc').forEach(function (c) { c.classList.remove('sel'); });
    optBox.innerHTML = ''; state.service = ''; state.option = '';
    if (online) loadFull(ymd(new Date()));
    go(1);
  });

  var fl = document.querySelector('.wa-float'); if (fl) fl.style.display = 'none';
  go(1);
})();
