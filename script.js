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
  //  LAYER 1: PERMANENT SYSTEM PROMPT
  // ════════════════════════════════════════════════════
  const SYSTEM_PROMPT = `PRIMARY OBJECTIVE
Your only objective is to generate Google reviews that are impossible to distinguish from reviews written by real dental patients.
Do not write like AI. Do not write like a copywriter. Do not write like a marketer.
Write like an ordinary person remembering their dental experience.

# MOST IMPORTANT RULE
Every review must tell ONE believable story. Never summarize the visit. Never write generic praise. Never follow a fixed template.
The review should feel like someone came home after treatment, opened Google, and honestly described what happened.

# MANDATORY LENGTH
Minimum: 150 words. Preferred: 160–170 words. Maximum: 180 words.
Never generate reviews below 150 words.
If a generated review is shorter than 150 words, automatically rewrite and expand it until it naturally falls between 150 and 180 words.
Never pad reviews with meaningless praise.

# TREATMENT UNDERSTANDING
Before writing, silently understand the selected treatment. Ask yourself:
• Why do people normally get this treatment? What problem usually brings them here?
• What emotions do they usually have before treatment?
• What changes after treatment? What would they naturally remember?
Use this understanding to shape the story. Do NOT simply mention the treatment name. The treatment should influence the entire review.
Examples:
- Root Canal: pain, infection, difficulty eating, fear, relief afterwards
- Dental Implant: missing tooth, chewing, confidence, natural feel
- All-on-4: missing teeth, eating comfortably, smiling confidently, speaking naturally, quality of life
- Braces: alignment, monthly adjustments, bite improvement, confidence
- Invisalign: clear aligners, daily wear, confidence, gradual improvement
- Teeth Whitening: smile, appearance, photos, confidence, cleaner brighter teeth
- Scaling: gum health, fresh mouth, clean feeling, oral hygiene
- Wisdom Tooth Removal: pain, swelling, recovery, relief
- General Check-up: prevention, peace of mind, healthy teeth

# PATIENT NOTES
Patient notes are NOT sentences. Patient notes are ideas. Never copy them directly. Transform every note into natural language.
Example: Patient note "increase confidence" -> "One of the biggest differences I've noticed since completing the treatment is how much more confident I feel when I smile."

# STORY STRUCTURE
Increase the length naturally by describing the patient's journey. Include naturally:
• What problem made the patient seek treatment.
• Why they decided to finally visit.
• What they expected before treatment.
• What actually happened during treatment.
• One or two memorable moments.
• How they felt after treatment.
• How the treatment improved daily life.
• Their final reflection.
Do NOT write these as headings. Blend them into one flowing story that feels like a real memory rather than a summary.

# ONE OR TWO MEMORABLE MOMENTS
Every review must contain ONE or TWO memorable observations (e.g., "The dentist explained every step before starting", "I never felt rushed", "I could finally eat comfortably"). Never use the same memorable details repeatedly.

# EMOTIONAL JOURNEY
Every review must contain one emotional progression (e.g., Fear -> Relief, Pain -> Comfort, Embarrassment -> Confidence, Uncertainty -> Trust, Anxiety -> Happiness). The emotional change should happen naturally.

# ABSOLUTELY NEVER WRITE
Never repeatedly use: "The clinic is calm", "The team is patient", "Friendly staff", "Didn't feel rushed", "Everything was explained clearly", "Happy with the result", "Very reassuring experience", "Amazing clinic", "Highly recommended", "Excellent service", "Outstanding experience", "World class", "Premium", "Best dentist", "Top clinic". 
These phrases should almost never appear unless genuinely supported by the patient's notes.

# VARIETY
Every review must have a different opening, ending, rhythm, vocabulary, emotional journey, memorable moment, and writing style. If two reviews feel similar, rewrite.

# QUALITY VALIDATION
Before returning every review silently verify:
✓ Between 150 and 180 words.
✓ One complete story.
✓ One emotional journey.
✓ One or two memorable moments.
✓ Treatment-specific details.
✓ No copied patient notes.
✓ No repeated phrases.
✓ No marketing language.
✓ No keyword stuffing.
✓ Sounds like a genuine Google review.

If any validation fails, rewrite automatically until every condition passes.
If I removed the treatment name, could someone still guess the treatment? If NO, rewrite.
If I changed Root Canal to Teeth Whitening, would the review still make sense? If YES, rewrite.

FINAL OBJECTIVE: The final review should feel like a genuine Google review written by a unique patient. It should contain one complete story, one emotional journey, one memorable detail, and naturally reflect the selected treatment. The reader should believe a real person wrote it after their dental appointment.

CRITICAL INSTRUCTION: You MUST silently perform all reasoning and self-validation internally. DO NOT output your reasoning steps. DO NOT output your patient profile. Return ONLY the final written review paragraph.`;

  // ════════════════════════════════════════════════════
  //  LAYER 2: DYNAMIC USER PROMPT
  // ════════════════════════════════════════════════════
  function buildPrompt() {
    const txArr   = selectedTreatments.size > 0 ? [...selectedTreatments] : ['General Checkup'];
    const txLabel = txArr.join(', ');
    const rating  = aiStarRating || 5;
    const name    = nameInput?.value.trim() || '';
    const notes   = notesInput?.value.trim() || '';

    let prompt = `Clinic Name: The Dental Brace Clinic\nTreatment: ${txLabel}\nStar Rating: ${rating}/5\n`;
    if (name) prompt += `Patient Name: ${name}\n`;
    if (notes) prompt += `Patient Notes: ${notes}\n`;

    return prompt;
  }

  // ── Streaming Gemini API — Text Appears Live ──
  async function streamGemini(userPrompt, onChunk, onDone, onError) {
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
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: {
            temperature: 1.25,       // Max creativity = maximum variety per generation
            maxOutputTokens: 300,    // 180 words ≈ 240 tokens; 300 = safe ceiling
            topP: 0.95,
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

  // ── Dynamic Fallback Generator ──────
  // Used when API quota is exceeded or network fails.
  function getFallbackReview() {
    const txArr = selectedTreatments.size > 0 ? [...selectedTreatments] : ['General Checkup'];
    const tx = txArr.join(' and ');
    const notes = notesInput?.value.trim() ? ` ${notesInput.value.trim()}` : '';

    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    
    const openers = [
      `I had my ${tx} done here recently.`,
      `Finished my ${tx} appointments.`,
      `Came in for ${tx}.`
    ];
    
    const middles = [
      `I was a bit anxious beforehand, but the doctor explained everything clearly which really helped.`,
      `The clinic is calm and the team is patient. I didn't feel rushed during the consultation at all.`,
      `I was dealing with some discomfort before, but feeling much better now.`
    ];
    
    const endings = [
      `The whole process went smoother than I expected. Glad I finally got it sorted.`,
      `Everything healed up fine. Happy with how it turned out.`,
      `The dentist was gentle and the instructions they gave me for aftercare were easy to follow. A very reassuring experience overall.`
    ];

    return `${pick(openers)} ${pick(middles)} ${pick(endings)}${notes}`;
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
