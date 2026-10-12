/* Shared helpers: clipped-reference store, header badge, footer */
(function () {
  const KEY = "cbr_clipped_refs";

  function safeGet() {
    try { return JSON.parse(sessionStorage.getItem(KEY)) || []; } catch (e) { return []; }
  }
  function safeSet(list) {
    try { sessionStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { /* storage blocked */ }
    document.dispatchEvent(new CustomEvent("clips:changed", { detail: list }));
  }

  const Clips = {
    all: () => safeGet(),
    has: (code) => safeGet().includes(code),
    add(code) {
      code = String(code).trim().toUpperCase();
      if (!code) return;
      const list = safeGet();
      if (!list.includes(code)) { list.push(code); safeSet(list); }
    },
    remove(code) { safeSet(safeGet().filter((c) => c !== code)); },
    toggle(code) { Clips.has(code) ? Clips.remove(code) : Clips.add(code); },
    clear() { safeSet([]); }
  };
  window.CBRClips = Clips;

  window.CBRRefByCode = function (code) {
    return (window.CBR_REFERENCES || []).find((r) => r.code.toUpperCase() === String(code).toUpperCase());
  };

  function updateBadges() {
    const n = Clips.all().length;
    document.querySelectorAll("[data-clip-count]").forEach((el) => {
      el.textContent = n;
      el.hidden = n === 0;
    });
  }

  function renderFooter() {
    const f = document.getElementById("site-footer");
    const cfg = window.CBR_CONFIG || {};
    const c = cfg.contact || {};
    if (!f) return;
    const items = [];
    if (c.email) items.push(`<a href="mailto:${c.email}">${c.email}</a>`);
    if (c.phone) items.push(`<a href="tel:${c.phone.replace(/[^\d+]/g, "")}">${c.phone}</a>`);
    if (c.instagram) items.push(`<a href="https://instagram.com/${c.instagram}" target="_blank" rel="noopener">@${c.instagram}</a>`);
    f.innerHTML = `
      <div class="footer-inner" id="contact">
        <div class="footer-brand">
          <span class="logo-mark" aria-hidden="true">✿</span>
          <div>
            <p class="footer-name">${cfg.businessName || "Cakes by Richa"}</p>
            <p class="muted">${c.location || ""}</p>
          </div>
        </div>
        <div class="footer-contact">
          <p class="eyebrow">Contact</p>
          <p class="contact-links">${items.join('<span aria-hidden="true">·</span>')}</p>
        </div>
        <nav class="footer-nav" aria-label="Footer">
          <a href="index.html">Home</a>
          <a href="references.html">Reference photos</a>
          <a href="order.html">Order a cake</a>
        </nav>
      </div>
      <p class="footer-fine">© ${new Date().getFullYear()} ${cfg.businessName || "Cakes by Richa"} · Made to order with love</p>`;
  }

  function markNav() {
    const page = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".site-nav a").forEach((a) => {
      if (a.getAttribute("href") === page) a.setAttribute("aria-current", "page");
    });
  }

  document.addEventListener("clips:changed", updateBadges);
  document.addEventListener("DOMContentLoaded", () => {
    renderFooter(); markNav(); updateBadges();
    const t = document.querySelector(".nav-toggle");
    if (t) t.addEventListener("click", () => {
      const open = document.body.classList.toggle("nav-open");
      t.setAttribute("aria-expanded", open);
    });
  });
})();
