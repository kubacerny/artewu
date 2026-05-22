#!/usr/bin/env node
/**
 * Vezme obrázky z src/tmp_realizace_photos/<slug>/ a vyrobí z nich
 * web-optimalizované verze do src/content/blog/<slug>/photo-NN.jpg.
 * Resize max 1800px na delší straně, auto-rotace podle EXIF, strip metadat.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const SRC = 'src/tmp_realizace_photos';
const DST = 'src/content/blog';

const folders = await fs.readdir(SRC, { withFileTypes: true });

for (const d of folders) {
  if (!d.isDirectory()) continue;
  const slug = d.name;
  const srcDir = path.join(SRC, slug);
  const dstDir = path.join(DST, slug);
  await fs.mkdir(dstDir, { recursive: true });

  const files = (await fs.readdir(srcDir))
    .filter((f) => /\.(jpe?g|png)$/i.test(f))
    .sort();

  let i = 1;
  for (const file of files) {
    const src = path.join(srcDir, file);
    const num = String(i).padStart(2, '0');
    const dst = path.join(dstDir, `photo-${num}.jpg`);
    await sharp(src)
      .rotate() // honor EXIF orientation
      .resize({ width: 1800, height: 1800, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(dst);
    const { size } = await fs.stat(dst);
    console.log(`${slug}/photo-${num}.jpg  ${(size / 1024).toFixed(0)} KB`);
    i++;
  }
}
