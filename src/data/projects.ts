/**
 * Featured projects and their case studies.
 *
 * Values in square brackets are placeholders for content only you can supply.
 * Only describe features you actually implemented and results you actually measured.
 */

export type ProjectSlug = 'gym-management' | 'nexus-dashboard' | '3d-portfolio'

export type PreviewKind = 'gym' | 'nexus' | 'portfolio'

export interface CaseStudySection {
  id: string
  heading: string
  body?: string[]
  list?: string[]
}

export interface Screenshot {
  caption: string
  src?: string
  /** Intrinsic size, so the page reserves the right space before the image loads. */
  width?: number
  height?: number
}

export interface Project {
  slug: ProjectSlug
  index: string
  title: string
  category: string
  year: string
  summary: string
  tags: string[]
  role: string
  stack: string[]
  status: string
  /** True while the case study is a template awaiting real content. */
  draft?: boolean
  links: {
    source: string
    /** Empty when there is no live demo. */
    demo: string
    /** Further repositories, e.g. a separate backend. */
    more?: { label: string; href: string }[]
  }
  preview: PreviewKind
  /**
   * Optional short, silent screen recording (e.g. /recordings/gym.mp4) played on
   * the project card while hovered, in place of the screenshot loop.
   */
  video?: string
  sections: CaseStudySection[]
  /** The first screenshot with a src also becomes the project's cover image. */
  screenshots: Screenshot[]
}

