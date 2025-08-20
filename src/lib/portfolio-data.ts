// Portfolio data structure based on existing images in src/content/projects/
// This temporary approach will be replaced with proper Astro content collections later

export interface PortfolioProject {
  title: string;
  images: string[];
  category: string;
  description: string;
  slug: string;
}

export const portfolioProjects: PortfolioProject[] = [
  {
    title: "Books Into The Wild",
    images: [
      "BOOKS INTO THE WILD single page spread.png",
      "Into the wild.png"
    ],
    category: "Editorial Illustration",
    description: "Illustrated spreads for literary work adaptation",
    slug: "books-into-wild"
  },
  {
    title: "Bimini Magazine",
    images: [
      "Bimini - double page spread.png",
      "Binimi SPEC MLK.png"
    ],
    category: "Magazine Design",
    description: "Double-page spread designs for Bimini Magazine",
    slug: "bimini-magazine"
  },
  {
    title: "History Repeating",
    images: [
      "History Repeating - Einsteen charcoal.png",
      "History Repeating.png"
    ],
    category: "Portrait Illustration",
    description: "Charcoal portrait series exploring historical themes",
    slug: "history-repeating"
  },
  {
    title: "Shadow of a Doubt",
    images: [
      "Shadow of a Doubt DP OCT 23 .jpg",
      "Shadow of a doubt illustration.jpg"
    ],
    category: "Editorial Illustration",
    description: "Film-inspired editorial illustrations",
    slug: "shadow-of-doubt"
  },
  {
    title: "Suffer Little Children",
    images: [
      "Suffer little children 1st page spread.png",
      "Suffer little children 2nd page.png",
      "Suffer little children Arnie .png",
      "Suffer little children David W.png",
      "Suffer little children Kanye.png",
      "Suffer little children Madonna.png"
    ],
    category: "Editorial Series",
    description: "Multi-page editorial series with celebrity portraits",
    slug: "suffer-little-children"
  }
];