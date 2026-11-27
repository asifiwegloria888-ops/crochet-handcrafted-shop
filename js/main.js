
console.log("Crochet Handcrafted Shop site loaded successfully.");

// FILTRAGE DES PRODUITS
const boutons = document.querySelectorAll(".filtres button");
const produits = document.querySelectorAll(".produit");

boutons.forEach((b) => {
  b.addEventListener("click", () => {
    boutons.forEach((x) => x.classList.remove("actif"));
    b.classList.add("actif");

    produits.forEach((p) => {
      const visible =
        b.dataset.cat === "all" || p.dataset.cat === b.dataset.cat;

      p.classList.toggle("cache", !visible);
    });
  });
});


// MENU HAMBURGER
const menuBtn = document.getElementById("menuBtn");
const mainNav = document.getElementById("mainNav");

if (menuBtn && mainNav) {

  // Ouvrir et fermer le menu
  menuBtn.addEventListener("click", () => {
    const ouvert = mainNav.classList.toggle("show");

    menuBtn.textContent = ouvert ? "✕" : "☰";
    menuBtn.setAttribute("aria-expanded", ouvert);
  });

  // Fermer le menu après avoir choisi une page
  const liens = mainNav.querySelectorAll("a");

  liens.forEach((lien) => {
    lien.addEventListener("click", () => {
      mainNav.classList.remove("show");
      menuBtn.textContent = "☰";
      menuBtn.setAttribute("aria-expanded", "false");
    });
  });
}
