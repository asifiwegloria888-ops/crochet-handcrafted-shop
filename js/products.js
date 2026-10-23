// Display data for the shop. The REAL prices are always checked by the server (api/order.js).
// Keep the prices identical to SIZE_PRICES / PRICES in api/order.js.
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