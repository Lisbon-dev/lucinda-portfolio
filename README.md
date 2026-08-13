# Lucinda Burman Portfolio - Client Guide

Welcome to your portfolio website! This guide will help you manage and update your website content, contact information, and handle deployments.

## 📋 Website Architecture Overview

Your portfolio website is built with modern technologies that ensure excellent performance, security, and ease of maintenance:

- **Framework:** [Astro](https://astro.build) - A modern static site generator
- **Hosting:** [Vercel](https://vercel.com) - Enterprise-grade hosting with global CDN
- **Content Management:** [Keystatic](https://keystatic.com) admin panel at `/keystatic`, backed by Markdown/YAML files (no database required)
- **Contact Form:** [Resend](https://resend.com) email integration

## ✨ The easiest way to edit: the `/keystatic` admin panel

You now have a friendly, no-code admin panel for editing your content.

- Go to **`https://your-domain.com/keystatic`** (or `http://localhost:4321/keystatic` when running locally).
- Sign in with GitHub (one time per device), then edit **Projects**, the **About** section, and **Site settings** through simple forms.
- Clicking **Save** commits the change and Vercel republishes the site automatically.

👉 **See [`documentation/CMS-guide.md`](documentation/CMS-guide.md) for the full step-by-step client guide.**

The manual, file-editing instructions below still work and are kept for reference and advanced edits.

### Key Website Sections

1. **Homepage:** Masonry grid portfolio showcase
2. **Project Detail Pages:** Individual pages for each portfolio item
3. **About Modal:** Your biography and professional information
4. **Contact Modal:** Contact form for client inquiries
5. **Privacy & Terms Pages:** Legal information

## 🔄 How to Update Your Content

### Managing Portfolio Projects

Your portfolio projects are stored as Markdown files in the `src/content/projects/` directory. Each project has its own file with a `.md` extension.

#### Option 1: Update via GitHub Web Interface

1. Go to your GitHub repository at `https://github.com/yourusername/lucinda-portfolio`
2. Navigate to `src/content/projects/`
3. Select the project file you want to edit (e.g., `w-hotel-paris-brand.md`)
4. Click the pencil icon (Edit this file)
5. Make your changes to the content
6. Scroll down and click "Commit changes"
7. Add a brief description of your changes (e.g., "Update W Hotel project description")
8. Click "Commit changes" button

#### Option 2: Update via Visual Studio Code

If you prefer using VS Code:

1. Clone the repository to your computer (one-time setup):
   ```
   git clone https://github.com/yourusername/lucinda-portfolio.git
   cd lucinda-portfolio
   ```

2. Open the project in VS Code:
   ```
   code .
   ```

3. Navigate to `src/content/projects/` in the file explorer
4. Edit the desired project file
5. Save your changes
6. Commit and push your changes:
   ```
   git add .
   git commit -m "Update project description"
   git push
   ```

### Project File Structure

Each project file follows this structure:

```markdown
---
title: "W Hotel Paris Brand"
description: "Brand identity development for W Hotel Paris"
client: "W Hotels"
date: "2023-05-15"
category: "Branding"
tags: ["Hospitality", "Luxury", "Identity"]
featured: true
coverImage: "../assets/portfolio/whotel/W Hotel 6.png"
videoUrl: "/videos/whotel/W-HOTEL-PRESENTATION.mp4"
images:
  - "../assets/portfolio/whotel/W Hotel 6.png"
  - "../assets/portfolio/whotel/W Hotel 7.png"
---

This project involved developing a comprehensive brand identity for the W Hotel Paris location. The design approach focused on blending Parisian elegance with the W Hotel's contemporary aesthetic.

The brand package included logo variations, color palette, typography guidelines, and application examples across various touchpoints including signage, stationery, and digital assets.

Key elements of the design include...
```

### Adding a New Project

To add a new project:

1. Create a new `.md` file in `src/content/projects/` (e.g., `new-project-name.md`)
2. Copy the structure from an existing project
3. Update all fields with your new project information
4. Add your project images to the appropriate folder in `src/assets/portfolio/`
5. Reference these images in your project file
6. Commit and push your changes

### Adding Project Images

1. Add your image files to the appropriate folder in `src/assets/portfolio/`
   - For organization, create a new folder for each project (e.g., `src/assets/portfolio/new-project/`)
2. Reference these images in your project markdown file:
   ```
   images:
     - "../assets/portfolio/new-project/image1.png"
     - "../assets/portfolio/new-project/image2.png"
   ```
3. Note that the images are configured in order of showing in the project page, with the `main image` being the first as well as the displayed image in the homepage masonry grid for this project

### Adding Project Videos

1. Add your video files to the `public/videos/` directory
   - Create a new folder for each project (e.g., `public/videos/new-project/`)
2. Add both MP4 and WebM formats for best compatibility
3. Reference the video in your project markdown:
   ```
   videoUrl: "/videos/new-project/PROJECT-VIDEO.mp4"
   ```

## 📧 Updating Contact Information

### Changing Contact Email Address

Your contact form sends emails to the address configured in the environment variables on Vercel. To update:

1. Log in to your [Vercel dashboard](https://vercel.com)
2. Select your portfolio project
3. Go to "Settings" > "Environment Variables"
4. Update the `CONTACT_TO_EMAIL` variable with your new email address
5. Click "Save"

### Updating About Me Content

**Easiest way:** open the **`/keystatic`** admin panel, click **About**, edit the
Bio / Select clients / Select exhibitions / Contact email fields, and Save. See
[`documentation/CMS-guide.md`](documentation/CMS-guide.md).

Under the hood, the About text now lives in `src/data/about/index.yaml` (managed
by Keystatic). The `src/components/dialog/AboutDialog.astro` component reads that
file automatically — you no longer edit the biography by hand-editing HTML.

**Homepage categories and social links** are likewise editable under **Site
settings** in `/keystatic` (stored in `src/data/site-settings/index.yaml`).

### Updating Contact Form Options

To modify the subject dropdown options in the contact form:

1. Navigate to `src/components/forms/ContactForm.astro`
2. Find the `subjectOptions` array at the top of the file
3. Edit the options to change available subjects
4. Commit and push your changes

Example:

```js
const subjectOptions = [
  { value: 'general', label: 'General Inquiry' },
  { value: 'project', label: 'Project Collaboration' },
  { value: 'commission', label: 'Commission Request' },
  { value: 'press', label: 'Press & Media' },
  { value: 'other', label: 'Other' },
  // Add a new option
  { value: 'exhibition', label: 'Exhibition Opportunity' },
];
```

## 🚀 Deployment & Troubleshooting

### How Deployments Work

Your website uses automatic deployments:

1. When you push changes to the `main` branch on GitHub, Vercel automatically detects the changes
2. Vercel builds and deploys your updated website (typically takes 1-2 minutes)
3. Once complete, your changes are live on your domain

### Viewing Deployment Status

To check the status of your deployments:

1. Log in to your [Vercel dashboard](https://vercel.com)
2. Select your portfolio project
3. Go to the "Deployments" tab to see all recent deployments
4. Click on any deployment to see build logs and details

### Common Issues & Solutions

#### Issue: Changes not appearing after deployment

**Solution:**
1. Check that your changes were successfully committed and pushed to GitHub
2. Verify the deployment completed successfully in Vercel
3. Try hard-refreshing your browser (Ctrl+F5 or Cmd+Shift+R)
4. Check for any build errors in the Vercel deployment logs

#### Issue: Contact form not sending emails

**Solution:**
1. Verify your Resend API key is correctly set in Vercel environment variables
2. Check that the recipient email address is correctly configured
3. Review Vercel Function logs for any errors

#### Issue: Images not displaying correctly

**Solution:**
1. Ensure image paths in your markdown files are correct
2. Verify images are in the correct directory
3. Check image formats are supported (PNG, JPG, WebP recommended)

### Getting Help

If you encounter issues you can't resolve:

1. Contact your developer at [help@lisbon.dev](mailto:help@lisbon.dev)
2. Provide specific details about the issue and any error messages
3. Include screenshots if applicable

## 🧰 Useful Commands (For Advanced Users)

If you're comfortable using the command line, these commands can be helpful for local development:

```bash
# Install dependencies
pnpm install

# Start local development server
pnpm dev

# Build the website locally
pnpm build

# Preview the production build locally
pnpm preview
```

---

*This guide was last updated: August 2026 (added Keystatic CMS at `/keystatic`)*
