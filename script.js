// ── LOADER ──
window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('loader').classList.add('hide');
  }, 600);
});

// ── NAV GLASS / SOLID TOGGLE ──
const nav = document.querySelector('nav');
function updateNav() {
  const heroH = document.getElementById('home').offsetHeight;
  if (window.scrollY < heroH - 80) {
    nav.classList.add('glass');
    nav.classList.remove('solid');
  } else {
    nav.classList.add('solid');
    nav.classList.remove('glass');
  }
}
updateNav();
window.addEventListener('scroll', updateNav);

// ── HAMBURGER NAV ──
const hamburger = document.getElementById('hamburger');
const navLinks = document.querySelector('.nav-links');
hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));

// ── INFINITE CAROUSEL ──
(function () {
  const viewport = document.querySelector('.carousel-viewport');
  const track = document.getElementById('carouselTrack');
  const originalSlides = Array.from(track.querySelectorAll('.slide'));
  const count = originalSlides.length;

  for (let i = 0; i < 3; i++) {
    originalSlides.forEach(slide => {
      track.appendChild(slide.cloneNode(true));
    });
  }

  function getSlidePercent() {
    const w = window.innerWidth;
    if (w <= 768) return 0.72;
    if (w <= 900) return 0.50;
    return 1 / 3;
  }

  let slideW, totalOrigW;

  function setSizes() {
    slideW = viewport.offsetWidth * getSlidePercent();
    totalOrigW = slideW * count;
  }
  setSizes();

  window.addEventListener('resize', () => {
    setSizes();
    pos = Math.round(pos / slideW) * slideW;
    if (pos >= totalOrigW) pos -= totalOrigW;
    if (pos < 0) pos += totalOrigW;
  });

  const AUTO_SPEED = 1.1;        // ← slowed down from 1.8
  const SWIPE_DECEL = 0.92;
  const MIN_VELOCITY = 0.1;

  let pos = 0;
  let velocity = 0;
  let isAutoScrolling = true;
  let isDragging = false;
  let dragLastX = 0;
  let dragLastTime = 0;
  let dragVelocity = 0;
  let rafId;

  function applyTransform() {
    track.style.transform = `translateX(${-pos}px)`;
  }

  function loop() {
    if (!isDragging) {
      if (isAutoScrolling) {
        pos += AUTO_SPEED;
      } else {
        pos += velocity;
        velocity *= SWIPE_DECEL;
        if (Math.abs(velocity) < MIN_VELOCITY) {
          velocity = AUTO_SPEED;
          isAutoScrolling = true;
        }
      }
      if (pos >= totalOrigW) pos -= totalOrigW;
      if (pos < 0) pos += totalOrigW;
    }
    applyTransform();
    rafId = requestAnimationFrame(loop);
  }

  loop();

  viewport.addEventListener('mousedown', e => {
    isDragging = true;
    isAutoScrolling = false;
    velocity = 0;
    dragLastX = e.clientX;
    dragLastTime = performance.now();
    dragVelocity = 0;
    viewport.classList.add('dragging');
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(loop);
  });

  window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    const now = performance.now();
    const dx = dragLastX - e.clientX;
    const dt = now - dragLastTime || 1;
    dragVelocity = dx / dt * 16;
    pos += dx;
    if (pos >= totalOrigW) pos -= totalOrigW;
    if (pos < 0) pos += totalOrigW;
    dragLastX = e.clientX;
    dragLastTime = now;
  });

  window.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    viewport.classList.remove('dragging');
    velocity = dragVelocity;
    isAutoScrolling = false;
  });

  viewport.addEventListener('touchstart', e => {
    isDragging = true;
    isAutoScrolling = false;
    velocity = 0;
    dragLastX = e.touches[0].clientX;
    dragLastTime = performance.now();
    dragVelocity = 0;
  }, { passive: true });

  viewport.addEventListener('touchmove', e => {
    if (!isDragging) return;
    const now = performance.now();
    const dx = dragLastX - e.touches[0].clientX;
    const dt = now - dragLastTime || 1;
    dragVelocity = dx / dt * 16;
    pos += dx;
    if (pos >= totalOrigW) pos -= totalOrigW;
    if (pos < 0) pos += totalOrigW;
    dragLastX = e.touches[0].clientX;
    dragLastTime = now;
  }, { passive: true });

  viewport.addEventListener('touchend', () => {
    isDragging = false;
    velocity = dragVelocity;
    isAutoScrolling = false;
  }, { passive: true });

})();

