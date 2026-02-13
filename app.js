(() => {
  const header = document.getElementById("header");
  const burger = document.getElementById("burger");
  const menu = document.getElementById("menu");
  const backToTop = document.getElementById("backToTop");

  // Year in footer
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Mobile menu
  if (burger && menu) {
    burger.addEventListener("click", () => {
      const open = menu.classList.toggle("open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });

    menu.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => {
        menu.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Header state + backToTop visibility
  const setHeaderState = () => {
    const y = window.scrollY || 0;
    if (header) header.classList.toggle("scrolled", y > 24);

    const hero = document.querySelector(".hero");
    if (hero && header) {
      const heroRect = hero.getBoundingClientRect();
      const heroVisible = heroRect.bottom > 70;
      header.classList.toggle("on-hero", heroVisible);
    }

    if (backToTop) backToTop.classList.toggle("show", y > 500);
  };

  window.addEventListener("scroll", setHeaderState, { passive: true });
  window.addEventListener("resize", setHeaderState);
  window.addEventListener("load", setHeaderState);
  setHeaderState();

  if (backToTop) {
    backToTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // Theme switching
  const themeSections = [...document.querySelectorAll("[data-theme]")];
  const THEMES = ["theme-sand", "theme-aqua", "theme-teal"];

  const themeObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visible) return;

      const nextTheme = visible.target.getAttribute("data-theme");
      if (!nextTheme) return;

      const currentTheme = THEMES.find((t) => document.body.classList.contains(t));
      if (currentTheme === nextTheme) return;

      document.body.classList.add(nextTheme);
      if (currentTheme) document.body.classList.remove(currentTheme);
    },
    { threshold: [0.25, 0.35, 0.5, 0.65] }
  );

  themeSections.forEach((sec) => themeObserver.observe(sec));

  // Reveal
  const revealEls = [...document.querySelectorAll(".reveal")];
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add("in");
      });
    },
    { threshold: 0.14 }
  );

  revealEls.forEach((el) => revealObserver.observe(el));

  // Portfolio stagger reveal
  const pfGrids = [...document.querySelectorAll(".pf-grid[data-gallery]")];
  const pfObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          pfObserver.unobserve(e.target);
        }
      });
    },
    { threshold: 0.18 }
  );

  pfGrids.forEach((grid) => {
    const shots = [...grid.querySelectorAll("a.pf-shot")];
    shots.forEach((a, idx) => {
      a.classList.add("pf-reveal");
      a.style.transitionDelay = `${Math.min(idx * 55, 440)}ms`;
      pfObserver.observe(a);
    });
  });

  // HERO slideshow
  const slidesWrap = document.getElementById("heroSlides");
  if (slidesWrap) {
    const slides = [...slidesWrap.querySelectorAll(".hero-slide")];
    let i = 0;

    const next = () => {
      if (!slides.length) return;
      slides[i].classList.remove("is-active");
      i = (i + 1) % slides.length;
      slides[i].classList.add("is-active");
    };
    setInterval(next, 5200);
  }

  // ===========================
  // WORK cards (thumbs + prev/next) - păstrăm logica ta
  // ===========================
  const projects = [...document.querySelectorAll("[data-project]")];
  projects.forEach((card) => {
    const main = card.querySelector("[data-main]");
    const thumbsWrap = card.querySelector("[data-thumbs]");
    const thumbs = thumbsWrap ? [...thumbsWrap.querySelectorAll("img[data-src]")] : [];
    const prevBtn = card.querySelector("[data-prev]");
    const nextBtn = card.querySelector("[data-next]");
    let idx = 0;

    const setActive = (newIdx) => {
      if (!thumbs.length || !main) return;
      idx = (newIdx + thumbs.length) % thumbs.length;
      thumbs.forEach((t) => t.classList.remove("is-active"));
      thumbs[idx].classList.add("is-active");
      main.src = thumbs[idx].dataset.src;
    };

    // păstrăm click-ul pe thumbs pentru sincronizarea imaginii mari
    thumbs.forEach((t, j) => t.addEventListener("click", () => setActive(j)));
    prevBtn?.addEventListener("click", () => setActive(idx - 1));
    nextBtn?.addEventListener("click", () => setActive(idx + 1));

    // expunem setActive + getIdx pe card (pt sincronizare după lightbox)
    card.__workThumbs = thumbs;
    card.__workSetActive = setActive;
  });

  // ===========================
  // Portfolio Lightbox (al tău)
  // + îmbunătățire: suport pentru "Șantier"
  // ===========================
  const lb = document.getElementById("lightbox");
  const lbImg = document.getElementById("lbImg");
  const lbCloseEls = lb ? [...lb.querySelectorAll("[data-lb-close]")] : [];
  const lbPrev = lb ? lb.querySelector("[data-lb-prev]") : null;
  const lbNext = lb ? lb.querySelector("[data-lb-next]") : null;

  let currentGallery = [];
  let currentIndex = 0;
  let scrollYBeforeLb = 0;

  // NEW: dacă lightbox a fost deschis din ȘANTIER, ținem minte cardul
  let lbSource = null; // "portfolio" | "work"
  let lbWorkCard = null;

  const openLightbox = (gallery, index, source = "portfolio", workCard = null) => {
    if (!lb || !lbImg) return;
    currentGallery = gallery;
    currentIndex = index;

    lbSource = source;
    lbWorkCard = workCard;

    lbImg.src = currentGallery[currentIndex];
    lb.classList.add("open");
    lb.setAttribute("aria-hidden", "false");

    scrollYBeforeLb = window.scrollY || 0;
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    if (!lb) return;

    // NEW: dacă a fost din ȘANTIER, sincronizăm poza mare + active thumb cu ultima poză văzută
    if (lbSource === "work" && lbWorkCard && typeof currentIndex === "number") {
      const setActive = lbWorkCard.__workSetActive;
      if (typeof setActive === "function") {
        setActive(currentIndex);
      }
    }

    lb.classList.remove("open");
    lb.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    window.scrollTo(0, scrollYBeforeLb);

    lbSource = null;
    lbWorkCard = null;
  };

  const stepLightbox = (dir) => {
    if (!currentGallery.length || !lbImg) return;
    currentIndex = (currentIndex + dir + currentGallery.length) % currentGallery.length;
    lbImg.src = currentGallery[currentIndex];
  };

  // Portfolio -> lightbox
  pfGrids.forEach((grid) => {
    const links = [...grid.querySelectorAll("a.pf-shot[href]")];
    const gallery = links.map((a) => a.getAttribute("href"));

    links.forEach((a, idx) => {
      a.addEventListener("click", (ev) => {
        ev.preventDefault();
        openLightbox(gallery, idx, "portfolio", null);
      });
    });
  });

  lbCloseEls.forEach((el) => el.addEventListener("click", closeLightbox));
  lbPrev?.addEventListener("click", () => stepLightbox(-1));
  lbNext?.addEventListener("click", () => stepLightbox(1));

  window.addEventListener("keydown", (e) => {
    if (lb && lb.classList.contains("open")) {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") stepLightbox(-1);
      if (e.key === "ArrowRight") stepLightbox(1);
    }
  });

  // ===========================
  // ȘANTIER -> lightbox (cea mai bună variantă UX)
  // Click pe poza mare SAU thumbnails => fullscreen
  // + când închizi: rămâne sincronizat proiectul
  // ===========================
  const workCards = [...document.querySelectorAll(".work-card[data-project]")];
  workCards.forEach((card) => {
    const main = card.querySelector("img.work-main[data-main]");
    const thumbs = card.__workThumbs || [];
    if (!main || !thumbs.length) return;

    const gallery = thumbs.map((t) => t.dataset.src);

    // cursors
    main.style.cursor = "zoom-in";
    thumbs.forEach((t) => (t.style.cursor = "zoom-in"));

    // click pe poza mare -> lightbox cu indexul imaginii curente
    main.addEventListener("click", () => {
      const src = main.getAttribute("src") || "";
      const file = src.split("/").pop();
      const idx = gallery.findIndex((g) => g.split("/").pop() === file);
      openLightbox(gallery, idx >= 0 ? idx : 0, "work", card);
    });

    // click pe thumbs -> lightbox exact pe poza aia
    thumbs.forEach((t, idx) => {
      t.addEventListener("click", () => {
        openLightbox(gallery, idx, "work", card);
      });
    });
  });

  // FAQ accordion (1 open)
  document.querySelectorAll(".faq-q").forEach((btn) => {
    btn.addEventListener("click", () => {
      const expanded = btn.getAttribute("aria-expanded") === "true";
      document.querySelectorAll(".faq-q").forEach((b) => b.setAttribute("aria-expanded", "false"));
      btn.setAttribute("aria-expanded", expanded ? "false" : "true");
    });
  });

  // Smooth scroll internal anchors
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (!id || id === "#") return;

      const el = document.querySelector(id);
      if (!el) return;

      e.preventDefault();
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  // LEGAL MODAL
  const legalModal = document.getElementById("legalModal");
  const legalClose = legalModal?.querySelector("[data-legal-close]");
  const legalBackdrop = legalModal?.querySelector("[data-legal-backdrop]");
  const legalPages = legalModal ? [...legalModal.querySelectorAll("[data-legal-page]")] : [];
  let scrollYBeforeLegal = 0;

  const openLegal = (key) => {
    if (!legalModal) return;

    legalPages.forEach((p) => (p.style.display = "none"));
    const page = legalModal.querySelector(`[data-legal-page="${key}"]`);
    if (page) page.style.display = "block";

    legalModal.classList.add("open");
    legalModal.setAttribute("aria-hidden", "false");

    scrollYBeforeLegal = window.scrollY || 0;
    document.body.style.overflow = "hidden";
  };

  const closeLegal = () => {
    if (!legalModal) return;
    legalModal.classList.remove("open");
    legalModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    window.scrollTo(0, scrollYBeforeLegal);
  };

  document.querySelectorAll("[data-legal]").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const key = link.getAttribute("data-legal");
      if (!key) return;
      openLegal(key);
    });
  });

  legalClose?.addEventListener("click", closeLegal);
  legalBackdrop?.addEventListener("click", closeLegal);

  window.addEventListener("keydown", (e) => {
    if (!legalModal || !legalModal.classList.contains("open")) return;
    if (e.key === "Escape") closeLegal();
  });
})();

(function () {
  const floatStack = document.querySelector(".float-stack");
  const footer = document.querySelector("footer.footer");
  if (!floatStack || !footer) return;

  const update = () => {
    const vh = window.innerHeight;
    const fr = footer.getBoundingClientRect();
    const overlap = vh - fr.top;
    const base = 16;
    const extra = Math.max(0, overlap + 20);
    floatStack.style.bottom = base + extra + "px";
  };

  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();
})();
