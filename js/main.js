/* Sihle Sawula — portfolio. Vanilla JS, no dependencies.
   Everything here is progressive enhancement: the page reads fine without it. */
(() => {
  "use strict";

  const root = document.documentElement;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Theme toggle (remembers the choice; falls back to the OS setting) ---- */
  const themeBtn = $("#theme-toggle");
  const systemDark = () => window.matchMedia("(prefers-color-scheme: dark)").matches;
  const currentTheme = () => root.dataset.theme || (systemDark() ? "dark" : "light");

  try {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") root.dataset.theme = saved;
  } catch (_) { /* storage blocked: ignore */ }

  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const next = currentTheme() === "dark" ? "light" : "dark";
      root.dataset.theme = next;
      try { localStorage.setItem("theme", next); } catch (_) {}
    });
  }

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

  /* ---- Project filter ---- */
  const filterBtns = $$(".filter");
  const projects = $$(".project");
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const f = btn.dataset.filter;
      filterBtns.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      projects.forEach((p) => { p.hidden = !(f === "all" || p.dataset.category === f); });
    });
  });

  /* ---- Lightbox for design pieces ---- */
  const box = $("#lightbox");
  if (box && typeof box.showModal === "function") {
    const boxImg = $("img", box);
    const boxCap = $("figcaption", box);
    $$("[data-lightbox]").forEach((btn) => {
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
    $$("[data-lightbox]").forEach((btn) =>
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
