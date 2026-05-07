// ── LOADER ──
window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('loader').classList.add('hide');
  }, 600);
});

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

  // Clone slides 3× so we always have enough to fill the viewport seamlessly
  for (let i = 0; i < 3; i++) {
    originalSlides.forEach(slide => {
      track.appendChild(slide.cloneNode(true));
    });
  }

  // Slide width = fraction of viewport (matches CSS: 33.333% desktop, 50% tablet, 72% mobile)
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

  // ── Auto-scroll state ──
  const AUTO_SPEED = 1.8;        // ← increased from 0.7 — faster scroll
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

      // Seamless wrap using 1 set width (clones handle the visual gap)
      if (pos >= totalOrigW) pos -= totalOrigW;
      if (pos < 0) pos += totalOrigW;
    }

    applyTransform();
    rafId = requestAnimationFrame(loop);
  }

  loop();

  // ── Mouse drag ──
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

  // ── Touch drag ──
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
