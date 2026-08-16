// Yuugen Project — light, dependency-free interactions.
(function () {
  "use strict";

  var doc = document;

  /* ---- current year in footer ---- */
  var yearEl = doc.getElementById("year");
  if (yearEl) yearEl.textContent = "© " + new Date().getFullYear();

  /* ---- header shadow on scroll ---- */
  var header = doc.querySelector(".site-header");
  var onScroll = function () {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 8);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---- mobile nav toggle ---- */
  var toggle = doc.querySelector(".nav-toggle");
  var mobileNav = doc.getElementById("mobile-nav");
  if (toggle && mobileNav) {
    var setOpen = function (open) {
      toggle.setAttribute("aria-expanded", String(open));
      mobileNav.hidden = !open;
    };
    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });
    mobileNav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        setOpen(false);
      });
    });
  }

  /* ---- scroll reveal ---- */
  var revealEls = doc.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach(function (el) {
      io.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* ---- contact form ---- */
  var form = doc.getElementById("contact-form");
  if (!form) return;

  var status = form.querySelector(".form-status");
  var submitBtn = form.querySelector('button[type="submit"]');

  var setFieldError = function (name, msg) {
    var errEl = form.querySelector('[data-error-for="' + name + '"]');
    var field = form.querySelector('[name="' + name + '"]');
    if (errEl) errEl.textContent = msg || "";
    if (field) {
      var wrap = field.closest(".field");
      if (wrap) wrap.classList.toggle("invalid", Boolean(msg));
    }
  };

  var clearErrors = function () {
    ["name", "email", "message"].forEach(function (n) {
      setFieldError(n, "");
    });
  };

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    clearErrors();
    if (status) {
      status.textContent = "";
      status.className = "form-status";
    }

    var data = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      service: form.service.value,
      message: form.message.value.trim(),
    };

    // lightweight client-side check for instant feedback
    var localErr = {};
    if (data.name.length < 2) localErr.name = "Please share your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
      localErr.email = "Please enter a valid email.";
    if (data.message.length < 10)
      localErr.message = "Tell us a little more (10+ characters).";

    if (Object.keys(localErr).length) {
      Object.keys(localErr).forEach(function (k) {
        setFieldError(k, localErr[k]);
      });
      return;
    }

    submitBtn.disabled = true;
    var label = submitBtn.querySelector(".btn-label");
    var originalLabel = label ? label.textContent : "";
    if (label) label.textContent = "Sending…";

    fetch("/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    })
      .then(function (res) {
        return res.json().then(function (body) {
          return { ok: res.ok, body: body };
        });
      })
      .then(function (result) {
        if (result.ok && result.body.ok) {
          form.reset();
          if (status) {
            status.textContent =
              result.body.message || "Thank you — we'll be in touch shortly.";
            status.className = "form-status ok";
          }
        } else {
          if (result.body && result.body.errors) {
            Object.keys(result.body.errors).forEach(function (k) {
              setFieldError(k, result.body.errors[k]);
            });
          }
          if (status) {
            status.textContent =
              (result.body && result.body.error) ||
              "Please check the highlighted fields.";
            status.className = "form-status error";
          }
        }
      })
      .catch(function () {
        if (status) {
          status.textContent =
            "Something went wrong. Please email hello@yuugenproject.com.";
          status.className = "form-status error";
        }
      })
      .finally(function () {
        submitBtn.disabled = false;
        if (label) label.textContent = originalLabel;
      });
  });
})();
