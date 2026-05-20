import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const HTML_PATH = "C:/Users/Carlos/Downloads/claudineia-calegari_6.html";
const OUT_IMG  = join(__dirname, "../public/img");
const OUT_VID  = join(__dirname, "../public/videos");

mkdirSync(OUT_IMG, { recursive: true });
mkdirSync(OUT_VID, { recursive: true });

const html = readFileSync(HTML_PATH, "utf8");

// ── EXTRACT IMAGES ────────────────────────────────────────────────────────────
const imgRe = /src="data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=\s]+?)"/g;
let m;
let imgIdx = 0;
const imgNames = ["hero", "card-whatsapp", "card-imoveis", "card-comprar", "card-vender", "card-instagram", "card-youtube"];

while ((m = imgRe.exec(html)) !== null) {
  const ext  = m[1] === "jpeg" ? "jpg" : m[1];
  const data = m[2].replace(/\s/g, "");
  const name = imgNames[imgIdx] ?? `image-${imgIdx}`;
  const out  = join(OUT_IMG, `${name}.${ext}`);
  writeFileSync(out, Buffer.from(data, "base64"));
  console.log(`✓ ${name}.${ext}  (${Math.round(data.length * 0.75 / 1024)}KB)`);
  imgIdx++;
}

// ── EXTRACT VIDEO ─────────────────────────────────────────────────────────────
const vidRe = /src="data:video\/mp4;base64,([A-Za-z0-9+/=\s]+?)"/g;
let vidIdx = 0;
while ((m = vidRe.exec(html)) !== null) {
  const data = m[1].replace(/\s/g, "");
  const out  = join(OUT_VID, `video-${vidIdx + 1}.mp4`);
  writeFileSync(out, Buffer.from(data, "base64"));
  console.log(`✓ video-${vidIdx + 1}.mp4  (${Math.round(data.length * 0.75 / 1024)}KB)`);
  vidIdx++;
}

console.log(`\nTotal: ${imgIdx} imagens, ${vidIdx} vídeos`);
