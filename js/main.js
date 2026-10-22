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

// Each "ORDER NOW" button sends the name and photo of its own card to the order page.
// New items added to creation.html work automatically, nothing to edit here.
document.querySelectorAll(".produit").forEach((carte) => {
  const bouton = carte.querySelector(".btn");
  const image = carte.querySelector("img");
  const nom = carte.querySelector("h3");
  if (!bouton || !image || !nom) return;

  const params = new URLSearchParams({ item: nom.textContent.trim() });
  const photo = (image.getAttribute("src").match(/(\d+)\.jpeg/) || [])[1];
  if (photo) params.set("photo", photo);
  bouton.href = "order.html?" + params.toString();
});
