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
