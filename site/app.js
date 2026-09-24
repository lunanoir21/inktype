/* Inktype project site: live typing demo, effect previews, EN/TR switch, copy buttons. */
(() => {
  "use strict";

  /* ------------------------------------------------------------ language */
  const TR = {
    "nav.features": "Özellikler",
    "nav.libraries": "Kütüphaneler",
    "nav.selfhost": "Kurulum",
    "hero.eyebrow": "Ücretsiz ve açık kaynak yazma pratiği",
    "hero.tagline": "Hep okumak istediğin kitapları yazarak bitir.",
    "demo.books": "Kitaplar",
    "demo.hint": "Buraya tıkla ve yazmaya başla",
    "demo.effect": "Efekt",
    "fx.none": "Yok",
    "fx.sparkle": "Işıltı",
    "fx.embers": "Köz",
    "fx.fireworks": "Havai fişek",
    "fx.ink": "Mürekkep",
    "cta.start": "Tek komutla kendi sunucunda çalıştır",
    "cta.github": "GitHub'da yıldızla",
    "hero.promise": "Hesap gerekmez · Reklam yok · Takip yok · MIT lisansı",
    "shot.typing": "Okuma konsolu — yalnızca sayfa, imleç ve senin hızın.",
    "shot.settings": "Ayarlar sağdan açılır; her efekt seçmeden önce önizlenir.",
    "shot.library": "Gerçek kapaklarıyla 70.000'den fazla kitap; yalnızca açtığında indirilir.",
    "shot.author": "Yazar profilleri, yazarın kitaplarını her kütüphaneden toplar.",
    "shot.stats": "Zaman içinde hız, seriler ve zayıf tuşlarının ısı haritası.",
    "features.title": "Her şey dahil. Sonsuza kadar ücretsiz.",
    "features.lead": "typelit.io'dan ilham alındı, açık kaynak olarak sıfırdan yazıldı. Kilitli ya da sınırlı hiçbir şey yok.",
    "f.engine.t": "Özenli bir yazma motoru",
    "f.engine.d": "Hatalar satır içinde kırmızı, düzelt-sonra-geç ya da devam et modları, satır hep ortada, sayfalar kendiliğinden döner, boşta geçen süre sayılmaz.",
    "f.effects.t": "Efektler ve arka planlar",
    "f.effects.d": "14 yazma efekti, 9 imleç izi ve 10 hareketli arka plan — Havai fişek, Köz, Gece gökyüzü, Dijital yağmur, Şömine…",
    "f.looks.t": "10 görünüm, 31 tema, 38 font",
    "f.looks.d": "Tek tıkla tema, font, imleç ve arka plan. Her tema düzenlenebilir; fontlar arasında Literata, Atkinson Hyperlegible ve OpenDyslexic var.",
    "f.stats.t": "Dürüst istatistikler",
    "f.stats.d": "Anlık ve ortalama WPM, doğruluk, seriler, haftalık ve aylık grafikler, klavye ısı haritası — JSON olarak dışa aktarılabilir.",
    "f.local.t": "Önce yerel, çevrimdışı da çalışır",
    "f.local.d": "İlerlemen tarayıcında durur. Uygulama olarak kur; açtığın kitaplar çevrimdışı da yazılabilir. İsteğe bağlı olarak kendi sunucunda senkronize et.",
    "f.lang.t": "English ve Türkçe",
    "f.lang.d": "Tüm arayüz İngilizce ya da Türkçe, Türkçe Q ekran klavyesi ve her dilde başlıkları anlayan arama.",
    "f.texts.t": "Kendi metinlerin",
    "f.texts.d": "Bir deneme, bir şiir ya da notlarını yapıştır — veya bir web sayfasını içe aktar — ve sayfa sayfa yaz.",
    "f.private.t": "Tasarımdan gizli",
    "f.private.d": "Analitik yok, tarayıcından üçüncü taraflara istek yok: fontlar, kapaklar ve kitaplar kendi Inktype sunucundan gelir.",
    "lib.title": "Üç kütüphane, tek arama kutusu",
    "lib.pg": "Tüm telifsiz kitaplar; kapaklar, türler ve dillerle.",
    "lib.ws": "Türk edebiyatı — Ömer Seyfettin, Halit Ziya, Namık Kemal, Yunus Emre ve daha fazlası.",
    "lib.pga": "Hayvan Çiftliği ve Bin Dokuz Yüz Seksen Dört gibi klasikler; Türkiye ve AB'de kamu malı.",
    "lib.note": "Başlıklar Wikidata ile çözülür; Türkçe bir başlık özgün eseri bulur — bir yazarın adını yazmak da profilini açar.",
    "host.title": "Tek komutla senin",
    "host.lead": "Inktype tek bir konteyner ve bir SQLite dosyasıdır. Dizüstünde, Raspberry Pi'de ya da küçük bir sunucuda çalıştır.",
    "host.docker": "Docker",
    "host.dev": "Geliştirme",
    "host.copy": "Kopyala",
    "host.stack": "Next.js 14 · TypeScript · Tailwind · Prisma + SQLite · Vitest · Playwright · MIT lisansı",
    "vibe.badge": "Vibe coding ile yapıldı",
    "vibe.title": "Sohbet ederek inşa edildi",
    "vibe.p1": "Inktype vibe coding ile yapıldı: tasarım, yazma motoru, kütüphaneler, efektler, çeviriler ve testler; ne istediğini anlatan ve her adımı gözden geçiren bir insanın yönlendirmesiyle bir yapay zekâ kodlama asistanıyla (Claude Code) birlikte yazıldı.",
    "vibe.p2": "Her gönderimde çalışan birim ve uçtan uca testlerle korunuyor ve açık kaynak — insanlardan da asistanlarından da katkılar memnuniyetle karşılanır.",
    "vibe.cta": "Kodu incele",
    "footer.text": "Inktype, MIT lisansıyla ücretsiz ve açık kaynaktır. Kitap metinleri:",
    "footer.nothanks": "Bu sayfa hiçbir takip aracı ve üçüncü taraf font yüklemez.",
  };
  const EN = {};
  document.querySelectorAll("[data-i18n]").forEach((el) => (EN[el.dataset.i18n] = el.textContent));

  const DEMO = {
    en: {
      title: "A Tale of Two Cities",
      text: "It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness, it was the epoch of belief.",
    },
    tr: {
      title: "Kesik Bıyık",
      text: "Darvin denilen adamın sözüne inanmalı. Evet. İnsanlar mutlaka maymundan türemişler! Çünkü işte neyi görsek hemen taklit ediyoruz.",
    },
  };

  let lang = (navigator.language || "").toLowerCase().startsWith("tr") ? "tr" : "en";
  try {
    const saved = localStorage.getItem("inktype-site-lang");
    if (saved === "en" || saved === "tr") lang = saved;
  } catch {
    /* storage unavailable: keep the browser language */
  }

  function applyLang() {
    document.documentElement.lang = lang;
    const dict = lang === "tr" ? TR : EN;
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const v = dict[el.dataset.i18n];
      if (v) el.textContent = v;
    });
    document.getElementById("lang").textContent = lang === "tr" ? "EN" : "TR";
    document.querySelector(".console-bar .crumb").lastChild.textContent = " " + DEMO[lang].title;
    reset();
  }
  document.getElementById("lang").addEventListener("click", () => {
    lang = lang === "tr" ? "en" : "tr";
    try {
      localStorage.setItem("inktype-site-lang", lang);
    } catch {
      /* ignore */
    }
    applyLang();
  });

  /* ------------------------------------------------------------ particles */
  const canvas = document.getElementById("fx");
  const ctx = canvas.getContext("2d");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let parts = [];
  let raf = 0;
  let last = 0;
  function size() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  size();
  addEventListener("resize", size);
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (xs) => xs[Math.floor(Math.random() * xs.length)];
  function add(p) {
    if (reduced) return;
    parts.push(Object.assign({ vx: 0, vy: 0, age: 0, life: 0.6, size: 2, g: 0, drag: 0.92, shape: "dot", glow: false, grow: 0 }, p));
    if (!raf) {
      last = performance.now();
      raf = requestAnimationFrame(loop);
    }
  }
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    parts = parts.filter((p) => (p.age += dt) < p.life);
    for (const p of parts) {
      p.vy += p.g * dt;
      const d = Math.pow(p.drag, dt * 60);
      p.vx *= d;
      p.vy *= d;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const t = p.age / p.life;
      const s = Math.max(0.1, p.size * (1 + p.grow * p.age));
      ctx.globalAlpha = p.shape === "blot" ? 0.35 * (1 - t) : 1 - t * t;
      ctx.fillStyle = p.color;
      ctx.shadowBlur = p.glow ? s * 3 : 0;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      if (p.shape === "star") {
        for (let i = 0; i < 8; i++) {
          const r = i % 2 ? s * 0.35 : s;
          const a = (i * Math.PI) / 4;
          ctx.lineTo(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r);
        }
      } else ctx.arc(p.x, p.y, s, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    raf = parts.length ? requestAnimationFrame(loop) : 0;
  }
  const FIRE = ["#ffb347", "#ff7b29", "#ffd166"];
  const CONF = ["#ff5d8f", "#ffd166", "#06d6a0", "#4cc9f0", "#b388ff"];
  function burst(fx, x, y, h) {
    if (fx === "sparkle") for (let i = 0; i < 3; i++) add({ x: x + rand(-10, 10), y: y + rand(-h / 2, 0), vy: rand(-20, 0), life: 0.6, size: rand(2.5, 4.5), color: "#7fd6a4", shape: "star", glow: true, grow: -1 });
    if (fx === "embers") for (let i = 0; i < 4; i++) add({ x, y, vx: rand(-15, 15), vy: rand(-60, -30), life: rand(0.6, 1), size: rand(1, 2.2), color: pick(FIRE), glow: true, drag: 0.98 });
    if (fx === "fireworks") for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, v = rand(80, 140); add({ x, y: y - h / 2, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.8, size: 1.6, color: pick(CONF), g: 160, glow: true }); }
    if (fx === "ink") add({ x, y: y - h / 3, life: 0.9, size: h * 0.35, color: "#7fd6a4", shape: "blot", grow: 1.4, drag: 1 });
  }

  /* ----------------------------------------------------------- typing demo */
  // The console types by itself (a "ghost typist" at ~65 wpm, with the odd
  // mistake it goes back to fix). Clicking or typing hands it to the visitor;
  // after a few idle seconds the ghost takes over again. Visitors are never
  // blocked by a mistake: wrong letters turn red and the cursor moves on.
  const box = document.getElementById("demo");
  const out = document.getElementById("demo-text");
  const input = document.getElementById("demo-input");
  const hint = document.getElementById("demo-hint");
  const wpmEl = document.getElementById("wpm");
  const accEl = document.getElementById("acc");
  const chips = [...document.querySelectorAll(".fx-chips button")];
  const GHOST_FX = ["sparkle", "embers", "fireworks", "ink"];
  let text = "";
  let marks = []; // "ok" | "bad" per typed character
  let keys = 0;
  let good = 0;
  let start = 0;
  let effect = "none";
  let userPicked = false;
  let spans = [];
  let mode = "ghost"; // "ghost" | "user"
  let ghostTimer = 0;
  let idleTimer = 0;
  let round = 0;
  let visible = true;

  const HINT = {
    en: { ghost: "Watching a demo — click to try it yourself", user: "Your turn — just type. Esc hands it back." },
    tr: { ghost: "Demo oynuyor — kendin denemek için tıkla", user: "Sıra sende — yazmaya başla. Esc ile demoya dön." },
  };

  function setEffect(fx, fromUser) {
    effect = fx;
    if (fromUser) userPicked = true;
    chips.forEach((x) => x.setAttribute("aria-checked", String(x.dataset.fx === fx)));
  }

  function reset() {
    text = DEMO[lang].text;
    marks = [];
    keys = good = start = 0;
    out.innerHTML = "";
    spans = [...text].map((ch) => {
      const s = document.createElement("span");
      s.textContent = ch;
      out.appendChild(s);
      return s;
    });
    render();
    wpmEl.textContent = "—";
    accEl.textContent = "—";
    hint.textContent = HINT[lang][mode];
  }

  function render() {
    const pos = marks.length;
    spans.forEach((s, i) => {
      s.className = i < pos ? (marks[i] === "ok" ? "t" : "e") : i === pos ? "c" : "";
    });
  }

  function stats() {
    const min = (performance.now() - start) / 60000;
    const correct = marks.filter((m) => m === "ok").length;
    if (min > 0.02) wpmEl.textContent = String(Math.round(correct / 5 / min));
    accEl.textContent = `${Math.round((good / Math.max(1, keys)) * 1000) / 10}%`;
  }

  function press(ch) {
    const pos = marks.length;
    if (pos >= text.length) return;
    if (!start) start = performance.now();
    keys++;
    const ok = ch === text[pos] || ch.toLocaleLowerCase(lang) === text[pos].toLocaleLowerCase(lang);
    if (ok) good++;
    marks.push(ok ? "ok" : "bad");
    if (ok && effect !== "none") {
      const r = spans[pos].getBoundingClientRect();
      burst(effect, r.left + r.width / 2, r.bottom - r.height * 0.25, r.height);
    }
    render();
    stats();
  }

  function backspace() {
    if (marks.length === 0) return;
    marks.pop();
    render();
  }

  /* The ghost typist */
  function ghostStep() {
    clearTimeout(ghostTimer);
    if (mode !== "ghost") return;
    if (!visible || document.hidden) {
      ghostTimer = setTimeout(ghostStep, 400);
      return;
    }
    const pos = marks.length;
    if (pos >= text.length) {
      // Finished: pause, then start again with the next effect.
      ghostTimer = setTimeout(() => {
        round++;
        if (!userPicked) setEffect(GHOST_FX[round % GHOST_FX.length], false);
        reset();
        ghostStep();
      }, 2200);
      return;
    }
    const last = marks[pos - 1];
    if (last === "bad") {
      backspace(); // notice the typo and fix it
      ghostTimer = setTimeout(ghostStep, 260);
      return;
    }
    const target = text[pos];
    const typo = pos > 3 && /[a-zçğıöşü]/i.test(target) && Math.random() < 0.035;
    press(typo ? String.fromCharCode(target.charCodeAt(0) + 1) : target);
    // ~65 wpm with a human rhythm: slower after spaces and punctuation.
    const base = 150 + Math.random() * 80;
    const pauseAfter = /[.,!?;]/.test(target) ? 260 : target === " " ? 60 : 0;
    ghostTimer = setTimeout(ghostStep, base + pauseAfter + (typo ? 220 : 0));
  }

  function toGhost() {
    mode = "ghost";
    input.blur();
    reset();
    ghostTimer = setTimeout(ghostStep, 700);
  }

  function toUser() {
    if (mode === "user") return;
    mode = "user";
    clearTimeout(ghostTimer);
    reset();
    box.classList.add("user");
  }

  function scheduleIdle() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      box.classList.remove("user");
      toGhost();
    }, 9000);
  }

  box.addEventListener("click", () => {
    toUser();
    input.focus({ preventScroll: true });
    scheduleIdle();
  });
  box.addEventListener("keydown", (e) => {
    if (e.target === box && (e.key.length === 1 || e.key === "Enter")) {
      toUser();
      input.focus({ preventScroll: true });
    }
  });
  input.addEventListener("input", () => {
    toUser();
    for (const ch of input.value) press(ch);
    input.value = "";
    if (marks.length >= text.length) setTimeout(() => mode === "user" && reset(), 1500);
    scheduleIdle();
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      backspace();
      scheduleIdle();
    } else if (e.key === "Escape") {
      clearTimeout(idleTimer);
      box.classList.remove("user");
      toGhost();
    }
  });

  chips.forEach((b) =>
    b.addEventListener("click", () => {
      setEffect(b.dataset.fx, true);
    }),
  );

  // Only animate while the console is on screen.
  new IntersectionObserver((entries) => (visible = entries.some((e) => e.isIntersecting))).observe(box);

  /* ----------------------------------------------------- search showcase */
  const EXAMPLES = {
    en: [
      ["hayvan çiftliği", "Animal Farm", "George Orwell · PG Australia"],
      ["crime and punishment", "Crime and Punishment", "Fyodor Dostoyevsky · Project Gutenberg"],
      ["ömer seyfettin", "Ömer Seyfettin", "Author profile · 24 works on Vikikaynak"],
      ["orwell", "George Orwell", "Author profile · 1903–1950"],
    ],
    tr: [
      ["hayvan çiftliği", "Animal Farm", "George Orwell · PG Avustralya"],
      ["suç ve ceza", "Crime and Punishment", "Fyodor Dostoyevski · Project Gutenberg"],
      ["ömer seyfettin", "Ömer Seyfettin", "Yazar profili · Vikikaynak'ta 24 eser"],
      ["orwell", "George Orwell", "Yazar profili · 1903–1950"],
    ],
  };
  const qEl = document.getElementById("search-q");
  const hit = document.querySelector(".search-hit");
  let ex = 0;
  async function showcase() {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    for (;;) {
      const [query, title, meta] = EXAMPLES[lang][ex % EXAMPLES[lang].length];
      ex++;
      hit.classList.add("hidden");
      qEl.textContent = "";
      for (const ch of query) {
        qEl.textContent += ch;
        await sleep(reduced ? 0 : 90 + Math.random() * 60);
      }
      await sleep(350);
      hit.querySelector("b").textContent = title;
      hit.querySelector("span").textContent = meta;
      hit.classList.remove("hidden");
      await sleep(2600);
      if (reduced) return;
    }
  }

  /* -------------------------------------------------------- copy buttons */
  document.querySelectorAll(".copy").forEach((b) =>
    b.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(b.dataset.copy);
        b.classList.add("done");
        const old = b.textContent;
        b.textContent = "✓";
        setTimeout(() => {
          b.classList.remove("done");
          b.textContent = old;
        }, 1400);
      } catch {
        /* clipboard unavailable: the text stays selectable */
      }
    }),
  );

  applyLang();
  if (reduced) {
    // No animation: show a finished demo line instead of a typing one.
    marks = [...text].slice(0, 42).map(() => "ok");
    render();
  } else {
    setEffect(GHOST_FX[0], false); // start the show with an effect
    toGhost();
  }
  void showcase();
})();
