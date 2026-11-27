console.log("Crochet Handcrafted Shop site loaded successfully.");
const boutons = document.querySelectorAll(".filtres button");
const produits = document.querySelectorAll(".produit");

boutons.forEach((b) => {
  b.addEventListener("click", () => {
    boutons.forEach((x) => x.classList.remove("actif"));
    b.classList.add("actif");
    produits.forEach((p) => {
      const visible = b.dataset.cat === "all" || p.dataset.cat === b.dataset.cat;
      p.classList.toggle("cache", !visible);
    });
  });
});

const menuBtn = document.getElementById("menuBtn");
const mainNav = document.querySelector("main-nav");

if (menuBtn && mainNav) {
  menuBtn.addEventListener("click", () => {
    mainNav.classList.toggle("show");
    menuBtn.textContent = mainNav.classList.contains("show") ? "✕" : "☰";
  });
}