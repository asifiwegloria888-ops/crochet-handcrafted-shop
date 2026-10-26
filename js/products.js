// ONE place for all your articles and prices.
// The website reads it AND the server reads it (api/_lib.js), so a price is changed here only.
var PRODUCTS = {
  "Scrunchies": {
    desc: "Soft handmade scrunchies. Many colors are available, tell us your favorite.",
    price: 5000,
    photos: ["1", "2", "6", "7", "10"]
  },
  "Ruffle crochet hat": {
    desc: "A handmade ruffle hat in the colors you like.",
    sizes: { "Child": 15000, "Adult": 20000 },
    photos: ["3","27"]
  },
  "Crop top": {
    desc: "Handmade to measure. Choose your size and your colors.",
    sizes: { "Small": 20000, "Medium": 20000, "Large": 25000, "XL": 25000 },
    photos: ["4"]
  },
  "Crop top-5": {
    desc: "Handmade to measure. Choose your size and your colors.",
    sizes: { "Small": 25000, "Medium": 25000, "Large": 30000, "XL": 35000 },
    photos: ["5"]
  },
  "Crop top-8": {
    desc: "Handmade to measure. Choose your size and your colors.",
    sizes: { "Small": 15000, "Medium": 15000, "Large": 20000, "XL": 25000 },
    photos: ["8"]
  },
  "Crop top-9":{
    desc: "Handmade to measure. Choose your size and your colors.",
    sizes: { "Small": 20000, "Medium": 20000, "Large": 25000, "XL": 25000 },
    photos: ["9"]
  },
  "Crop top-11": {
    desc: "Handmade to measure. Choose your size and your colors.",
    sizes: { "Small": 15000, "Medium": 15000, "Large": 20000, "XL": 20000 },
    photos: ["11"]
  },

  "Crop top-12":{
    desc: "Handmade to measure. Choose your size and your colors.",
    sizes: { "Small": 15000, "Medium": 15000, "Large": 20000, "XL": 20000 },
    photos: ["12"]
  },

  "Crop top-13": {
    desc: "Handmade to measure. Choose your size and your colors.",
    sizes: { "Small": 15000, "Medium": 15000, "Large": 20000, "XL": 20000 },
    photos: ["13"]
  },

  "Crop top-14": {
    desc: "Handmade to measure. Choose your size and your colors.",
    sizes: { "Small": 15000, "Medium": 15000, "Large": 20000, "XL": 20000 },
    photos: ["14"]
  },
  "Crop top-15": {
    desc: "Handmade to measure. Choose your size and your colors.",
    sizes: { "Small": 15000, "Medium": 15000, "Large": 20000, "XL": 20000 },
    photos: ["15"]
  },
   
  "Crop top-16": {
    desc: "Handmade to measure. Choose your size and your colors.",
    sizes: { "Small": 15000, "Medium": 15000, "Large": 20000, "XL": 20000 },
    photos: ["16"]
  },
  
  "Crop-top-37": {
    desc: "choose your favotite color",
    sizes: {"Small": 10000,"Medium": 10000,"Large": 15000,"XL": 20000},
    photos: ["37"]
  },
  "Sweater": {
    desc: "A warm handmade crochet sweater, made to measure.",
    sizes: { "Small": 50000, "Medium": 60000, "Large": 80000, "XL": 90000 },
    photos: ["21","28"]
  },
  
  "Dress": {
    title: "Dress",
    desc: "Handmade to measure, choose your colors.",
    sizes: { "Small": 45000, "Medium": 45000, "Large": 50000, "XL": 60000 },
    photos: ["30"]
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
    sizes: {"Small": 35000,"Medium":35000,"Large":40000,"XL":50000},
    photos: ["23"]
  },
  "Dress-24": {
    title: "Dress",
    desc: "Handmade to measure. Choose your size and your colors",
    sizes: {"Small": 35000,"Medium":35000,"Large":40000,"XL":50000},
    photos: ["24"]
  },
  "dress-35": {
    title: "Dress",
    desc: "A beautiful dress made with love. Choose your size and color",
    sizes: { "Small": 50000, "Medium": 60000, "Large": 60000, "XL": 70000 },
    photos: ["35"]
  },
  "dress-34": {
    title: "Dress",
    desc: "A beautiful dress made with love. Choose your size and color",
    sizes: { "Small": 60000, "Medium": 60000, "Large": 70000, "XL": 75000 },
    photos: ["34"]
  },
  "Dress-36": {
    title: "Dress",
    desc: "A beautiful dress made with love. choose your size and color",
    sizes: {"Small": 40000, "Medium": 40000, "Large": 50000, "XL": 60000},
    photos: ["36"]

  },
  "Dress-38": {
    title: "Dress",
    desc: "A cute dress. choose your favorite color",
    sizes: {"Small": 35000, "Medium": 35000, "Large":40000,"XL": 45000},
    photos: ["38"]
  },

  "Small bag-22": {
    desc: "A small handmade crochet bag.",
    sizes: { "Small": 15000},
    photos: ["22"]
  },
  "Small bag -32":{
    desc: " A handmade crochet bag.",
    sizes: { "Small": 15000,},
    photos: ["32"]
  },
  "Small bag-33": {
    desc: "choose your color",
    sizes: {"Small": 15000},
    photos: ["33"]
  },

  "Crochet flower": {
    desc: "Handmade crochet flowers, choose your colors.",
    sizes: { "Small": 50000, "Big": 80000 },
    photos: ["25","26","29"]
  },
  "Two-pieces": {
    title: "Two-piece",
    desc: "cute and confy. choose your color",
    sizes: {"Small": 50000,"Medium": 60000,"Large":70000,"XL":90000},
    photos: ["46","43"]

  },
  "Two-piece 42": {
    desc: "two-piece items are available. choose your color",
    sizes: {"small": 40000,"large": 45000,"XL": 50000},
    photos: ["42"]
  },
  "Two-piece 39": {
    desc: "two-pieces items are available. choose your color",
    sizes: {"small": 35000,"large": 40000,"XL":45000},
    photos: ["39"]
  },
  "Two-piece 46": {
    desc: "Two-pieces items are available, choose your color",
    sizes: {"small": 50000,"large": 60000,"XL": 70000},
    photos: ["46"]
  }

  
  

};

// Delivery options: the key is what the customer picks, the value is the fee in UGX.
// "Delivery" has no fixed fee (null): the customer types his address and YOU tell him the price when you confirm.
var DELIVERY_FEES = { "Pickup": 0, "Delivery": null };

// Lets the server (Node) use this same file. The browser ignores this line.
if (typeof module !== "undefined" && module.exports) {
  module.exports = { PRODUCTS: PRODUCTS, DELIVERY_FEES: DELIVERY_FEES };
}
