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

  // --- PRICING CAROUSEL (mobile) ---
  // Below 768px the pricing grid is a horizontal scroll-snap track. Two jobs
  // here: pagination dots, and making sure the cards actually appear — the
  // reveal observer never fires for cards clipped horizontally by the track,
  // so they would sit at opacity 0 until swiped into view.
  var pricingTrack = document.querySelector('.pricing__grid--4');

  if (pricingTrack) {
    var pricingCards = Array.prototype.slice.call(
      pricingTrack.querySelectorAll('.pricing__card')
    );
    var carouselMq = window.matchMedia('(max-width: 768px)');
    var dotsWrap = null;

    var cardsRevealed = false;

    // Reveal the whole rail at once when it scrolls into view. The per-card
    // transition-delay set by the reveal loop above still staggers them, so
    // the cascade survives even though the trigger is now the track.
    function watchTrackForReveal() {
      if (cardsRevealed) return;
      cardsRevealed = true;

      function show() {
        pricingCards.forEach(function (card) {
          card.classList.add('reveal--visible');
        });
      }

      if (prefersReducedMotion || !('IntersectionObserver' in window)) {
        show();
        return;
      }

      var trackObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            show();
            trackObserver.disconnect();
          }
        });
      }, { threshold: 0.1 });

      trackObserver.observe(pricingTrack);
    }

    function activeCardIndex() {
      // Nearest card to the track's left edge, accounting for the gutter.
      var best = 0;
      var bestGap = Infinity;
      pricingCards.forEach(function (card, i) {
        var gap = Math.abs(card.offsetLeft - pricingTrack.scrollLeft - pricingTrack.clientLeft);
        if (gap < bestGap) {
          bestGap = gap;
          best = i;
        }
      });
      return best;
    }

    function syncDots() {
      if (!dotsWrap) return;
      var active = activeCardIndex();
      Array.prototype.forEach.call(dotsWrap.children, function (dot, i) {
        dot.setAttribute('aria-current', i === active ? 'true' : 'false');
      });
    }

    function buildDots() {
      if (dotsWrap) return;
      dotsWrap = document.createElement('div');
      dotsWrap.className = 'pricing__dots';

      pricingCards.forEach(function (card, i) {
        var tier = card.querySelector('.pricing__tier');
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'pricing__dots-dot';
        dot.setAttribute('aria-label', 'Show ' + (tier ? tier.textContent.trim() : 'plan ' + (i + 1)));
        dot.addEventListener('click', function () {
          pricingTrack.scrollTo({
            left: card.offsetLeft - pricingTrack.clientLeft,
            behavior: prefersReducedMotion ? 'auto' : 'smooth'
          });
        });
        dotsWrap.appendChild(dot);
      });

      pricingTrack.parentNode.appendChild(dotsWrap);
      pricingTrack.addEventListener('scroll', syncDots, { passive: true });
      syncDots();
    }

    function destroyDots() {
      if (!dotsWrap) return;
      pricingTrack.removeEventListener('scroll', syncDots);
      dotsWrap.parentNode.removeChild(dotsWrap);
      dotsWrap = null;
    }

    function applyCarousel() {
      if (carouselMq.matches) {
        buildDots();
        watchTrackForReveal();
      } else {
        destroyDots();
      }
    }

    applyCarousel();

    if (carouselMq.addEventListener) {
      carouselMq.addEventListener('change', applyCarousel);
    } else if (carouselMq.addListener) {
      carouselMq.addListener(applyCarousel);
    }
  }

})();
