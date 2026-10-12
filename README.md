# Cakes by Richa — website

Static site (works on GitHub Pages, Netlify, Cloudflare Pages) + one small Cloudflare Worker for the AI design preview.

```
index.html          Home page
references.html     Reference photo gallery (clip codes)
order.html          Order form (FormSubmit) + AI preview
thanks.html         Page shown after submitting
css/style.css
js/config.js        ← YOUR SETTINGS (email, phone, Instagram, AI endpoint)
js/references-data.js ← YOUR REFERENCE PHOTOS + CODES
js/common.js        Clip storage, footer, nav
js/order.js         Form logic + AI preview
images/references/  Put reference photos here (placeholders included)
worker/             AI preview backend (Cloudflare Worker)
```

## 1. Fill in your details
Edit `js/config.js`: contact info (footer), `formsubmitEmail`, and `thankYouUrl` (your domain + `/thanks.html`).

## 2. Add reference photos
1. Put the photo in `images/references/` (e.g. `REF-009.jpg`; ~800×1000 px is ideal).
2. Add a line to `js/references-data.js`:
   ```js
   { code: "REF-009", title: "Marigold wedding", category: "Tiered", image: "images/references/REF-009.jpg", notes: "Fresh marigolds" },
   ```
Categories become filter buttons automatically. The 8 included images are placeholders — replace them with real photos of your cakes.

**How clipping works:** clipped codes are kept in `sessionStorage`, so they carry over to the order form as long as the customer stays in the same browser tab. They clear when the tab closes or after an order is sent. Customers can also type codes in by hand.

## 3. Host the site
GitHub Pages: push this folder to your repo, Settings → Pages → deploy from `main` / root. Your existing `cakebyrichaorderform.com` domain keeps working.

The first order sent through FormSubmit triggers an activation email to your inbox — click it once, then orders arrive normally (as a table, with the inspiration photo and AI design as attachments). Send a test order with both attachments to confirm they come through.

## 4. Turn on the AI preview (optional)
The preview uses OpenAI's image models. The API key must **not** go in the website, so a free Cloudflare Worker holds it.

1. Get an API key at platform.openai.com and **set a monthly spend limit** there.
2. In `worker/wrangler.toml`, set `ALLOWED_ORIGINS` to your site's address.
3. Deploy:
   ```bash
   cd worker
   npx wrangler login
   npx wrangler secret put OPENAI_API_KEY
   npx wrangler deploy
   ```
4. Copy the `https://cakes-by-richa-ai.<you>.workers.dev` URL into `aiEndpoint` in `js/config.js`.

The order form then shows the "AI design preview" section. It sends the customer's description + form details (flavor, colors, message…) + up to 4 clipped/uploaded reference photos to the image-edits endpoint, and returns a mock-up they can attach to the order.

Cost controls built in: 3 previews per browser session, 5 per minute per IP (Worker rate limit), prompt length cap, only your site's origin is allowed. Swap `IMAGE_MODEL` to `gpt-image-1-mini` or `IMAGE_QUALITY` to `low` to make each preview cheaper.

## Test locally
```bash
python3 -m http.server 8000
```
then open http://localhost:8000.
