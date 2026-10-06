/* Edit this file with your real business info. Anything left blank keeps its placeholder. */
window.SITE = {
  phone: "(346) 229-9942",
  phoneDigits: "13462299942",   // used for tel:+13462299942 and sms:+13462299942 links
  email: "haulbroshauling@gmail.com",
  hours: "Mon–Fri 7 AM–7 PM, Sat 8 AM–5 PM, Sun closed",
  instagram: "https://www.instagram.com/haulbros_/",
  facebook: "https://www.facebook.com/profile.php?id=61594964889182",
  tiktok: "",
  /* Set to true once you have real customer reviews in the Reviews section of index.html */
  showReviews: false,
  /* Quote form endpoint. Works with Formspree, Getform, Web3Forms, etc. */
  formEndpoint: "",     // e.g. "https://formspree.io/f/xxxxxxxx"

  /* Load-size price ranges in dollars: [low, high]. Shown as "$X – $Y". */
  prices: {
    single:  [125, 150],
    quarter: [195, 250],
    half:    [275, 350],
    three:   [350, 425],
    full:    [425, 500]
  },

  /* Add-ons shown under the pricing cards (display text only).
     The estimator charges these via each item's `fee` below — keep the two in sync. */
  addons: [
    { label: "Mattress or box spring", price: "+$50 each" },
    { label: "Appliance (washer, dryer, stove)", price: "+$75 each" },
    { label: "Fridge, freezer or AC unit", price: "+$75 plus $50 refrigerant removal" },
    { label: "TVs and electronics", price: "+$25 each" },
    { label: "Tires", price: "+$15 each" },
    { label: "Concrete, dirt, shingles or heavy debris", price: "quoted on-site" }
  ],

  /* ---------------- 3D load estimator ---------------- */
  estimator: {
    soundDefault: false,            // sound effects start OFF
    trailer: { widthFt: 5, lengthFt: 10, loadHeightFt: 4, fullCuFt: 200 },  // 5x10 bed, 4 ft usable height = 200 cu ft
    maxTrailers: 2,                 // loads beyond this ask the customer to text us
    maxPlacements: 60,              // performance cap on 3D objects
    celebrateAtCuFt: 190,           // confetti + "Trailer full!" when the load reaches this volume
    /* Tier = smallest tier whose maxCuFt holds the load (round up). "single" applies only when exactly 1 unit is loaded. */
    tiers: [
      { key: "single",  label: "Single Item",         short: "Single",  maxCuFt: 50 },
      { key: "quarter", label: "1/4 Trailer",         short: "1/4",     maxCuFt: 50 },
      { key: "half",    label: "1/2 Trailer",         short: "1/2",     maxCuFt: 100 },
      { key: "three",   label: "3/4 Trailer",         short: "3/4",     maxCuFt: 150 },
      { key: "full",    label: "Full Trailer (5x10)", short: "Full",    maxCuFt: 200 }
    ],
    /* Item list. vol = approximate cubic feet of trailer space used (per placement).
       units = how many real items one tap adds (boxes and bags come in 5s).
       fee = add-on dollars per placement (fridge = $75 + $50 refrigerant). */
    items: [
      { id: "couch",    label: "Couch",          name: "Couch",       plural: "Couches",     units: 1, vol: 50 },
      { id: "loveseat", label: "Loveseat",       name: "Loveseat",    plural: "Loveseats",   units: 1, vol: 32 },
      { id: "recliner", label: "Recliner/Chair", name: "Chair",       plural: "Chairs",      units: 1, vol: 22 },
      { id: "mattress", label: "Mattress",       name: "Mattress",    plural: "Mattresses",  units: 1, vol: 28, fee: 50 },
      { id: "boxspring",label: "Box Spring",     name: "Box Spring",  plural: "Box Springs", units: 1, vol: 24, fee: 50 },
      { id: "fridge",   label: "Fridge",         name: "Fridge",      plural: "Fridges",     units: 1, vol: 36, fee: 125 },
      { id: "washer",   label: "Washer",         name: "Washer",      plural: "Washers",     units: 1, vol: 16, fee: 75 },
      { id: "dryer",    label: "Dryer",          name: "Dryer",       plural: "Dryers",      units: 1, vol: 16, fee: 75 },
      { id: "stove",    label: "Stove",          name: "Stove",       plural: "Stoves",      units: 1, vol: 16, fee: 75 },
      { id: "dresser",  label: "Dresser",        name: "Dresser",     plural: "Dressers",    units: 1, vol: 24 },
      { id: "table",    label: "Table",          name: "Table",       plural: "Tables",      units: 1, vol: 20 },
      { id: "tv",       label: "TV",             name: "TV",          plural: "TVs",         units: 1, vol: 5,  fee: 25 },
      { id: "grill",    label: "Grill",          name: "Grill",       plural: "Grills",      units: 1, vol: 12 },
      { id: "tires",    label: "Tires",          name: "Tire",        plural: "Tires",       units: 1, vol: 3,  fee: 15 },
      { id: "boxes",    label: "Boxes (x5)",     name: "Box",         plural: "Boxes",       units: 5, vol: 15 },
      { id: "bags",     label: "Trash Bags (x5)",name: "Trash Bag",   plural: "Trash Bags",  units: 5, vol: 15 },
      { id: "yard",     label: "Yard Debris",    name: "Yard Debris Pile", plural: "Yard Debris Piles", units: 1, vol: 30 }
    ],
    /* "Surprise me" mixes: item id -> number of taps */
    presets: [
      { name: "Garage cleanout",  mix: { boxes: 3, bags: 1, table: 1, grill: 1, tires: 4, yard: 1 } },
      { name: "Bedroom clear-out", mix: { mattress: 1, boxspring: 1, dresser: 1, tv: 1, boxes: 1 } },
      { name: "Living room redo", mix: { couch: 1, loveseat: 1, recliner: 1, tv: 1, table: 1 } },
      { name: "Appliance swap",   mix: { fridge: 1, washer: 1, dryer: 1, stove: 1 } },
      { name: "Yard cleanup",     mix: { yard: 3, bags: 2, grill: 1 } }
    ]
  }
};
