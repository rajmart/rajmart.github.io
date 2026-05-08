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
  const isGlass = nav.classList.contains('glass');
  let scrollY = window.scrollY + 80;
  sections.forEach(sec => {
    if (scrollY >= sec.offsetTop && scrollY < sec.offsetTop + sec.offsetHeight) {
      navAs.forEach(a => {
        const isActive = a.getAttribute('href') === '#' + sec.id;
        if (isActive) {
          if (isGlass) {
            a.style.color = '#fff';
            a.style.textShadow = '0 0 10px rgba(255,255,255,0.9), 0 0 22px rgba(255,255,255,0.4)';
          } else {
            a.style.color = 'var(--red)';
            a.style.textShadow = '';
          }
        } else {
          a.style.color = '';
          a.style.textShadow = '';
        }
      });
    }
  });
});

// ── HERO DOT GRID ──
// Desktop: wave (always) + proximity boost on mouse move
// Mobile:  wave only
window.addEventListener('load', function () { (function () {
  const canvas = document.getElementById('dotCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const SPACING     = 58;
  const R_BASE      = 16;
  const RADIUS      = 180;   // desktop mouse proximity radius
  const BASE_ALPHA  = 0.07;
  const HOVER_ALPHA = 0.38;  // extra brightness from mouse proximity

  // Wave settings (both desktop + mobile)
  const WAVE_SPEED  = 1.4;   // px per frame along diagonal
  const WAVE_WIDTH  = 200;   // half-width of the bright band (px along diagonal)
  const WAVE_ALPHA  = 0.50;  // peak brightness of wave

  let W, H, cols, rows;
  let mouse = { x: -9999, y: -9999 };
  // Two waves staggered by diagLen so there's never a dead gap
  let wave1 = 0;
  let wave2 = 0; // will be set after first resize
  let isMobile = window.innerWidth <= 768;

  function diagLen() { return W + H; }

  function resize() {
    const hero = document.getElementById('home');
    W = canvas.width  = hero.offsetWidth;
    H = canvas.height = hero.offsetHeight;
    cols = Math.ceil(W / SPACING) + 1;
    rows = Math.ceil(H / SPACING) + 1;
    isMobile = window.innerWidth <= 768;
    // Keep waves valid after resize
    const dl = diagLen();
    if (wave2 <= wave1) wave2 = wave1 + dl;
  }
  resize();
  // Start wave1 already a little past the edge so it's visible immediately
  wave1 = WAVE_WIDTH * 0.5;
  wave2 = wave1 + diagLen();

  window.addEventListener('resize', resize);

  const hero = document.getElementById('home');

  // Track mouse on desktop
  hero.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });
  hero.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });

  function waveContrib(diagPos, waveOffset) {
    const dist = Math.abs(diagPos - waveOffset);
    if (dist >= WAVE_WIDTH) return 0;
    const t = 1 - dist / WAVE_WIDTH;
    return (WAVE_ALPHA - BASE_ALPHA) * t * t;
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    const dl = diagLen();

    // Advance both waves
    wave1 += WAVE_SPEED;
    wave2 += WAVE_SPEED;

    // Loop: as soon as wave1 exits, reset it one diagLen behind wave2
    if (wave1 > dl + WAVE_WIDTH) wave1 = wave2 - dl;
    if (wave2 > dl + WAVE_WIDTH) wave2 = wave1 - dl;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * SPACING;
        const y = r * SPACING;

        // Diagonal projection of this dot
        const diagPos = x + y;

        // Wave contribution (both waves, take max)
        const wc = Math.max(waveContrib(diagPos, wave1), waveContrib(diagPos, wave2));

        let alpha = BASE_ALPHA + wc;

        // On desktop: also add mouse proximity boost
        if (!isMobile) {
          const dx = mouse.x - x;
          const dy = mouse.y - y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < RADIUS) {
            const proximity = 1 - dist / RADIUS;
            alpha = Math.min(alpha + (HOVER_ALPHA - BASE_ALPHA) * proximity * proximity, 0.75);
          }
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