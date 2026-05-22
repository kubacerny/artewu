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
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    category: z.enum(['truhlarstvi', 'software']),
    cover: z.string().optional(),
    gallery: z.array(z.string()).optional(),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { blog };
