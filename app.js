const PHONE_E164 = "+17178279785";

const prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

document.addEventListener(
  "DOMContentLoaded",
  () => {
    document.body.setAttribute("data-ready", "true");
  },
  { once: true }
);

function createToast() {
  const existing = document.querySelector("[data-toast]");
  if (existing) return existing;

  const el = document.createElement("div");
  el.setAttribute("data-toast", "");
  el.setAttribute("role", "status");
  el.setAttribute("aria-live", "polite");
  el.hidden = true;
  document.body.appendChild(el);
  return el;
}

function showToast(message) {
  const toast = createToast();
  toast.textContent = message;
  toast.hidden = false;

  window.clearTimeout(showToast._t);
  showToast._t = window.setTimeout(() => {
    toast.hidden = true;
  }, 3200);
}

function buildTelHref() {
  if (!PHONE_E164) return "#";
  return `tel:${PHONE_E164}`;
}

function buildSmsHref() {
  if (!PHONE_E164) return "#";
  return `sms:${PHONE_E164}`;
}

function showPhoneMissing() {
  showToast("Número pendiente. Pásame el teléfono en formato +1XXXXXXXXXX para activar Llamar/Texto.");
}

function handleAction(action) {
  if (!PHONE_E164) {
    showPhoneMissing();
    return;
  }

  if (action === "call") {
    window.location.href = buildTelHref();
    return;
  }

  if (action === "text") {
    window.location.href = buildSmsHref();
  }
}

function initCtas() {
  document.addEventListener("click", (e) => {
    const target = e.target instanceof Element ? e.target : null;
    if (!target) return;

    const btn = target.closest("[data-action]");
    if (!btn) return;

    const action = btn.getAttribute("data-action");
    if (!action) return;

    e.preventDefault();
    handleAction(action);
  });
}

function initFaq() {
  const root = document.querySelector("[data-faq]");
  if (!root) return;

  root.addEventListener("click", (e) => {
    const target = e.target instanceof Element ? e.target : null;
    if (!target) return;

    const q = target.closest(".faq-q");
    if (!q) return;

    const item = q.closest(".faq-item");
    const a = item ? item.querySelector(".faq-a") : null;
    if (!a) return;

    const expanded = q.getAttribute("aria-expanded") === "true";
    q.setAttribute("aria-expanded", String(!expanded));
    a.hidden = expanded;
  });
}

function initYear() {
  const el = document.querySelector("[data-year]");
  if (el) el.textContent = String(new Date().getFullYear());
}

function initSmoothScroll() {
  document.addEventListener("click", (e) => {
    const target = e.target instanceof Element ? e.target : null;
    if (!target) return;

    const a = target.closest("a[href^='#']");
    if (!a) return;

    const href = a.getAttribute("href");
    if (!href || href === "#") return;

    const id = href.slice(1);
    const el = document.getElementById(id);
    if (!el) return;

    e.preventDefault();

    if (prefersReducedMotion) {
      el.scrollIntoView();
    } else {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
}

function initRevealOnScroll() {
  if (prefersReducedMotion) return;
  if (typeof IntersectionObserver === "undefined") return;

  const candidates = document.querySelectorAll("section, .plan, .feature, .hero-card, .cta-panel");
  candidates.forEach((el) => el.setAttribute("data-reveal", "pending"));

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.setAttribute("data-reveal", "in");
        io.unobserve(entry.target);
      }
    },
    { threshold: 0.12 }
  );

  candidates.forEach((el) => io.observe(el));
}

function initBackgroundParallax() {
  if (prefersReducedMotion) return;

  let raf = 0;
  const onScroll = () => {
    if (raf) return;
    raf = window.requestAnimationFrame(() => {
      raf = 0;
      const y = window.scrollY || 0;
      const x1 = Math.min(24, y * 0.04);
      const x2 = Math.min(18, y * 0.03);
      document.body.style.backgroundPosition = `0px ${-x1}px, 0px ${-x2}px, 0px ${x2}px, 0px ${x1}px, 0px 0px`;
    });
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

function initQuickRecommendation() {
  const root = document.querySelector("[data-reco]");
  if (!root) return;

  const sliders = {
    streaming: root.querySelector("[data-slider='streaming']"),
    work: root.querySelector("[data-slider='work']"),
    devices: root.querySelector("[data-slider='devices']"),
  };

  const out = {
    streaming: root.querySelector("[data-streaming-val]"),
    work: root.querySelector("[data-work-val]"),
    devices: root.querySelector("[data-devices-val]"),
    people: root.querySelector("[data-reco-people]"),
    text: root.querySelector("[data-reco-text]"),
    sub: root.querySelector("[data-reco-sub]"),
  };

  if (!sliders.streaming || !sliders.work || !sliders.devices || !out.text) return;

  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  function calcPeopleScore(devices) {
    return clamp(Math.round(devices / 2) + 1, 1, 8);
  }

  function selectTier(score) {
    if (score >= 19) return { plan: "Fibra 1G", sub: "Para hogares con muchos dispositivos y gaming intenso." };
    if (score >= 12) return { plan: "Fibra 500Mbps", sub: "Ideal para trabajo remoto, videollamadas y streaming simultáneo." };
    return { plan: "Fibra 300Mbps", sub: "Suficiente para streaming y uso diario de 1–3 personas." };
  }

  function update() {
    const streaming = Number(sliders.streaming.value);
    const work = Number(sliders.work.value);
    const devices = Number(sliders.devices.value);

    if (out.streaming) out.streaming.textContent = String(streaming);
    if (out.work) out.work.textContent = String(work);
    if (out.devices) out.devices.textContent = String(devices);

    const score = streaming * 1.2 + work * 1.1 + devices * 1.0;
    const tier = selectTier(score);
    const people = calcPeopleScore(devices);

    if (out.people) out.people.textContent = `Para ${people}+ personas:`;
    out.text.textContent = tier.plan;
    if (out.sub) out.sub.textContent = tier.sub;
  }

  root.addEventListener("input", (e) => {
    const target = e.target instanceof HTMLInputElement ? e.target : null;
    if (!target) return;
    if (target.type !== "range") return;
    update();
  });

  update();
}

initCtas();
initFaq();
initYear();
initSmoothScroll();
initRevealOnScroll();
initBackgroundParallax();
initQuickRecommendation();
initUsoTabs();

function initUsoTabs() {
  const presets = {
    streaming: { streaming: 5, work: 1, devices: 2 },  // score ~9 → 300Mbps
    trabajo:   { streaming: 3, work: 8, devices: 4 },  // score ~15 → 500Mbps
    gaming:    { streaming: 5, work: 3, devices: 10 }, // score ~19 → 1G
  };

  const tabs = document.querySelectorAll('[data-uso]');
  if (!tabs.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => {
        t.classList.remove('bg-blue-600', 'text-white');
        t.classList.add('text-slate-600');
      });
      tab.classList.add('bg-blue-600', 'text-white');
      tab.classList.remove('text-slate-600');

      const p = presets[tab.dataset.uso];
      if (!p) return;

      const root = document.querySelector('[data-reco]');
      if (!root) return;

      const setSlider = (attr, val) => {
        const el = root.querySelector(`[data-slider='${attr}']`);
        if (el) { el.value = val; el.dispatchEvent(new Event('input', { bubbles: true })); }
      };
      setSlider('streaming', p.streaming);
      setSlider('work', p.work);
      setSlider('devices', p.devices);
    });
  });
}
