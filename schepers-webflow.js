(() => {
  'use strict';

  const root = document.querySelector('[data-page^="schepers-"]');
  if (!root) return;

  const page = root.getAttribute('data-page') || '';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cleanups = [];

  const on = (target, event, handler, options) => {
    if (!target) return;
    target.addEventListener(event, handler, options);
    cleanups.push(() => target.removeEventListener(event, handler, options));
  };

  const initLenis = () => {
    if (reducedMotion || typeof window.Lenis !== 'function') return;
    const lenis = new window.Lenis({
      duration: 1.1,
      smoothWheel: true,
      syncTouch: false,
      touchMultiplier: 1.5
    });
    let frame = 0;
    const raf = time => {
      lenis.raf(time);
      frame = window.requestAnimationFrame(raf);
    };
    frame = window.requestAnimationFrame(raf);
    cleanups.push(() => {
      window.cancelAnimationFrame(frame);
      lenis.destroy();
    });
  };

  const initSmoothAnchors = () => {
    root.querySelectorAll('a[href^="#"]').forEach(link => {
      on(link, 'click', event => {
        const id = link.getAttribute('href');
        if (!id || id === '#') return;
        const target = document.querySelector(id);
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({
          behavior: reducedMotion ? 'auto' : 'smooth',
          block: 'start'
        });
      });
    });
  };

  const initMobileMenu = () => {
    const panel = root.querySelector('[data-module="mobile-menu"]');
    const openButton = root.querySelector('[data-menu-open]');
    const closeButton = root.querySelector('[data-menu-close]');
    if (!panel || !openButton || !closeButton) return;

    const setOpen = open => {
      panel.setAttribute('aria-hidden', String(!open));
      panel.classList.toggle('is-open', open);
      document.documentElement.classList.toggle('is-menu-open', open);
      (open ? closeButton : openButton).focus();
    };

    on(openButton, 'click', event => {
      event.preventDefault();
      setOpen(true);
    });
    on(closeButton, 'click', event => {
      event.preventDefault();
      setOpen(false);
    });
    panel.querySelectorAll('a[href^="#"]').forEach(link => {
      on(link, 'click', () => setOpen(false));
    });
    on(document, 'keydown', event => {
      if (event.key === 'Escape' && panel.getAttribute('aria-hidden') === 'false') {
        setOpen(false);
      }
    });
  };

  const initReveals = () => {
    const items = [...root.querySelectorAll('[data-reveal]')];
    if (!items.length || reducedMotion || !('IntersectionObserver' in window)) {
      items.forEach(item => item.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.18 });
    items.forEach(item => observer.observe(item));
    cleanups.push(() => observer.disconnect());
  };

  const initActiveNavigation = () => {
    const links = [...root.querySelectorAll('[data-nav]')];
    if (!links.length || !('IntersectionObserver' in window)) return;
    const sections = links
      .map(link => document.querySelector(link.getAttribute('data-nav')))
      .filter(Boolean);
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        links.forEach(link => {
          link.classList.toggle(
            'is-current',
            link.getAttribute('data-nav') === `#${entry.target.id}`
          );
        });
      });
    }, { rootMargin: '-35% 0px -55% 0px' });
    sections.forEach(section => observer.observe(section));
    cleanups.push(() => observer.disconnect());
  };

  const initParallax = () => {
    if (reducedMotion) return;
    const items = [...root.querySelectorAll('[data-parallax]')];
    if (!items.length) return;
    let ticking = false;
    const render = () => {
      const viewport = window.innerHeight;
      items.forEach(item => {
        const rect = item.getBoundingClientRect();
        const progress = (viewport - rect.top) / (viewport + rect.height);
        const offset = Math.max(-1, Math.min(1, progress - 0.5)) * 18;
        item.style.setProperty('--schepers-parallax-y', `${offset}px`);
      });
      ticking = false;
    };
    const requestRender = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(render);
    };
    on(window, 'scroll', requestRender, { passive: true });
    on(window, 'resize', requestRender);
    requestRender();
  };

  const initHorizontalGallery = () => {
    const section = root.querySelector('[data-module="horizontal-gallery"]');
    if (!section) return;
    const track = section.querySelector('.schepers_gallery-track');
    if (!track) return;
    on(section, 'wheel', event => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      const max = track.scrollWidth - track.clientWidth;
      if (max <= 0) return;
      const next = track.scrollLeft + event.deltaY;
      if ((next <= 0 && event.deltaY < 0) || (next >= max && event.deltaY > 0)) return;
      event.preventDefault();
      track.scrollLeft = next;
    }, { passive: false });
  };

  const initDetailPage = () => {
    const image = root.querySelector('[data-parallax="image"]');
    if (!image || reducedMotion) return;
    image.classList.add('is-ready');
  };

  initLenis();
  initSmoothAnchors();
  initReveals();

  if (page === 'schepers-home') {
    initMobileMenu();
    initActiveNavigation();
    initParallax();
    initHorizontalGallery();
  }

  if ([
    'schepers-training',
    'schepers-stallungen',
    'schepers-privatunterricht'
  ].includes(page)) {
    initDetailPage();
    initParallax();
  }

  on(window, 'pagehide', () => {
    cleanups.splice(0).forEach(cleanup => cleanup());
  }, { once: true });
})();
