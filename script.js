(() => {
  // ===== SHOOTING STAR PARTICLE SYSTEM =====
  const canvas = document.getElementById('particleCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let width, height;
    const stars = [];
    const STAR_COUNT = 60;
    const SHOOTING_STAR_CHANCE = 0.015;
    const shootingStars = [];

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }

    function createStars() {
      stars.length = 0;
      for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 1.2 + 0.3,
          alpha: Math.random() * 0.4 + 0.1,
          twinkleSpeed: Math.random() * 0.02 + 0.005,
          twinkleOffset: Math.random() * Math.PI * 2,
        });
      }
    }

    function spawnShootingStar() {
      const angle = Math.PI / 6 + Math.random() * Math.PI / 6;
      const speed = 8 + Math.random() * 12;
      shootingStars.push({
        x: Math.random() * width * 1.2 - width * 0.1,
        y: -10 - Math.random() * 100,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.008 + Math.random() * 0.012,
        length: 40 + Math.random() * 80,
        width: 1 + Math.random() * 1.5,
        hue: Math.random() > 0.7 ? 232 : (Math.random() > 0.5 ? 163 : 286),
      });
    }

    let time = 0;

    function draw() {
      ctx.clearRect(0, 0, width, height);
      time += 0.016;

      // Static twinkling stars
      for (const s of stars) {
        const flicker = Math.sin(time * s.twinkleSpeed * 60 + s.twinkleOffset) * 0.5 + 0.5;
        const alpha = s.alpha * (0.4 + flicker * 0.6);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 210, 230, ${alpha})`;
        ctx.fill();
      }

      // Spawn shooting stars
      if (Math.random() < SHOOTING_STAR_CHANCE) {
        spawnShootingStar();
      }

      // Draw shooting stars
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        ss.x += ss.vx;
        ss.y += ss.vy;
        ss.life -= ss.decay;

        if (ss.life <= 0 || ss.x > width + 100 || ss.y > height + 100) {
          shootingStars.splice(i, 1);
          continue;
        }

        const tailX = ss.x - (ss.vx / Math.sqrt(ss.vx * ss.vx + ss.vy * ss.vy)) * ss.length * ss.life;
        const tailY = ss.y - (ss.vy / Math.sqrt(ss.vx * ss.vx + ss.vy * ss.vy)) * ss.length * ss.life;

        const grad = ctx.createLinearGradient(ss.x, ss.y, tailX, tailY);
        const baseAlpha = ss.life * 0.7;
        grad.addColorStop(0, `oklch(0.85 0.12 ${ss.hue} / ${baseAlpha})`);
        grad.addColorStop(0.3, `oklch(0.7 0.08 ${ss.hue} / ${baseAlpha * 0.5})`);
        grad.addColorStop(1, `oklch(0.5 0.04 ${ss.hue} / 0)`);

        ctx.beginPath();
        ctx.moveTo(ss.x, ss.y);
        ctx.lineTo(tailX, tailY);
        ctx.strokeStyle = grad;
        ctx.lineWidth = ss.width * ss.life;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Bright head glow
        ctx.beginPath();
        ctx.arc(ss.x, ss.y, ss.width * ss.life * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `oklch(0.95 0.05 ${ss.hue} / ${ss.life * 0.6})`;
        ctx.fill();
      }

      requestAnimationFrame(draw);
    }

    resize();
    createStars();
    draw();

    window.addEventListener('resize', () => {
      resize();
      createStars();
    });
  }

  // ===== SCROLL ANIMATIONS =====
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = parseInt(entry.target.dataset.delay || '0', 10);
        setTimeout(() => entry.target.classList.add('visible'), delay);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el));

  // ===== MOBILE MENU =====
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

  // ===== NAV BACKGROUND ON SCROLL =====
  const nav = document.getElementById('nav');
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        nav.style.background = window.scrollY > 50
          ? 'oklch(0.12 0.005 285.823 / 0.95)'
          : 'oklch(0.12 0.005 285.823 / 0.75)';
        ticking = false;
      });
      ticking = true;
    }
  });

  // ===== COUNTER ANIMATION =====
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
