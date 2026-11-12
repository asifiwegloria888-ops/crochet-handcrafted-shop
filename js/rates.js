// Currencies and exchange rates of the shop. ONE place to change them: the table PER_USD below.
// Used by the website (js/i18n.js) AND by the server (api/_lib.js, for the emails).
// Prices are ALWAYS decided in shillings (UGX). The other currencies are only an indication shown next to the shillings.
(function (root, factory) {
  var api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.SHOP_RATES = api;
})(this, function () {
  // ======================= CHANGE THESE NUMBERS when the rates change =======================
  // "How many ... for 1 US dollar".   Last checked: 12 November 2026 (rounded). UGX is kept at 3700 on purpose.
  var PER_USD = {
    UGX: 3700,
    USD: 1,
    EUR: 0.90,
    KES: 130,
    TZS: 2660,
    RWF: 1474,
    CDF: 2320,
    BIF: 3002,   // official rate; the street rate in Burundi is much higher, change it if you know the one used by your customers
    ETB: 161,
    SOS: 571,
    NGN: 1347,
    ZAR: 16.6,
    AED: 3.67,
    INR: 95,
    CNY: 6.67,
    GBP: 0.75
  };
  // ===========================================================================================

  var CODES = ["UGX", "USD", "EUR", "GBP", "KES", "TZS", "RWF", "CDF", "BIF", "ETB", "SOS", "NGN", "ZAR", "AED", "INR", "CNY"];          // order of the selector
  var SYMBOL = { USD: "$", EUR: "€", GBP: "£" };                              // written before the number; the others are written after
  // default currency guessed from the country of the visitor's phone (the visitor can change it)
  // country (2 letters) -> its money. Any other country: dollars only.
  var BY_REGION = { UG: "UGX", US: "USD", KE: "KES", TZ: "TZS", RW: "RWF", CD: "CDF", BI: "BIF", ET: "ETB", SO: "SOS", NG: "NGN", ZA: "ZAR",
    AE: "AED", IN: "INR", CN: "CNY", GB: "GBP",
    FR: "EUR", BE: "EUR", DE: "EUR", IT: "EUR", ES: "EUR", PT: "EUR", NL: "EUR", IE: "EUR", AT: "EUR", LU: "EUR", FI: "EUR", GR: "EUR" };

  function isCode(c) { return Object.prototype.hasOwnProperty.call(PER_USD, c) && typeof c === "string"; }
  function group(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " "); }
  // amount in shillings -> amount in the other currency (a number)
  function convert(ugx, code) { return ugx / PER_USD.UGX * PER_USD[code]; }
  // "$8.11", "€7.30", "1 474 RWF"
  function format(ugx, code) {
    var v = convert(ugx, code);
    var text = v === 0 ? "0" : (code === "USD" || code === "EUR" || code === "GBP") ? (v >= 100 ? group(Math.round(v)) : v.toFixed(2)) : group(Math.round(v));
    return SYMBOL[code] ? SYMBOL[code] + text : text + " " + code;
  }
  // What the CUSTOMER sees: the money of his country first, the dollars in brackets.
  //   Rwanda "11 951 RWF (≈ $8.11)"   France "€7.30 (≈ $8.11)"   Uganda "30 000 UGX (≈ $8.11)"   dollars "$8.11"
  // Shillings only appear for customers in Uganda. "" when the currency is unknown.
  function show(ugx, code) {
    if (!isCode(code) || !(ugx >= 0)) return "";
    if (ugx === 0) return "0";
    if (code === "USD") return format(ugx, "USD");
    var local = code === "UGX" ? group(Math.round(ugx)) + " UGX" : format(ugx, code);
    return local + " (≈ " + format(ugx, "USD") + ")";
  }
  // "(≈ $8.11)" for dollars, "(≈ $8.11 · 10 785 RWF)" for the money of the customer's country (dollars are always shown),
  // or "" when there is nothing to add (shillings or unknown currency)
  function approx(ugx, code) {
    if (!isCode(code) || code === "UGX" || !(ugx > 0)) return "";
    return "(≈ " + format(ugx, "USD") + (code === "USD" ? "" : " · " + format(ugx, code)) + ")";
  }
  // 1 unit of this currency = ... shillings (to tell the owner which rate was used)
  function ugxPer(code) { return Math.round(PER_USD.UGX / PER_USD[code] * 10) / 10; }

  return { PER_USD: PER_USD, CODES: CODES, BY_REGION: BY_REGION, isCode: isCode, convert: convert, format: format, approx: approx, show: show, ugxPer: ugxPer, group: group };
});