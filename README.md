# Haul Bros — junk removal site

Static one-page site (plain HTML/CSS/JS, no build step). Deploy the folder as-is to Netlify, Vercel, GitHub Pages, Cloudflare Pages, etc.

## Before launch
1. Edit `js/config.js` — phone, email, hours, social links, optional starting prices.
2. Quote form: create a form endpoint (Formspree, Getform, Web3Forms…) and paste its URL into `formEndpoint`. Until then the form shows a "not connected" message. Check your provider's plan supports file uploads.
3. Photos live in `assets/photos/` (optimized copies of the originals, max 1600px, under 400 KB), shown in the About Us section.
4. Confirm the Service Area list and the exceptions list ("We Take Almost Everything!") match what you actually do.

Design decisions follow the `ui-ux-pro-max` skill in `.claude/skills/`.

## Pricing
- Load-size price ranges, add-ons and the single-item list are in `js/config.js` (display text; the lowest Single Item price is $70 to match the hero).

## Spanish (EN / ES)
- All page text lives in `js/i18n.js` (`window.I18N.en` / `.es`). Static text in `index.html` carries `data-i18n="key"` (or `data-i18n-attr="aria-label:key"`); text built by scripts uses `t("key", {vars})`. Add new text to both languages.
- The site starts in English, or Spanish when the browser language starts with "es". The EN / ES toggle in the header switches everything. The choice is kept in memory only (no localStorage).
- Spanish business hours are `hoursEs` in `js/config.js`. The "¡Se Habla Español!" badge is fixed text.

## Service area
- The city list is plain HTML in the `#area` section of `index.html`. The "within 35 miles of Fulshear" wording is in `js/i18n.js` (`and_surrounding_areas`).

## Branding
- Logo files: `assets/logo-wide-*.webp` and `assets/logo-round-*.webp` are resized copies of `haulbros_logo_wide.png` / `haulbros_profile.png` (the originals are not loaded by the page). Brand red `#E10600` and the dark palette are defined at the top of `css/style.css`.
