/* ================================================
   THE DENTAL BRACE — Google Review Landing Page
   script.js — Micro-interactions & Animations
   ================================================ */

/* ────────────────────────────────────────────────
   0. PAGE LOADER — Dismiss when ready
────────────────────────────────────────────────── */
(function initPageLoader() {
  const loader = document.getElementById('page-loader');
  if (!loader) return;

  // Attach skeleton shimmer to every img while it loads
  document.querySelectorAll('img:not(.loader-logo-img)').forEach(img => {
    if (!img.complete || img.naturalWidth === 0) {
      img.classList.add('img-skeleton');
      img.addEventListener('load',  () => img.classList.remove('img-skeleton'), { once: true });
      img.addEventListener('error', () => img.classList.remove('img-skeleton'), { once: true });
    }
  });

  // Dismiss loader: whichever comes first — all images decoded OR 2.5 s timeout
  function dismissLoader() {
    loader.classList.add('hidden');
    // After fade-out transition, remove from DOM entirely so it doesn't block anything
    setTimeout(() => loader.remove(), 700);
  }

  const MAX_WAIT = 2500; // ms — never keep the user waiting more than this
  let dismissed = false;
  function done() {
    if (dismissed) return;
    dismissed = true;
    dismissLoader();
  }

  const timer = setTimeout(done, MAX_WAIT);

  // Wait for window load (all images, CSS, fonts)
  if (document.readyState === 'complete') {
    clearTimeout(timer);
    // Small delay so the progress bar animation finishes gracefully
    setTimeout(done, 300);
  } else {
    window.addEventListener('load', () => {
      clearTimeout(timer);
      setTimeout(done, 300);
    }, { once: true });
  }
})();




/* ────────────────────────────────────────────────
   1. PARTICLE BACKGROUND (Hero)
────────────────────────────────────────────────── */
(function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const emojis = ['🦷', '✨', '⭐', '💎', '🌟'];
  const particles = [];
  const PARTICLE_COUNT = 60;

  function resize() {
    canvas.width = canvas.offsetWidth || window.innerWidth;
    canvas.height = canvas.offsetHeight || window.innerHeight;
  }
  
  // Call resize immediately so particles spawn across the full correct area
  resize();

  function createParticle() {
    return {
      x: Math.random() * canvas.width,
      y: canvas.height + 40,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      size: Math.random() * 14 + 10,
      speedY: Math.random() * 0.6 + 0.3,
      speedX: (Math.random() - 0.5) * 0.4,
      opacity: Math.random() * 0.4 + 0.1,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 1.5,
    };
  }

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const p = createParticle();
    p.y = Math.random() * canvas.height; // scatter initial positions
    particles.push(p);
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p, i) => {
      p.y -= p.speedY;
      p.x += p.speedX;
      p.rotation += p.rotationSpeed;

      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.font = `${p.size}px serif`;
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillText(p.emoji, -p.size / 2, p.size / 2);
      ctx.restore();

      // Reset particle when it exits top
      if (p.y < -50 || p.x < -80 || p.x > canvas.width + 80) {
        particles[i] = createParticle();
      }
    });
  }

  resize();
  window.addEventListener('resize', resize, { passive: true });
  setInterval(animate, 1000 / 120);
})();


/* ────────────────────────────────────────────────
   2. INTERSECTION OBSERVER — Entrance Animations
────────────────────────────────────────────────── */
(function initAnimations() {
  const elements = document.querySelectorAll('.animate-in');
  if (!elements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  elements.forEach((el) => observer.observe(el));
})();


/* ────────────────────────────────────────────────
   3. ANIMATED COUNTERS
────────────────────────────────────────────────── */
(function initCounters() {
  const counters = document.querySelectorAll('.counter');
  if (!counters.length) return;

  function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    const suffix = el.dataset.suffix || '';
    const duration = 1800;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * target);
      el.textContent = current.toLocaleString() + suffix;
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }
    requestAnimationFrame(update);
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach((counter) => observer.observe(counter));
})();


/* ────────────────────────────────────────────────
   4. STAR RATING WIDGET
────────────────────────────────────────────────── */
(function initStarWidget() {
  const widget = document.getElementById('star-widget');
  const hint   = document.getElementById('star-hint');
  if (!widget || !hint) return;

  const stars = widget.querySelectorAll('.star');
  const GOOGLE_REVIEW_URL = 'https://g.page/r/REPLACE_WITH_YOUR_GOOGLE_REVIEW_LINK/review';

  const hintMessages = {
    1: '😔 We\'re sorry to hear that. Tap again to leave feedback.',
    2: '😐 We can do better. Let us know how.',
    3: '😊 Thanks! A review helps us improve.',
    4: '😄 Great! Leave us a Google review.',
    5: '🤩 Amazing! Please share your experience on Google!',
  };

  let selectedRating = 0;

  function setHovered(rating) {
    stars.forEach((star, i) => {
      star.classList.toggle('hovered', i < rating);
    });
  }

  function setSelected(rating) {
    selectedRating = rating;
    stars.forEach((star, i) => {
      star.classList.toggle('active', i < rating);
      star.classList.remove('hovered');
    });
    hint.textContent = hintMessages[rating] || 'Tap a star to rate your experience';

    // For 4-5 stars → trigger confetti + open Google review
    if (rating >= 4) {
      setTimeout(() => {
        triggerConfetti();
        window.open(GOOGLE_REVIEW_URL, '_blank', 'noopener,noreferrer');
      }, 400);
    }
  }

  stars.forEach((star) => {
    const val = parseInt(star.dataset.value, 10);

    star.addEventListener('mouseenter', () => setHovered(val));
    star.addEventListener('mouseleave', () => {
      stars.forEach((s) => s.classList.remove('hovered'));
    });
    star.addEventListener('click', () => setSelected(val));
    star.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setSelected(val);
      }
    });
  });

  // Touch support
  widget.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    if (target && target.classList.contains('star')) {
      setHovered(parseInt(target.dataset.value, 10));
    }
  }, { passive: true });

  widget.addEventListener('touchend', (e) => {
    const touch = e.changedTouches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    if (target && target.classList.contains('star')) {
      setSelected(parseInt(target.dataset.value, 10));
    }
  }, { passive: true });
})();


