// ONE place for all your articles and prices.
// The website reads it AND the server reads it (api/_lib.js), so a price is changed here only.
//
// One block = one article (one card on the Creation page).
//   "dress-35"  the unique id: it must be DIFFERENT for every article (two blocks with the same id: the second one erases the first).
//   title       the name the customer sees. Always write it the same way ("Two-piece", never "Two piece"),
//               exactly like a name of TYPES in js/catalog.js, because the preparation days and the filter come from there.
var PRODUCTS = {
  "Scrunchies": {
    title: "Scrunchies",
    desc: "Soft handmade scrunchies. Many colors are available, tell us your favorite.",
    price: 5000,
    photos: ["7", "10", "55"]
  },
  "Ruffle crochet hat": {
    title: "Ruffle crochet hat",
    desc: "A handmade ruffle hat in the colors you like.",
    sizes: { "Child": 15000, "Adult": 20000 },
    photos: ["3", "27", "29"]
  },
  "Crop top": {
    title: "Crop top",
    desc: "Handmade to measure. Choose your size and your colors.",
    sizes: { "Small": 20000, "Medium": 20000, "Large": 25000, "XL": 25000 },
    photos: ["4"]
  },
  "Crop top-48": {
    title: "Crop top",
    desc: "Handmade to measure. Choose your size and your colors.",
    sizes: { "Small": 20000, "Medium": 20000, "Large": 25000, "XL": 30000 },
    photos: ["48"]
  },
  "Crop top-5": {
    title: "Crop top",
    desc: "Handmade to measure. Choose your size and your colors.",
    sizes: { "Small": 25000, "Medium": 25000, "Large": 30000, "XL": 35000 },
    photos: ["5"]
  },
  "Crop top-8": {
    title: "Crop top",
    desc: "Handmade to measure. Choose your size and your colors.",
    sizes: { "Small": 15000, "Medium": 15000, "Large": 20000, "XL": 25000 },
    photos: ["8"]
  },
  "Crop top-9": {
    title: "Crop top",
    desc: "Handmade to measure. Choose your size and your colors.",
    sizes: { "Small": 20000, "Medium": 20000, "Large": 25000, "XL": 25000 },
    photos: ["9", "19"]
  },
  "Crop top-11": {
    title: "Crop top",
    desc: "Handmade to measure. Choose your size and your colors.",
    sizes: { "Small": 15000, "Medium": 15000, "Large": 20000, "XL": 20000 },
    photos: ["11"]
  },
  "Crop top-12": {
    title: "Crop top",
    desc: "Handmade to measure. Choose your size and your colors.",
    sizes: { "Small": 15000, "Medium": 15000, "Large": 20000, "XL": 20000 },
    photos: ["12"]
  },
  "Crop top-13": {
    title: "Crop top",
    desc: "Handmade to measure. Choose your size and your colors.",
    sizes: { "Small": 15000, "Medium": 15000, "Large": 20000, "XL": 20000 },
    photos: ["13"]
  },
  "Crop top-14": {
    title: "Crop top",
    desc: "Handmade to measure. Choose your size and your colors.",
    sizes: { "Small": 15000, "Medium": 15000, "Large": 20000, "XL": 20000 },
    photos: ["14"]
  },
  "Crop top-15": {
    title: "Crop top",
    desc: "Handmade to measure. Choose your size and your colors.",
    sizes: { "Small": 15000, "Medium": 15000, "Large": 20000, "XL": 20000 },
    photos: ["15"]
  },
  "Crop top-16": {
    title: "Crop top",
    desc: "Handmade to measure. Choose your size and your colors.",
    sizes: { "Small": 15000, "Medium": 15000, "Large": 20000, "XL": 20000 },
    photos: ["16"]
  },
  "Crop-top-37": {
    title: "Crop top",
    desc: "choose your favorite color",
    sizes: { "Small": 10000, "Medium": 10000, "Large": 15000, "XL": 20000 },
    photos: ["37"]
  },
  "Sweater-18": {
    title: "Sweater",
    desc: "A warm handmade crochet sweater, made to measure.",
    sizes: { "Small": 200000, "Medium": 200000, "Large": 200000, "XL": 210000 },
    photos: ["18"]
  },
  "Sweater": {
    title: "Sweater",
    desc: "A warm handmade crochet sweater, made to measure.",
    sizes: { "Small": 50000, "Medium": 60000, "Large": 80000, "XL": 90000 },
    photos: ["21", "28"]
  },
  "Dress-30": {
    title: "Dress",
    desc: "Handmade to measure, choose your colors.",
    sizes: { "Small": 45000, "Medium": 45000, "Large": 50000, "XL": 60000 },
    photos: ["30"]
  },
  "Dress-64": {
    title: "Dress",
    desc: "Handmade to measure, choose your colors.",
    sizes: { "Small": 30000, "Medium": 30000, "Large": 35000, "XL": 40000 },
    photos: ["64"]
  },
  "Dress-51": {
    title: "Dress",
    desc: "Handmade to measure, choose your colors.",
    sizes: { "Small": 60000, "Medium": 65000, "Large": 70000, "XL": 70000 },
    photos: ["51"]
  },
  "Dress-53": {
    title: "Dress",
    desc: "Handmade to measure, choose your colors.",
    sizes: { "Small": 30000, "Medium": 30000, "Large": 35000, "XL": 40000 },
    photos: ["53"]
  },
  "Dress-54": {
    title: "Dress",
    desc: "Handmade to measure, choose your colors.",
    sizes: { "Small": 35000, "Medium": 35000, "Large": 40000, "XL": 40000 },
    photos: ["54"]
  },
  "dress-31": {
    title: "Dress",
    desc: "Handmade to measure. Choose your size and your colors",
    sizes: { "Small": 70000, "Medium": 80000, "Large": 90000, "XL": 100000 },
    photos: ["31"]
  },
  "Dress-23": {
    title: "Dress",
    desc: "Handmade to measure. Choose your size and your colors",
    sizes: { "Small": 35000, "Medium": 35000, "Large": 40000, "XL": 50000 },
    photos: ["23"]
  },
  "Dress-24": {
    title: "Dress",
    desc: "Handmade to measure. Choose your size and your colors",
    sizes: { "Small": 35000, "Medium": 35000, "Large": 40000, "XL": 50000 },
    photos: ["24"]
  },
  "dress-35": {
    title: "Dress",
    desc: "A beautiful dress made with love. Choose your size and color",
    sizes: { "Small": 35000, "Medium": 35000, "Large": 40000, "XL": 45000 },
    photos: ["35"]
  },
  "dress-34": {
    title: "Dress",
    desc: "A beautiful dress made with love. Choose your size and color",
    sizes: { "Small": 60000, "Medium": 60000, "Large": 70000, "XL": 75000 },
    photos: ["34"]
  },
  "Dress-66": {
    title: "Dress",
    desc: "A beautiful dress made with love. Choose your size and color",
    sizes: { "Small": 40000, "Medium": 40000, "Large": 45000, "XL": 45000 },
    photos: ["66"]
  },
  "Dress-59": {
    title: "Dress",
    desc: "A beautiful dress made with love. Choose your size and color",
    sizes: { "Small": 35000, "Medium": 35000, "Large": 40000, "XL": 40000 },
    photos: ["59"]
  },
  "Dress-36": {
    title: "Dress",
    desc: "A beautiful dress made with love. choose your size and color",
    sizes: { "Small": 40000, "Medium": 40000, "Large": 50000, "XL": 60000 },
    photos: ["36", "63"]
  },
  "Dress-38": {
    title: "Dress",
    desc: "A cute dress. choose your favorite color",
    sizes: { "Small": 35000, "Medium": 35000, "Large": 40000, "XL": 45000 },
    photos: ["38"]
  },
  "Small bag-22": {
    title: "Small bag",
    desc: "A small handmade crochet bag.",
    sizes: { "Small": 15000 },
    photos: ["22"]
  },
  "Small bag-32": {
    title: "Small bag",
    desc: "A handmade crochet bag.",
    sizes: { "Small": 15000 },
    photos: ["32"]
  },
  "Small bag-33": {
    title: "Small bag",
    desc: "choose your color",
    sizes: { "Small": 15000 },
    photos: ["33"]
  },
  "Crochet flower": {
    title: "Crochet flower",
    desc: "Handmade crochet flowers, choose your colors.",
    sizes: { "Small": 50000, "Big": 80000 },
    photos: ["25", "26", "29", "52"]
  },
  "Two-piece": {
    title: "Two-piece",
    desc: "cute and comfy. choose your color",
    sizes: { "Small": 50000, "Medium": 60000, "Large": 70000, "XL": 90000 },
    photos: ["46", "43"]
  },
  "Two-piece-56": {
    title: "Two-piece",
    desc: "cute and comfy. choose your color",
    sizes: { "Small": 30000, "Medium": 30000, "Large": 35000, "XL": 35000 },
    photos: ["56"]
  },
  "Two-piece 42": {
    title: "Two-piece",
    desc: "two-piece items are available. choose your color",
    sizes: { "small": 40000, "large": 45000, "XL": 50000 },
    photos: ["42"]
  },
  "Two-piece-57": {
    title: "Two-piece",
    desc: "two-piece items are available. choose your color",
    sizes: { "small": 30000, "large": 30000, "XL": 35000 },
    photos: ["57"]
  },
  "Two-pieces-60": {
    title: "Two-piece",
    desc: "two-piece items are available. choose your color",
    sizes: { "small": 25000, "large": 25000, "XL": 30000 },
    photos: ["60"]
  },
  "Two-pieces-61": {
    title: "Two-piece",
    desc: "two-piece items are available. choose your color",
    sizes: { "small": 25000, "large": 25000, "XL": 30000 },
    photos: ["61"]
  },
  "Two-piece-62": {
    title: "Two-piece",
    desc: "two-piece items are available. choose your color",
    sizes: { "small": 35000, "large": 35000, "XL": 40000 },
    photos: ["62"]
  },
  "Two-piece-65": {
    title: "Two-piece",
    desc: "Skirt are available, choose your color",
    sizes: { "small": 55000, "large": 55000, "XL": 60000 },
    photos: ["65"]
  },
  "Two-piece 49": {
    title: "Two-piece",
    desc: "two-pieces items are available. choose your color",
    sizes: { "small": 50000, "large": 55000, "XL": 60000 },
    photos: ["49"]
  },
  "Two-piece 39": {
    title: "Two-piece",
    desc: "two-pieces items are available. choose your color",
    sizes: { "small": 35000, "large": 40000, "XL": 45000 },
    photos: ["39"]
  },
  "Two-piece 47": {
    title: "Two-piece",
    desc: "Two-pieces items are available, choose your color",
    sizes: { "small": 25000, "large": 25000, "XL": 30000 },
    photos: ["47"]
  },
  "Two-piece-40": {
    title: "Two-piece",
    desc: "Skirt are available, choose your color",
    sizes: { "small": 50000, "large": 50000, "XL": 55000 },
    photos: ["40"]
  },
  "Skirt-45": {
    title: "Skirt",
    desc: "Skirt are available, choose your color",
    sizes: { "small": 20000, "large": 20000, "XL": 25000 },
    photos: ["45"]
  },
  "Skirt-41": {
    title: "Skirt",
    desc: "Two-pieces items are available, choose your color",
    sizes: { "small": 30000, "large": 30000, "XL": 35000 },
    photos: ["41"]
  },
  "Two-piece 44": {
    title: "Two-piece",
    desc: "Two-pieces items are available, choose your color",
    sizes: { "small": 30000, "large": 30000, "XL": 40000 },
    photos: ["44"]
  },
  "Two-piece 60": {
    title: "Two-piece",
    desc: "Two-pieces items are available, choose your color",
    sizes: { "small": 35000, "large": 40000, "XL": 45000 },
    photos: ["60"]
  },
  "Two-piece 46": {
    title: "Two-piece",
    desc: "Two-pieces items are available, choose your color",
    sizes: { "small": 45000, "large": 45000, "XL": 50000 },
    photos: ["46"]
  },
  "Shirt-1": {
    title: "Shirt",
    desc: "Shirt for man are available, choose your color",
    sizes: { "small": 45000, "large": 45000, "XL": 50000 },
    photos: ["1"]
  },
  "Shirt-2": {
    title: "Shirt",
    desc: "Shirt for man are available, choose your color",
    sizes: { "small": 45000, "large": 45000, "XL": 50000 },
    photos: ["2"]
  },
  "Shirt-6": {
    title: "Shirt",
    desc: "Shirt for man are available, choose your color",
    sizes: { "small": 45000, "large": 45000, "XL": 50000 },
    photos: ["6"]
  },
  "Shirt-17": {
    title: "Shirt",
    desc: "Shirt for man are available, choose your color",
    sizes: { "small": 45000, "large": 45000, "XL": 50000 },
    photos: ["17"]
  },
  "Couple outfits-50": {
    title: "Couple outfits",
    desc: "Couple outfits are available, get yours",
    sizes: { "small": 110000, "large": 120000, "XL": 140000 },
    photos: ["50"]
  }
};

// Delivery options: the key is what the customer picks, the value is the fee in UGX.
// "Delivery" has no fixed fee (null): the customer types his address and YOU tell him the price when you confirm.
var DELIVERY_FEES = { "Pickup": 0, "Delivery": null };

// Lets the server (Node) use this same file. The browser ignores this line.
if (typeof module !== "undefined" && module.exports) {
  module.exports = { PRODUCTS: PRODUCTS, DELIVERY_FEES: DELIVERY_FEES };
}
