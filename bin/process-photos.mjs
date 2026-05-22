#!/usr/bin/env node
/**
 * Projde src/content/blog/ rekurzivně a optimalizuje každý JPEG/PNG obrázek:
 *   - auto-rotace podle EXIF
 *   - resize na max 1800 px na delší straně
 *   - JPEG quality 82 (mozjpeg), strip metadat
 *   - přepis na místě, název souboru se nemění
 *
 * Přeskočí soubory, které už byly zpracované. Stav se sleduje v
 * src/content/blog/.artewu-processed.json přes SHA-256 fingerprint
 * prvních 4 KB souboru — jakmile se soubor změní (náhrada fotky),
 * automaticky se zpracuje znovu.
 *
 * Použití:
 *   node bin/process-photos.mjs
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

const BASE = 'src/content/blog';
const MANIFEST = path.join(BASE, '.artewu-processed.json');

// --- manifest helpers ---

async function loadManifest() {
  try {
    return JSON.parse(await fs.readFile(MANIFEST, 'utf8'));
  } catch {
    return {};
  }
}

async function saveManifest(m) {
  await fs.writeFile(MANIFEST, JSON.stringify(m, null, 2) + '\n');
}

/** SHA-256 of first 4 096 bytes — cheap but reliable fingerprint. */
async function fingerprint(filePath) {
  const fd = await fs.open(filePath, 'r');
  const buf = Buffer.alloc(4096);
  const { bytesRead } = await fd.read(buf, 0, 4096, 0);
  await fd.close();
  return crypto.createHash('sha256').update(buf.subarray(0, bytesRead)).digest('hex');
}

// --- file discovery ---

async function findImages(dir) {
  const results = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;          // skip dotfiles / manifest
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      results.push(...(await findImages(full)));
    } else if (/\.(jpe?g|png)$/i.test(e.name)) {
      results.push(full);
    }
  }
  return results;
}

// --- main ---

const manifest = await loadManifest();
const images = await findImages(BASE);
let processed = 0;
let skipped = 0;

for (const absPath of images) {
  const rel = path.relative(BASE, absPath);
  const fp = await fingerprint(absPath);

  if (manifest[rel] === fp) {
    skipped++;
    continue; // already optimized, fingerprint unchanged
  }

  const tmp = absPath + '.artewu-tmp';
  try {
    await sharp(absPath)
      .rotate()                // bake EXIF orientation, then strip it
      .resize({ width: 1800, height: 1800, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(tmp);

    await fs.rename(tmp, absPath); // atomic replace

    manifest[rel] = await fingerprint(absPath); // store output fingerprint
    const { size } = await fs.stat(absPath);
    console.log(`✓  ${rel}  →  ${(size / 1024).toFixed(0)} KB`);
    processed++;
  } catch (err) {
    await fs.unlink(tmp).catch(() => {});
    console.error(`✗  ${rel}: ${err.message}`);
  }
}

// Remove manifest entries for deleted files
for (const key of Object.keys(manifest)) {
  try { await fs.access(path.join(BASE, key)); }
  catch { delete manifest[key]; }
}

await saveManifest(manifest);
console.log(`\nHotovo. Zpracováno: ${processed}, přeskočeno (již optimalizováno): ${skipped}.`);