// ── NAV ACTIVE HIGHLIGHT ON SCROLL ──
const sections = document.querySelectorAll('section[id]');
const navAs = document.querySelectorAll('.nav-links a');
window.addEventListener('scroll', () => {
  let scrollY = window.scrollY + 80;
  sections.forEach(sec => {
    if (scrollY >= sec.offsetTop && scrollY < sec.offsetTop + sec.offsetHeight) {
      navAs.forEach(a => {
        a.style.color = a.getAttribute('href') === '#' + sec.id ? 'var(--red)' : '';
      });
    }
  });
});

// ── HERO DOT GRID ──
// Desktop: proximity brightness on mouse move
// Mobile:  diagonal brightness wave (top-left → bottom-right)
window.addEventListener('load', function () { (function () {
  const canvas = document.getElementById('dotCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const SPACING   = 58;
  const R_BASE    = 16;
  const RADIUS    = 160;   // desktop mouse radius
  const BASE_ALPHA  = 0.07;
  const HOVER_ALPHA = 0.30;

  // Wave settings (mobile only)
  const WAVE_SPEED  = 1.4;   // lower = slower wave travel
  const WAVE_WIDTH  = 220;   // how wide the bright band is (px along diagonal)
  const WAVE_ALPHA  = 0.55;  // peak brightness of the wave

  let W, H, cols, rows;
  let mouse = { x: -9999, y: -9999 };
  let waveOffset = 0;        // how far the wave front has travelled along the diagonal
  let isMobile = window.innerWidth <= 768;

  function resize() {
    const hero = document.getElementById('home');
    W = canvas.width  = hero.offsetWidth;
    H = canvas.height = hero.offsetHeight;
    cols = Math.ceil(W / SPACING) + 1;
    rows = Math.ceil(H / SPACING) + 1;
    isMobile = window.innerWidth <= 768;
  }
  resize();
  window.addEventListener('resize', resize);

  const hero = document.getElementById('home');

  // Desktop mouse tracking
  hero.addEventListener('mousemove', e => {
    if (isMobile) return;
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });
  hero.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // The diagonal length (top-left to bottom-right)
    const diagLen = W + H;

    // Advance wave — loop seamlessly
    if (isMobile) {
      waveOffset += WAVE_SPEED;
      if (waveOffset > diagLen + WAVE_WIDTH) waveOffset = -WAVE_WIDTH;
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * SPACING;
        const y = r * SPACING;

        let alpha = BASE_ALPHA;

        if (isMobile) {
          // Project dot onto the diagonal axis (x + y gives distance along top-left→bottom-right)
          const diagPos = x + y;
          // Distance from wave front centre
          const dist = Math.abs(diagPos - waveOffset);
          // Smooth bell-curve falloff within WAVE_WIDTH
          if (dist < WAVE_WIDTH) {
            const t = 1 - dist / WAVE_WIDTH;
            alpha = BASE_ALPHA + (WAVE_ALPHA - BASE_ALPHA) * t * t;
          }
        } else {
          // Desktop: mouse proximity
          const dx = mouse.x - x;
          const dy = mouse.y - y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const proximity = dist < RADIUS ? 1 - dist / RADIUS : 0;
          alpha = BASE_ALPHA + (HOVER_ALPHA - BASE_ALPHA) * proximity * proximity;
        }

        ctx.beginPath();
        ctx.arc(x, y, R_BASE, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
        ctx.fill();
      }
    }

    requestAnimationFrame(draw);
  }

  draw();
  })();
});
