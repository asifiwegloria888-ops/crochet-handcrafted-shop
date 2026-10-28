// French translations of the site. Used by the browser (js/i18n.js) and by the server (emails to French customers).
//
// HOW IT WORKS: every English text of the site is looked up here. If it is found, the French text is shown.
// If it is NOT found, the English text stays (nothing breaks). To translate a new text, add one line in EXACT:
//     "English text": "Texte français",
// Add your own lines in the section "YOUR OWN TRANSLATIONS" at the bottom of EXACT.
// To see the texts that are still in English: open the site in French and add  ?i18n=missing  at the end of the address,
// then look in the browser console (F12).

(function (root) {
  var EXACT = {
    // ---------- menu, footer ----------
    "Home": "Accueil", "Creation": "Créations", "Album": "Album", "Contact": "Contact", "Order": "Commander", "Cart": "Panier",
    "My favorites": "Mes favoris", "main navigation": "navigation principale",
    "© 2026 Crochet Handcrafted Shop. All rights reserved.": "© 2026 Crochet Handcrafted Shop. Tous droits réservés.",
    "contact us": "nous contacter", "Contact us": "Contactez-nous", "Chat on WhatsApp": "Discuter sur WhatsApp",
    "Chat with us on WhatsApp": "Discutez avec nous sur WhatsApp", "Chat with me on WhatsApp": "Discuter avec moi sur WhatsApp",
    "WhatsApp me": "Écrivez-moi sur WhatsApp", "New orders": "Nouvelles commandes", "New orders and comments to approve": "Nouvelles commandes et commentaires à approuver",

    // ---------- home page ----------
    "Welcome to Crochet Handcrafted Shop": "Bienvenue chez Crochet Handcrafted Shop",
    "Handmade with love": "Fait main avec amour",
    "Welcome to my little corner of handmade crochet treasures. Every piece here is lovingly crafted by hand, from cozy blankets to delicate accessories.":
      "Bienvenue dans mon petit coin de trésors faits main au crochet. Chaque pièce est confectionnée à la main avec amour, des couvertures douillettes aux accessoires délicats.",
    "Order now": "Commander", "ORDER NOW": "COMMANDER", "Browse our creations": "Découvrir nos créations", "See all creations": "Voir toutes les créations",
    "What we do": "Ce que nous faisons", "Handmade crochet creations": "Créations au crochet faites main",
    "Cozy blankets, cute baby hats, tote bags, skirts, dresses, crop tops and many more. Each lovingly crafted by hand with soft, quality yarn.":
      "Couvertures douillettes, jolis bonnets pour bébé, sacs cabas, jupes, robes, hauts courts et bien d'autres choses. Chaque pièce est faite à la main avec amour, dans un fil doux et de qualité.",
    "Custom orders & accessories": "Commandes sur mesure et accessoires",
    "Choose your colors, size, and style. I also make hair accessories, hair scrunchies, and home decor, made just for you.":
      "Choisissez vos couleurs, votre taille et votre style. Je réalise aussi des accessoires pour cheveux, des chouchous et de la décoration d'intérieur, faits rien que pour vous.",
    "Some of my creations": "Quelques-unes de mes créations", "About me": "À propos de moi",
    "Hello! I'm a passionate crocheter with a love for creating unique, handmade items. With years of experience and a keen eye for detail, I strive to bring joy and beauty to every piece I create.":
      "Bonjour ! Je suis une crocheteuse passionnée, et j'adore créer des pièces uniques faites à la main. Avec des années d'expérience et un œil attentif aux détails, je m'efforce d'apporter de la joie et de la beauté à chaque pièce que je crée.",
    "Opening hours": "Horaires d'ouverture",
    "Sunday to Friday, 8:00 AM to 8:00 PM. Customer orders available anytime.": "Du dimanche au vendredi, de 8 h à 20 h. Les commandes des clients sont possibles à tout moment.",
    "Orange crochet scrunchie": "Chouchou orange au crochet", "Red crochet crop top with white flowers": "Haut court rouge au crochet avec des fleurs blanches",
    "Three crochet hair scrunchies in yellow, red and olive green": "Trois chouchous au crochet jaune, rouge et vert olive",

    // ---------- articles ----------
    "Scrunchies": "Chouchous", "Crop top": "Haut court", "Ruffle crochet hat": "Chapeau au crochet à volants", "Sweater": "Pull", "Dress": "Robe",
    "Skirt": "Jupe", "Small bag": "Petit sac", "Crochet flower": "Fleur au crochet",
    "Small": "Petit (S)", "Medium": "Moyen (M)", "Large": "Grand (L)", "XL": "XL", "Big": "Grand", "Child": "Enfant", "Adult": "Adulte",
    "Black": "Noir", "White": "Blanc", "Red": "Rouge", "Pink": "Rose", "Yellow": "Jaune", "Orange": "Orange", "Blue": "Bleu", "Green": "Vert",
    "Purple": "Violet", "Brown": "Marron", "Beige": "Beige", "Grey": "Gris",
    "A beautiful dress made with love. Choose your size and color": "Une belle robe faite avec amour. Choisissez votre taille et votre couleur.",
    "A beautiful dress made with love. Choose your size and color.": "Une belle robe faite avec amour. Choisissez votre taille et votre couleur.",
    "A handmade ruffle hat in the colors you like.": "Un chapeau à volants fait main, dans les couleurs que vous aimez.",
    "A small handmade crochet bag.": "Un petit sac au crochet fait main.",
    "A warm handmade crochet sweater, made to measure.": "Un pull chaud au crochet, fait main et sur mesure.",
    "Handmade crochet flowers, choose your colors.": "Des fleurs au crochet faites main, choisissez vos couleurs.",
    "Handmade to measure, choose your colors.": "Fait main sur mesure, choisissez vos couleurs.",
    "Handmade to measure, choose your colors!": "Fait main sur mesure, choisissez vos couleurs !",
    "Handmade to measure. Choose your size and your colors": "Fait main sur mesure. Choisissez votre taille et vos couleurs.",
    "Handmade to measure. Choose your size and your colors.": "Fait main sur mesure. Choisissez votre taille et vos couleurs.",
    "Soft handmade scrunchies. Many colors are available, tell us your favorite.": "De doux chouchous faits main. De nombreuses couleurs sont disponibles, dites-nous votre préférée.",
    "Beautiful ruffle crochet hat with beautiful colors are available": "Un beau chapeau au crochet à volants, disponible dans de belles couleurs.",
    "Beautiful scrunchies with beautiful colors are available": "De beaux chouchous disponibles dans de belles couleurs.",
    "choose your colors!": "choisissez vos couleurs !",
    "From 15 000 UGX": "À partir de 15 000 UGX",

    // ---------- creation page ----------
    "Crochet Creation": "Créations au crochet", "Welcome to my crochet creation page!": "Bienvenue sur la page de mes créations au crochet !",
    "some items are here below": "quelques articles sont ci-dessous", "All": "Tout", "Clothes": "Vêtements", "Accessories": "Accessoires", "View details": "Voir les détails",

    // ---------- album ----------
    "Tap a photo to see it bigger. Tap again to zoom.": "Touchez une photo pour l'agrandir. Touchez encore pour zoomer.",
    "Order this model": "Commander ce modèle", "Close": "Fermer", "Next": "Suivant", "Previous": "Précédent", "Photo viewer": "Visionneuse de photos",
    "Be the first to like this": "Soyez le premier à aimer ça", "Add a comment...": "Ajouter un commentaire...", "Post": "Publier",
    "Save": "Enregistrer", "Share": "Partager", "Download": "Télécharger", "Comments": "Commentaires",

    // ---------- contact ----------
    "Contact Information": "Coordonnées", "Contact me": "Me contacter", "contact me": "me contacter",
    "If you have any questions or would like to place an order, feel free to reach out!": "Pour toute question ou pour passer une commande, n'hésitez pas à me contacter !",
    "Address:": "Adresse :", "telephone:": "téléphone :", "Email:": "Email :", "Email": "Email", "Name": "Nom", "Message": "Message", "Website": "Site web",
    "Send us a message": "Envoyez-nous un message", "Send Message": "Envoyer le message", "Send message": "Envoyer le message",
    "sunday - friday : 8 am- 8pm": "dimanche - vendredi : 8 h - 20 h",
    "sunday to friday, 8:00 AM to 8:00 PM. Customer orders available anytime.": "du dimanche au vendredi, de 8 h à 20 h. Commandes des clients possibles à tout moment.",

    // ---------- product page ----------
    "Add to cart": "Ajouter au panier", "Add to favorites": "Ajouter aux favoris", "In my favorites": "Dans mes favoris", "Like": "J'aime",
    "Price": "Prix", "Size": "Taille", "Color": "Couleur", "Quantity": "Quantité", "Choose a color": "Choisissez une couleur", "Other color...": "Autre couleur...",
    "Write the color you want": "Écrivez la couleur que vous voulez", "Please choose a color.": "Veuillez choisir une couleur.", "Please write the color you want.": "Veuillez écrire la couleur que vous voulez.",
    "← Back to creations": "← Retour aux créations", "Item not found": "Article introuvable", "⇩ Download this photo": "⇩ Télécharger cette photo",
    "Added to your cart. You can choose another item or": "Ajouté au panier. Vous pouvez choisir un autre article ou", "open your cart": "ouvrir votre panier",
    "Your name": "Votre nom", "Your comment": "Votre commentaire", "Send my comment": "Envoyer mon commentaire",
    "":"",
    "No comment yet. Be the first!": "Pas encore de commentaire. Soyez le premier !",
    "Thank you! Your comment will appear after I approve it.": "Merci ! Votre commentaire apparaîtra après mon approbation.",
    "Thank you!": "Merci !",

    // ---------- cart ----------
    "Your cart": "Votre panier", "Your cart is empty.": "Votre panier est vide.", "Add another item": "Ajouter un autre article", "Qty": "Qté", "Remove": "Retirer",
    "Subtotal:": "Sous-total :", "The delivery fee is added on the next page.": "Les frais de livraison sont ajoutés à la page suivante.",
    "Please choose a color": "Veuillez choisir une couleur", "Color (optional)": "Couleur (facultatif)",
    "Please choose a color for each item before you order.": "Veuillez choisir une couleur pour chaque article avant de commander.",

    // ---------- order ----------
    "Place an order": "Passer une commande", "Your items": "Vos articles", "Items:": "Articles :", "Delivery:": "Livraison :", "Estimated total:": "Total estimé :",
    "The final price is confirmed by email before you pay.": "Le prix final est confirmé par email avant que vous payiez.", "Change my cart": "Modifier mon panier",
    "Phone": "Téléphone", "Your confirmation will be sent here.": "Votre confirmation sera envoyée ici.", "Pick up or delivery?": "Retrait ou livraison ?",
    "Pick up (free)": "Retrait sur place (gratuit)", "Delivery to my address (price confirmed by me)": "Livraison à mon adresse (prix confirmé par la boutique)",
    "Choose \"Delivery\" and write your address below. I will tell you the delivery price by email before you pay.": "Choisissez « Livraison » et écrivez votre adresse ci-dessous. Je vous indiquerai le prix de la livraison par email avant que vous payiez.",
    "Your delivery address": "Votre adresse de livraison", "The more exact, the easier the delivery.": "Plus l'adresse est précise, plus la livraison est facile.",
    "Town, area, street, landmark near your home...": "Ville, quartier, rue, repère près de chez vous...",
    "Date you want your order ready": "Date à laquelle vous voulez votre commande prête", "Anything else?": "Autre chose ?", "Deadline, gift message...": "Date limite, message cadeau...",
    "Send my order": "Envoyer ma commande", "Sending...": "Envoi en cours...", "price confirmed by me": "prix confirmé par la boutique",
    "Your cart is empty. Choose your items first, then come back here to send your order.": "Votre panier est vide. Choisissez d'abord vos articles, puis revenez ici pour envoyer votre commande.",
    "Please choose a color for each item in your cart before you order.": "Veuillez choisir une couleur pour chaque article de votre panier avant de commander.",
    "Go to my cart": "Aller à mon panier", "Thank you! Your order was sent.": "Merci ! Votre commande a bien été envoyée.", "Back to creations": "Retour aux créations",
    "Please choose the date you want your order ready.": "Veuillez choisir la date à laquelle vous voulez votre commande prête.",
    "Network problem. Please check your connection and try again.": "Problème de réseau. Vérifiez votre connexion et réessayez.",
    "Something went wrong. Please try again.": "Un problème est survenu. Veuillez réessayer.",
    "We could not send the confirmation email, but I will contact you soon.": "Nous n'avons pas pu envoyer l'email de confirmation, mais je vous contacterai bientôt.",
    "Check your email for the confirmation (and your spam folder).": "Consultez votre boîte email pour la confirmation (et vos courriers indésirables).",

    // ---------- favorites ----------
    "You have no favorite yet. Open an article and press \"Add to favorites\".": "Vous n'avez pas encore de favori. Ouvrez un article et appuyez sur « Ajouter aux favoris ».",
    "Your favorites are saved on this phone or computer only.": "Vos favoris sont enregistrés sur ce téléphone ou cet ordinateur seulement.",

    // ---------- messages sent by the server ----------
    "Please enter your name.": "Veuillez écrire votre nom.", "Please enter a valid email address.": "Veuillez entrer une adresse email valide.",
    "Please choose a delivery option.": "Veuillez choisir une option de livraison.", "Too many items in one order.": "Trop d'articles dans une seule commande.", "One item is not available anymore.": "Un article n'est plus disponible.",
    "Please write your full delivery address (town, area, landmark) so I can quote the delivery price.": "Veuillez écrire votre adresse de livraison complète (ville, quartier, repère) pour que je puisse vous indiquer le prix de la livraison.",
    "Please choose a date within the next year.": "Veuillez choisir une date dans l'année à venir.",
    "Sorry, we could not save your order. Please try again.": "Désolé, nous n'avons pas pu enregistrer votre commande. Veuillez réessayer.",
    "Please write your name (at least 2 letters).": "Veuillez écrire votre nom (au moins 2 lettres).", "Please write your comment.": "Veuillez écrire votre commentaire.",
    "Links are not allowed in comments.": "Les liens ne sont pas autorisés dans les commentaires.",
    "You wrote several comments already. Please try again later.": "Vous avez déjà écrit plusieurs commentaires. Veuillez réessayer plus tard.",
    "Please write your name to like this photo.": "Veuillez écrire votre nom pour aimer cette photo.",
    "This email address does not look right.": "Cette adresse email ne semble pas correcte.",
    "Network problem. Please try again.": "Problème de réseau. Veuillez réessayer.", "Something went wrong.": "Un problème est survenu.",

    // ---------- YOUR OWN TRANSLATIONS (add new lines here) ----------
    // article descriptions and names (js/products.js)
    "choose your favorite color": "choisissez votre couleur préférée",
    "choose your color": "choisissez votre couleur",
    "A beautiful dress made with love. choose your size and color": "Une belle robe faite avec amour. Choisissez votre taille et votre couleur",
    "A cute dress. choose your favorite color": "Une jolie robe. Choisissez votre couleur préférée",
    "A handmade crochet bag.": "Un sac au crochet fait main.",
    "cute and comfy. choose your color": "Mignon et confortable. Choisissez votre couleur",
    "two-piece items are available. choose your color": "Des ensembles deux pièces sont disponibles. Choisissez votre couleur",
    "two-pieces items are available. choose your color": "Des ensembles deux pièces sont disponibles. Choisissez votre couleur",
    "Two-pieces items are available, choose your color": "Des ensembles deux pièces sont disponibles. Choisissez votre couleur",
    "Couple outfits are available, get yours": "Des tenues assorties pour couples sont disponibles, prenez la vôtre",
    "Two-piece": "Deux-pièces", "Couple outfits": "Tenues de couple", "Shirt": "Chemise", "T-shirt": "T-shirt",
    "small": "Petit (S)", "medium": "Moyen (M)", "large": "Grand (L)",

    // texts of the cards of the Creation page
    "Skirt are available, choose your color": "Des jupes sont disponibles, choisissez votre couleur",
    "Shirt for man are available, choose your color": "Des chemises pour hommes sont disponibles, choisissez votre couleur",
    "Beautiful shirt with beautiful colors are available": "De belles chemises aux belles couleurs sont disponibles",
    "Beautiful crop top with beautiful colors are available": "De beaux crop tops aux belles couleurs sont disponibles",
    "Beautiful skirt with beautiful colors are available": "De belles jupes aux belles couleurs sont disponibles",
    "Get for you one": "Procurez-vous-en une",
    "Get for you one today": "Procurez-vous-en une aujourd'hui",
    "get yours today": "Prenez la vôtre aujourd'hui",
    "Beautiful outfit for couples with beautiful colors are available": "De belles tenues pour couples aux belles couleurs sont disponibles",
    "Beautiful dress with beautiful colors are available": "De belles robes aux belles couleurs sont disponibles",
    "Beautiful dress with beautiful colors": "Belle robe aux belles couleurs",
    "Beautiful dress": "Belle robe",
    "Beautiful crochet flower are available": "De belles fleurs au crochet sont disponibles",
    "Beautiful scrunchies": "De beaux chouchous",
    "Beautiful two piece": "Bel ensemble deux pièces",
    "Beautiful item!": "Bel article !",
    "confy! Handmade to measure, choose your colors!": "Confortable ! Fait main sur mesure, choisissez vos couleurs !",
    "cute, beautiful, comfy. choose your favorite color!": "Mignon, beau et confortable. Choisissez votre couleur préférée !",
    "Couple outfit": "Tenue de couple",
    "Scrunchie": "Chouchou",
    "Handmade two-piece set. soft, cute & comfy. custom size & color available": "Ensemble deux pièces fait main. Doux, mignon et confortable. Taille et couleur sur mesure disponibles",
    "soft, cute & comfy. custom size & color available": "Doux, mignon et confortable. Taille et couleur sur mesure disponibles",
    "Handmade to measure, choose your colors": "Fait main sur mesure, choisissez vos couleurs",
    "Choose your color": "Choisissez votre couleur",

    // comments, favorites, download, color
    "Comment": "Commenter", "Add a comment": "Ajouter un commentaire", "Your name (optional)": "Votre nom (facultatif)",
    "Download this photo": "Télécharger cette photo", "Save to favorites": "Ajouter aux favoris", "Remove from favorites": "Retirer des favoris",
    "Write the color you want": "Écrivez la couleur souhaitée",
    "Write the color you want (ex: red and white)": "Écrivez la couleur souhaitée (ex : rouge et blanc)",
    "Please write the color you want": "Veuillez écrire la couleur souhaitée",
    "Please write the color you want.": "Veuillez écrire la couleur souhaitée.",
    "Please write the color you want for each item before you order.": "Veuillez écrire la couleur souhaitée pour chaque article avant de commander.",
    "Please write the color you want for each item in your cart before you order.": "Veuillez écrire la couleur souhaitée pour chaque article de votre panier avant de commander.",
    "Please reload the page and try again.": "Veuillez recharger la page et réessayer.",
    "": ""
  };
  delete EXACT[""];

  var has = function (o, k) { return Object.prototype.hasOwnProperty.call(o, k); };

  function frDate(text) {                     // "Thu, 5 Nov 2026" -> "jeu. 5 nov. 2026"
    var d = new Date(text + " UTC");
    if (isNaN(d)) return text;
    return d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  }

  // Lookup that ignores capital letters, hyphens and a final "." or "!": a text written a little differently is still found
  var NORM = {};
  var norm = function (t) { return String(t).toLowerCase().replace(/-/g, " ").replace(/\s+/g, " ").replace(/[\s.!]+$/, ""); };
  Object.keys(EXACT).forEach(function (k) { var n = norm(k); if (!has(NORM, n)) NORM[n] = EXACT[k]; });

  // Texts with a number or a name inside. Each rule: [regular expression, function(match, translate) -> French text]
  var RULES = [
    [/^(.+) #(\d+)$/, function (m, tr) { var t = tr(m[1]); return t !== m[1] ? t + " #" + m[2] : null; }],
    [/^(.+) \| Crochet Handcrafted Shop$/, function (m, tr) { var t = tr(m[1]); return t !== m[1] ? t + " | Crochet Handcrafted Shop" : null; }],
    [/^(.+) - (\d[\d ]* UGX) each$/, function (m, tr) { return tr(m[1]) + " - " + m[2] + " l'unité"; }],
    [/^(\d[\d ]* UGX) each$/, function (m) { return m[1] + " l'unité"; }],
    [/^Total: (.+)$/, function (m) { return "Total : " + m[1]; }],
    [/^From (.+)$/, function (m) { return "À partir de " + m[1]; }],
    [/^(.+) \+ delivery$/, function (m) { return m[1] + " + livraison"; }],
    [/^(?:(.+), )?qty (\d+)(?:, (.+))?$/, function (m, tr) { return (m[1] ? tr(m[1]) + ", " : "") + "qté " + m[2] + (m[3] ? ", " + tr(m[3]) : ""); }],
    [/^Color for (.+)$/, function (m, tr) { return "Couleur pour " + tr(m[1]); }],
    [/^Colors for (.+)$/, function (m, tr) { return "Couleurs pour " + tr(m[1]); }],
    [/^Other color for (.+)$/, function (m, tr) { return "Autre couleur pour " + tr(m[1]); }],
    [/^Earliest date: (.+)\. Making time: (.+)\.$/, function (m, tr) {
      var list = m[2].split(", ").map(function (p) { var q = /^(.+) (\d+) days$/.exec(p); return q ? tr(q[1]) + " " + q[2] + " jours" : p; });
      return "Première date possible : " + m[1] + ". Délai de fabrication : " + list.join(", ") + ".";
    }],
    [/^Your items need (\d+) days\. Please choose (.+) or a later date\.$/, function (m) { return "Vos articles demandent " + m[1] + " jours. Veuillez choisir le " + m[2] + " ou une date ultérieure."; }],
    [/^Your items need (\d+) days to be made\. Please choose (.+) or a later date\.$/, function (m) { return "Vos articles demandent " + m[1] + " jours de fabrication. Veuillez choisir le " + frDate(m[2]) + " ou une date ultérieure."; }],
    [/^Your items need (\d+) days to be made\.$/, function (m) { return "Vos articles demandent " + m[1] + " jours de fabrication."; }],
    [/^Your items need (\d+) days\.$/, function (m) { return "Vos articles demandent " + m[1] + " jours."; }],
    [/^Please choose (.+) or a later date\.$/, function (m) { return "Veuillez choisir le " + frDate(m[1]) + " ou une date ultérieure."; }],
    [/^Your reference is (\S+)\. (.+)$/, function (m, tr) { return "Votre référence est " + m[1] + ". " + tr(m[2]); }],
    [/^Please write the color you want for (.+)\.$/, function (m, tr) { return "Veuillez écrire la couleur souhaitée pour " + tr(m[1]) + "."; }],
    [/^Guest (\d+)$/, function (m) { return "Invité " + m[1]; }],
    [/^Please choose a size for (.+)\.$/, function (m, tr) { return "Veuillez choisir une taille pour " + tr(m[1]) + "."; }],
    [/^Please choose a color for (.+)\.$/, function (m, tr) { return "Veuillez choisir une couleur pour " + tr(m[1]) + "."; }],
    [/^Quantity for (.+) must be between 1 and 100\.$/, function (m, tr) { return "La quantité pour " + tr(m[1]) + " doit être comprise entre 1 et 100."; }],
    [/^Crochet model (\d+)$/, function (m) { return "Modèle au crochet " + m[1]; }],
    [/^(\d+) likes?$/, function (m) { return m[1] + " j'aime"; }]
  ];

  var missing = {};

  function translate(s) {
    var core = String(s).replace(/\s+/g, " ").trim();
    if (!core) return s;
    if (has(EXACT, core)) return EXACT[core];
    var nk = norm(core);
    if (has(NORM, nk)) return NORM[nk];
    for (var i = 0; i < RULES.length; i++) {
      var m = RULES[i][0].exec(core);
      if (m) { var r = RULES[i][1](m, translate); if (r != null) return r; }
    }
    // several sentences in one text (for example several messages of the server)
    var parts = core.match(/[^.!?]+[.!?]+(?:\s+|$)/g);
    if (parts && parts.length > 1) {
      var done = parts.map(function (p) { return p.trim(); });
      var out = done.map(translate);
      if (out.some(function (o, k) { return o !== done[k]; })) return out.join(" ");
    }
    if (/[A-Za-z]{3}/.test(core)) missing[core] = true;
    return s;
  }

  var api = { translate: translate, EXACT: EXACT, missing: function () { return Object.keys(missing); }, frDate: frDate };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.LANG_FR = api;
})(this);