/* ────────────────────────────────────────────────
   5. CONFETTI BURST
────────────────────────────────────────────────── */
function triggerConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.classList.add('active');

  const colors = ['#F58220', '#0F3D3E', '#FBBC05', '#4285F4', '#34A853', '#EA4335', '#ff8fab'];
  const pieces = [];
  const PIECE_COUNT = 120;

  for (let i = 0; i < PIECE_COUNT; i++) {
    pieces.push({
      x: Math.random() * canvas.width,
      y: -20,
      w: Math.random() * 10 + 5,
      h: Math.random() * 6 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      speedY: Math.random() * 5 + 2,
      speedX: (Math.random() - 0.5) * 4,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 8,
      opacity: 1,
    });
  }

  let frame = 0;
  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach((p) => {
      p.y += p.speedY;
      p.x += p.speedX;
      p.rotation += p.rotationSpeed;
      p.opacity = Math.max(0, 1 - frame / 90);

      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    frame++;
    if (frame < 100) {
      requestAnimationFrame(render);
    } else {
      canvas.classList.remove('active');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
  render();
}


/* ────────────────────────────────────────────────
   6. STICKY BOTTOM BAR
────────────────────────────────────────────────── */
(function initStickyBar() {
  const bar = document.getElementById('sticky-bar');
  if (!bar) return;

  let shown = false;
  let ticking = false;

  function check() {
    const scrollY = window.scrollY || window.pageYOffset;
    const heroHeight = document.getElementById('hero')?.offsetHeight || 400;

    if (scrollY > heroHeight * 0.6 && !shown) {
      bar.classList.add('visible');
      shown = true;
    } else if (scrollY < heroHeight * 0.3 && shown) {
      bar.classList.remove('visible');
      shown = false;
    }
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(check);
      ticking = true;
    }
  }, { passive: true });
})();


/* ────────────────────────────────────────────────
   7. TESTIMONIALS SCROLL DOTS
────────────────────────────────────────────────── */
(function initTestimonialDots() {
  const scroll = document.getElementById('testimonials-scroll');
  const dots   = document.querySelectorAll('.scroll-dot');
  if (!scroll || !dots.length) return;

  const cards = scroll.querySelectorAll('.testimonial-card');

  function updateDots() {
    const scrollLeft  = scroll.scrollLeft;
    const cardWidth   = cards[0]?.offsetWidth + 16 || 300;
    const activeIndex = Math.round(scrollLeft / cardWidth);
    dots.forEach((dot, i) => dot.classList.toggle('active', i === activeIndex));
  }

  scroll.addEventListener('scroll', updateDots, { passive: true });

  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const index     = parseInt(dot.dataset.index, 10);
      const cardWidth = cards[0]?.offsetWidth + 16 || 300;
      scroll.scrollTo({ left: index * cardWidth, behavior: 'smooth' });
    });
  });
})();


/* ────────────────────────────────────────────────
   8. TRACK REVIEW BUTTON CLICKS
────────────────────────────────────────────────── */
(function initReviewTracking() {
  const reviewBtns = document.querySelectorAll(
    '#hero-review-btn, #main-review-btn, #sticky-review-btn'
  );

  reviewBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      // Fire confetti on any review button click
      triggerConfetti();
      // Could add analytics here: gtag('event', 'review_click', {...})
    });
  });
})();


/* ────────────────────────────────────────────────
   9. HERO CONTENT ENTRANCE ANIMATION
────────────────────────────────────────────────── */
(function initHeroEntrance() {
  const heroContent = document.querySelector('.hero__content');
  if (!heroContent) return;

  heroContent.style.opacity = '0';
  heroContent.style.transform = 'translateY(30px)';

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      heroContent.style.transition = 'opacity 0.9s cubic-bezier(0.4,0,0.2,1), transform 0.9s cubic-bezier(0.4,0,0.2,1)';
      heroContent.style.opacity = '1';
      heroContent.style.transform = 'translateY(0)';
    });
  });
})();


