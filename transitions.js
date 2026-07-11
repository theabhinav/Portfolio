(function () {
  const STORAGE_KEY = 'portfolioPageTransition';
  const GSAP_URL = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function getNavHref(btn) {
    if (btn.dataset.href) return btn.dataset.href;
    const onclick = btn.getAttribute('onclick') || '';
    const match = onclick.match(/location\.href\s*=\s*['"]([^'"]+)['"]/);
    return match ? match[1] : null;
  }

  function currentPage() {
    const path = window.location.pathname.split('/').pop();
    return path || 'index.html';
  }

  function ensureOverlay() {
    let overlay = document.querySelector('.page-transition-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'page-transition-overlay';
      overlay.setAttribute('aria-hidden', 'true');
      document.body.appendChild(overlay);
    }
    return overlay;
  }

  function getAnimTargets() {
    var pageContent = document.querySelector('.page-content');
    if (pageContent) {
      var targets = [pageContent];
      var magic = document.querySelector('#magic');
      if (magic) targets.push(magic);
      return targets;
    }
    return ['#magic', '.playground', '.abt_nav', '.trapy_idx', '.trapy3']
      .map(function (sel) {
        return document.querySelector(sel);
      })
      .filter(Boolean);
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector('script[src="' + src + '"]')) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async function loadGsap() {
    if (window.gsap) return window.gsap;
    await loadScript(GSAP_URL);
    return window.gsap;
  }

  async function navigateWithTransition(href) {
    if (!href) return;

    const targetPage = href.split('/').pop();
    if (targetPage === currentPage()) return;

    if (reducedMotion) {
      sessionStorage.setItem(STORAGE_KEY, '1');
      window.location.href = href;
      return;
    }

    const gsap = await loadGsap();
    const overlay = ensureOverlay();
    const targets = getAnimTargets();

    gsap.set(overlay, { y: '100%' });
    await gsap
      .timeline()
      .to(targets, { opacity: 0.7, scale: 0.97, duration: 0.28, ease: 'power2.in' }, 0)
      .to(overlay, { y: '0%', duration: 0.5, ease: 'power3.inOut' }, 0.08)
      .then();

    sessionStorage.setItem(STORAGE_KEY, '1');
    window.location.href = href;
  }

  function setupNav() {
    document.querySelectorAll('.abt_nav button').forEach(function (btn) {
      const href = getNavHref(btn);
      if (href && !btn.dataset.href) btn.dataset.href = href;
      if (btn.getAttribute('onclick')) btn.removeAttribute('onclick');

      btn.addEventListener('click', function (e) {
        const target = btn.dataset.href || getNavHref(btn);
        if (!target) return;

        // Support for hash links / smooth scrolling
        if (target.startsWith('#') || target.includes('#')) {
          const parts = target.split('#');
          const targetPage = parts[0];
          const hash = parts[1];

          if (targetPage === '' || targetPage === currentPage()) {
            e.preventDefault();
            const el = document.getElementById(hash);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth' });
            }
            return;
          }
        }

        e.preventDefault();
        navigateWithTransition(target);
      });
    });

    const logo = document.querySelector('.nav-logo');
    if (logo) {
      logo.addEventListener('click', function (e) {
        e.preventDefault();
        navigateWithTransition('index.html');
      });
    }
  }

  function setActiveNav() {
    const page = currentPage();
    document.querySelectorAll('.abt_nav button').forEach(function (btn) {
      const href = btn.dataset.href || getNavHref(btn);
      btn.classList.toggle('nav-active', href === page);
    });
  }

  function initVanta() {
    var el = document.getElementById('vanta-bg');
    if (!el || !window.VANTA || window.vantaBgEffect) return;

    window.vantaBgEffect = window.VANTA.RINGS({
      el: '#vanta-bg',
      THREE: window.THREE,
      mouseControls: window.innerWidth > 768,
      touchControls: true,
      gyroControls: false,
      minHeight: 200.0,
      minWidth: 200.0,
      backgroundColor: 0x000322,
    });
  }

  async function playEnterTransition() {
    if (!sessionStorage.getItem(STORAGE_KEY)) return;
    sessionStorage.removeItem(STORAGE_KEY);

    const overlay = ensureOverlay();
    const targets = getAnimTargets();

    if (reducedMotion) {
      overlay.style.display = 'none';
      return;
    }

    const gsap = await loadGsap();
    gsap.set(overlay, { y: '0%' });
    if (document.querySelector('.page-content')) {
      gsap.set(targets, { opacity: 0, scale: 1.02 });
    }

    const tl = gsap.timeline();
    tl.to(overlay, { y: '-100%', duration: 0.55, ease: 'power3.inOut' });
    if (document.querySelector('.page-content')) {
      tl.to(targets, { opacity: 1, scale: 1, duration: 0.45, ease: 'power2.out' }, '-=0.38');
    }
  }

  function initScrollClass() {
    var onScroll = function () {
      document.body.classList.toggle('scrolled', window.scrollY > 50);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  async function init() {
    ensureOverlay();
    setActiveNav();
    setupNav();
    initScrollClass();

    if (document.getElementById('vanta-bg') && window.THREE) {
      initVanta();
    }

    await playEnterTransition();

    // Check for hash on load and scroll to it
    if (window.location.hash) {
      const id = window.location.hash.substring(1);
      const el = document.getElementById(id);
      if (el) {
        setTimeout(function () {
          el.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      }
    }

    window.dispatchEvent(new CustomEvent('pageTransitionComplete'));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
