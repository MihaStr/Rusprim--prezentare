// RUSPRIM – app.js (premium)
// - hero slideshow auto
// - header: scrolled + theme by section
// - mobile menu
// - reveal on scroll
// - portfolio lightbox
// - work cards: thumbs + prev/next

(() => {
  const header = document.getElementById("header");
  const burger = document.getElementById("burger");
  const menu = document.getElementById("menu");

  // -------------------------
  // Mobile menu
  // -------------------------
  if (burger && menu) {
    burger.addEventListener("click", () => {
      const open = menu.classList.toggle("open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });

    // close on click
    menu.querySelectorAll("a").forEach(a => {
      a.addEventListener("click", () => {
        menu.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
      });
    });
  }

  // -------------------------
  // Header scrolled state + on-hero state
  // -------------------------
  const setHeaderState = () => {
    const y = window.scrollY || 0;
    header.classList.toggle("scrolled", y > 24);

    // on-hero only when top section is visible
    // we treat hero as first main section
    const hero = document.querySelector(".hero");
    if (!hero) return;
    const heroRect = hero.getBoundingClientRect();
    const heroVisible = heroRect.bottom > 70; // header height
    header.classList.toggle("on-hero", heroVisible);
  };

  window.addEventListener("scroll", setHeaderState, { passive: true });
  window.addEventListener("resize", setHeaderState);
  setHeaderState();

  // -------------------------
  // Theme switching by section (body class)
  // (5) fix: fără moment "fără temă" => elimină flash/linie
  // -------------------------
  const themeSections = [...document.querySelectorAll("[data-theme]")];
  const THEMES = ["theme-sand", "theme-aqua", "theme-teal"];

  const themeObserver = new IntersectionObserver((entries) => {
    const visible = entries
      .filter(e => e.isIntersecting)
      .sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visible) return;

    const nextTheme = visible.target.getAttribute("data-theme");
    if (!nextTheme) return;

    const currentTheme = THEMES.find(t => document.body.classList.contains(t));
    if (currentTheme === nextTheme) return;

    // Add new first, then remove old => no flash
    document.body.classList.add(nextTheme);
    if (currentTheme) document.body.classList.remove(currentTheme);
  }, { threshold: [0.25, 0.35, 0.5, 0.65] });

  themeSections.forEach(sec => themeObserver.observe(sec));

  // -------------------------
  // Reveal on scroll
  // -------------------------
  const revealEls = [...document.querySelectorAll(".reveal")];
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) e.target.classList.add("in");
    });
  }, { threshold: 0.14 });

  revealEls.forEach(el => revealObserver.observe(el));

  // -------------------------
  // (3) Portfolio: apar treptat la scroll (stagger premium)
  // -------------------------
  const pfGrids = [...document.querySelectorAll(".pf-grid[data-gallery]")];

  const pfObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        pfObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.18 });

  pfGrids.forEach(grid => {
    const shots = [...grid.querySelectorAll("a.pf-shot")];
    shots.forEach((a, idx) => {
      a.classList.add("pf-reveal");
      a.style.transitionDelay = `${Math.min(idx * 70, 420)}ms`;
      pfObserver.observe(a);
    });
  });

  // -------------------------
  // HERO slideshow auto
  // -------------------------
  const slidesWrap = document.getElementById("heroSlides");
  if (slidesWrap) {
    const slides = [...slidesWrap.querySelectorAll(".hero-slide")];
    let i = 0;

    const next = () => {
      slides[i].classList.remove("is-active");
      i = (i + 1) % slides.length;
      slides[i].classList.add("is-active");
    };

    // auto continuous
    setInterval(next, 5200);
  }

  // -------------------------
  // WORK cards (thumbs + prev/next)
  // -------------------------
  const projects = [...document.querySelectorAll("[data-project]")];

  projects.forEach(card => {
    const main = card.querySelector("[data-main]");
    const thumbsWrap = card.querySelector("[data-thumbs]");
    const thumbs = thumbsWrap ? [...thumbsWrap.querySelectorAll("img[data-src]")] : [];
    const prevBtn = card.querySelector("[data-prev]");
    const nextBtn = card.querySelector("[data-next]");
    let idx = 0;

    const setActive = (newIdx) => {
      if (!thumbs.length || !main) return;
      idx = (newIdx + thumbs.length) % thumbs.length;
      thumbs.forEach(t => t.classList.remove("is-active"));
      thumbs[idx].classList.add("is-active");
      main.src = thumbs[idx].dataset.src;
    };

    thumbs.forEach((t, j) => {
      t.addEventListener("click", () => setActive(j));
    });

    if (prevBtn) prevBtn.addEventListener("click", () => setActive(idx - 1));
    if (nextBtn) nextBtn.addEventListener("click", () => setActive(idx + 1));
  });

  // -------------------------
  // Portfolio Lightbox
  // -------------------------
  const lb = document.getElementById("lightbox");
  const lbImg = document.getElementById("lbImg");
  const lbCloseEls = lb ? [...lb.querySelectorAll("[data-lb-close]")] : [];
  const lbPrev = lb ? lb.querySelector("[data-lb-prev]") : null;
  const lbNext = lb ? lb.querySelector("[data-lb-next]") : null;

  let currentGallery = [];
  let currentIndex = 0;

  const openLightbox = (gallery, index) => {
    if (!lb || !lbImg) return;
    currentGallery = gallery;
    currentIndex = index;

    lbImg.src = currentGallery[currentIndex];
    lb.classList.add("open");
    lb.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    if (!lb) return;
    lb.classList.remove("open");
    lb.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  const stepLightbox = (dir) => {
    if (!currentGallery.length || !lbImg) return;
    currentIndex = (currentIndex + dir + currentGallery.length) % currentGallery.length;
    lbImg.src = currentGallery[currentIndex];
  };

  // collect galleries
  pfGrids.forEach(grid => {
    const links = [...grid.querySelectorAll("a.pf-shot[href]")];
    const gallery = links.map(a => a.getAttribute("href"));

    links.forEach((a, idx) => {
      a.addEventListener("click", (ev) => {
        ev.preventDefault();
        openLightbox(gallery, idx);
      });
    });
  });

  lbCloseEls.forEach(el => el.addEventListener("click", closeLightbox));
  if (lbPrev) lbPrev.addEventListener("click", () => stepLightbox(-1));
  if (lbNext) lbNext.addEventListener("click", () => stepLightbox(1));

  window.addEventListener("keydown", (e) => {
    if (!lb || !lb.classList.contains("open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") stepLightbox(-1);
    if (e.key === "ArrowRight") stepLightbox(1);
  });

  // -------------------------
  // Smooth scroll (optional but nice)
  // -------------------------
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (!id || id === "#") return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
})();
