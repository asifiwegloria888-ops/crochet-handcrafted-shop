// Allège toutes les photos .jpeg / .jpg du dossier du site (à la racine, là où sont 49.jpeg, 61.jpeg...).
// - Les noms ne changent pas : le site n'a rien à modifier.
// - Les originaux sont copiés d'abord dans un dossier à côté du projet : ../photos-originales-backup
// - Une photo n'est remplacée que si la nouvelle version est plus légère.
//
// Utilisation (dans le terminal de VS Code, dans le dossier du site) :
//   npm install sharp --no-save
//   node optimize-images.js

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const MAX_SIDE = 1280;   // plus grand côté, en pixels (assez pour la grande photo d'accueil et le zoom de l'album)
const QUALITY = 80;      // 1 à 100 : 80 est un bon équilibre poids / qualité

const root = process.cwd();
const backup = path.join(root, "..", "photos-originales-backup");
fs.mkdirSync(backup, { recursive: true });

const files = fs.readdirSync(root).filter((f) => /\.(jpe?g)$/i.test(f));
if (!files.length) {
  console.log("Aucune photo .jpeg ou .jpg trouvée ici. Vérifiez que vous êtes dans le dossier du site.");
  process.exit(0);
}

const mb = (n) => (n / 1024 / 1024).toFixed(2) + " Mo";

(async () => {
  let before = 0, after = 0, done = 0, skipped = 0;
  for (const name of files) {
    const file = path.join(root, name);
    const original = fs.readFileSync(file);
    before += original.length;

    const copy = path.join(backup, name);
    if (!fs.existsSync(copy)) fs.copyFileSync(file, copy);   // on ne remplace jamais une sauvegarde existante

    try {
      const output = await sharp(original)
        .rotate()   // respecte le sens de la photo pris par le téléphone
        .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: QUALITY, mozjpeg: true })
        .toBuffer();

      if (output.length < original.length) {
        fs.writeFileSync(file, output);
        after += output.length;
        done++;
        console.log(name + ": " + mb(original.length) + " -> " + mb(output.length));
      } else {
        after += original.length;
        skipped++;
        console.log(name + ": déjà légère, gardée telle quelle");
      }
    } catch (err) {
      after += original.length;
      skipped++;
      console.log(name + ": ignorée (" + err.message + ")");
    }
  }
  console.log("\n" + done + " photos allégées, " + skipped + " laissées telles quelles.");
  console.log("Avant : " + mb(before) + "  |  Après : " + mb(after) + "  |  Gagné : " + mb(before - after));
  console.log("Originaux sauvegardés dans : " + backup);
})();
