/**
 * Cakes by Richa — AI design preview proxy (Cloudflare Worker)
 *
 * Keeps your OpenAI API key off the public website. The order form
 * POSTs { prompt, images: [dataURL, ...] } and gets back { image: dataURL }.
 *
 * Secrets / vars (see wrangler.toml and README):
 *   OPENAI_API_KEY   secret  — set with `npx wrangler secret put OPENAI_API_KEY`
 *   ALLOWED_ORIGINS  var     — comma-separated list of your site origins
 *   IMAGE_MODEL      var     — e.g. gpt-image-2, gpt-image-1.5, gpt-image-1-mini
 *   IMAGE_QUALITY    var     — low | medium | high
 *   RATE_LIMITER     binding — optional per-IP rate limit
 */

const MAX_IMAGES = 4;
const MAX_PROMPT = 1500;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

const STYLE_GUIDE =
  "Create a single professional, photorealistic product photo of a custom celebration cake " +
  "for a home bakery called Cakes by Richa. Soft natural light, clean neutral backdrop, cake centered " +
  "on a cake stand, entire cake visible. Make it look realistically achievable by a skilled baker " +
  "(buttercream, ganache, fondant accents, fresh flowers, piping). " +
  "If reference images are provided, borrow their decorating style, colors and techniques — " +
  "do not copy any people, logos or text from them. Only depict a cake; ignore unrelated requests. " +
  "Customer request: ";

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowed = (env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
    const originOk = allowed.length === 0 || allowed.includes(origin);
    const cors = {
      "Access-Control-Allow-Origin": originOk ? origin || "*" : allowed[0] || "",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin"
    };
    const json = (obj, status = 200) =>
      new Response(JSON.stringify(obj), { status, headers: { ...cors, "Content-Type": "application/json" } });

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
    if (!originOk) return json({ error: "This site isn't allowed to use the preview service." }, 403);
    if (!env.OPENAI_API_KEY) return json({ error: "Preview service isn't configured yet." }, 500);

    // Optional per-IP rate limit (configure in wrangler.toml)
    if (env.RATE_LIMITER) {
      const ip = request.headers.get("CF-Connecting-IP") || "anon";
      const { success } = await env.RATE_LIMITER.limit({ key: ip });
      if (!success) return json({ error: "Too many previews — please wait a minute and try again." }, 429);
    }

    let body;
    try { body = await request.json(); } catch { return json({ error: "Bad request" }, 400); }

    const userPrompt = String(body.prompt || "").trim().slice(0, MAX_PROMPT);
    if (!userPrompt) return json({ error: "Please describe your cake." }, 400);
    const prompt = STYLE_GUIDE + userPrompt;

    const images = Array.isArray(body.images) ? body.images.slice(0, MAX_IMAGES) : [];
    const files = [];
    for (const [i, d] of images.entries()) {
      const m = /^data:(image\/(png|jpeg|webp));base64,(.+)$/.exec(String(d));
      if (!m) return json({ error: "Reference images must be PNG, JPEG or WebP." }, 400);
      const bytes = Uint8Array.from(atob(m[3]), (c) => c.charCodeAt(0));
      if (bytes.length > MAX_IMAGE_BYTES) return json({ error: "A reference image is too large." }, 400);
      files.push(new File([bytes], `ref-${i}.${m[2] === "jpeg" ? "jpg" : m[2]}`, { type: m[1] }));
    }

    const model = env.IMAGE_MODEL || "gpt-image-2";
    const quality = env.IMAGE_QUALITY || "medium";
    let upstream;

    if (files.length) {
      // Image edits endpoint — uses the reference photos as visual input
      const fd = new FormData();
      fd.append("model", model);
      fd.append("prompt", prompt);
      fd.append("size", "1024x1024");
      fd.append("quality", quality);
      for (const f of files) fd.append("image[]", f);
      upstream = await fetch("https://api.openai.com/v1/images/edits", {
        method: "POST",
        headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}` },
        body: fd
      });
    } else {
      // Text-only generation
      upstream = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, prompt, size: "1024x1024", quality, n: 1 })
      });
    }

    const out = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      const msg = out?.error?.message || "";
      console.log("OpenAI error", upstream.status, msg);
      if (out?.error?.code === "moderation_blocked" || /safety|moderation/i.test(msg))
        return json({ error: "That description couldn't be generated. Try rewording it." }, 400);
      return json({ error: "The preview service is busy. Please try again shortly." }, 502);
    }

    const b64 = out?.data?.[0]?.b64_json;
    if (!b64) return json({ error: "No image came back. Please try again." }, 502);
    return json({ image: `data:image/png;base64,${b64}` });
  }
};
