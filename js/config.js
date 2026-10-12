/* Edit this file with your real business info. Anything left blank keeps its placeholder. */
window.SITE = {
  phone: "(346) 229-9942",
  phoneDigits: "13462299942",   // used for tel:+13462299942 and sms:+13462299942 links
  email: "haulbroshauling@gmail.com",
  hours: "Mon–Fri 7 AM–7 PM, Sat 8 AM–5 PM, Sun closed",
  hoursEs: "Lun–Vie 7 AM–7 PM, Sáb 8 AM–5 PM, Dom cerrado",   // shown when Spanish is active
  instagram: "https://www.instagram.com/haulbros_/",
  facebook: "https://www.facebook.com/profile.php?id=61594964889182",
  tiktok: "",
  /* Quote form endpoint. Works with Formspree, Getform, Web3Forms, etc. */
  formEndpoint: "",     // e.g. "https://formspree.io/f/xxxxxxxx"

  /* Load-size price ranges in dollars: [low, high]. Shown as "$X – $Y". */
  prices: {
    single:  [70, 120],
    quarter: [150, 195],
    half:    [225, 275],
    three:   [295, 350],
    full:    [350, 425]
  },

  /* Single-item list shown on the page (display text only). */
  singleList: [
    { label: "Most single items (mattress, TV, washer, dryer, stove, couch, chair\u2026)", price: "$70 \u2013 $120" },
    { label: "Fridge, freezer or AC unit (refrigerant included)", price: "from $130" }
  ],


  /* Add-ons shown under the pricing cards (display text only; for loads of 2+ items). */
  addons: [
    { label: "Mattress or box spring", price: "+$50 each" },
    { label: "Appliance (washer, dryer, stove)", price: "+$50 each" },
    { label: "Fridge, freezer or AC unit (refrigerant removal included)", price: "+$75 each" },
    { label: "TVs and electronics", price: "+$25 each" },
    { label: "Tires", price: "+$15 each" },
    { label: "Concrete, dirt, shingles or heavy debris", price: "quoted on-site" }
  ]
};
