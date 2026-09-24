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
  const box = document.getElementById("demo");
  const out = document.getElementById("demo-text");
  const input = document.getElementById("demo-input");
  const wpmEl = document.getElementById("wpm");
  const accEl = document.getElementById("acc");
  let text = "";
  let pos = 0;
  let wrong = false;
  let keys = 0;
  let good = 0;
  let start = 0;
  let effect = "none";
  let spans = [];

  function reset() {
    text = DEMO[lang].text;
    pos = 0;
    wrong = false;
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
  }
  function render() {
    spans.forEach((s, i) => (s.className = i < pos ? "t" : i === pos ? (wrong ? "e c" : "c") : ""));
  }
  function type(ch) {
    if (pos >= text.length) return reset();
    if (!start) start = performance.now();
    keys++;
    if (ch === text[pos]) {
      good++;
      wrong = false;
      const r = spans[pos].getBoundingClientRect();
      pos++;
      if (effect !== "none") burst(effect, r.left + r.width / 2, r.bottom - r.height * 0.25, r.height);
    } else wrong = true;
    render();
    const min = (performance.now() - start) / 60000;
    if (min > 0.02) wpmEl.textContent = Math.round(pos / 5 / min);
    accEl.textContent = `${Math.round((good / keys) * 1000) / 10}%`;
    if (pos >= text.length) setTimeout(reset, 1600);
  }
  box.addEventListener("click", () => input.focus({ preventScroll: true }));
  box.addEventListener("keydown", (e) => {
    if (e.target === box && e.key.length === 1) {
      input.focus({ preventScroll: true });
    }
  });
  input.addEventListener("input", () => {
    for (const ch of input.value) type(ch);
    input.value = "";
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Tab") return;
    if (e.key === "Escape") input.blur();
  });

  document.querySelectorAll(".fx-chips button").forEach((b) =>
    b.addEventListener("click", () => {
      effect = b.dataset.fx;
      document.querySelectorAll(".fx-chips button").forEach((x) => x.setAttribute("aria-checked", String(x === b)));
      input.focus({ preventScroll: true });
    }),
  );

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
})();
