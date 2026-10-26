(function () {
  var form = document.getElementById('bokningsformular');
  if (!form) return;

  var endpoint = form.getAttribute('data-endpoint') || '';
  var sitekey = form.getAttribute('data-sitekey') || '';
  var demo = !endpoint;
  var summary = document.getElementById('bf-summary');
  var status = form.querySelector('.bf-status');
  var done = document.getElementById('bf-tack');
  var button = form.querySelector('button[type="submit"]');
  var message = form.elements.meddelande;
  var counter = document.getElementById('bf-meddelande-antal');
  var turnstileBox = form.querySelector('[data-turnstile]');
  var widget = null;

  var MAX = 2000;
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var PHONE = /^\+?[0-9\s\-()]{6,30}$/;
  var GENERIC = 'Förfrågan kunde inte skickas. Försök igen om en stund eller ring oss på 08-86 10 10.';

  function value(name) {
    var el = form.elements[name];
    return el ? String(el.value || '').trim() : '';
  }

  function updateCounter() {
    var n = message.value.length;
    counter.textContent = n.toLocaleString('sv-SE') + ' / 2 000 tecken';
    counter.classList.toggle('is-over', n > MAX);
  }
  message.addEventListener('input', updateCounter);
  updateCounter();

  function validate() {
    var e = {};
    var namn = value('namn'), epost = value('epost'), telefon = value('telefon'), text = value('meddelande');
    if (!namn) e.namn = 'Skriv ditt namn.';
    else if (namn.length > 100) e.namn = 'Namnet får vara högst 100 tecken.';
    if (!epost) e.epost = 'Skriv din e-postadress.';
    else if (epost.length > 254 || !EMAIL.test(epost)) e.epost = 'Kontrollera e-postadressen, till exempel namn@exempel.se.';
    if (!telefon) e.telefon = 'Skriv ditt telefonnummer.';
    else if (!PHONE.test(telefon) || telefon.replace(/\D/g, '').length < 6) e.telefon = 'Kontrollera telefonnumret. Använd siffror, till exempel 070-123 45 67.';
    if (value('djurets_namn').length > 60) e.djurets_namn = 'Djurets namn får vara högst 60 tecken.';
    if (['hund', 'katt'].indexOf(value('djurslag')) < 0) e.djurslag = 'Välj hund eller katt.';
    if (value('alder').length > 30) e.alder = 'Åldern får vara högst 30 tecken.';
    if (!text) e.meddelande = 'Beskriv vad ditt djur behöver hjälp med.';
    else if (text.length > MAX) e.meddelande = 'Texten får vara högst 2 000 tecken. Korta gärna ner den.';
    if (value('onskad_tid').length > 200) e.onskad_tid = 'Önskad dag eller tid får vara högst 200 tecken.';
    return e;
  }

  function setFieldError(field, text) {
    var box = form.querySelector('[data-field="' + field + '"]');
    if (!box) return;
    var err = box.querySelector('.bf-error');
    var inputs = box.querySelectorAll('input, textarea');
    box.classList.toggle('is-invalid', !!text);
    for (var i = 0; i < inputs.length; i++) {
      if (text) inputs[i].setAttribute('aria-invalid', 'true'); else inputs[i].removeAttribute('aria-invalid');
    }
    if (err) { err.textContent = text || ''; err.hidden = !text; }
  }

  function showErrors(errors) {
    var list = summary.querySelector('ul');
    list.innerHTML = '';
    var boxes = form.querySelectorAll('[data-field]');
    for (var i = 0; i < boxes.length; i++) {
      var name = boxes[i].getAttribute('data-field');
      setFieldError(name, errors[name]);
      if (errors[name]) {
        var target = boxes[i].querySelector('input, textarea');
        var li = document.createElement('li');
        li.setAttribute('data-for', name);
        var a = document.createElement('a');
        a.href = '#' + target.id;
        a.textContent = errors[name];
        a.addEventListener('click', function (ev) {
          ev.preventDefault();
          var el = document.getElementById(this.getAttribute('href').slice(1));
          if (el) el.focus();
        });
        li.appendChild(a);
        list.appendChild(li);
      }
    }
    summary.hidden = !list.children.length;
    return list.children.length;
  }
  form.addEventListener('input', function (ev) {
    var box = ev.target.closest('[data-field]');
    if (!box || !box.classList.contains('is-invalid')) return;
    var name = box.getAttribute('data-field');
    var msg = validate()[name];
    setFieldError(name, msg);
    if (!msg) {
      var item = summary.querySelector('li[data-for="' + name + '"]');
      if (item) item.remove();
      if (!summary.querySelector('li')) summary.hidden = true;
    }
  });

  function setStatus(text, isError) {
    status.textContent = text || '';
    status.classList.toggle('is-error', !!isError);
  }

  function resetTurnstile() {
    if (widget !== null && window.turnstile) { try { window.turnstile.reset(widget); } catch (_) {} }
  }
  function renderTurnstile() {
    if (demo || !sitekey || !turnstileBox || !window.turnstile || widget !== null) return;
    turnstileBox.innerHTML = '';
    widget = window.turnstile.render(turnstileBox, { sitekey: sitekey, action: 'bokning', language: 'sv' });
  }
  window.dalenumTurnstile = renderTurnstile;
  renderTurnstile();

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    setStatus('');
    if (showErrors(validate())) { summary.focus(); return; }

    if (demo) {
      setStatus('Demo: ingen förfrågan har skickats. Formuläret är korrekt ifyllt. När webbplatsen publiceras går förfrågan till kliniken.');
      return;
    }

    var token = form.querySelector('[name="cf-turnstile-response"]');
    if (!token || !token.value) { setStatus('Bekräfta att du inte är en robot och försök igen.', true); return; }

    var label = button.textContent;
    button.disabled = true;
    button.textContent = 'Skickar …';

    fetch(endpoint, { method: 'POST', body: new FormData(form), credentials: 'same-origin', headers: { Accept: 'application/json' } })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { return { ok: r.ok, data: d }; }); })
      .then(function (res) {
        if (res.ok && res.data.ok) {
          form.hidden = true;
          done.hidden = false;
          done.focus();
          return;
        }
        if (res.data.errors && showErrors(res.data.errors)) summary.focus();
        setStatus(res.data.message || GENERIC, true);
      })
      .catch(function () { setStatus(GENERIC, true); })
      .then(function () {
        button.disabled = false;
        button.textContent = label;
        resetTurnstile();
      });
  });
})();
