# SEO guide

Astro renders all public pages statically and supplies the site-wide SEO configuration from `src/data/site.ts`.

## Included SEO assets

- Canonical URLs, title/description, Open Graph, Twitter, and robots meta tags in `src/layouts/BaseLayout.astro`
- JSON-LD for the home page, blog posts, work items, and projects
- Build-time PNG Open Graph images for every home, list, tag, and detail route
- `robots.txt`, `rss.xml`, and `llms.txt` Astro endpoints
- Automatic sitemap generation with `@astrojs/sitemap`

Set `PUBLIC_SITE_URL` in the deployment environment to your final canonical origin. Update `src/data/site.ts`, `src/data/portfolio.ts`, and the MDX frontmatter before publishing.
