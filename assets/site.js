/* Rochester NY Living — shared behavior. No dependencies. */

// Mobile nav
document.addEventListener('click', function (e) {
  var t = e.target.closest('.nav-toggle');
  if (!t) return;
  var nav = document.getElementById('primary-nav');
  var open = nav.classList.toggle('open');
  t.setAttribute('aria-expanded', open ? 'true' : 'false');
});

// Mark the current page in the nav
(function () {
  var here = location.pathname.replace(/index\.html$/, '').replace(/\/$/, '') || '/';
  document.querySelectorAll('.nav a[href]').forEach(function (a) {
    if (a.classList.contains('ext')) return;
    var href = a.getAttribute('href').replace(/index\.html$/, '').replace(/\/$/, '') || '/';
    if (href === here) a.setAttribute('aria-current', 'page');
  });
})();

// Lead forms — every form with data-lead posts to /api/lead
document.querySelectorAll('form[data-lead]').forEach(function (form) {
  var status = form.querySelector('.form-status');
  var button = form.querySelector('button[type="submit"]');
  var original = button ? button.textContent : '';

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (status) { status.className = 'form-status'; status.textContent = ''; }
    if (button) { button.disabled = true; button.textContent = 'Sending…'; }

    var payload = Object.fromEntries(new FormData(form).entries());
    payload.form_name = form.getAttribute('data-lead') || 'contact';
    payload.page_url = location.href;
    payload.page_title = document.title;

    fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (r) { return r.json().then(function (b) { return { ok: r.ok, body: b }; }); })
      .then(function (res) {
        if (!res.ok) throw new Error(res.body && res.body.error ? res.body.error : 'Request failed');
        form.reset();
        if (status) {
          status.className = 'form-status show ok';
          status.textContent = form.getAttribute('data-success') ||
            'Thanks — that came through. I’ll get back to you personally, usually the same day.';
        }
      })
      .catch(function () {
        if (status) {
          status.className = 'form-status show err';
          status.innerHTML = 'Something went wrong on our end. Please call or text ' +
            '<a href="tel:+15857132055">(585) 713-2055</a> or email ' +
            '<a href="mailto:lucashine@kw.com">lucashine@kw.com</a>.';
        }
      })
      .finally(function () {
        if (button) { button.disabled = false; button.textContent = original; }
      });
  });
});
