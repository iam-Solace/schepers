document.addEventListener('DOMContentLoaded', function () {
  const nav = document.querySelector('.main-menu');
  const content = document.querySelector('.content');
  const logoDefault = document.querySelector('.nav_logo');
  const logoScroll = document.querySelector('.nav_logo-scroll');
  const navBg = document.querySelector('.nav-bg');

  if (!nav || !content) return;

  navBg.style.cssText = 'transform:translateY(-100%);transition:transform 0.5s cubic-bezier(0.4,0,0.2,1)';
  logoScroll.style.cssText = 'transition:opacity 0.3s ease;opacity:0;display:none';
  logoDefault.style.transition = 'opacity 0.3s ease';

  let active = false;

  function swapLogo(logoIn, logoOut) {
    logoOut.style.opacity = '0';
    setTimeout(() => {
      logoOut.style.display = 'none';
      logoIn.style.display = 'block';
      setTimeout(() => logoIn.style.opacity = '1', 20);
    }, 300);
  }

  window.addEventListener('scroll', function () {
    const rect = content.getBoundingClientRect();
    const fill = Math.max(Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0), 0) / window.innerHeight;
    const shouldBeActive = fill >= 0.5;

    if (shouldBeActive === active) return;
    active = shouldBeActive;

    nav.classList.toggle('main-menu-small', active);
    navBg.style.transform = active ? 'translateY(0%)' : 'translateY(-100%)';
    active ? swapLogo(logoScroll, logoDefault) : swapLogo(logoDefault, logoScroll);
  }, { passive: true });
});
