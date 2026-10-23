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
    sizes: { "Small": 25000, "Medium": 28000, "Large": 32000, "XL": 36000 },
    photos: ["4", "5", "8","9", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20"]
  },
  "Sweater": {
    desc: "A warm handmade crochet sweater, made to measure.",
    sizes: { "Small": 50000, "Medium": 60000, "Large": 80000, "XL": 90000 },
    photos: ["21","28"]
  },
  "Dress": {
    desc: "Handmade to measure, choose your colors.",
    sizes: { "Small": 50000, "Medium": 60000, "Large": 80000, "XL": 100000 },
    photos: ["23", "24", "30", "31"]
  },
  "Small bag": {
    desc: "A small handmade crochet bag.",
    sizes: { "Small": 15000, "Big": 25000 },
    photos: ["22"]
  },
  "Crochet flower": {
    desc: "Handmade crochet flowers, choose your colors.",
    sizes: { "Small": 50000, "Big": 80000 },
    photos: ["25","26","29"]
  }
};

// Delivery options: the key is what the customer picks, the value is the fee in UGX.
// "Delivery" has no fixed fee (null): the customer types his address and YOU tell him the price when you confirm.
var DELIVERY_FEES = { "Pickup": 0, "Delivery": null };

// Lets the server (Node) use this same file. The browser ignores this line.
if (typeof module !== "undefined" && module.exports) {
  module.exports = { PRODUCTS: PRODUCTS, DELIVERY_FEES: DELIVERY_FEES };
}
