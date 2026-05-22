import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({
    pattern: '**/*.mdx',
    base: './src/content/blog',
    // Podporuje obě varianty:
    //   1) src/content/blog/slug.mdx                → id: "slug"
    //   2) src/content/blog/slug/index.mdx          → id: "slug"   (lze přidat obrázky vedle)
    generateId: ({ entry }) => entry.replace(/\.mdx$/, '').replace(/\/index$/, ''),
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      date: z.coerce.date(),
      category: z.enum(['truhlarstvi', 'software']),
      // Buď lokální obrázek (vedle index.mdx, relativní cesta `./photo.jpg`),
      // nebo absolutní URL na externí obrázek.
      cover: z.union([image(), z.string().url()]).optional(),
      gallery: z.array(z.union([image(), z.string().url()])).optional(),
      tags: z.array(z.string()).default([]),
    }),
});

export const collections = { blog };
