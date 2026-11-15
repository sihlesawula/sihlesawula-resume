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

  /* ---- Resume dropdown (Download My CV) ---- */
  const dd = $(".nav-dd");
  if (dd) {
    const toggle = $(".dd-toggle", dd);
    const menu = $(".dropdown", dd);
    const setDD = (open) => {
      toggle.setAttribute("aria-expanded", String(open));
      menu.hidden = !open;
    };
    toggle.addEventListener("click", (e) => { e.stopPropagation(); setDD(menu.hidden); });
    menu.addEventListener("click", () => setDD(false));
    document.addEventListener("click", (e) => { if (!dd.contains(e.target)) setDD(false); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !menu.hidden) { setDD(false); toggle.focus(); }
    });
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

  /* ---- Carousels (certificates + testimonials share this) ---- */
  $$(".carousel").forEach((carousel) => {
    const track = $(".carousel-track", carousel);
    const prev = $("[data-dir='prev']", carousel);
    const next = $("[data-dir='next']", carousel);
    if (!track || !prev || !next) return;

    // One step = width of a slide plus the flex gap.
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
    const go = (dir) => {
      track.scrollBy({ left: dir * step(), behavior: reduceMotion ? "auto" : "smooth" });
      // Belt and braces: refresh the arrows once the scroll has settled.
      setTimeout(update, reduceMotion ? 50 : 500);
    };

    prev.addEventListener("click", () => go(-1));
    next.addEventListener("click", () => go(1));
    track.addEventListener("scroll", update, { passive: true });
    track.addEventListener("scrollend", update);
    window.addEventListener("resize", update);
    update();
  });

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

  /* ---- Contact form ----
     Static site, so there is no server of our own. The form posts to FormSubmit, which forwards the
     message to my inbox. Without JavaScript the form still works as a normal POST to the same service. */
  const form = $("#contact-form");
  if (form) {
    const status = $("#form-status");
    const button = $("button[type='submit']", form);
    const direct = form.getAttribute("action").replace(/^https?:\/\/formsubmit\.co\//, "");
    const say = (html, cls) => {
      status.className = "form-note" + (cls ? " " + cls : "");
      status.innerHTML = html;
    };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;

      const data = new FormData(form);
      if (data.get("_honey")) return; // a bot filled the hidden field: silently drop it

      const name = String(data.get("name") || "").trim();
      const email = String(data.get("email") || "").trim();
      const topic = String(data.get("topic") || "").trim();
      const message = String(data.get("message") || "").trim();

      button.disabled = true;
      button.textContent = "Sending…";
      say("");

      try {
        const res = await fetch(form.dataset.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            name, email, topic, message,
            _subject: `Portfolio message: ${topic} (${name})`,
            _replyto: email,
            _template: "table",
            _captcha: "false",
          }),
        });
        const out = await res.json().catch(() => ({}));
        if (!res.ok || String(out.success) !== "true") throw new Error(out.message || "send failed");

        form.reset();
        say("Thanks, your message has been sent.", "is-ok");
      } catch (err) {
        say(`That didn't go through. Please email me directly at <a href="mailto:${direct}">${direct}</a>.`, "is-error");
      } finally {
        button.disabled = false;
        button.textContent = "Send message";
      }
    });
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
