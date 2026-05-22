import type { ImageMetadata } from 'astro';

/**
 * `cover` a položky v `gallery` mohou být buď string URL (externí),
 * nebo objekt `ImageMetadata` (lokální obrázek vedle MDX).
 * Vrátí URL použitelné v `<img src>`.
 */
export function imgSrc(input: string | ImageMetadata | undefined | null): string | undefined {
  if (!input) return undefined;
  return typeof input === 'string' ? input : input.src;
}
