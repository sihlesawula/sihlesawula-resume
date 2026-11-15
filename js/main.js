/* Sihle Sawula — portfolio. Vanilla JS, no dependencies.
   Everything here is progressive enhancement: the page reads fine without it. */
(() => {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Mobile menu ---- */
  const menuBtn = $("#menu-toggle");
  const links = $("#nav-links");
  if (menuBtn && links) {
    const setOpen = (open) => {
      links.classList.toggle("is-open", open);
      menuBtn.setAttribute("aria-expanded", String(open));
    };
    menuBtn.addEventListener("click", () => setOpen(!links.classList.contains("is-open")));
    links.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
  }

  /* ---- Age (computed so it never goes stale) ---- */
  const ageEl = $("[data-birth]");
  if (ageEl) {
    const b = new Date(ageEl.dataset.birth);
    const now = new Date();
    let age = now.getFullYear() - b.getFullYear();
    const hadBirthday = now.getMonth() > b.getMonth() || (now.getMonth() === b.getMonth() && now.getDate() >= b.getDate());
    if (!hadBirthday) age -= 1;
    if (age > 0 && age < 120) ageEl.textContent = age;
  }

  /* ---- Rotating role in the hero ---- */
  const roleEl = $("#role");
  if (roleEl && !reduceMotion) {
    const roles = (roleEl.dataset.roles || "").split("|").filter(Boolean);
    let i = 0;
    if (roles.length > 1) {
      setInterval(() => {
        roleEl.classList.add("is-swapping");
        setTimeout(() => {
          i = (i + 1) % roles.length;
          roleEl.textContent = roles[i];
          roleEl.classList.remove("is-swapping");
        }, 260);
      }, 2600);
    }
  }

  /* ---- Certificates carousel ---- */
  const carousel = $("#cert-carousel");
  if (carousel) {
    const track = $(".carousel-track", carousel);
    const prev = $("[data-dir='prev']", carousel);
    const next = $("[data-dir='next']", carousel);

    // Distance of one step = width of a slide plus the flex gap.
    const step = () => {
      const first = track.firstElementChild;
      if (!first) return track.clientWidth;
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return first.getBoundingClientRect().width + gap;
    };
    const update = () => {
      const max = track.scrollWidth - track.clientWidth - 2;
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= max;
    };
    prev.addEventListener("click", () => track.scrollBy({ left: -step(), behavior: reduceMotion ? "auto" : "smooth" }));
    next.addEventListener("click", () => track.scrollBy({ left: step(), behavior: reduceMotion ? "auto" : "smooth" }));
    track.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* ---- Lightbox (certificate images) ---- */
  const box = $("#lightbox");
  const lightboxTriggers = $$("[data-lightbox]");
  if (box && typeof box.showModal === "function") {
    const boxImg = $("img", box);
    const boxCap = $("figcaption", box);
    lightboxTriggers.forEach((btn) => {
      btn.addEventListener("click", () => {
        boxImg.src = btn.dataset.lightbox;
        boxImg.alt = btn.dataset.alt || "";
        boxCap.textContent = btn.dataset.alt || "";
        box.showModal();
      });
    });
    $("[data-close]", box).addEventListener("click", () => box.close());
    box.addEventListener("click", (e) => { if (e.target === box) box.close(); });
  } else {
    // No <dialog> support: just open the image in a new tab.
    lightboxTriggers.forEach((btn) =>
      btn.addEventListener("click", () => window.open(btn.dataset.lightbox, "_blank", "noopener")));
  }

  /* ---- Scroll-spy for nav links ---- */
  const navLinks = $$("#nav-links a[href^='#']");
  const sections = navLinks.map((a) => $(a.getAttribute("href"))).filter(Boolean);
  if ("IntersectionObserver" in window && sections.length) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        navLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + en.target.id));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach((s) => spy.observe(s));
  }

  /* ---- Reveal on scroll ---- */
  const revealEls = $$(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add("is-visible"); obs.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---- Footer year ---- */
  const yr = $("#year");
  if (yr) yr.textContent = new Date().getFullYear();
})();
