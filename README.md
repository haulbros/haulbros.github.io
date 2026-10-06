# Haul Bros — junk removal site

Static one-page site (plain HTML/CSS/JS, no build step). Deploy the folder as-is to Netlify, Vercel, GitHub Pages, Cloudflare Pages, etc.

## Before launch
1. Edit `js/config.js` — phone, email, hours, social links, optional starting prices.
2. Quote form: create a form endpoint (Formspree, Getform, Web3Forms…) and paste its URL into `formEndpoint`. Until then the form shows a "not connected" message. Check your provider's plan supports file uploads.
3. Photos live in `assets/photos/` (optimized copies of the originals, max 1600px, under 400 KB). Add more to the Gallery in `index.html` with `width`/`height` and `loading="lazy"`.
4. Reviews: the section is hidden. Replace the three placeholder cards in `index.html` with real reviews, then set `showReviews: true` in `js/config.js`.
5. Confirm the Service Area list and the exceptions list ("We Take Almost Everything!") match what you actually do.

Design decisions follow the `ui-ux-pro-max` skill in `.claude/skills/`.

## Pricing, add-ons and the 3D load estimator
- Load-size price ranges, add-ons and every estimator setting (trailer size, item volumes in cubic feet, add-on fees, tier limits, "Surprise me" mixes) are in `js/config.js`.
- The estimator (`js/estimator.js`, `js/estimator-3d.js`) loads three.js r128 from cdnjs only when the section nears the viewport. If WebGL, the CDN or JavaScript animation is unavailable (or the visitor prefers reduced motion) it falls back to a 2D version with the same cards, fill bar, tier and price.

## Spanish (EN / ES)
- All page text lives in `js/i18n.js` (`window.I18N.en` / `.es`). Static text in `index.html` carries `data-i18n="key"` (or `data-i18n-attr="aria-label:key"`); text built by scripts uses `t("key", {vars})`. Add new text to both languages.
- The site starts in English, or Spanish when the browser language starts with "es". The EN / ES toggle (header and mobile menu) switches everything, including the estimator, add-ons and the text-message body. The choice is kept in memory only (no localStorage).
- Spanish business hours are `hoursEs` in `js/config.js`. The "¡Se Habla Español!" badge is fixed text (it is already Spanish).

## Service area map
- `js/map.js` lazy-loads Leaflet 1.9.4 from cdnjs with OpenStreetMap tiles. Center, radius (35 miles) and city list are in `serviceMap` in `js/config.js`; only cities inside the circle are drawn. If Leaflet cannot load, a styled city list is shown instead.
- The "within 35 miles of Fulshear" wording in `index.html` and `js/i18n.js` is plain text, so update it too if you change the radius.
