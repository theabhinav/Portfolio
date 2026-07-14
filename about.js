(function () {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = window.matchMedia('(max-width: 768px)').matches;

  function initMagnetic(selector) {
    if (mobile || reducedMotion || !window.gsap) return;

    document.querySelectorAll(selector).forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var rect = el.getBoundingClientRect();
        var x = (e.clientX - rect.left - rect.width / 2) * 0.22;
        var y = (e.clientY - rect.top - rect.height / 2) * 0.22;
        window.gsap.to(el, { x: x, y: y, duration: 0.35, ease: 'power2.out' });
      });
      el.addEventListener('mouseleave', function () {
        window.gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.5)' });
      });
    });
  }

  // Mouse hover glow tracker for bento cells
  function initBentoGlow() {
    document.querySelectorAll('.bento-item').forEach(function (item) {
      item.addEventListener('mousemove', function (e) {
        var rect = item.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        item.style.setProperty('--x', x + 'px');
        item.style.setProperty('--y', y + 'px');
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

    var bentoItems = document.querySelectorAll('.bento-item');
    var hero = document.querySelector('.pg-hero');

    initBentoGlow();

    if (reducedMotion) {
      bentoItems.forEach(function (item) { item.style.opacity = '1'; });
      return;
    }

    if (hero) {
      gsap.fromTo(hero, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out', delay: 0.2 });
    }

    // Stagger bento items entrance
    if (bentoItems.length > 0) {
      gsap.fromTo(
        bentoItems,
        { opacity: 0, y: 40, scale: 0.97 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          stagger: 0.08,
          ease: 'power3.out',
          delay: 0.35
        }
      );
    }

    // Connect timeline animation triggers on scroll
    var timelineItems = document.querySelectorAll('.timeline-item-premium');
    timelineItems.forEach(function (item, i) {
      gsap.fromTo(
        item,
        { opacity: 0, x: -20 },
        {
          opacity: 1,
          x: 0,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: item,
            start: 'top 90%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    });

    initMagnetic('.interest-tag-premium');
    initMagnetic('.pg-social-dock a');

    // Lightbox Modal logic
    const profileImg = document.querySelector('.bento-profile-card img');
    const lightbox = document.getElementById('image-lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxClose = document.querySelector('.lightbox-close');

    if (profileImg && lightbox && lightboxImg) {
      profileImg.addEventListener('click', function () {
        lightboxImg.src = profileImg.src;
        lightbox.classList.add('is-active');
        document.body.style.overflow = 'hidden';
      });

      const closeLightbox = function () {
        lightbox.classList.remove('is-active');
        document.body.style.overflow = '';
      };

      if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
      lightbox.addEventListener('click', function (e) {
        if (e.target === lightbox) {
          closeLightbox();
        }
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
          closeLightbox();
        }
      });
    }

    // Contact Form submission logic
    initContactForm();
  }

  function initContactForm() {
    const form = document.getElementById('contact-form');
    const status = document.getElementById('form-status');
    if (!form || !status) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      
      const formData = new FormData(form);
      const accessKey = formData.get('access_key');
      
      // If access key is still the placeholder, advise the user to set it up
      if (accessKey === 'YOUR_ACCESS_KEY_HERE') {
        status.textContent = 'Setup Required: Please replace YOUR_ACCESS_KEY_HERE with a real Web3Forms key in about.html.';
        status.className = 'form-status show error';
        return;
      }

      status.textContent = 'Sending message...';
      status.className = 'form-status show info';
      
      const object = Object.fromEntries(formData);
      const json = JSON.stringify(object);

      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: json
      })
      .then(async (response) => {
        let res = await response.json();
        if (response.status == 200) {
          status.textContent = 'Message sent successfully!';
          status.className = 'form-status show success';
          form.reset();
        } else {
          status.textContent = res.message || 'Something went wrong. Please try again.';
          status.className = 'form-status show error';
        }
      })
      .catch((error) => {
        status.textContent = 'Network error. Please try again later.';
        status.className = 'form-status show error';
      });
    });
  }

  window.addEventListener('pageTransitionComplete', initAnimations);
  document.addEventListener('DOMContentLoaded', function () {
    setTimeout(initAnimations, 120);
  });
})();
