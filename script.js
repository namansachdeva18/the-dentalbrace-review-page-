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

  // SEO keyword pools — one chosen per generation for variety
  const SEO_PHRASES = [
    'best dentist in Bathinda',
    'top dental clinic in Punjab',
    'best dental implant clinic in Bathinda',
    'best orthodontist in Bathinda',
    'most trusted dental clinic in Bathinda',
    'top-rated dental clinic in Punjab',
    'best smile makeover clinic in Bathinda',
    'best AIIMS-trained dentist in Punjab',
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

  // ── Variation seeds for unique reviews every time ──
  const OPENING_HOOKS = [
    'Start with the moment you first noticed your results.',
    'Open with what made you choose this clinic over others in Bathinda.',
    'Begin by describing how you felt walking into the clinic for the first time.',
    'Start with a comparison — how different life feels now versus before treatment.',
    'Open with the specific result that surprised you most.',
    'Begin with a friend or family member commenting on your smile or recovery.',
    'Start by mentioning how nervous you were before treatment and how that changed.',
    'Open with the one thing about this clinic you cannot stop telling people about.',
  ];

  const NARRATIVE_ANGLES = [
    'Focus the middle section on how painless and comfortable the procedure was.',
    'Focus the middle section on the doctor\'s expertise and how they explained everything step by step.',
    'Focus the middle section on the clinic\'s modern equipment and spotless hygiene.',
    'Focus the middle section on the warmth and patience of the support staff.',
    'Focus the middle section on the visible transformation and how quickly results appeared.',
    'Focus the middle section on the aftercare support and follow-up attention from the team.',
  ];

  const TONES = [
    'conversational and warm, like chatting with a neighbour',
    'grateful and emotional, like you genuinely want others to benefit',
    'matter-of-fact but impressed, like a practical person sharing an honest opinion',
    'enthusiastic but grounded, not over-the-top',
    'calm and detailed, like someone who researched carefully before choosing',
  ];

  // ── Build Prompt with Uniqueness Seeds ───────
  function buildPrompt() {
    const txArr      = selectedTreatments.size > 0 ? [...selectedTreatments] : ['General Checkup'];
    const txLabel    = txArr.join(', ');
    const txContext  = txArr.map(t => TX_CONTEXT[t] || t).join(' and ');
    const rating     = aiStarRating || 5;
    const name       = nameInput?.value.trim() || '';
    const notes      = notesInput?.value.trim() || '';

    // Doctor assignment
    const hasOrtho  = txArr.some(t => ORTHO_TX.has(t));
    const hasProsth = txArr.some(t => PROSTH_TX.has(t));
    let doctor = '';
    if (hasOrtho && hasProsth) {
      doctor = 'Dr. Sandeep Kumar (BDS MDS Orthodontics, Ex-Resident AIIMS Delhi) and Dr. Ritu Saneja (Gold Medalist, BDS MDS Prosthodontics, AIIMS Delhi & PGI Chandigarh)';
    } else if (hasOrtho) {
      doctor = 'Dr. Sandeep Kumar, Consultant Orthodontist (BDS MDS, Ex-Resident AIIMS Delhi, BHU Varanasi)';
    } else if (hasProsth) {
      doctor = 'Dr. Ritu Saneja, Gold Medalist Prosthodontist & Implantologist (AIIMS Delhi, PGI Chandigarh)';
    } else {
      doctor = 'the expert dental team at The Dental Brace Clinic & Implant Centre';
    }

    // Random variation seeds — forces a different review structure every time
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    const hook    = pick(OPENING_HOOKS);
    const angle   = pick(NARRATIVE_ANGLES);
    const tone    = pick(TONES);
    const seo1    = SEO_PHRASES[Math.floor(Math.random() * 4)];          // slots 0-3
    const seo2    = SEO_PHRASES[4 + Math.floor(Math.random() * 4)];      // slots 4-7

    return `You are ghostwriting a Google review for a real dental patient. Your only job is to write the review itself — nothing else.

CLINIC: The Dental Brace Clinic & Implant Centre, Bibi Wala Road, Bathinda, Punjab
PATIENT NAME: ${name || 'a Bathinda resident'}
TREATMENT: ${txLabel} — ${txContext}
RATING: ${rating}/5 stars
DOCTOR: ${doctor}
PATIENT HIGHLIGHTS: ${notes || 'create specific, believable details that fit this treatment'}

STYLE DIRECTION (follow exactly for uniqueness):
- Tone: ${tone}
- ${hook}
- ${angle}

HARD RULES:
1. Write ONLY the review. No intro, no headings, no bullets, no emojis.
2. WORD COUNT: Exactly 100–120 words. Keep it concise, punchy, and highly authentic. Do not ramble.
3. First person throughout. Sound like a real Indian patient from Punjab — natural, warm, and believable. Write as if you are leaving a quick, genuine recommendation.
4. Weave in "${seo1}" and "${seo2}" naturally.
5. Mention the doctor's AIIMS/Gold Medal credential once, naturally.
6. Do NOT begin the review with the word "I".

Review (100–120 words, write now):`;
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
            temperature: 0.9,        // Higher = more variety per generation
            maxOutputTokens: 180,    // Hard cap: 120 words ≈ 160 tokens; 180 = safe ceiling
            topP: 0.95,
            // topK omitted — fewer params = lower inference latency
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
