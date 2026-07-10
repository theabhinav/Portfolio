(function () {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = window.matchMedia('(max-width: 768px)').matches;

  const glowMap = {
    react: 'rgba(97, 218, 251, 0.45)',
    html: 'rgba(228, 77, 38, 0.4)',
    javascript: 'rgba(247, 223, 30, 0.35)',
    node: 'rgba(104, 160, 99, 0.4)',
    express: 'rgba(255, 255, 255, 0.25)',
    mongodb: 'rgba(77, 179, 61, 0.4)',
    git: 'rgba(240, 80, 50, 0.4)',
    docker: 'rgba(36, 150, 237, 0.4)',
    figma: 'rgba(162, 89, 255, 0.35)',
    cpp: 'rgba(0, 90, 156, 0.4)',
    python: 'rgba(55, 118, 171, 0.4)',
    dsa: 'rgba(0, 195, 255, 0.4)',
  };

  function initTilt(card) {
    if (mobile || reducedMotion || !window.gsap) return;
    var glow = glowMap[card.dataset.skill] || 'rgba(0, 195, 255, 0.3)';

    card.addEventListener('mousemove', function (e) {
      var rect = card.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width - 0.5;
      var y = (e.clientY - rect.top) / rect.height - 0.5;
      
      // Update custom properties for mouse glow background
      card.style.setProperty('--x', (e.clientX - rect.left) + 'px');
      card.style.setProperty('--y', (e.clientY - rect.top) + 'px');

      window.gsap.to(card, {
        rotateY: x * 15,
        rotateX: -y * 15,
        transformPerspective: 800,
        boxShadow: '0 20px 45px ' + glow,
        duration: 0.25,
        ease: 'power2.out',
      });
    });

    card.addEventListener('mouseleave', function () {
      window.gsap.to(card, {
        rotateY: 0,
        rotateX: 0,
        boxShadow: '0 15px 30px rgba(0, 0, 0, 0.25)',
        duration: 0.5,
        ease: 'power2.out',
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

    var cards = document.querySelectorAll('.skill-card-premium');
    var hero = document.querySelector('.pg-hero');

    cards.forEach(initTilt);

    if (reducedMotion) {
      cards.forEach(function (card) {
        card.style.opacity = '1';
        card.classList.add('is-visible');
        var progressCircle = card.querySelector('.progress-circle');
        if (progressCircle) {
          progressCircle.style.strokeDashoffset = mobile ? 
            card.style.getPropertyValue('--dashoffset-mobile') : 
            card.style.getPropertyValue('--dashoffset');
        }
      });
      return;
    }

    if (hero) {
      gsap.fromTo(hero, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out', delay: 0.2 });
    }

    // Set initial card states
    gsap.set(cards, { opacity: 0, scale: 0.88, y: 20 });

    document.querySelectorAll('.skills-category-premium').forEach(function (category) {
      var categoryCards = category.querySelectorAll('.skill-card-premium');
      
      gsap.to(categoryCards, {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.08,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: category,
          start: 'top 85%',
          toggleActions: 'play none none reverse'
        }
      });
    });
  }

  window.addEventListener('pageTransitionComplete', initAnimations);
  document.addEventListener('DOMContentLoaded', function () {
    setTimeout(initAnimations, 120);
  });
})();
