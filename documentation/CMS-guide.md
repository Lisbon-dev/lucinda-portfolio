# Content Management Guide (Keystatic CMS)

This site now has a friendly admin panel — **Keystatic** — so you can add and
edit content without touching code. Every change you make is saved back to the
project's files; when those changes reach the `main` branch on GitHub, Vercel
automatically rebuilds and publishes the live site.

This guide is written for non-technical use. If anything looks unfamiliar, your
developer can walk you through it once and it will make sense from then on.

---

## 1. Opening the admin panel

The admin panel lives at **`/keystatic`**.

- **On the live site:** `https://your-domain.com/keystatic`
- **On your computer (developer preview):** `http://localhost:4321/keystatic`

When Keystatic is set to **GitHub mode** (see "For your developer" at the
bottom), the first time you open `/keystatic` it will ask you to **sign in with
GitHub** and authorise the app. This is how your edits are safely saved to the
project. You only sign in once per device.

Once you are in, you will see the sections in the left sidebar:

- **Projects** — your portfolio pieces
- **About** — the text in the About pop-up
- **Site settings** — the homepage categories and social links

---

## 2. Editing a project

1. Click **Projects** in the sidebar. You will see the full list (18 to start).
2. Click the project you want to change.
3. Update any of the fields:
   - **Title** — the project name.
   - **Description** — the short blurb shown on the project page.
   - **Category** — e.g. "Brand Storytelling", "Editorial Illustration".
   - **Featured / Order** — controls prominence and sort order (lower Order
     numbers appear first).
   - **Published date**.
   - **Main image** — the hero image (also used as the tile on the homepage).
   - **Additional images** — extra images shown down the project page.
   - **Videos**, **Tags**, **Client**, **Year**.
   - **SEO** and **Metadata** — optional, for search engines and rich details.
   - **Body** — the longer write-up beneath the images.
4. Click **Save** (top right).

> Tip: The **Title** also determines the project's web address (its "slug").
> Changing the title of an existing project does **not** change its address by
> default, which keeps existing links working. Only change the slug if you
> intentionally want the URL to change.

### Adding a new project

1. In **Projects**, click **+ Create** (top right).
2. Fill in the fields — at minimum a Title, Description, Category, Published
   date, and a Main image with its alt text.
3. Click **Save**. The new project appears on the homepage grid automatically.

---

## 3. Uploading images

Anywhere you see an image field (Main image, Additional images, video poster):

1. Click the upload area and choose a file from your computer (PNG or JPG).
2. Always fill in the **Alt text** box — a short description of what's in the
   image. This is important for accessibility and search engines.
3. Save.

Behind the scenes the image is stored inside the project's assets folder and the
site automatically optimises it (resizes and converts to modern formats) when it
builds — you don't need to do anything for that.

**Videos** are handled slightly differently: video files themselves are large,
so they live in the `public/videos/` folder and are added by your developer. In
the CMS you reference a video by its path (for example
`/videos/whotel/W-HOTEL-PRESENTATION`) and can give it a poster image and alt
text.

---

## 4. Editing the About section

1. Click **About** in the sidebar.
2. Edit:
   - **Bio** — your introduction. Separate paragraphs with a blank line.
   - **Select clients** — the clients list.
   - **Select exhibitions** — one exhibition per line.
   - **Contact email** — the email shown in the About pop-up (the "contact me"
     address that opens the visitor's email app).
3. Click **Save**.

> **Important about the contact email:** the address here is only what visitors
> *see* in the About pop-up. The contact **form** delivers messages to a
> separate address set by your developer in Vercel (the `CONTACT_TO_EMAIL`
> setting). If you want the form's destination changed, ask your developer to
> update that setting too — changing it here alone will not redirect form
> emails.

---

## 5. Editing homepage categories & social links

1. Click **Site settings** in the sidebar.
2. **Homepage categories** — the words under your name on the homepage
   (Illustration, Editorial, …). Add, remove, reorder, or rename them.
3. **Social links** — each has a Label (e.g. "Instagram"), a URL, and an
   "Opens in new tab" toggle.
4. Click **Save**.

---

## 6. How your changes go live

- In **GitHub mode**, clicking **Save** commits your change to the repository.
  Vercel notices the commit and rebuilds the site — usually live within 1–2
  minutes.
- If your developer has set up a staging/`preview` branch, edits may be reviewed
  there before being merged to `main` (production).

If a change doesn't appear after a couple of minutes, hard-refresh your browser
(Cmd/Ctrl + Shift + R) and check the Vercel dashboard's Deployments tab.

---

## For your developer — switching from local to GitHub storage

Keystatic ships configured with **local** storage (`keystatic.config.ts`), which
writes directly to the working tree — ideal for development. To let the client
edit the live site, switch to GitHub storage:

```ts
// keystatic.config.ts
export default config({
  storage: {
    kind: 'github',
    repo: { owner: 'Lisbon-dev', name: 'lucinda-portfolio' },
  },
  // ...collections and singletons unchanged
});
```

Then create a **Keystatic GitHub App** (Keystatic's dashboard walks you through
it) and add the resulting credentials to Vercel's Environment Variables:

- `KEYSTATIC_GITHUB_CLIENT_ID`
- `KEYSTATIC_GITHUB_CLIENT_SECRET`
- `KEYSTATIC_SECRET`

See the official guide: <https://keystatic.com/docs/github-mode>.

Notes specific to this project:

- **Images round-trip through `astro:assets`.** The image fields save uploads
  into `src/assets/portfolio` and write a `../../assets/portfolio/...` path into
  each project's frontmatter, which is exactly what the content-collection
  schema's `image()` helper expects. Existing per-project sub-folder paths (e.g.
  `../../assets/portfolio/whotel/…`) are preserved verbatim.
- **Singletons** (`about`, `siteSettings`) are stored as YAML under `src/data/`
  and read at build time via `@keystatic/core/reader` in
  `src/components/dialog/AboutDialog.astro` and `src/pages/index.astro`.
- **Contact email delivery** stays controlled by the `CONTACT_TO_EMAIL`
  environment variable — the CMS `about.contactEmail` is display-only.
