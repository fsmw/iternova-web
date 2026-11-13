(function () {
  "use strict";

  /* Mobile navigation */
  var toggle = document.getElementById("nav-toggle");
  var menu = document.getElementById("nav-menu");
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      menu.classList.toggle("is-open", !open);
    });
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        toggle.setAttribute("aria-expanded", "false");
        menu.classList.remove("is-open");
      }
    });
  }

  /* Cases carousel */
  var track = document.getElementById("cases-track");
  var prev = document.getElementById("cases-prev");
  var next = document.getElementById("cases-next");
  var dotsBox = document.getElementById("cases-dots");

  if (track && prev && next && dotsBox) {
    var cards = Array.prototype.slice.call(track.children);
    var dots = cards.map(function () {
      var d = document.createElement("span");
      dotsBox.appendChild(d);
      return d;
    });

    function step() {
      var first = cards[0];
      if (!first) return track.clientWidth;
      var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return first.getBoundingClientRect().width + gap;
    }

    function update() {
      var max = track.scrollWidth - track.clientWidth - 2;
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= max;
      var index = Math.round(track.scrollLeft / step());
      if (track.scrollLeft >= max) index = cards.length - 1;
      dots.forEach(function (d, i) { d.classList.toggle("is-active", i === index); });
    }

    prev.addEventListener("click", function () { track.scrollBy({ left: -step(), behavior: "smooth" }); });
    next.addEventListener("click", function () { track.scrollBy({ left: step(), behavior: "smooth" }); });
    track.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); next.click(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); prev.click(); }
    });

    var ticking = false;
    track.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { update(); ticking = false; });
    }, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* Contact form: POST /api/contact -> crm.lead en Odoo 18 */
  var form = document.getElementById("contact-form");
  var status = document.getElementById("form-status");
  if (form && status) {
    var submitBtn = form.querySelector('button[type="submit"]');
    var btnLabel = submitBtn ? submitBtn.textContent : "";
    var FALLBACK = "No pudimos enviar el mensaje. Vuelve a intentarlo en unos minutos.";

    function markFields() {
      var firstInvalid = null;
      Array.prototype.forEach.call(form.querySelectorAll("input, textarea"), function (el) {
        if (el.name === "website") return; /* honeypot */
        var ok = el.checkValidity() && el.value.trim() !== "";
        el.closest(".field").classList.toggle("has-error", !ok);
        el.setAttribute("aria-invalid", String(!ok));
        if (!ok && !firstInvalid) firstInvalid = el;
      });
      return firstInvalid;
    }

    function busy(on) {
      form.dataset.sending = on ? "1" : "";
      if (submitBtn) {
        submitBtn.disabled = on;
        submitBtn.textContent = on ? "Enviando..." : btnLabel;
      }
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (form.dataset.sending === "1") return;

      status.classList.remove("is-error", "is-ok");
      status.textContent = "";
      var firstInvalid = markFields();
      if (firstInvalid) {
        status.textContent = "Revisa los campos marcados: todos son obligatorios y el correo debe ser válido.";
        status.classList.add("is-error");
        firstInvalid.focus();
        return;
      }

      var payload = {
        nombre: form.nombre.value.trim(),
        empresa: form.empresa.value.trim(),
        correo: form.correo.value.trim(),
        mensaje: form.mensaje.value.trim(),
        website: form.website.value
      };

      busy(true);
      fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
        .then(function (res) { return res.json().catch(function () { return {}; }); })
        .then(function (data) {
          if (data && data.ok) {
            status.textContent = "Gracias, recibimos tu mensaje. Un socio te contacta dentro de un día hábil.";
            status.classList.add("is-ok");
            form.reset();
          } else {
            status.textContent = (data && data.error) || FALLBACK;
            status.classList.add("is-error");
          }
        })
        .catch(function () {
          status.textContent = FALLBACK;
          status.classList.add("is-error");
        })
        .finally(function () { busy(false); });
    });
  }

  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