export const projects: Project[] = [
  {
    slug: 'gym-management',
    index: '01',
    title: 'Gym Management System',
    category: 'Full-stack web application',
    year: '2025',
    summary:
      'A full-stack web application that digitises daily gym operations — members, subscriptions, payments, trainers and attendance — and generates personalised workout and meal plans.',
    tags: ['Full-stack', 'Angular', 'Spring Boot'],
    role: 'Full-stack developer — final-year project',
    stack: ['Angular', 'TypeScript', 'Spring Boot', 'Java', 'MySQL'],
    status: 'In development (since Nov 2025)',
    links: {
      source: 'https://github.com/Hasitha-Vithanage/gym-management-frontend',
      demo: '',
      more: [{ label: 'Backend source', href: 'https://github.com/Hasitha-Vithanage/gym-management-backend' }],
    },
    preview: 'gym',
    sections: [
      {
        id: 'overview',
        heading: 'Overview',
        body: [
          'Gym Management System is a full-stack web application designed to digitise and automate daily gym operations while improving the member experience through automated fitness planning.',
          'It was developed as my final-year software engineering project, covering requirement analysis, system design and full-stack development around real-world business logic.',
        ],
      },
      {
        id: 'problem',
        heading: 'Problem and objectives',
        list: [
          'Replace manual records with a single system for the gym’s day-to-day operations.',
          'Reduce the manual effort trainers spend writing workout and meal plans, while keeping those plans consistent and accurate.',
          'Give administrators a clear view of active memberships, payments and overall gym performance.',
          'Keep member and transaction data secure, with access controlled by role.',
        ],
      },
      {
        id: 'workflows',
        heading: 'Key modules',
        list: [
          'Member and employee registration, with trainer assignment',
          'Subscription and payment tracking',
          'Attendance — QR code check-in with a manual fallback, and a live list of today’s check-ins',
          'Workout management — exercise library, workout templates built day by day, plan requests and progress tracking',
          'Automated workout and meal plan generators',
          'Class scheduling with capacity tracking',
          'Supplement store — products, suppliers and order processing',
          'Reports — employees, members, monthly attendance and sales, plus attendance analytics such as peak check-in hours',
          'Ratings and feedback — members rate the gym and trainers, and staff review and resolve each submission',
          'Admin dashboard — pending orders, upcoming classes, new members and key totals at a glance',
          'Role-based access control across all modules',
        ],
      },
      {
        id: 'plan-generators',
        heading: 'Automated plan generators',
        body: [
          'The project’s key feature is a pair of generators that create personalised workout and meal plans from each member’s attributes — goals, body metrics, experience level and availability. Trainers start from a consistent, accurate plan instead of writing every one by hand.',
        ],
      },
      {
        id: 'architecture',
        heading: 'Architecture',
        list: [
          'A modular Angular frontend communicating with a RESTful Spring Boot backend, kept in separate repositories.',
          'MySQL database designed to manage member and transaction data securely and efficiently.',
          'Clean architecture principles on the backend, with validation and error handling applied consistently.',
          'Role-based access control secures every module.',
        ],
      },
      {
        id: 'stack',
        heading: 'Technology stack',
        body: [
          'Angular and TypeScript for the frontend, Spring Boot and Java for the REST API, and MySQL for persistence — chosen with scalability, maintainability and data integrity in mind.',
        ],
      },
    ],
    screenshots: [
      { caption: 'Admin dashboard — pending orders, upcoming classes and key totals', src: '/screenshots/gym-dashboard.webp', width: 1904, height: 908 },
      { caption: 'Assigning exercises to a workout template, day by day', src: '/screenshots/gym-assign-workout.webp', width: 1904, height: 909 },
      { caption: 'Member check-in by QR code or manual search', src: '/screenshots/gym-attendance.webp', width: 1907, height: 908 },
      { caption: 'Attendance analytics — daily check-ins and peak hours', src: '/screenshots/gym-attendance-analytics.webp', width: 1903, height: 908 },
      { caption: 'Feedback history with review and resolve workflow', src: '/screenshots/gym-feedback.webp', width: 1906, height: 910 },
    ],
  },
  {
    slug: 'nexus-dashboard',
    index: '02',
    title: 'NEXUS Dashboard',
    category: 'Productivity tool',
    year: '2026',
    summary:
      'A terminal-style personal dashboard: a live clock, a focus timer linked to a task queue, weather with a rain-soon signal and Sri Lankan public holidays — in plain HTML, CSS and JavaScript, with no build step and no backend.',
    tags: ['JavaScript', 'Offline-first', 'Public APIs'],
    role: 'Design and development',
    stack: ['HTML', 'CSS', 'JavaScript', 'localStorage', 'Open-Meteo API'],
    status: 'v1.1.0',
    links: {
      source: 'https://github.com/Hasitha-Vithanage/NEXUS',
      demo: '',
    },
    preview: 'nexus',
    sections: [
      {
        id: 'overview',
        heading: 'Overview',
        body: [
          'NEXUS is a personal developer dashboard built to run on a secondary laptop. It opens straight from a file, needs nothing installed and changes no system settings, and its clock, tasks and focus timer keep working offline.',
        ],
      },
      {
        id: 'features',
        heading: 'Features',
        list: [
          'A large live clock with an optional second timezone, searchable by city, country, alias or UTC offset.',
          'A Pomodoro focus timer linked to tasks, counting sessions and focused minutes per task.',
          'A prioritised task queue with drag-and-drop and keyboard reordering, and undo on delete.',
          'Weather from Open-Meteo, with a rain-soon signal from the hourly forecast.',
          'A daylight track from sunrise to sunset, calculated on the device so it works offline.',
          'Sri Lankan public holidays with long-weekend and bridge-day hints.',
          'A command palette (Ctrl+K), four accent themes and a keep-screen-awake toggle.',
        ],
      },
      {
        id: 'reliability',
        heading: 'Reliability and data handling',
        list: [
          'The focus timer works from real timestamps, so it never drifts in a background window and survives a page reload.',
          'Weather and holiday data are cached and clearly labelled LIVE, CACHED or STALE; failed requests retry with back-off and never block startup.',
          'Holiday sources are a simple provider list with an automatic fallback mirror. If no verified data exists the panel says so — it never invents a holiday.',
          'Saved data that can’t be read is copied to a backup key instead of being erased.',
          'Several open windows stay in sync automatically.',
        ],
      },
      {
        id: 'accessibility',
        heading: 'Keyboard and accessibility',
        body: [
          'Every action is reachable from the keyboard, focus is always visible, and a reduced-motion setting turns off every animation, including the boot sequence and blinking cursor.',
        ],
      },
      {
        id: 'stack',
        heading: 'Technology',
        body: [
          'Plain HTML, CSS and JavaScript with no frameworks or build step. Data is stored in localStorage on the device, and nothing is uploaded. In headless test runs it used about 1% of main-thread time while idle.',
        ],
      },
    ],
    screenshots: [
      {
        caption: 'The full dashboard — clock with daylight track, focus timer, task queue, weather and holiday panels',
        src: '/screenshots/nexus-dashboard.webp',
        width: 1917,
        height: 1080,
      },
    ],
  },
  {
    slug: '3d-portfolio',
    index: '03',
    title: 'Interactive 3D Portfolio',
    category: 'Creative frontend',
    year: '2026',
    summary:
      'This website: a React and TypeScript application with a real-time WebGL scene, scroll-coordinated storytelling and fully accessible HTML content.',
    tags: ['React', 'TypeScript', 'Three.js', 'GSAP'],
    role: 'Design and development',
    stack: ['React', 'TypeScript', 'Vite', 'Three.js', 'React Three Fiber', 'Drei', 'GSAP ScrollTrigger', 'Tailwind CSS', 'React Router'],
    status: 'Live',
    links: {
      source: 'https://github.com/Hasitha-Vithanage/hasitha-portfolio',
      demo: '/',
    },
    preview: 'portfolio',
    sections: [
      {
        id: 'overview',
        heading: 'Overview',
        body: [
          'The portfolio is treated as an engineering project in its own right. A real-time 3D scene sits behind the page while every piece of content — navigation, text, project information and contact links — remains semantic, accessible HTML.',
          'The visual concept is a single engineered core that, as you scroll, releases its orbiting elements into a connected network: an idea becoming a system. That network is not decoration — it is an explorable map of my disciplines, skills and the projects that demonstrate them.',
        ],
      },
      {
        id: 'skills-graph',
        heading: 'Interactive skills graph',
        list: [
          'The graph is generated from the same typed project and skills data as the rest of the site, so it can never drift out of date: me → disciplines → skills → projects.',
          'Progressive disclosure keeps it calm: at rest it shows only disciplines and projects. Hovering a discipline fans out its skills; hovering a project reveals the skills that prove it. A short release delay lets the pointer travel onto a revealed skill without the fan folding away.',
          'Clicking opens the case study or jumps to the matching skill. On phones there is no room for skill labels in the graph, so the explored node’s skills are listed in a panel with an explicit Open button.',
          'Hit-testing happens in screen space: each frame the render loop projects node positions to the viewport, and the HTML layer picks the nearest node. The canvas itself never needs pointer events, so it cannot block the page.',
          'Labels are real DOM text, positioned by the render loop without React re-renders, so they stay sharp at any resolution.',
          'A legend of links drives the same highlighting for keyboard and screen-reader users, and sits inside the graph area so focusing it never scrolls the graph out of view.',
        ],
      },
      {
        id: 'architecture',
        heading: 'Architecture',
        list: [
          'Vite, React and strict TypeScript single-page application with React Router routes for each case study.',
          'All personal and project content lives in typed data files, separate from the UI components.',
          'The WebGL scene is a lazily loaded chunk, so text and navigation render before any 3D code is downloaded.',
          'A fixed canvas layer sits beneath the HTML. GSAP ScrollTrigger writes scroll progress into a small mutable store that the render loop reads, so scrolling never triggers React re-renders inside the scene.',
        ],
      },
      {
        id: 'rendering',
        heading: '3D rendering and materials',
        list: [
          'A physically based chrome core (MeshPhysicalMaterial with clearcoat) reflects an environment map generated procedurally from Drei Lightformers — no HDR files are downloaded.',
          'The environment is rendered once and reused: soft studio panels give clean reflections, and a lime panel behind the sphere supplies the accent rim.',
          'The sphere carries engineered panel plating computed in its material shader: an inflated-cube grid gives evenly sized panels with no pole pinching. Grooves only absorb light, so they disappear on dark metal and appear only where a reflection crosses them; lines are antialiased with screen-space derivatives so they stay stable in motion.',
          'A small custom GLSL shader adds a fresnel rim and a soft halo around the sphere, so the glow exists even without post-processing.',
          'On desktop, a bloom pass adds real light bleed. Only the lime accents are pushed above white, so bloom picks them out while the chrome and text stay crisp; hovered graph links are boosted the same way and glow. Bloom is skipped on phones and switches itself off if the frame rate drops.',
          'Orbit rings, satellites and instanced network nodes are built from primitive geometry, so the scene has no model assets. Every satellite rides exactly on a complete ring.',
          'Fog blends distant nodes into the background to create depth.',
        ],
      },
      {
        id: 'interaction',
        heading: 'Camera and pointer interaction',
        body: [
          'The camera and core respond to the pointer with damped, frame-rate-independent interpolation, so movement stays restrained. Pointer tracking is only enabled for fine pointers; touch devices get the idle animation without parallax.',
        ],
      },
      {
        id: 'scroll',
        heading: 'Scroll-driven animation',
        body: [
          'ScrollTrigger maps the hero and the graph stage to progress values. The sphere stays put while the camera moves: as the hero leaves, the camera swings around it, rising and pulling back so it settles above the next section; approaching the graph, it swings back to face it head-on in one continuous shot. The rim light and glow shift tone along the way: signature lime in the hero, a cooler, quieter mint behind the project cards, and a brighter lime as the graph forms. The project and discipline nodes then unfold from their orbits, skills emerge, and the connecting lines fade in. Section headings and cards reveal with short, staggered transitions. Nothing is pinned and scrolling is never hijacked.',
          'On first load, a short intro of about 2.6 seconds assembles the scene: the sphere grows in, each ring traces itself with a custom shader that reveals the torus around its circumference, and the satellites spiral in to settle on their orbits. It runs alongside the headline rather than delaying it, plays once per visit, and is skipped entirely when reduced motion is requested.',
        ],
      },
      {
        id: 'responsive',
        heading: 'Responsive behaviour',
        body: [
          'Scene layout is computed from the visible viewport in world units, so the core is placed beside the headline on wide screens and above it on narrow ones. Phones receive fewer network nodes and a lower maximum pixel ratio.',
        ],
      },
      {
        id: 'performance',
        heading: 'Performance considerations',
        list: [
          'Device pixel ratio is capped and drops automatically if the frame rate declines.',
          'The render loop stops entirely once the scene has scrolled out of view.',
          'Network nodes use instanced meshes; line geometry is a single buffer updated in place.',
          'GPU resources are disposed and ScrollTriggers are reverted when components unmount.',
          '[Add measured Lighthouse / Core Web Vitals results after deployment]',
        ],
      },
      {
        id: 'accessibility',
        heading: 'Accessibility and fallbacks',
        list: [
          'All content is real HTML with a logical heading hierarchy, a skip link, visible focus states and keyboard-operable navigation.',
          'With prefers-reduced-motion, idle animation, parallax and reveal transitions are disabled and the scene renders only on demand.',
          'If WebGL is unavailable or fails to initialise, a static CSS composition of the core is shown instead.',
          'The canvas is hidden from assistive technology because it is purely decorative.',
        ],
      },
      {
        id: 'testing',
        heading: 'Testing and validation',
        body: [
          'Strict TypeScript checks and a production build run before release. Vitest tests check content integrity: unique project routes, skill-to-project references that resolve, and correct detection of unfinished placeholders.',
        ],
      },
    ],
    screenshots: [
      { caption: 'Hero scene on a wide screen', src: '/screenshots/portfolio-home.webp', width: 1898, height: 914 },
      { caption: 'The interactive skills graph, formed', src: '/screenshots/portfolio-network.webp', width: 1898, height: 907 },
    ],
  },
]

export const getProject = (slug: string | undefined): Project | undefined =>
  projects.find((project) => project.slug === slug)

export const coverImage = (project: Project): Screenshot | undefined => project.screenshots.find((shot) => shot.src)