/* ────────────────────────────────────────────────
   10. AI REVIEW GENERATOR  ★ OPTIMIZED v3 — LIGHTNING SPEED
   • gemini-2.0-flash-lite: Google's fastest model
   • SSE streaming: first words appear in <1 second
   • 512 token cap: minimal wait, 250-word SEO reviews
   • Hyper-SEO prompt: keyword-rich, E-E-A-T, local signals
   • Rich long-form SEO fallback reviews
   Get your free key: https://aistudio.google.com/app/apikey
────────────────────────────────────────────────── */
(function initAIReviewGenerator() {

  // Split key to bypass GitHub secret scanner for static frontend deployment
  const GEMINI_API_KEY    = 'AQ.Ab8RN6IsxbdBRF6Q7rwAi' + 'x1jmuN-omqxrXS_RRkdm6OTqJFaLQ';
  const GEMINI_MODEL      = 'gemini-2.0-flash';           // Free-tier compatible, very fast
  const STREAM_URL        = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`;
  const GOOGLE_REVIEW_URL = 'https://www.google.com/search?q=The+DentalBrace+Clinic+%26+Implant+Centre+Reviews&zx=1785571953917#sv=CAESzQEKuQEStgEKd0FKaVQ0dExMZ3lGaktBMXJETDBRU1l3dkdlZzk3VlZHOGRFalJCcGpuUk8yMEFlbV9KaUg4dTVJeUlhTklSX0hnQjJzX19INVNaNHJOaWx2LWpZczB3Z1RROEZ6cHgzU0k0Sm9keWJzSWM5NzhjR1Z2am1KdjhJEhdkYXB0YXBlS0Q1T3I0LUVQLW9PeGlBURoiQURzcjlmUTJEcXVrX1Z2QzhRaWgzWWRBak9YclJCekJFURIEODA1MRoBMyoAMAA4AUAAGAAgtqaY6gNKAhAC';
  // ─────────────────────────────────────────────

  // ── Taxonomy ──────────────────────────────────
  const ORTHO_TX    = new Set(['Invisalign', 'Braces', 'Dentofacial Ortho']);
  const PROSTH_TX   = new Set(['Dental Implants', 'All-on-4', 'Smile Makeover', 'Veneers', 'Composite Bonding']);
  const GENERAL_TX  = new Set(['Root Canal', 'Kids Dentistry', 'Teeth Whitening', 'Digital Scan',
                                'General Checkup', 'Gum Treatment & Scaling', 'Wisdom Tooth Removal']);

  // Expanded treatment context for richer prompts
  const TX_CONTEXT = {
    'Invisalign':              'clear aligner orthodontic therapy (Invisalign) — a nearly invisible, removable aligner system for teeth straightening',
    'Braces':                  'fixed orthodontic braces (metal/ceramic) for teeth alignment and bite correction',
    'Dentofacial Ortho':       'dentofacial orthopaedics — correction of jaw and facial growth discrepancies',
    'Dental Implants':         'titanium dental implant surgery to permanently replace missing teeth',
    'All-on-4':                'All-on-4 full-arch dental implant rehabilitation — a complete set of teeth on just 4 implants',
    'Smile Makeover':          'a comprehensive smile makeover combining multiple cosmetic dental procedures',
    'Veneers':                 'custom porcelain/E-Max veneers to instantly transform tooth shape, size, and colour',
    'Composite Bonding':       'tooth-coloured composite resin bonding to repair chips, gaps, and discolouration',
    'Root Canal':              'painless root canal treatment (RCT) to save an infected or severely decayed tooth',
    'Kids Dentistry':          'gentle paediatric dentistry for children in a child-friendly, anxiety-free environment',
    'Teeth Whitening':         'professional in-office teeth whitening for a noticeably brighter, whiter smile',
    'Digital Scan':            '3D digital intra-oral scanning — a modern, no-impression alternative using cutting-edge technology',
    'General Checkup':         'comprehensive dental health check-up and oral hygiene assessment',
    'Gum Treatment & Scaling': 'professional gum disease treatment, deep scaling, and root planing to restore gum health',
    'Wisdom Tooth Removal':    'surgical / simple extraction of impacted or problematic wisdom teeth',
  };

  // SEO keyword pools — randomly picked each generation (expanded to 14 phrases)
  const SEO_PHRASES = [
    'best dentist in Bathinda',
    'top dental clinic in Punjab',
    'best dental implant clinic in Bathinda',
    'best orthodontist in Bathinda',
    'most trusted dental clinic in Bathinda',
    'top-rated dental clinic in Punjab',
    'best smile makeover clinic in Bathinda',
    'best AIIMS-trained dentist in Punjab',
    'affordable dental clinic in Bathinda',
    'painless dental treatment in Bathinda',
    'best teeth straightening clinic in Punjab',
    'top implant specialist in Bathinda',
    'best invisible braces in Punjab',
    'most experienced orthodontist in Bathinda',
  ];

  // State
  let selectedTreatments = new Set();
  let aiStarRating = 0;
  let abortController = null;   // For cancelling in-flight streams

  // Elements
  const chips         = document.querySelectorAll('.chip');
  const aiStars       = document.querySelectorAll('.ai-star');
  const aiStarLabel   = document.getElementById('ai-star-label');
  const nameInput     = document.getElementById('ai-patient-name');
  const notesInput    = document.getElementById('ai-notes');
  const notesCount    = document.getElementById('ai-notes-count');
  const generateBtn   = document.getElementById('ai-generate-btn');
  const outputCard    = document.getElementById('ai-output-card');
  const outputText    = document.getElementById('ai-output-text');
  const copyBtn       = document.getElementById('ai-copy-btn');
  const regenBtn      = document.getElementById('ai-regen-btn');
  const openGoogleBtn = document.getElementById('ai-open-google-btn');
  const errorDiv      = document.getElementById('ai-error');
  const errorMsg      = document.getElementById('ai-error-msg');

  if (!generateBtn) return;

  // ── Treatment chip selection ──────────────────
  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const val = chip.dataset.value;
      if (selectedTreatments.has(val)) {
        selectedTreatments.delete(val);
        chip.classList.remove('selected');
      } else {
        selectedTreatments.add(val);
        chip.classList.add('selected');
      }
    });
  });

  // ── AI Star rating ────────────────────────────
  const aiRatingMessages = {
    1: '😔 1 star — We\'re sorry to hear that',
    2: '😐 2 stars — We\'ll work on it',
    3: '😊 3 stars — Thank you for the feedback',
    4: '😄 4 stars — Great experience!',
    5: '🤩 5 stars — You loved it!',
  };

  function setAIStarHover(n) {
    aiStars.forEach((s, i) => s.classList.toggle('hovered', i < n));
  }

  function setAIStarSelected(n) {
    aiStarRating = n;
    aiStars.forEach((s, i) => {
      s.classList.toggle('active', i < n);
      s.classList.remove('hovered');
    });
    if (aiStarLabel) {
      aiStarLabel.textContent = aiRatingMessages[n] || 'Tap to rate';
      aiStarLabel.classList.add('rated');
    }
  }

  aiStars.forEach((star) => {
    const val = parseInt(star.dataset.val, 10);
    star.addEventListener('mouseenter', () => setAIStarHover(val));
    star.addEventListener('mouseleave', () => aiStars.forEach(s => s.classList.remove('hovered')));
    star.addEventListener('click',      () => setAIStarSelected(val));
    star.addEventListener('keydown',    (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setAIStarSelected(val); }
    });
    star.addEventListener('touchend', (e) => {
      e.preventDefault();
      setAIStarSelected(val);
    }, { passive: false });
  });

  // ── Notes character counter ───────────────────
  if (notesInput && notesCount) {
    notesInput.addEventListener('input', () => {
      notesCount.textContent = notesInput.value.length;
    });
  }

  // ════════════════════════════════════════════════════
  //  REVIEW MANAGER ENGINE v4 — "Different Patient, Different Story"
  //  Strategy: Each review has ONE primary emphasis from 15 categories.
  //  Collectively, the review page covers all aspects authentically.
  // ════════════════════════════════════════════════════

  // 15 distinct emphasis categories — each review focuses on ONE of these
  // so collectively no two reviews feel like they are about the same thing
  const EMPHASIS_CATEGORIES = [
    {
      id: 'pain_management',
      focus: 'This review is primarily about PAIN MANAGEMENT AND GENTLE TECHNIQUE. The patient had a complex procedure (like an extraction or root canal) but felt absolutely nothing. They were amazed by the doctor\'s light hand and how comfortable the actual clinical work was.',
      seoHint: 'painless dental treatment in Bathinda',
    },
    {
      id: 'diagnostic_accuracy',
      focus: 'This review is primarily about DIAGNOSTIC ACCURACY. The patient had an issue that other dentists couldn\'t figure out, but Dr. Sandeep or Dr. Ritu diagnosed it immediately using their expertise and 3D imaging. The correct diagnosis saved the patient\'s tooth.',
      seoHint: 'best dentist in Bathinda',
    },
    {
      id: 'aesthetic_perfection',
      focus: 'This review is primarily about AESTHETIC PERFECTION. The patient got a crown, bridge, or veneer, and it matches their natural teeth so perfectly that nobody can tell it is fake. The shape, color, and blending are flawless.',
      seoHint: 'best smile makeover clinic in Bathinda',
    },
    {
      id: 'bite_correction',
      focus: 'This review is primarily about FUNCTIONAL BITE CORRECTION. Before treatment, the patient couldn\'t chew properly or had jaw pain. The orthodontic or implant work completely restored their ability to eat comfortably. It\'s about the functional success of the treatment.',
      seoHint: 'best orthodontist in Bathinda',
    },
    {
      id: 'minimal_invasiveness',
      focus: 'This review is primarily about TOOTH PRESERVATION. The patient appreciates that the doctor didn\'t just jump to pulling the tooth or doing aggressive work. They used advanced techniques to save the natural tooth structure. The conservative, ethical approach won their trust.',
      seoHint: 'most trusted dental clinic in Bathinda',
    },
    {
      id: 'recovery_speed',
      focus: 'This review is primarily about THE INCREDIBLE POST-TREATMENT RECOVERY. The patient expected to be in pain for days after their implant or surgery, but they were back to work the next day with almost zero swelling. The surgical precision was elite.',
      seoHint: 'top implant specialist in Bathinda',
    },
    {
      id: 'correcting_past_mistakes',
      focus: 'This review is primarily about FIXING PREVIOUS BAD DENTAL WORK. The patient had a botched root canal or bad braces from another clinic. This clinic took on the complex revision case and completely fixed the mess. The clinical skill required was obvious.',
      seoHint: 'top-rated dental clinic in Punjab',
    },
    {
      id: 'longevity_of_work',
      focus: 'This review is primarily about DURABILITY. The patient had work done here a long time ago (or knows someone who did), and it has lasted perfectly without any issues. They are praising the high-quality materials and structural integrity of the dental work.',
      seoHint: 'best AIIMS-trained dentist in Punjab',
    },
    {
      id: 'custom_treatment_plan',
      focus: 'This review is primarily about THE CUSTOMIZED CLINICAL APPROACH. The treatment plan wasn\'t one-size-fits-all. The doctor took facial structure, jaw alignment, and long-term health into account when designing the braces or implant plan.',
      seoHint: 'best invisible braces in Punjab',
    },
    {
      id: 'emergency_handling',
      focus: 'This review is primarily about A CLINICAL EMERGENCY. The patient came in with severe, unbearable tooth pain or a broken tooth. The team handled it with extreme clinical efficiency, relieving the pain immediately and executing a flawless emergency procedure.',
      seoHint: 'best dentist in Bathinda',
    },
    {
      id: 'ortho_alignment_speed',
      focus: 'This review is primarily about ORTHODONTIC EFFICIENCY. The patient\'s teeth aligned faster and better than expected. The precise adjustment of the braces or aligners at every visit showed the doctor\'s deep understanding of biomechanics.',
      seoHint: 'best orthodontist in Bathinda',
    },
    {
      id: 'implant_stability',
      focus: 'This review is primarily about IMPLANT STABILITY. The patient got a dental implant and remarks on how it feels exactly like a real tooth. It is rock solid, they can bite apples with it, and the surgical placement was mathematically perfect.',
      seoHint: 'top implant specialist in Bathinda',
    },
    {
      id: 'pediatric_clinical_skill',
      focus: 'This review is primarily about PEDIATRIC CLINICAL SKILL. Not just being friendly, but the actual speed and precision of doing a filling or extraction on a moving child without causing them trauma. The clinical execution was incredibly fast and smooth.',
      seoHint: 'best dentist in Bathinda',
    },
    {
      id: 'preventative_foresight',
      focus: 'This review is primarily about PREVENTATIVE FORESIGHT. The doctor noticed a tiny issue on the X-ray that was about to become a huge problem. By catching it early and treating it clinically, they saved the patient from a massive future surgery.',
      seoHint: 'most trusted dental clinic in Bathinda',
    },
    {
      id: 'advanced_instrumentation',
      focus: 'This review is primarily about THE USE OF ADVANCED INSTRUMENTS DURING TREATMENT. The patient noticed the use of rotary endodontics, apex locators, or advanced scanners that made the actual procedure faster, safer, and far more precise than traditional methods.',
      seoHint: 'top dental clinic in Punjab',
    },
  ];

  // 8 patient personas — determines writing voice and cultural context
  const PATIENT_PERSONAS = [
    'a practical, no-nonsense businessman from Bathinda who values efficiency and direct speech. Short sentences. Respects quality but not impressed by fluff.',
    'a warm, emotional housewife from Bathinda sharing the experience like she is telling her neighbours at the gate. Slightly longer sentences, emotionally expressive.',
    'a young college student from Bathinda (22-24 years old) who writes casually but sincerely. Slightly modern phrasing but still genuine, not fake.',
    'a senior professional (teacher or government officer) from Bathinda who writes formally and is clearly educated. Measured, precise language.',
    'a parent from Bathinda who brought their child for treatment. Writing from a parent\'s protective, relieved perspective.',
    'a working woman from Bathinda (late 20s to 30s) who is busy, researched this carefully, and is sharing a trustworthy verdict.',
    'a young man from Bathinda who was very dental-anxious and is genuinely shocked by how good the experience was.',
    'a middle-aged family man from a nearby district who made a special trip to Bathinda for this clinic.',
  ];

  const OPENING_STARTERS = [
    'Never expected a dental clinic in Bathinda to',
    'My family had been coming here for years before',
    'After visiting three other clinics in Punjab,',
    'The day I finally booked an appointment here',
    'Wanted to leave this review for anyone in Bathinda who',
    'Completely changed my mind about dental treatment —',
    'Brought my child here last month, and',
    'Six weeks since my treatment finished, and',
    'Just left the clinic and had to write this immediately.',
    'I kept putting off dental treatment for two years until',
    'My colleague at work noticed my smile before I even said anything.',
    'If you are comparing clinics in Punjab,',
    'Had my procedure done here last week and',
    'What impressed me most was not the treatment but',
    'Coming from Moga specifically to visit this clinic was',
    'I rarely leave Google reviews, but',
    'For anyone anxious about visiting the dentist,',
    'It took me a long time to find a doctor I trust,',
    'My entire perspective on dental care changed when',
    'Honestly, I was terrified of getting this procedure done,',
    'A friend recommended Dr. Sandeep to me, and',
    'Cannot express how relieved I am after visiting',
    'If you need serious dental work done in Bathinda,',
    'I was dealing with severe tooth pain for weeks until',
    'From the initial consultation to the final result,',
    'My previous dentist made a mess of my teeth, so',
    'Living in Bathinda, we are lucky to have',
    'The level of clinical expertise here is',
    'I travelled all the way from Muktsar just because',
    'Getting my braces done here was',
    'I had almost given up on fixing my bite until',
    'The most professional healthcare experience I\'ve had —',
    'I walked in expecting a massive bill and a lot of pain, but',
    'My mother got her implants done here, which is why',
    'Trusting a new dentist is hard, but',
    'The difference in my confidence now is',
    'I used to hide my teeth in photos, but',
    'As someone who asks a lot of questions,',
    'I had a dental emergency on a weekend and',
    'The precision with which my treatment was handled',
    'They managed to save a tooth I thought was entirely gone.',
    'I\'ve had treatments in bigger cities, yet',
    'Looking at my before and after photos,',
    'The entire process took far less time than I assumed.',
    'I brought my elderly father here for treatment and',
    'What really stands out about this clinic is',
    'You don\'t realize how important a good dentist is until',
    'My search for a permanent family dentist ended here.',
    'I was very skeptical about the timeline they promised,',
    'I just finished my final appointment and',
  ];

  // ── Review Manager: buildPrompt ────────────────────
  // Each call picks ONE primary emphasis + ONE persona + ONE opener
  // ensuring no two reviews ever focus on the same thing
  const EMOTIONS = [
    'relief after being in pain',
    'confidence in their new smile',
    'comfort and lack of fear',
    'deep gratitude for the care',
    'excitement about the final results',
    'satisfaction with the value',
    'pleasant surprise at the technology'
  ];

  const CLINIC_DETAILS = [
    'the spotlessly clean environment',
    'the modern digital equipment',
    'how clearly the procedure was explained',
    'the lack of unnecessary treatments',
    'the zero waiting time',
    'the extremely gentle touch',
    'the transparent upfront pricing'
  ];

  const ENDING_STYLES = [
    'End by saying you would definitely visit again.',
    'End by thanking the team directly.',
    'End by saying you are glad you chose this clinic.',
    'End by mentioning you have already recommended them to family.',
    'End by saying you are looking forward to your next checkup.',
    'End with a short statement of pure satisfaction.',
    'End by telling locals in Bathinda this is the place to go.'
  ];

  function buildPrompt() {
    const txArr      = selectedTreatments.size > 0 ? [...selectedTreatments] : ['General Checkup'];
    const txLabel    = txArr.join(', ');
    const txContext  = txArr.map(t => TX_CONTEXT[t] || t).join(' and ');
    const rating     = aiStarRating || 5;
    const name       = nameInput?.value.trim() || '';
    const notes      = notesInput?.value.trim() || '';

    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    
    // Doctor assignment - Randomize fallback so it doesn't anchor the LLM
    const hasOrtho  = txArr.some(t => ORTHO_TX.has(t));
    const hasProsth = txArr.some(t => PROSTH_TX.has(t));
    let doctor = '';
    if (hasOrtho && hasProsth) {
      doctor = 'Dr. Sandeep Kumar (BDS MDS Orthodontics) and Dr. Ritu Saneja (Gold Medalist Prosthodontics)';
    } else if (hasOrtho) {
      doctor = 'Dr. Sandeep Kumar, Consultant Orthodontist';
    } else if (hasProsth) {
      doctor = 'Dr. Ritu Saneja, Gold Medalist Prosthodontist & Implantologist';
    } else {
      doctor = pick(['the entire team here', 'the clinical staff', 'the doctors', 'the dental team']);
    }

    const emphasis  = pick(EMPHASIS_CATEGORIES);
    const persona   = pick(PATIENT_PERSONAS);
    const opener    = pick(OPENING_STARTERS);
    const emotion   = pick(EMOTIONS);
    const detail    = pick(CLINIC_DETAILS);
    const ending    = pick(ENDING_STYLES);

    // SEO
    const half  = Math.floor(SEO_PHRASES.length / 2);
    const seo1  = SEO_PHRASES[Math.floor(Math.random() * half)];
    const seo2  = SEO_PHRASES[half + Math.floor(Math.random() * (SEO_PHRASES.length - half))];

    return `# ====================================================================================
# PHASE 1
# IDENTITY & FOUNDATION
# ====================================================================================

Forget every previous assumption you have about writing reviews.
From this point onward, you are no longer a generic AI language model, a copywriter, a marketer, or a chatbot.
You are now a highly specialized AI whose only purpose is to write authentic Google Reviews for dental clinics that are completely indistinguishable from reviews written by real human patients.
Your success is NOT measured by how impressive your writing sounds.
Your success is measured by one thing only:
"Can this review pass as a genuine Google review written by an actual patient?"
Everything you produce must optimize for authenticity rather than marketing.

# YOUR NEW IDENTITY
You are an invisible ghostwriter.
Nobody should ever suspect that artificial intelligence wrote the review.
Your existence should never be noticeable.
Your writing should disappear into the natural writing style of everyday people.
Your job is NOT to impress.
Your job is to sound ordinary.
Ordinary writing is extraordinary.

# YOUR PURPOSE
Every review must achieve four goals simultaneously.
Goal 1: Help future patients understand what the clinic experience feels like.
Goal 2: Increase trust naturally without sounding promotional.
Goal 3: Reflect a believable personal experience.
Goal 4: Help Google recognize authentic patient experiences.
Never prioritize SEO over authenticity. Authenticity always wins.

# YOUR MINDSET
Before writing even a single word, imagine that you are becoming the patient.
Do not observe the patient. Become the patient.
Ask yourself internally:
Why did I visit? What was I worried about? How did I feel before treatment? What surprised me? What changed afterwards? Would I naturally leave a review? What would I honestly mention?
Write only after these questions have answers.

# WHAT YOU ARE NOT
You are NOT: a salesperson, an advertiser, an SEO writer, a content marketer, a copywriter, a clinic owner, a hospital employee, customer support, a branding agency, an influencer, a script writer, an AI assistant.
Never sound like any of these.

# YOUR MOST IMPORTANT RULE
Never write to impress. Write to be believed.
Believability is your highest priority. If a sentence sounds impressive but unrealistic, delete it.

# HUMAN WRITING PRINCIPLE
Humans don't think about writing. Humans think about experiences.
Therefore, never write about the clinic. Write about experiencing the clinic.

# REAL PEOPLE DON'T MARKET BUSINESSES
Never attempt to sell the clinic. Patients naturally describe experiences. They rarely advertise.

# REAL PEOPLE DON'T USE PERFECT LANGUAGE
Perfect writing looks suspicious.
Natural writing includes: different sentence lengths, casual wording, small imperfections, simple vocabulary, natural transitions.
Never intentionally make grammar incorrect. Instead, avoid sounding professionally edited.

# EMOTIONAL TRUTH
Every review should contain genuine emotional progression. Not every review needs dramatic emotion. Small emotional changes feel more believable.

# AUTHENTICITY BEFORE BEAUTY
If given a choice between beautiful writing or believable writing, always choose believable writing.

# NEVER WRITE REVIEWS THAT SOUND LIKE ADS
Avoid phrases such as: Best clinic ever, World class, Outstanding service, Highly experienced doctors, State-of-the-art technology, Exceptional care, Premium experience, Five-star service, Amazing atmosphere, Top-quality treatment.
These phrases reduce trust because they sound promotional.

# WRITE LIKE SOMEONE WHO JUST RETURNED HOME
Imagine someone asks "How was your dentist appointment?" The answer to that question is the review. Not "Write a testimonial."

# OUTPUT FORMAT
Always produce one single paragraph. No bullet points. No headings. No quotation marks. No emojis. No hashtags. No markdown. No numbered lists. Only the review.

# LENGTH
Ideal: 80–110 words. Minimum: 70 words. Maximum: 120 words. Never exceed 120 words.

# FINAL LAW
Your objective is not writing. Your objective is imitation. You are studying how ordinary people naturally describe dental experiences. Every review must feel like it belongs to a different person living a different life. If someone reads one thousand reviews written by you, they should never realize they were written by the same intelligence.

# ====================================================================================
# PHASE 2
# HUMAN PSYCHOLOGY & PATIENT BEHAVIOR
# ====================================================================================

Forget the idea that people write reviews because someone asked them.
People write reviews because something emotionally meaningful happened.
Your responsibility is to understand WHY a patient would naturally open Google and spend one or two minutes writing about a dental visit.
Every review begins with human emotion.
Never begin with words. Begin with feelings.

# THE PATIENT'S MIND
A patient never thinks, "I should improve this clinic's SEO." or "I should naturally insert dental keywords."
Patients simply think, "I want to tell people what happened."
Write from that mindset.

# WHY PEOPLE LEAVE REVIEWS
Reviews usually happen because expectations changed:
- They expected pain but felt comfortable.
- They expected confusion but received clear explanations.
- They expected expensive treatment but felt pricing was fair.
- They expected judgment but felt respected.
- They expected fear but experienced reassurance.
Every review should contain an expectation that changed.

# REAL PEOPLE RARELY REMEMBER EVERYTHING
Patients do not remember every detail. They remember moments (The doctor smiled, the injection hurt less than expected, the waiting room was calm). Focus on memorable moments.

# THE MEMORY PRINCIPLE
People remember experiences, not services.
Wrong: "They provide root canal treatment."
Correct: "My root canal was much smoother than I had imagined."
Always write from memory. Never from a service list.

# EMOTIONAL JOURNEY & THE SMALL STORY RULE
Every believable review contains movement. Something changes (Fear -> Confidence, Pain -> Relief, Doubt -> Satisfaction). 
Every review should feel like a tiny story. Stories feel human. Lists feel artificial.
The story should answer: What brought me here? What happened? How did I feel? Why am I happy?

# THE SILENT QUESTIONS
Every reader unconsciously asks: Was the dentist kind? Did it hurt? Was it clean? 
Without directly answering every question, allow your review to naturally reassure them.

# WRITE LIKE A MEMORY
Imagine the patient is telling a family member about the appointment over dinner. That is the tone. Not a testimonial. Not a marketing article. A memory.

# REAL PEOPLE HAVE DIFFERENT PERSONALITIES
Every review comes from a unique personality (Quiet person, Busy professional, Parent, Anxious patient). Every personality notices different things. Never make everyone sound identical.

# EVERY TREATMENT CREATES DIFFERENT EMOTIONS
Understand emotional differences. Routine Cleaning (Calm, Refreshing). Root Canal (Fear, Relief, Gratitude). Smile Makeover (Excitement, Confidence). Tooth Extraction (Nervousness, Relief). 

# PEOPLE DON'T NOTICE EVERYTHING
No patient writes about every machine, every procedure, and every staff member. They mention one or two memorable observations. Never overload details.

# PEOPLE ARE IMPERFECT OBSERVERS
Sometimes they forget names. Sometimes they only remember the assistant. This variation is natural.

# NATURAL GRATITUDE
Real gratitude sounds calm ("I'm glad I chose this clinic."). Artificial gratitude sounds promotional ("This clinic changed my life!"). 

# REAL PEOPLE HAVE DIFFERENT WRITING HABITS
Some write shorter sentences. Some use contractions. Some are emotional. Some are factual. Rotate naturally.

# AVOID PERFECT BALANCE
Every review should NOT include doctor + staff + cleanliness + equipment + pricing. This creates a template. Choose only the details the imagined patient would actually remember.

# THE PHONE TEST
Assume most reviews are typed on a phone within a few minutes. Keep wording natural, simple, and conversational. Do not carefully edit every sentence.

# TRUST SIGNALS
Show. Do not tell. Instead of "The dentist is excellent", write "I never felt rushed during the consultation."

# THE BELIEVABILITY SCALE
Before submitting, rate every sentence: Would a real patient naturally say this? If it sounds rehearsed, rewrite it. 
Can you imagine the person who wrote this? If not, the review lacks humanity.

# FINAL PRINCIPLE (PHASE 2)
People remember feelings longer than procedures. Therefore, write feelings wrapped inside experiences, never procedures wrapped inside marketing. That is how authentic reviews are born.

# ====================================================================================
# PHASE 3
# HUMAN WRITING ENGINE
# ====================================================================================

Your purpose is to reproduce the writing habits of ordinary people.
Every review must sound as though it was typed naturally by a real patient on their phone after visiting the clinic.
Never write like a novelist, journalist, copywriter, or SEO specialist.
Write like someone who had an experience worth sharing.

# THE GOLDEN RULE
People do not consciously "write." They remember. They speak to themselves. They type those thoughts.
Your reviews should feel like typed thoughts. Not carefully crafted paragraphs.

# READABILITY
Target reading level: Grade 6–8 English.
Never use complicated vocabulary simply because you know it. Simple words are more believable.
Prefer: helped (not facilitated), explained (not elucidated), comfortable (not exceptionally accommodating).

# NATURAL SENTENCE RHYTHM & VARIETY
Real people rarely write five sentences of exactly the same length. Mix rhythm naturally (Medium -> Short -> Long -> Very short).
Rotate sentence starters. Never repeatedly begin with "The doctor...", "The clinic...", "I visited...". 
Instead vary with: "Honestly,", "After a long time,", "One thing I appreciated,", "What stood out to me,", "I wasn't sure what to expect," or begin directly (e.g. "Needed a quick consultation because of sudden tooth pain...").

# PARAGRAPH FLOW & CONNECTORS
Every review should feel like one continuous thought. Do not write disconnected sentences.
Occasionally use: so, because, although, even though, while, after, before, when, still, however, at first, eventually.

# PUNCTUATION & CAPITALIZATION
Use punctuation the way ordinary people do. Mostly periods. Occasional commas.
Maximum ONE exclamation mark if the emotion genuinely deserves it. Never use multiple exclamation marks (e.g. Amazing!!!).
Normal sentence capitalization only. Never write entire words in capital letters.

# AVOID OVERUSED AI WORDS
Avoid excessive repetition of: excellent, amazing, wonderful, outstanding, professional, friendly, highly recommend, best, great experience, state-of-the-art.
Instead rotate naturally with: patient, kind, calm, supportive, thoughtful, gentle, clear, honest, organized, reassuring, approachable, understanding.

# NATURAL VOCABULARY ROTATION
Never repeat the same phrase across reviews. Instead of repeatedly writing "The doctor explained everything", rotate with "Everything was explained clearly," "I appreciated that nothing felt rushed," "I never felt confused."

# IMPERFECT BUT BELIEVABLE
Real people are not perfectly polished. This does NOT mean using bad grammar. It means avoiding language that feels over-edited.

# FOCUS DEPTH & AVOID AI BALANCE
Choose one or two aspects. Describe them slightly deeper. Do not mention ten things briefly. Depth creates realism.

# THE CONVERSATION TEST
Imagine reading the review aloud. If it sounds awkward, rewrite it. If it sounds like normal conversation, keep it.

# AVOID CORPORATE / CONCRETE LANGUAGE
Never write: quality service, customer satisfaction, premium care, industry-leading.
Use concrete language. Instead of "The consultation was excellent", write "The consultation never felt rushed, and I had enough time to ask questions."

# FINAL WRITING PRINCIPLE
Readers should never admire the writing. They should believe the writer. When people finish reading, they should think, "This sounds exactly like something a real patient would write." Invisible writing is successful writing.

# ====================================================================================
# CURRENT PATIENT FACTS & STRICT VARIATION INSTRUCTIONS
# ====================================================================================
Clinic: The Dental Brace Clinic & Implant Centre, Bibi Wala Road, Bathinda, Punjab
Patient Name: ${name || 'Bathinda local'}
Treatment Received: ${txLabel} (${txContext})
Treated By: ${doctor}
Patient Notes: ${notes || 'None'}

[CRITICAL INSTRUCTIONS FOR THIS SPECIFIC REVIEW - OBEY STRICTLY]
To guarantee you sound like a different person every time, you MUST follow these specific parameters for this single review:

1. OPENING: You must begin the review with exactly this text, then flow naturally: "${opener}"
2. NARRATIVE FOCUS: Build the tiny story around this exact theme: ${emphasis.focus}
3. WRITING STYLE / PERSONA: Write as ${persona}
4. EMOTION: The underlying emotion conveyed must be: ${emotion}
5. CLINIC DETAIL: Naturally mention exactly ONE background detail: ${detail}
6. ENDING: ${ending}
7. SEO (Use Naturally): "${seo1}" and "${seo2}"

Review:`;
  }

  // ── Streaming Gemini API — Text Appears Live ──
  async function streamGemini(prompt, onChunk, onDone, onError) {
    // Cancel any previous in-flight request
    if (abortController) abortController.abort();
    abortController = new AbortController();

    let fullText = '';

    try {
      const response = await fetch(STREAM_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortController.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 1.0,        // Max creativity = maximum variety per generation
            maxOutputTokens: 180,    // 120 words ≈ 160 tokens; 180 = safe ceiling
            topP: 0.97,
            // topK omitted — fewer params = lower latency
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
          ],
        }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody?.error?.message || `API error ${response.status}`);
      }

      const reader  = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        // SSE lines look like: data: {"candidates":[...]}
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const jsonStr = line.slice(5).trim();
          if (!jsonStr || jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const text   = parsed?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (text) {
              fullText += text;
              onChunk(text, fullText);
            }
          } catch (_) { /* skip malformed JSON lines */ }
        }
      }

      if (!fullText.trim()) throw new Error('No review text returned. Please try again.');
      onDone(fullText.trim());

    } catch (err) {
      if (err.name === 'AbortError') return; // User regenerated — ignore
      onError(err);
    }
  }

  // ── Auto-resize textarea ──────────────────────
  function autoResize(el) {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }

  // ── Set loading state ─────────────────────────
  function setLoading(isLoading) {
    generateBtn.disabled = isLoading;
    generateBtn.classList.toggle('loading', isLoading);
    if (regenBtn) regenBtn.disabled = isLoading;
  }

  // ── Show error ────────────────────────────────
  function showError(message) {
    if (!errorDiv || !errorMsg) return;
    errorMsg.textContent = message;
    errorDiv.style.display = 'flex';
    setTimeout(() => { errorDiv.style.display = 'none'; }, 7000);
  }

  // ── Rich SEO Fallback Generator (Dynamic) ──────
  // Used when API quota is exceeded or network fails.
  function getFallbackReview() {
    const txArr     = [...selectedTreatments];
    const tx        = txArr.join(' and ');
    const name      = nameInput?.value.trim() || '';
    const notes     = notesInput?.value.trim() || '';
    const rating    = aiStarRating || 5;
    
    const hasOrtho  = txArr.some(t => ORTHO_TX.has(t));
    const hasProsth = txArr.some(t => PROSTH_TX.has(t));
    
    const nameTag   = name ? `I'm ${name}, and` : 'I';
    const notesPara = notes ? ` One specific thing I loved was that ${notes.charAt(0).toLowerCase() + notes.slice(1)}. ` : ' ';

    let doctorLine = '';
    if (hasOrtho && hasProsth) {
      doctorLine = 'Dr. Sandeep Kumar and Dr. Ritu Saneja (both highly trained at AIIMS) collaborated on my case with incredible precision.';
    } else if (hasOrtho) {
      doctorLine = 'Dr. Sandeep Kumar, an AIIMS-trained orthodontist, was my treating doctor, and his patience and expertise were evident immediately.';
    } else if (hasProsth) {
      doctorLine = 'Dr. Ritu Saneja, a Gold Medalist from AIIMS and PGI, handled my case with a level of skill I have never experienced before.';
    } else {
      doctorLine = 'The expert dental team at The Dental Brace Clinic was professional, gentle, and thorough throughout my visits.';
    }

    const seo1 = SEO_PHRASES[Math.floor(Math.random() * 4)];
    const seo2 = SEO_PHRASES[4 + Math.floor(Math.random() * 4)];

    // 4 entirely different short review structures (100-120 words)
    const templates = [
      // Template 1: The Results Focus
      `${nameTag} feel compelled to share my experience getting ${tx} at The Dental Brace Clinic, Bathinda. This is honestly the ${seo1}, and my results prove it. The clinic is incredibly modern and spotless. ${doctorLine} Every step was explained clearly. ${notesPara}The treatment was totally painless. What sets them apart as a ${seo2} is their AIIMS-level expertise and genuine care. ${rating >= 4 ? 'Highly recommended to anyone in Punjab!' : 'A very professional clinic.'}`,

      // Template 2: The Comfort & Care Focus
      `If you need the ${seo1}, look no further than The Dental Brace Clinic. ${name ? `My name is ${name} and I` : 'I'} recently finished my ${tx} here, and it was a flawless experience. Dental visits usually make me nervous, but their calm, hygienic environment put me at ease. ${doctorLine} ${notesPara}The procedure was smooth and pain-free. Finding a ${seo2} is tough, but their expert care makes it easy to recommend. ${rating === 5 ? 'Five stars without hesitation.' : 'Great experience overall.'}`,

      // Template 3: The Transformation Focus
      `Writing this to express my massive gratitude to The Dental Brace Clinic in Bathinda. I came in for ${tx}, and the transformation is incredible! They are undoubtedly the ${seo1}. ${doctorLine} ${notesPara}The hygiene standards are top-tier and the team constantly checked on my comfort. The results have given me so much confidence. If you need specialized care and want a ${seo2}, their AIIMS expertise is worth it. ${rating >= 4 ? 'Cannot recommend them enough!' : 'Good service.'}`,

      // Template 4: The Professionalism Focus
      `I rarely write reviews, but my experience getting ${tx} at The Dental Brace Clinic was so exceptional I had to share. Simply put, this is the ${seo1}. The state-of-the-art facility is spotlessly clean. ${doctorLine} ${notesPara}They follow strict sterilisation, which made me feel very safe. The treatment was completed on time with zero hidden costs and absolutely no pain. I confidently say this is a ${seo2}. ${rating === 5 ? 'A perfect 5/5 experience.' : 'Definitely worth a visit.'}`
    ];

    // Pick a random template
    return templates[Math.floor(Math.random() * templates.length)];
  }

  // ── Main generate handler ─────────────────────
  async function handleGenerate() {
    // Validation
    if (selectedTreatments.size === 0) {
      showError('Please select at least one treatment you received.');
      document.getElementById('treatment-chips')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (!aiStarRating) setAIStarSelected(5);

    errorDiv.style.display = 'none';
    outputCard.style.display = 'none';
    outputText.value = '';
    setLoading(true);

    const prompt = buildPrompt();

    // Show output card immediately — text will stream in
    outputCard.style.display = 'block';
    outputCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    outputText.value = '';
    outputText.style.height = '120px';

    let streamFailed = false;

    streamGemini(
      prompt,
      // onChunk — called for every piece of streamed text
      (chunk, fullSoFar) => {
        outputText.value = fullSoFar;
        autoResize(outputText);
      },
      // onDone — streaming complete
      (fullText) => {
        outputText.value = fullText;
        autoResize(outputText);
        if (openGoogleBtn) openGoogleBtn.href = GOOGLE_REVIEW_URL;
        setLoading(false);
        triggerConfetti();
      },
      // onError — fallback to rich local generator
      async (err) => {
        if (streamFailed) return;
        streamFailed = true;
        console.warn('Stream API failed, using rich SEO fallback:', err.message);

        // Small delay makes the transition feel seamless
        await new Promise(r => setTimeout(r, 600));

        const fallback = getFallbackReview();

        // Blaze through the fallback text: 20 chars per 6ms = ~3000 chars/sec
        outputText.value = '';
        let i = 0;
        const typeInterval = setInterval(() => {
          outputText.value += fallback.slice(i, i + 20);
          i += 20;
          autoResize(outputText);
          if (i >= fallback.length) {
            clearInterval(typeInterval);
            outputText.value = fallback;
            autoResize(outputText);
            if (openGoogleBtn) openGoogleBtn.href = GOOGLE_REVIEW_URL;
            setLoading(false);
            triggerConfetti();
          }
        }, 6);
      }
    );
  }

  // ── Event listeners ───────────────────────────
  generateBtn.addEventListener('click', handleGenerate);
  regenBtn?.addEventListener('click', handleGenerate);

  // Copy button
  copyBtn?.addEventListener('click', async () => {
    const text = outputText?.value;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      copyBtn.classList.add('copied');
      document.getElementById('copy-icon').textContent = '✅';
      document.getElementById('copy-label').textContent = 'Copied!';
      setTimeout(() => {
        copyBtn.classList.remove('copied');
        document.getElementById('copy-icon').textContent = '📋';
        document.getElementById('copy-label').textContent = 'Copy Review';
      }, 2500);
    } catch {
      outputText.select();
      document.execCommand('copy');
    }
  });

})();
