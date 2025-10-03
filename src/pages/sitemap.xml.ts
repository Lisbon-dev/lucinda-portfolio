import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async ({ site }) => {
  // Get all projects from content collection
  const projects = await getCollection('projects');
  
  // Base URL for the site
  const siteUrl = site?.href || 'https://lucindaburman.com';
  
  // Static pages with their priority and change frequency
  const staticPages = [
    {
      url: siteUrl,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: '1.0'
    },
    {
      url: `${siteUrl}privacy-policy`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'yearly',
      priority: '0.3'
    },
    {
      url: `${siteUrl}terms-and-conditions`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'yearly',
      priority: '0.3'
    }
  ];
  
  // Dynamic project pages
  const projectPages = projects.map((project) => ({
    url: `${siteUrl}projects/${project.slug}`,
    lastmod: project.data.publishedDate 
      ? project.data.publishedDate.toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    changefreq: 'monthly',
    priority: '0.8'
  }));
  
  // Combine all pages
  const allPages = [...staticPages, ...projectPages];
  
  // Generate XML sitemap
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${allPages
  .map(
    (page) => `  <url>
    <loc>${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
    }
  });
};
