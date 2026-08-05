/* =========================================================
   main.js — تفاعلات الموقع
   بدون أي مكتبات خارجية. يعمل على كل الصفحات (عربي/إنجليزي).
   ========================================================= */
(function () {
  'use strict';

  var isRTL = document.documentElement.dir !== 'ltr';

  /* ---------- 1. قائمة الجوال ---------- */
  function initNav() {
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.getElementById('primary-nav');
    if (!toggle || !nav) return;

    function setOpen(open) {
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
      document.body.style.overflow = open && window.innerWidth < 992 ? 'hidden' : '';
    }

    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });

    document.addEventListener('click', function (e) {
      if (
        toggle.getAttribute('aria-expanded') === 'true' &&
        !e.target.closest('.nav') &&
        !e.target.closest('.nav-toggle')
      ) {
        setOpen(false);
      }
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth >= 992) setOpen(false);
    });
  }

  /* ---------- 2. ظل الترويسة عند التمرير ---------- */
  function initHeaderShadow() {
    var header = document.querySelector('.site-header');
    if (!header) return;

    var ticking = false;
    function update() {
      header.classList.toggle('is-stuck', window.scrollY > 8);
      ticking = false;
    }
    window.addEventListener(
      'scroll',
      function () {
        if (!ticking) {
          ticking = true;
          window.requestAnimationFrame(update);
        }
      },
      { passive: true }
    );
    update();
  }

  /* ---------- 3. ظهور العناصر عند التمرير ---------- */
  function initReveal() {
    var items = document.querySelectorAll('.reveal');
    if (!items.length) return;

    if (
      !('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      items.forEach(function (el) {
        el.classList.add('is-visible');
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );

    items.forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i % 4, 3) * 90 + 'ms';
      observer.observe(el);
    });
  }

  /* ---------- 4. سنة النشر في التذييل ---------- */
  function initYear() {
    document.querySelectorAll('[data-year]').forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }

  /* ---------- 5. اتجاه سهم الأزرار حسب اللغة ---------- */
  function initArrows() {
    document.documentElement.style.setProperty('--arrow-dir', isRTL ? '-3px' : '3px');
    document.documentElement.style.setProperty('--origin', isRTL ? 'right' : 'left');
  }

  /* ---------- 6. نموذج التواصل ---------- */
  function initForm() {
    var form = document.querySelector('[data-contact-form]');
    if (!form) return;

    var status = form.querySelector('.form__status');
    var strings = {
      required: form.dataset.msgRequired || 'هذا الحقل مطلوب',
      email: form.dataset.msgEmail || 'صيغة البريد غير صحيحة',
      sending: form.dataset.msgSending || 'جارٍ الإرسال…',
      success: form.dataset.msgSuccess || 'وصلتنا رسالتك، سنعاود التواصل معك قريباً.',
      error: form.dataset.msgError || 'تعذّر الإرسال. جرّب مرة أخرى أو راسلنا مباشرة.'
    };

    function showError(field, message) {
      var wrap = field.closest('.field');
      if (!wrap) return;
      wrap.classList.add('has-error');
      var slot = wrap.querySelector('.field__error');
      if (slot) slot.textContent = message;
    }

    function clearError(field) {
      var wrap = field.closest('.field');
      if (wrap) wrap.classList.remove('has-error');
    }

    form.querySelectorAll('input, select, textarea').forEach(function (field) {
      field.addEventListener('input', function () {
        clearError(field);
      });
    });

    function validate() {
      var ok = true;
      var first = null;

      form.querySelectorAll('[required]').forEach(function (field) {
        clearError(field);
        var value = String(field.value || '').trim();

        if (!value) {
          showError(field, strings.required);
          ok = false;
          first = first || field;
          return;
        }
        if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
          showError(field, strings.email);
          ok = false;
          first = first || field;
        }
      });

      if (first) first.focus();
      return ok;
    }

    function setStatus(kind, message) {
      if (!status) return;
      status.className = 'form__status' + (kind ? ' is-' + kind : '');
      status.textContent = message || '';
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      setStatus('', '');
      if (!validate()) return;

      var endpoint = form.getAttribute('action') || '';
      var submitBtn = form.querySelector('[type="submit"]');

      /* لم يُضبط مزوّد الاستقبال بعد → نفتح بريد الزائر برسالة جاهزة */
      if (!/^https?:\/\//.test(endpoint)) {
        var to = form.dataset.mailto || 'info@example.com';
        var data = new FormData(form);
        var body = [];
        data.forEach(function (value, key) {
          body.push(key + ': ' + value);
        });
        window.location.href =
          'mailto:' +
          to +
          '?subject=' +
          encodeURIComponent(form.dataset.mailSubject || 'رسالة من الموقع') +
          '&body=' +
          encodeURIComponent(body.join('\n'));
        return;
      }

      if (submitBtn) submitBtn.disabled = true;
      setStatus('', strings.sending);

      fetch(endpoint, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      })
        .then(function (res) {
          if (!res.ok) throw new Error('bad response');
          form.reset();
          setStatus('success', strings.success);
        })
        .catch(function () {
          setStatus('error', strings.error);
        })
        .finally(function () {
          if (submitBtn) submitBtn.disabled = false;
        });
    });
  }

  /* ---------- التشغيل ---------- */
  function init() {
    initArrows();
    initNav();
    initHeaderShadow();
    initReveal();
    initYear();
    initForm();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
