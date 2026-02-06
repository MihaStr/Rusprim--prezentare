(() => {
  const header = document.getElementById("header");
  const burger = document.getElementById("burger");
  const menu = document.getElementById("menu");
  const backToTop = document.getElementById("backToTop");

  // Mobile menu
  if (burger && menu) {
    burger.addEventListener("click", () => {
      const open = menu.classList.toggle("open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });

    menu.querySelectorAll("a").forEach(a => {
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

  const themeObserver = new IntersectionObserver((entries) => {
    const visible = entries
      .filter(e => e.isIntersecting)
      .sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visible) return;

    const nextTheme = visible.target.getAttribute("data-theme");
    if (!nextTheme) return;

    const currentTheme = THEMES.find(t => document.body.classList.contains(t));
    if (currentTheme === nextTheme) return;

    document.body.classList.add(nextTheme);
    if (currentTheme) document.body.classList.remove(currentTheme);
  }, { threshold: [0.25, 0.35, 0.5, 0.65] });

  themeSections.forEach(sec => themeObserver.observe(sec));

  // Reveal
  const revealEls = [...document.querySelectorAll(".reveal")];
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) e.target.classList.add("in");
    });
  }, { threshold: 0.14 });

  revealEls.forEach(el => revealObserver.observe(el));

  // Portfolio stagger reveal
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

  // WORK cards (thumbs + prev/next)
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

    thumbs.forEach((t, j) => t.addEventListener("click", () => setActive(j)));
    prevBtn?.addEventListener("click", () => setActive(idx - 1));
    nextBtn?.addEventListener("click", () => setActive(idx + 1));
  });

  // Portfolio Lightbox
  const lb = document.getElementById("lightbox");
  const lbImg = document.getElementById("lbImg");
  const lbCloseEls = lb ? [...lb.querySelectorAll("[data-lb-close]")] : [];
  const lbPrev = lb ? lb.querySelector("[data-lb-prev]") : null;
  const lbNext = lb ? lb.querySelector("[data-lb-next]") : null;

  let currentGallery = [];
  let currentIndex = 0;
  let scrollYBeforeLb = 0;

  const openLightbox = (gallery, index) => {
    if (!lb || !lbImg) return;
    currentGallery = gallery;
    currentIndex = index;

    lbImg.src = currentGallery[currentIndex];
    lb.classList.add("open");
    lb.setAttribute("aria-hidden", "false");

    scrollYBeforeLb = window.scrollY || 0;
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    if (!lb) return;
    lb.classList.remove("open");
    lb.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    window.scrollTo(0, scrollYBeforeLb);
  };

  const stepLightbox = (dir) => {
    if (!currentGallery.length || !lbImg) return;
    currentIndex = (currentIndex + dir + currentGallery.length) % currentGallery.length;
    lbImg.src = currentGallery[currentIndex];
  };

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
  lbPrev?.addEventListener("click", () => stepLightbox(-1));
  lbNext?.addEventListener("click", () => stepLightbox(1));

  window.addEventListener("keydown", (e) => {
    if (lb && lb.classList.contains("open")) {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") stepLightbox(-1);
      if (e.key === "ArrowRight") stepLightbox(1);
    }
  });

  // FAQ accordion (1 open)
  document.querySelectorAll(".faq-q").forEach(btn => {
    btn.addEventListener("click", () => {
      const expanded = btn.getAttribute("aria-expanded") === "true";
      document.querySelectorAll(".faq-q").forEach(b => b.setAttribute("aria-expanded", "false"));
      btn.setAttribute("aria-expanded", expanded ? "false" : "true");
    });
  });

  // Smooth scroll internal anchors
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

  // LEGAL MODAL
  const legalModal = document.getElementById("legalModal");
  const legalClose = legalModal?.querySelector("[data-legal-close]");
  const legalBackdrop = legalModal?.querySelector("[data-legal-backdrop]");
  const legalPages = legalModal ? [...legalModal.querySelectorAll("[data-legal-page]")] : [];
  let scrollYBeforeLegal = 0;

  const openLegal = (key) => {
    if (!legalModal) return;

    legalPages.forEach(p => p.style.display = "none");
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

  document.querySelectorAll("[data-legal]").forEach(link => {
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
(function(){
  const floatStack = document.querySelector('.float-stack');
  const footer = document.querySelector('footer.footer');
  if(!floatStack || !footer) return;

  const update = () => {
    const vh = window.innerHeight;
    const fr = footer.getBoundingClientRect();
    const overlap = vh - fr.top; // cât intră footer-ul peste ecran
    const base = 16;
    const extra = Math.max(0, overlap + 20); // 20px buffer
    floatStack.style.bottom = (base + extra) + 'px';
  };

  window.addEventListener('scroll', update, { passive:true });
  window.addEventListener('resize', update);
  update();
})();

