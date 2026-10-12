/* Order form: clipped references, live summary, AI preview, submit */
(function () {
  const cfg = window.CBR_CONFIG || {};
  const form = document.getElementById("order-form");
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));

  // ---------- FormSubmit wiring ----------
  form.action = "https://formsubmit.co/" + (cfg.formsubmitEmail || "").trim();
  $("next-url").value = cfg.thankYouUrl || new URL("thanks.html", location.href).href;

  // Earliest allowed date: 7 days out
  const min = new Date(); min.setDate(min.getDate() + 7);
  $("date").min = min.toISOString().slice(0, 10);

  // ---------- Reference codes ----------
  const chips = $("ref-chips");
  function renderChips() {
    const codes = CBRClips.all();
    $("ref-codes-hidden").value = codes.join(", ");
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
    renderSummary();
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
  document.addEventListener("clips:changed", renderChips);

  // ---------- Live summary ----------
  function val(name) {
    const el = form.elements[name];
    if (!el) return "";
    if (el instanceof RadioNodeList) return el.value;
    return el.value;
  }
  function renderSummary() {
    const rows = [
      ["Date", val("Date needed") && new Date(val("Date needed") + "T12:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })],
      ["Occasion", val("Occasion")],
      ["Type", val("Cake type")],
      ["Servings", val("Servings")],
      ["Flavor", val("Flavor")],
      ["Frosting", val("Frosting")],
      ["Theme", val("Colors / theme")],
      ["References", CBRClips.all().join(", ")],
      ["AI design", $("ai-file").files.length ? "Attached" : ""]
    ].filter(([, v]) => v);
    $("summary").innerHTML = rows.length
      ? rows.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("")
      : `<dt>—</dt><dd style="text-align:left">Start filling in the form</dd>`;
  }
  form.addEventListener("input", renderSummary);
  form.addEventListener("change", renderSummary);

  // ---------- AI preview ----------
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
  }

  // Load an image (URL or File) and return a downscaled JPEG data URL
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
        if (src instanceof File) URL.revokeObjectURL(img.src);
      };
      img.onerror = () => reject(new Error("Couldn't load an image"));
      img.src = src instanceof File ? URL.createObjectURL(src) : src;
    });
  }

  function buildPrompt() {
    const desc = $("ai-prompt").value.trim();
    const refs = CBRClips.all().map(CBRRefByCode).filter(Boolean);
    const parts = [
      desc,
      `Cake type: ${val("Cake type")}.`,
      val("Flavor") && `Flavor: ${val("Flavor")}.`,
      val("Frosting") && `Frosting: ${val("Frosting")}.`,
      val("Colors / theme") && `Colors/theme: ${val("Colors / theme")}.`,
      val("Occasion") && `Occasion: ${val("Occasion")}.`,
      val("Message on cake") && `Piped lettering on the cake reads exactly: "${val("Message on cake")}".`,
      refs.length && `Reference images (in order): ${refs.map((r) => `${r.code} – ${r.title}`).join("; ")}.`
    ];
    return parts.filter(Boolean).join(" ");
  }

  let lastBlob = null;

  $("ai-go").addEventListener("click", async () => {
    const status = $("ai-status");
    status.classList.remove("err");
    if (!$("ai-prompt").value.trim()) {
      status.textContent = "Add a short description first.";
      status.classList.add("err"); $("ai-prompt").focus(); return;
    }
    if (triesUsed() >= MAX_TRIES) return;

    $("ai-go").disabled = true;
    status.innerHTML = `<span class="spinner"></span> Mixing ideas… this can take up to a minute.`;

    try {
      const max = cfg.maxAiImages || 4;
      const sources = CBRClips.all().map(CBRRefByCode).filter(Boolean).map((r) => r.image);
      const upload = $("inspiration").files[0];
      if (upload) sources.unshift(upload);
      const images = await Promise.all(sources.slice(0, max).map((s) => toDataUrl(s)));

      const prompt = buildPrompt();
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
      $("ai-attached").hidden = true;
      $("ai-prompt-hidden").value = prompt;
      lastBlob = await (await fetch(data.image)).blob();
      status.textContent = "Here's your preview. Like it? Attach it to your order.";
    } catch (err) {
      status.textContent = err.message || "Something went wrong. Please try again.";
      status.classList.add("err");
    } finally {
      updateTriesLabel();
    }
  });

  $("ai-attach").addEventListener("click", async () => {
    if (!lastBlob) return;
    // Re-encode as JPEG to keep the email attachment small
    const url = URL.createObjectURL(lastBlob);
    const jpg = await toDataUrl(url, 1024);
    URL.revokeObjectURL(url);
    const blob = await (await fetch(jpg)).blob();
    const file = new File([blob], "ai-cake-design.jpg", { type: "image/jpeg" });
    try {
      const dt = new DataTransfer();
      dt.items.add(file);
      $("ai-file").files = dt.files;
      $("ai-attached").hidden = false;
      renderSummary();
    } catch (e) {
      $("ai-status").textContent = "Your browser can't attach it automatically — please download it and add it as your inspiration photo.";
      $("ai-status").classList.add("err");
    }
  });

  // ---------- Submit ----------
  form.addEventListener("submit", (e) => {
    const err = $("form-error");
    err.textContent = "";
    $("ref-codes-hidden").value = CBRClips.all().join(", ");
    const up = $("inspiration").files[0];
    if (up && up.size > 5 * 1024 * 1024) {
      e.preventDefault(); err.textContent = "Your inspiration photo is over 5 MB — please choose a smaller one."; return;
    }
    if (!form.checkValidity()) {
      e.preventDefault();
      const bad = form.querySelector(":invalid");
      err.textContent = "Please fill in the required fields marked *.";
      if (bad) bad.focus();
      return;
    }
    // Remove empty AI file input so FormSubmit doesn't receive an empty attachment
    if (!$("ai-file").files.length) $("ai-file").disabled = true;
  });

  renderChips();
})();
