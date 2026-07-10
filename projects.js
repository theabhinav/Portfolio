(function () {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = window.matchMedia('(max-width: 768px)').matches;

  // Add card tilt and mouse glow tracker
  function initProjectCards(cards) {
    if (reducedMotion) return;

    cards.forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        card.style.setProperty('--x', x + 'px');
        card.style.setProperty('--y', y + 'px');

        if (!mobile && window.gsap) {
          // Tilt calculations
          var dx = (x / rect.width) - 0.5;
          var dy = (y / rect.height) - 0.5;
          window.gsap.to(card, {
            rotateY: dx * 8,
            rotateX: -dy * 8,
            transformPerspective: 1000,
            duration: 0.35,
            ease: 'power2.out'
          });
        }
      });

      card.addEventListener('mouseleave', function () {
        if (!mobile && window.gsap) {
          window.gsap.to(card, {
            rotateY: 0,
            rotateX: 0,
            duration: 0.5,
            ease: 'power2.out'
          });
        }
      });
    });
  }

  let initialized = false;
  async function initAnimations() {
    if (initialized) return;
    initialized = true;
    if (!window.gsap) return;
    var gsap = window.gsap;
    if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

    var cards = document.querySelectorAll('.project-card-premium');
    var hero = document.querySelector('.pg-hero');

    initProjectCards(cards);

    if (reducedMotion) {
      cards.forEach(function (card) { card.style.opacity = '1'; });
      return;
    }

    if (hero) {
      gsap.fromTo(hero, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out', delay: 0.2 });
    }

    cards.forEach(function (card, index) {
      var img = card.querySelector('.project-image-side img');

      // Entrance animation
      gsap.fromTo(
        card,
        { opacity: 0, y: 50, scale: 0.96 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 88%',
            toggleActions: 'play none none reverse'
          }
        }
      );

      // Image scroll parallax
      if (img && !mobile) {
        gsap.fromTo(
          img,
          { y: -30, scale: 1.06 },
          {
            y: 30,
            scale: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: card,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 0.5
            }
          }
        );
      }
    });
  }

  window.addEventListener('pageTransitionComplete', initAnimations);
  document.addEventListener('DOMContentLoaded', function () {
    setTimeout(initAnimations, 120);
  });
})();
