import sharp from "sharp";
import { join } from "path";
import fs from "fs";

const IMAGES_PATH = join(process.cwd(), "out", "image");

async function optimizeImages() {
  console.log("optimizeImages: Start");
  const dirs = fs
    .readdirSync(IMAGES_PATH, { withFileTypes: true })
    .filter((dir) => dir.isDirectory())
    .map((dir) => join(IMAGES_PATH, dir.name));
  for (const dir of dirs) {
    const imgs = fs
      .readdirSync(dir)
      // 仅处理 JPEG
      .filter((img) => img.endsWith(".jpg"))
      .map((img) => join(dir, img));
    for (const img of imgs) {
      // console.log(`optimizeImages: Processing "${img}"`);
      const out = img.slice(0, -3) + "webp";
      await sharp(img).webp().toFile(out);
      // 删掉原图
      fs.unlinkSync(img);
    }
  }
  console.log("optimizeImages: Done");
}

await optimizeImages();
