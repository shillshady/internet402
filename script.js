(() => {
  // ===== SHOOTING STAR PARTICLE SYSTEM =====
  const canvas = document.getElementById('particleCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let width, height;
    const stars = [];
    const STAR_COUNT = 70;
    const SHOOTING_STAR_CHANCE = 0.012;
    const shootingStars = [];

    const COLORS = [
      { r: 148, g: 190, b: 230 },  // sky
      { r: 120, g: 220, b: 180 },  // emerald
      { r: 180, g: 175, b: 210 },  // zinc-ish
    ];

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
          alpha: Math.random() * 0.35 + 0.05,
          twinkleSpeed: Math.random() * 0.015 + 0.003,
          twinkleOffset: Math.random() * Math.PI * 2,
        });
      }
    }

    function spawnShootingStar() {
      const angle = Math.PI / 7 + Math.random() * Math.PI / 5;
      const speed = 6 + Math.random() * 14;
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      shootingStars.push({
        x: Math.random() * width * 1.3 - width * 0.15,
        y: -10 - Math.random() * 150,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.006 + Math.random() * 0.01,
        length: 50 + Math.random() * 100,
        width: 0.8 + Math.random() * 1.8,
        color,
      });
    }

    let time = 0;

    function draw() {
      ctx.clearRect(0, 0, width, height);
      time += 0.016;

      // Twinkling static stars
      for (const s of stars) {
        const flicker = Math.sin(time * s.twinkleSpeed * 60 + s.twinkleOffset) * 0.5 + 0.5;
        const alpha = s.alpha * (0.3 + flicker * 0.7);
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

        const mag = Math.sqrt(ss.vx * ss.vx + ss.vy * ss.vy);
        const nx = ss.vx / mag;
        const ny = ss.vy / mag;
        const tailLen = ss.length * ss.life;
        const tailX = ss.x - nx * tailLen;
        const tailY = ss.y - ny * tailLen;

        const { r, g, b } = ss.color;
        const a = ss.life * 0.7;

        const grad = ctx.createLinearGradient(ss.x, ss.y, tailX, tailY);
        grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${a})`);
        grad.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, ${a * 0.4})`);
        grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

        ctx.beginPath();
        ctx.moveTo(ss.x, ss.y);
        ctx.lineTo(tailX, tailY);
        ctx.strokeStyle = grad;
        ctx.lineWidth = ss.width * ss.life;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Head glow
        const glowRadius = ss.width * ss.life * 2;
        const headGrad = ctx.createRadialGradient(ss.x, ss.y, 0, ss.x, ss.y, glowRadius);
        headGrad.addColorStop(0, `rgba(${Math.min(r + 60, 255)}, ${Math.min(g + 60, 255)}, ${Math.min(b + 60, 255)}, ${ss.life * 0.5})`);
        headGrad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        ctx.beginPath();
        ctx.arc(ss.x, ss.y, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = headGrad;
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

  // ===== CURSOR GLOW =====
  const cursorGlow = document.createElement('div');
  cursorGlow.className = 'cursor-glow';
  document.body.appendChild(cursorGlow);
  let glowX = -200, glowY = -200;
  let targetX = -200, targetY = -200;

  window.addEventListener('mousemove', (e) => {
    targetX = e.clientX;
    targetY = e.clientY;
  });

  function updateGlow() {
    glowX += (targetX - glowX) * 0.12;
    glowY += (targetY - glowY) * 0.12;
    cursorGlow.style.transform = `translate(${glowX - 200}px, ${glowY - 200}px)`;
    requestAnimationFrame(updateGlow);
  }
  updateGlow();

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
        const scrolled = window.scrollY > 50;
        nav.style.background = scrolled
          ? 'oklch(0.12 0.005 285.823 / 0.92)'
          : 'oklch(0.12 0.005 285.823 / 0.6)';
        nav.style.borderColor = scrolled
          ? 'oklch(0.274 0.006 286.033 / 0.5)'
          : 'oklch(0.274 0.006 286.033 / 0.2)';
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
