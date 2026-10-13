/* Order page: clipped references → Google Form link, optional AI preview */
(function () {
  const cfg = window.CBR_CONFIG || {};
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));
  const PLACEHOLDER = "REF-TEST";

  // ---------- Google Form link ----------
  function formUrl() {
    const link = (cfg.googleFormLink || "").trim();
    if (!link) return "";
    const codes = CBRClips.all().join(", ");
    if (link.includes(PLACEHOLDER)) {
      // Pre-filled link: swap the placeholder for the real codes (or blank it)
      return link.replace(PLACEHOLDER, encodeURIComponent(codes));
    }
    return link;
  }
  function updateFormLink() {
    const url = formUrl();
    $("form-link").hidden = !url;
    $("form-missing").hidden = !!url;
    if (url) $("form-link").href = url;
  }

  // ---------- Reference codes ----------
  const chips = $("ref-chips");
  function renderChips() {
    const codes = CBRClips.all();
    $("copy-codes").hidden = codes.length === 0;
    if (!codes.length) {
      chips.innerHTML = `<p class="empty-note">No references yet — <a href="references.html">browse the gallery</a> and clip a few.</p>`;
    } else {
      chips.innerHTML = codes.map((code) => {
        const r = CBRRefByCode(code);
        return `<div class="ref-chip ${r ? "" : "unknown"}">
          ${r ? `<img src="${esc(r.image)}" alt="">` : `<img alt="">`}
          <div><div class="c">${esc(code)}</div><div class="t">${r ? esc(r.title) : "Code not found"}</div></div>
          <button type="button" data-remove="${esc(code)}" aria-label="Remove ${esc(code)}">×</button>
        </div>`;
      }).join("");
    }
    updateFormLink();
  }
  chips.addEventListener("click", (e) => {
    const b = e.target.closest("[data-remove]"); if (b) CBRClips.remove(b.dataset.remove);
  });
  function addTyped() {
    const v = $("code-input").value.trim();
    if (!v) return;
    v.split(/[\s,]+/).filter(Boolean).forEach((c) => CBRClips.add(c));
    $("code-input").value = "";
  }
  $("code-add").addEventListener("click", addTyped);
  $("code-input").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); addTyped(); } });
  $("copy-codes").addEventListener("click", async (e) => {
    const btn = e.currentTarget;
    try { await navigator.clipboard.writeText(CBRClips.all().join(", ")); btn.textContent = "Copied!"; }
    catch (_) { btn.textContent = CBRClips.all().join(", "); }
    setTimeout(() => (btn.textContent = "Copy codes"), 1600);
  });
  document.addEventListener("clips:changed", renderChips);

  // ---------- AI preview (only if aiEndpoint is set) ----------
  const MAX_TRIES = 3;
  const TRY_KEY = "cbr_ai_tries";
  const triesUsed = () => { try { return +sessionStorage.getItem(TRY_KEY) || 0; } catch (e) { return 0; } };
  const bumpTries = () => { try { sessionStorage.setItem(TRY_KEY, triesUsed() + 1); } catch (e) {} };
  function updateTriesLabel() {
    const left = MAX_TRIES - triesUsed();
    $("ai-left").textContent = left > 0 ? `${left} preview${left === 1 ? "" : "s"} left this session` : "Preview limit reached for this session";
    $("ai-go").disabled = left <= 0;
  }

  if (cfg.aiEndpoint) {
    $("ai-section").hidden = false;
    updateTriesLabel();
  } else {
    $("form-step").textContent = "2";
  }

  function toDataUrl(src, maxSide = 1024) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
        const c = document.createElement("canvas");
        c.width = Math.round(img.naturalWidth * scale);
        c.height = Math.round(img.naturalHeight * scale);
        const ctx = c.getContext("2d");
        ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", 0.88));
      };
      img.onerror = () => reject(new Error("Couldn't load a reference image"));
      img.src = src;
    });
  }

  $("ai-go").addEventListener("click", async () => {
    const status = $("ai-status");
    status.classList.remove("err");
    const desc = $("ai-prompt").value.trim();
    if (!desc) { status.textContent = "Add a short description first."; status.classList.add("err"); $("ai-prompt").focus(); return; }
    if (triesUsed() >= MAX_TRIES) return;

    $("ai-go").disabled = true;
    status.innerHTML = `<span class="spinner"></span> Mixing ideas… this can take up to a minute.`;
    try {
      const refs = CBRClips.all().map(CBRRefByCode).filter(Boolean).slice(0, cfg.maxAiImages || 4);
      const images = await Promise.all(refs.map((r) => toDataUrl(r.image)));
      const prompt = desc + (refs.length ? ` Reference images (in order): ${refs.map((r) => `${r.code} – ${r.title}`).join("; ")}.` : "");
      const res = await fetch(cfg.aiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, images })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.image) throw new Error(data.error || `Preview service error (${res.status})`);
      bumpTries();
      $("ai-img").src = data.image;
      $("ai-download").href = data.image;
      $("ai-result").hidden = false;
      status.textContent = "Here's your preview! Download it to include with your order.";
    } catch (err) {
      status.textContent = err.message || "Something went wrong. Please try again.";
      status.classList.add("err");
    } finally {
      updateTriesLabel();
    }
  });

  renderChips();
})();
