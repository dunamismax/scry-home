# shadcn/ui Component Packs

> Custom components extending shadcn/ui. The ecosystem is hungry for these.

---

## The Problem

shadcn/ui has become the de facto component library for React + Tailwind projects. But it's intentionally minimal — it gives you primitives, not solutions. Developers constantly need components that don't exist in the base library: data tables with sorting/filtering, file uploaders, rich text editors, dashboards, multi-step forms, command palettes, and more.

The shadcn ecosystem is young and there's real demand for high-quality extensions that follow the same patterns (copy-paste, customizable, accessible, no runtime dependency).

## The Product

One or more repos containing production-quality shadcn/ui-compatible components:

### Pack Ideas (pick the highest-demand first)

**Data Components**
- Advanced data table with column sorting, filtering, pagination, row selection, and export
- Kanban board with drag-and-drop
- Timeline / activity feed
- Charts and dashboards (wrapping Recharts with shadcn styling)

**Form Components**
- Multi-step form wizard with validation
- File upload with drag-and-drop, preview, and progress
- Rich text editor (Tiptap-based, shadcn-styled)
- Address autocomplete input
- Date range picker with presets

**Layout Components**
- Command palette (enhanced beyond cmdk)
- Settings page layout with sidebar navigation
- Onboarding stepper
- Pricing table with toggle
- Notification center / inbox

**Auth Components**
- Login/register forms with social providers
- 2FA setup flow
- Session management table
- Password strength indicator

## Target Audience

- React + Tailwind developers (massive and growing)
- shadcn/ui users who need more than the base library
- SaaS builders who want polished UI without building from scratch
- Agencies and freelancers who need reusable components

## Star Potential

High. `shadcn/ui` itself has 85k+ stars. Extension repos consistently get thousands. The audience is enormous and actively searching for these components.

## Launch Strategy

1. Ship 3-5 components as an initial pack (focus on highest-demand: data table, file upload, multi-step form)
2. Create a docs site showing live previews (Storybook or custom)
3. Follow shadcn's copy-paste philosophy — no npm package, just source
4. Post to: r/reactjs, r/tailwindcss, shadcn Discord, Twitter/X
5. Submit to shadcn's community extensions list

## Name Candidates

- `shadcn-extras` — direct, discoverable
- `shadcn-plus` — implies extension
- `shadcn-blocks` — the "blocks" metaphor fits shadcn's ethos
- `ui-kit` — generic but clean if scoped under dunamismax

## Stack

React, TypeScript, Tailwind, Radix primitives (where shadcn uses them), Storybook or custom docs site.

## Priority

Tier 2. Steady growth play. Ship components as they're needed in other projects — don't build them in isolation.
