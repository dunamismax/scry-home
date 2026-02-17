# astro-blog-template

A production-ready Astro starter converted into a neutral template with no personal content.

## What You Get

- Astro + MDX + Tailwind v4
- Fast static output with built-in search (`pagefind`)
- Dynamic OG image generation
- RSS, sitemap, tags, pagination, archives
- Markdown response routes (`/index.md`, `/posts.md`, etc.)
- PWA support

## Quick Start

```bash
bun install
bun run dev
```

## Build & Verify

```bash
bun run lint
bun run typecheck
bun run build
```

## Personalization Checklist

1. Update `src/consts.ts` for site title, author, description, and URL.
2. Update social links in `src/constants.ts`.
3. Set `PUBLIC_NEWSLETTER_ACTION` (and optional `PUBLIC_NEWSLETTER_TAG`) if you want email signup enabled.
4. Replace `public/template-avatar.svg` and `public/template-cover.svg`.
5. Replace starter posts in `src/content/blog/`.

## Deployment

`vercel.json` is included and uses Bun commands by default.

## License

MIT. See `LICENSE`.
