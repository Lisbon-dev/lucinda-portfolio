import { config, fields, collection, singleton } from '@keystatic/core';

/**
 * Keystatic CMS configuration.
 *
 * Storage is `local` for development (edits write straight to the working
 * tree). For production, switch to GitHub storage so the client's edits commit
 * to the repo and Vercel auto-deploys — see documentation/CMS-guide.md:
 *
 *   storage: {
 *     kind: 'github',
 *     repo: { owner: 'Lisbon-dev', name: 'lucinda-portfolio' },
 *   },
 *
 * IMPORTANT (image paths): the Astro `projects` content collection resolves
 * `image()` paths RELATIVE to each markdown file in `src/content/projects/`.
 * The image fields below therefore save uploads into `src/assets/portfolio`
 * and write a `../../assets/portfolio/...` path into the frontmatter, which is
 * exactly what `astro:assets` expects. This also round-trips the existing
 * per-project sub-folder paths (e.g. `../../assets/portfolio/whotel/...`)
 * because the stored path is kept verbatim on read/write.
 */

const IMAGE_DIRECTORY = 'src/assets/portfolio';
const IMAGE_PUBLIC_PATH = '../../assets/portfolio';

const imageField = (label: string, isRequired = false) =>
  fields.image({
    label,
    directory: IMAGE_DIRECTORY,
    publicPath: IMAGE_PUBLIC_PATH,
    validation: { isRequired },
  });

// Reusable media object shapes mirroring src/content/config.ts
const dimensionFields = {
  width: fields.integer({ label: 'Width (px)' }),
  height: fields.integer({ label: 'Height (px)' }),
};

export default config({
  storage: {
    kind: 'local',
  },
  ui: {
    brand: { name: 'Lucinda Burman' },
    navigation: {
      Content: ['projects'],
      Site: ['about', 'siteSettings'],
    },
  },
  collections: {
    projects: collection({
      label: 'Projects',
      slugField: 'title',
      path: 'src/content/projects/*',
      format: { contentField: 'content', data: 'yaml' },
      columns: ['title', 'category'],
      entryLayout: 'form',
      schema: {
        title: fields.slug({
          name: {
            label: 'Title',
            validation: { isRequired: true },
          },
          slug: {
            description:
              'The URL segment for this project (e.g. /projects/w-hotel-paris-brand). Change with care — it changes the public URL.',
          },
        }),
        description: fields.text({
          label: 'Description',
          multiline: true,
          validation: { isRequired: true },
        }),
        category: fields.text({
          label: 'Category',
          validation: { isRequired: true },
        }),
        featured: fields.checkbox({
          label: 'Featured',
          defaultValue: false,
        }),
        order: fields.integer({
          label: 'Order',
          description: 'Lower numbers appear first.',
        }),
        publishedDate: fields.date({
          label: 'Published date',
          validation: { isRequired: true },
        }),
        mainImage: fields.object(
          {
            src: imageField('Main image', true),
            alt: fields.text({ label: 'Alt text', validation: { isRequired: true } }),
            ...dimensionFields,
          },
          { label: 'Main image' }
        ),
        images: fields.array(
          fields.object(
            {
              src: imageField('Image', true),
              alt: fields.text({ label: 'Alt text' }),
              ...dimensionFields,
            },
            { label: 'Image' }
          ),
          {
            label: 'Additional images',
            itemLabel: (props) => props.fields.alt.value || 'Image',
          }
        ),
        videos: fields.array(
          fields.object(
            {
              src: fields.text({
                label: 'Video path',
                description:
                  'Path to the video in /public, without extension (e.g. /videos/whotel/W-HOTEL-PRESENTATION).',
                validation: { isRequired: true },
              }),
              poster: imageField('Poster image'),
              alt: fields.text({ label: 'Alt text' }),
              ...dimensionFields,
              position: fields.integer({
                label: 'Position',
                description: 'Zero-based position within the media sequence.',
              }),
            },
            { label: 'Video' }
          ),
          {
            label: 'Videos',
            itemLabel: (props) => props.fields.alt.value || 'Video',
          }
        ),
        tags: fields.array(fields.text({ label: 'Tag' }), {
          label: 'Tags',
          itemLabel: (props) => props.value || 'Tag',
        }),
        client: fields.text({ label: 'Client' }),
        year: fields.integer({ label: 'Year' }),
        seo: fields.object(
          {
            title: fields.text({ label: 'SEO title' }),
            description: fields.text({ label: 'Meta description', multiline: true }),
            keywords: fields.array(fields.text({ label: 'Keyword' }), {
              label: 'Keywords',
              itemLabel: (props) => props.value || 'Keyword',
            }),
            ogImage: fields.text({ label: 'Open Graph image path' }),
            noindex: fields.checkbox({
              label: 'Exclude from search engines',
              defaultValue: false,
            }),
          },
          { label: 'SEO' }
        ),
        metadata: fields.object(
          {
            duration: fields.text({ label: 'Duration' }),
            role: fields.text({ label: 'Role' }),
            tools: fields.array(fields.text({ label: 'Tool' }), {
              label: 'Tools',
              itemLabel: (props) => props.value || 'Tool',
            }),
            awards: fields.array(fields.text({ label: 'Award' }), {
              label: 'Awards',
              itemLabel: (props) => props.value || 'Award',
            }),
            featured_in: fields.array(fields.text({ label: 'Publication' }), {
              label: 'Featured in',
              itemLabel: (props) => props.value || 'Publication',
            }),
          },
          { label: 'Metadata' }
        ),
        content: fields.markdoc({
          label: 'Body',
          extension: 'md',
        }),
      },
    }),
  },
  singletons: {
    about: singleton({
      label: 'About',
      path: 'src/data/about/',
      format: { data: 'yaml' },
      schema: {
        bio: fields.text({
          label: 'Bio',
          description: 'Separate paragraphs with a blank line.',
          multiline: true,
          validation: { isRequired: true },
        }),
        selectClients: fields.text({
          label: 'Select clients',
          multiline: true,
        }),
        selectExhibitions: fields.text({
          label: 'Select exhibitions',
          description: 'One exhibition per line.',
          multiline: true,
        }),
        contactEmail: fields.text({
          label: 'Contact email (display / mailto only)',
          description:
            'Shown in the About modal. Email DELIVERY for the contact form is controlled by the CONTACT_TO_EMAIL environment variable, not this field.',
        }),
      },
    }),
    siteSettings: singleton({
      label: 'Site settings',
      path: 'src/data/site-settings/',
      format: { data: 'yaml' },
      schema: {
        categories: fields.array(fields.text({ label: 'Category' }), {
          label: 'Homepage categories',
          itemLabel: (props) => props.value || 'Category',
        }),
        socialLinks: fields.array(
          fields.object(
            {
              label: fields.text({ label: 'Label', validation: { isRequired: true } }),
              url: fields.url({ label: 'URL', validation: { isRequired: true } }),
              external: fields.checkbox({ label: 'Opens in new tab', defaultValue: true }),
            },
            { label: 'Social link' }
          ),
          {
            label: 'Social links',
            itemLabel: (props) => props.fields.label.value || 'Social link',
          }
        ),
      },
    }),
  },
});
