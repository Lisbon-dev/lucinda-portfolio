import { defineCollection, z } from 'astro:content';

const projects = defineCollection({
  type: 'content',
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string(),
    category: z.string(),
    featured: z.boolean().default(false),
    order: z.number().optional(),
    publishedDate: z.date(),
    mainImage: z.object({
      src: image(),
      alt: z.string(),
      width: z.number().optional(),
      height: z.number().optional(),
    }),
    images: z.array(z.object({
      src: image(),
      alt: z.string(),
      width: z.number().optional(),
      height: z.number().optional(),
    })).optional(),
    // New video support
    videos: z.array(z.object({
      src: z.string(), // Path to video file
      poster: image().optional(), // Optional poster image
      alt: z.string(), // Description for accessibility
      width: z.number().optional(),
      height: z.number().optional(),
      position: z.number().optional(), // Position in image sequence (0-based)
    })).optional(),
    tags: z.array(z.string()).optional(),
    client: z.string().optional(),
    year: z.number().optional(),
    
    // SEO Enhancement Fields
    seo: z.object({
      title: z.string().optional(), // Custom SEO title (max 60 chars recommended)
      description: z.string().optional(), // Custom meta description (max 155 chars)
      keywords: z.array(z.string()).optional(), // Project-specific keywords
      ogImage: z.string().optional(), // Custom Open Graph image path
      noindex: z.boolean().default(false), // Whether to exclude from search engines
    }).optional(),
    
    // Enhanced Metadata for Rich Snippets
    metadata: z.object({
      duration: z.string().optional(), // Project duration (e.g., "3 months")
      role: z.string().optional(), // Role in project (e.g., "Lead Illustrator")
      tools: z.array(z.string()).optional(), // Tools used (e.g., ["Adobe Illustrator", "Procreate"])
      awards: z.array(z.string()).optional(), // Any awards or recognition
      featured_in: z.array(z.string()).optional(), // Publications or sites that featured this work
    }).optional(),
  }),
});

export const collections = {
  projects,
};
