# Haul Bros — junk removal site

Static one-page site (plain HTML/CSS/JS, no build step). Deploy the folder as-is to Netlify, Vercel, GitHub Pages, Cloudflare Pages, etc.

## Before launch
1. Edit `js/config.js` — phone, email, hours, social links, optional starting prices.
2. Quote form: create a form endpoint (Formspree, Getform, Web3Forms…) and paste its URL into `formEndpoint`. Until then the form shows a "not connected" message. Check your provider's plan supports file uploads.
3. Replace placeholders: truck photo (hero), team photo (About), before/after shots (Gallery) with real photos (WebP, add `width`/`height` + `loading="lazy"`).
4. Reviews: replace the three placeholder cards with real customer reviews only.
5. Confirm the Service Area list and the "What We Don't Take" list match what you actually do.

Design decisions follow the `ui-ux-pro-max` skill in `.claude/skills/`.
