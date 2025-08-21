import { defineCollection, z } from 'astro:content';

const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.string(),
    featured: z.boolean().default(false),
    publishedDate: z.date(),
    mainImage: z.object({
      src: z.string(),
      alt: z.string(),
      width: z.number().optional(),
      height: z.number().optional(),
    }),
    images: z.array(z.object({
      src: z.string(),
      alt: z.string(),
      width: z.number().optional(),
      height: z.number().optional(),
    })),
    tags: z.array(z.string()).optional(),
    client: z.string().optional(),
    year: z.number().optional(),
  }),
});

export const collections = {
  projects,
};