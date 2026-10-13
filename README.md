# Cakes by Richa — website

Static site (works on GitHub Pages, Netlify, Cloudflare Pages) + one small Cloudflare Worker for the AI design preview.

```
index.html          Home page
references.html     Reference photo gallery (clip codes)
order.html          Order page: clipped codes + link to your Google Form (+ optional AI preview)
css/style.css
js/config.js        ← YOUR SETTINGS (contact info, Google Form link, AI endpoint)
js/references-data.js ← YOUR REFERENCE PHOTOS + CODES
js/common.js        Clip storage, footer, nav
js/order.js         Form logic + AI preview
images/references/  Put reference photos here (placeholders included)
worker/             AI preview backend (Cloudflare Worker)
```

## 1. Set up your Google Form
1. Create your order form at forms.google.com. Include a short-answer question called **Reference codes**.
2. Make the codes fill in automatically:
   - In the form editor, click **⋮** (top right) → **Get pre-filled link**.
   - Type `REF-TEST` into the Reference codes question (leave the rest blank).
   - Click **Get link** → **Copy link**.
3. Paste that link into `googleFormLink` in `js/config.js`. The site replaces `REF-TEST` with the customer's clipped codes.
   (A plain form link also works — codes just won't be pre-filled.)
4. In the form's **Responses** tab, link it to a Google Sheet and turn on email notifications (⋮ → "Get email notifications for new responses").

Also fill in your contact info in `js/config.js` for the footer.

## 2. Add reference photos
1. Put the photo in `images/references/` (e.g. `REF-009.jpg`; ~800×1000 px is ideal).
2. Add a line to `js/references-data.js`:
   ```js
   { code: "REF-009", title: "Marigold wedding", category: "Tiered", image: "images/references/REF-009.jpg", notes: "Fresh marigolds" },
   ```
Categories become filter buttons automatically. The 8 included images are placeholders — replace them with real photos of your cakes.

**How clipping works:** clipped codes are kept in `sessionStorage`, so they carry over to the order page (and into the Google Form link) as long as the customer stays in the same browser tab. They clear when the tab closes. Customers can also type codes in by hand.

## 3. Host the site
GitHub Pages: push this folder to your repo, Settings → Pages → deploy from `main` / root. Your existing `cakebyrichaorderform.com` domain keeps working.

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

The order page then shows the "AI design preview" section. It sends the customer's description + up to 4 clipped reference photos to the image-edits endpoint, and returns a mock-up they can download and upload in your Google Form (if you add a file-upload question; Google requires respondents to sign in for uploads).

Cost controls built in: 3 previews per browser session, 5 per minute per IP (Worker rate limit), prompt length cap, only your site's origin is allowed. Swap `IMAGE_MODEL` to `gpt-image-1-mini` or `IMAGE_QUALITY` to `low` to make each preview cheaper.

## Test locally
```bash
python3 -m http.server 8000
```
then open http://localhost:8000.
