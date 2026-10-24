/* Kabuchi Spa & Beauty — site scripts */
(function () {
  var WHATSAPP = '260973879988';

  // Mobile menu
  var burger = document.querySelector('.burger');
  var menu = document.querySelector('.menu');
  if (burger && menu) {
    burger.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      burger.setAttribute('aria-expanded', open);
    });
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { menu.classList.remove('open'); });
    });
  }

  // Highlight the current page in the menu
  var page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.menu a').forEach(function (a) {
    if (a.getAttribute('href') === page) a.classList.add('active');
  });

  // Year in footer
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  // Reveal on scroll
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

  // Gallery filters
  var filters = document.querySelectorAll('.filters button');
  filters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filters.forEach(function (b) { b.classList.remove('on'); });
      btn.classList.add('on');
      var f = btn.dataset.filter;
      document.querySelectorAll('.masonry figure').forEach(function (fig) {
        fig.classList.toggle('hide', f !== 'all' && fig.dataset.cat !== f);
      });
    });
  });

  // Lightbox
  var lb = document.querySelector('.lightbox');
  if (lb) {
    var lbImg = lb.querySelector('img');
    document.querySelectorAll('.masonry figure').forEach(function (fig) {
      fig.addEventListener('click', function () {
        var img = fig.querySelector('img');
        lbImg.src = img.src; lbImg.alt = img.alt;
        lb.classList.add('open');
      });
    });
    lb.addEventListener('click', function (e) { if (e.target !== lbImg) lb.classList.remove('open'); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') lb.classList.remove('open'); });
  }

  // Pre-select a service from the link (contact.html?service=Massage)
  var params = new URLSearchParams(location.search);
  var svcSelect = document.getElementById('service');
  if (svcSelect && params.get('service')) {
    var want = params.get('service').toLowerCase();
    Array.prototype.forEach.call(svcSelect.options, function (o) {
      if (o.text.toLowerCase().indexOf(want) === 0) svcSelect.value = o.value;
    });
  }

  // Booking form -> WhatsApp message
  var form = document.getElementById('booking-form');
  if (form) {
    var dateInput = document.getElementById('date');
    if (dateInput) dateInput.min = new Date().toISOString().split('T')[0];
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; };
      var lines = [
        'Hello Kabuchi Spa & Beauty! I would like to book an appointment.',
        '',
        'Name: ' + v('name'),
        'Phone: ' + v('phone'),
        'Service: ' + v('service'),
        'Date: ' + v('date'),
        'Time: ' + v('time')
      ];
      if (v('message')) lines.push('Note: ' + v('message'));
      window.open('https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(lines.join('\n')), '_blank', 'noopener');
    });
  }
})();
