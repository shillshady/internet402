(() => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = parseInt(entry.target.dataset.delay || '0', 10);
        setTimeout(() => entry.target.classList.add('visible'), delay);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el));

  // Mobile menu
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.getElementById('mobileMenu');

  toggle?.addEventListener('click', () => {
    menu.classList.toggle('open');
    const spans = toggle.querySelectorAll('span');
    if (menu.classList.contains('open')) {
      spans[0].style.transform = 'rotate(45deg) translate(2px, 2px)';
      spans[1].style.transform = 'rotate(-45deg) translate(2px, -2px)';
    } else {
      spans[0].style.transform = '';
      spans[1].style.transform = '';
    }
  });

  menu?.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.remove('open');
      const spans = toggle.querySelectorAll('span');
      spans[0].style.transform = '';
      spans[1].style.transform = '';
    });
  });

  // Nav background on scroll
  const nav = document.getElementById('nav');
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        nav.style.background = window.scrollY > 50
          ? 'rgba(10, 14, 20, 0.95)'
          : 'rgba(10, 14, 20, 0.8)';
        ticking = false;
      });
      ticking = true;
    }
  });

  // Counter animation for stat values
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.count, 10);
        if (!target) return;
        counterObserver.unobserve(el);

        let current = 0;
        const step = Math.ceil(target / 40);
        const interval = setInterval(() => {
          current += step;
          if (current >= target) {
            current = target;
            clearInterval(interval);
          }
          el.textContent = current;
        }, 25);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('[data-count]').forEach(el => counterObserver.observe(el));
})();
