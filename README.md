# Portfolio

Immersive developer portfolio: React, TypeScript, Vite, Three.js / React Three Fiber, GSAP ScrollTrigger and Tailwind CSS.

## Commands

```bash
npm install
npm run dev        # development server
npm run build      # type-check + production build to dist/
npm run preview    # serve the production build locally
npm run typecheck
npm test           # Vitest content-integrity tests
```

## Editing content

All personal content lives in `src/data/`. You should not need to touch components.

| File | Contents |
| --- | --- |
| `src/data/profile.ts` | Name, hero copy, links (email, GitHub, LinkedIn, résumé), about, experience, education, certifications |
| `src/data/projects.ts` | Featured projects and full case-study sections |
| `src/data/skills.ts` | Capability groups, linked to projects by slug |

Any value written as `[Like this]` is a **placeholder**. It renders with a dashed lime outline and is never turned into a link, so
missing content is obvious. Replace it with real content, and only describe work you actually did.

- **Résumé:** put a PDF at `public/resume.pdf` and set `links.resume: '/resume.pdf'`.
- **Screenshots:** put images in `public/screenshots/` and add `src` to the project's `screenshots` entry.
- **Name in metadata:** `index.html` also contains the name in its static title and social tags.

## Environment (`.env`)

| Variable | Purpose |
| --- | --- |
| `VITE_SITE_URL` | Absolute site URL (no trailing slash) for Open Graph / Twitter image URLs. |
| `VITE_FORM_ENDPOINT` | Optional JSON form endpoint (Formspree, Basin, …). Without it, the contact form opens the visitor's email app (needs `links.email`); with neither, the form is disabled. |

## Deployment

The site is a single-page app with routes such as `/projects/3d-portfolio`, so the host must serve `index.html` for unknown paths
(Netlify: `/* /index.html 200` in `public/_redirects`; Vercel and most static hosts have an SPA rewrite option).

## Structure

```
src/
  app/            router
  components/     layout, navigation, ui, projects, three (WebGL scene)
  sections/       Hero, FeaturedProjects, Capabilities, About, Contact
  pages/          Home, ProjectDetails, NotFound
  data/           editable content + tests
  hooks/ lib/ utils/ styles/
```

The 3D scene is loaded lazily and rendered on a fixed layer behind the HTML. Scroll progress reaches it through
`components/three/sceneStore.ts`, so scrolling never re-renders React components inside the canvas. Without WebGL, a static CSS
version of the core is shown instead.
