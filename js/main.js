(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- NAV SCROLL ---
  var nav = document.getElementById('nav');

  function updateNav() {
    if (window.scrollY > 40) {
      nav.classList.add('nav--scrolled');
    } else {
      nav.classList.remove('nav--scrolled');
    }
  }
  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  // --- MOBILE MENU ---
  var burger = document.querySelector('.nav__burger');
  var mobileMenu = document.querySelector('.nav__mobile');

  if (burger && mobileMenu) {
    burger.addEventListener('click', function () {
      var isOpen = burger.classList.toggle('nav__burger--open');
      mobileMenu.classList.toggle('nav__mobile--open', isOpen);
      burger.setAttribute('aria-expanded', String(isOpen));
      mobileMenu.setAttribute('aria-hidden', String(!isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        burger.classList.remove('nav__burger--open');
        mobileMenu.classList.remove('nav__mobile--open');
        burger.setAttribute('aria-expanded', 'false');
        mobileMenu.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      });
    });
  }

  // --- SMOOTH SCROLL ---
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var targetId = this.getAttribute('href');
      if (targetId === '#') return;
      var target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      var navHeight = nav ? nav.offsetHeight : 0;
      var top = target.getBoundingClientRect().top + window.scrollY - navHeight;
      window.scrollTo({ top: top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  });

  // --- REVEAL ON SCROLL ---
  if (!prefersReducedMotion) {
    var reveals = document.querySelectorAll('.reveal');

    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal--visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    reveals.forEach(function (el, i) {
      var parent = el.parentElement;
      if (parent && (
        parent.classList.contains('bento') ||
        parent.classList.contains('pillars') ||
        parent.classList.contains('pricing__grid') ||
        parent.classList.contains('stats__grid')
      )) {
        var siblings = Array.from(parent.children);
        var idx = siblings.indexOf(el);
        el.style.transitionDelay = (idx * 0.1) + 's';
      }
      revealObserver.observe(el);
    });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) {
      el.classList.add('reveal--visible');
    });
  }

  // --- COUNTER ANIMATION ---
  var statNumbers = document.querySelectorAll('.stats__number[data-target]');

  function animateCounter(el) {
    var target = parseInt(el.getAttribute('data-target'), 10);
    if (isNaN(target)) return;

    if (prefersReducedMotion) {
      el.textContent = target;
      return;
    }

    var duration = 2000;
    var start = null;

    function step(timestamp) {
      if (!start) start = timestamp;
      var progress = Math.min((timestamp - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target);
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }

  if (statNumbers.length > 0) {
    var counterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    statNumbers.forEach(function (el) { counterObserver.observe(el); });
  }

  // --- ACTIVE NAV LINK ---
  var sections = document.querySelectorAll('section[id]');
  var navLinks = document.querySelectorAll('.nav__link');

  if (sections.length > 0 && navLinks.length > 0) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var id = entry.target.getAttribute('id');
          navLinks.forEach(function (link) {
            if (link.getAttribute('href') === '#' + id) {
              link.style.color = 'var(--text)';
            } else {
              link.style.color = '';
            }
          });
        }
      });
    }, { threshold: 0.15, rootMargin: '-80px 0px -60% 0px' });

    sections.forEach(function (section) { sectionObserver.observe(section); });
  }

  // --- CONTACT FORM (AJAX to Formspree, inline success state) ---
  var contactForm = document.getElementById('contact-form');
  var contactSuccess = document.getElementById('contact-success');
  var contactError = document.getElementById('contact-form-error');

  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      contactError.hidden = true;

      var submitBtn = contactForm.querySelector('button[type="submit"]');
      var originalLabel = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';

      fetch(contactForm.action, {
        method: 'POST',
        body: new FormData(contactForm),
        headers: { 'Accept': 'application/json' }
      })
        .then(function (response) {
          if (response.ok) {
            contactForm.hidden = true;
            contactSuccess.hidden = false;
            contactForm.reset();
          } else {
            throw new Error('Form submission failed');
          }
        })
        .catch(function () {
          contactError.hidden = false;
          submitBtn.disabled = false;
          submitBtn.textContent = originalLabel;
        });
    });
  }

})();
