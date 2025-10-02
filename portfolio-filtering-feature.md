# Portfolio Filtering Feature Implementation Plan

### Plan for Implementing Category Filtering

The goal is to filter the projects displayed in the `MasonryGrid` when a user clicks a category link in the sub-header, while ensuring the grid layout and animations adapt correctly.

A simple CSS `display: none` approach is not viable because:
1.  The `astro-masonry` library calculates its column layout based on the number of direct children. Hiding elements with CSS would leave empty gaps in the grid instead of re-flowing the layout.
2.  It would conflict with the `motion` library's `inView` animations, which rely on the element's position in the viewport.

The implementation will require client-side JavaScript to manipulate the DOM, forcing the `astro-masonry` component to re-calculate its layout with a new set of items.

---

#### Step 1: Update Astro Component Markup

1.  **Modify `src/pages/index.astro`:**
    *   Add an "All" or "Works" link to the `categories` array. This will serve as the way to clear the filter and show all projects.
    *   Add a specific class (e.g., `category-filter-link`) to the `<a>` tags for easy selection in JavaScript.

2.  **Modify `src/components/portfolio/MasonryGrid.astro`:**
    *   Add a `data-category` attribute to each `div.masonry-item`. The value should be the "slugified" version of the project's category from its frontmatter (e.g., `brand-storytelling`). This will be used by the JavaScript filter.

---

#### Step 2: Implement Client-Side JavaScript Logic

This logic will be added to the `<script>` tag within `src/components/portfolio/MasonryGrid.astro` to keep the component's functionality self-contained.

1.  **Initialization:**
    *   On page load, select and store all `div.masonry-item` elements in a persistent JavaScript array. This creates an in-memory "master list" of all projects that will never be lost during filtering.
    *   Select the `Masonry` component's container element, which holds the grid columns.

2.  **Event Handling:**
    *   Attach `click` event listeners to all category links (`.category-filter-link`).
    *   In the click handler, `event.preventDefault()` to stop the browser's default anchor link behavior.
    *   Extract the target category slug from the link's `href` attribute.

3.  **Filtering and DOM Manipulation:**
    *   When a filter link is clicked:
        a.  Get the target category (e.g., `brand-storytelling` or `all`).
        b.  Filter the "master list" of stored project elements based on their `data-category` attribute.
        c.  **Crucially, empty the contents of the `Masonry` container in the DOM.** This removes all currently visible items.
        d.  Append the filtered list of elements back into the `Masonry` container.
    *   This process of removing and adding elements will force `astro-masonry`'s underlying library to re-calculate the column layout with the new, filtered set of items.

---

#### Step 3: Assess Interaction with Animations and Styling

1.  **Animation Integration (`motion`):**
    *   The proposed DOM manipulation strategy works favorably with the existing `motion` animations.
    *   When elements are re-added to the DOM, their animation state is reset. The `inView` observers will re-trigger as the new grid layout appears, causing the filtered items to animate into view with the same cascade effect they have on initial page load.
    *   This provides a smooth and visually consistent user experience, as filtering will feel like a fresh, animated reveal of the content.

2.  **Styling for Active Filter:**
    *   The JavaScript logic will manage an `active` class on the category links.
    *   When a filter link is clicked, the `active` class will be removed from all other links and applied to the clicked one.
    *   CSS will be used to style the `.category-filter-link.active` selector, providing clear visual feedback to the user about which filter is currently selected.
