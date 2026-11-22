import type { ProjectSlug } from './projects'

/**
 * Capabilities, grouped by discipline. No proficiency levels — each item says what
 * it covers and, where possible, links to a project that demonstrates it.
 * Only list what you can verify in an interview.
 */

export interface Capability {
  name: string
  detail: string
  projects?: ProjectSlug[]
}

export interface CapabilityGroup {
  id: string
  index: string
  title: string
  summary: string
  /** Marks a group as an area of active study rather than professional experience. */
  learning?: boolean
  /** Kept in the data but left off the site (cards and graph) until its content is ready. */
  hidden?: boolean
  items: Capability[]
}

const allGroups: CapabilityGroup[] = [
  {
    id: 'development',
    index: '01',
    title: 'Development',
    summary: 'Building web interfaces and applications that are maintainable and pleasant to use.',
    // At most 7 items per group: the graph fans a group's skills across the space between disciplines.
    items: [
      { name: 'Angular', detail: 'Components, forms, services and API integration.', projects: ['gym-management'] },
      { name: 'C# / ASP.NET Core', detail: 'REST APIs, business logic and integrations.' },
      { name: 'Java / Spring Boot', detail: 'RESTful backends with layered architecture.', projects: ['gym-management'] },
      {
        name: 'TypeScript / JavaScript',
        detail: 'Typed application code, and plain JavaScript where no build step is wanted.',
        projects: ['3d-portfolio', 'nexus-dashboard'],
      },
      { name: 'React', detail: 'Component architecture, hooks and routing.', projects: ['3d-portfolio'] },
      { name: 'Next.js', detail: 'React applications with routing and server rendering.' },
      { name: 'Three.js / R3F', detail: 'Real-time 3D scenes, materials and render-loop performance.', projects: ['3d-portfolio'] },
    ],
  },
  {
    id: 'quality',
    index: '02',
    title: 'Testing & Quality',
    summary: 'A QA background applied to my own code: finding how software fails before users do.',
    items: [
      { name: 'Test design', detail: 'Test cases, scenarios and test data from business and technical specifications.' },
      { name: 'Functional testing', detail: 'Manual testing of web and mobile applications against requirements.' },
      { name: 'Regression and smoke testing', detail: 'Verifying fixes and keeping releases stable after changes.' },
      { name: 'Defect management', detail: 'Logging, tracking and following bugs through their lifecycle in Azure DevOps.' },
      { name: 'API testing', detail: 'Validating endpoints, status codes, data and error handling with Postman.' },
      { name: 'Performance testing', detail: 'Load and performance testing with JMeter.' },
    ],
  },
  {
    id: 'data-tools',
    index: '03',
    title: 'Data & Tools',
    summary: 'The databases, platforms and workflow that support everyday delivery.',
    items: [
      { name: 'SQL / MySQL', detail: 'Schema design, queries and stored procedures.', projects: ['gym-management'] },
      { name: 'PostgreSQL', detail: 'Relational data modelling and queries.' },
      { name: 'Entity Framework Core', detail: 'Data access and database operations in ASP.NET Core.' },
      { name: 'Git', detail: 'Version control, branching and readable history.' },
      { name: 'Azure DevOps', detail: 'Boards, test plans and bug tracking.' },
      { name: 'Jira', detail: 'Issue tracking and sprint planning.' },
      { name: 'Vite', detail: 'Fast builds and development tooling for modern frontends.', projects: ['3d-portfolio'] },
    ],
  },
  {
    id: 'security',
    index: '04',
    title: 'Security & Learning',
    summary: 'Studying how systems are attacked to build ones that hold up.',
    learning: true,
    // Hidden until the placeholder details below are filled in.
    hidden: true,
    items: [
      { name: 'Cybersecurity fundamentals', detail: '[Add courses, labs or resources you have completed]' },
      { name: 'Linux', detail: 'Command line, file systems and permissions.' },
      { name: 'Ethical hacking', detail: '[Add platforms, labs or CTFs — e.g. TryHackMe, Hack The Box]' },
    ],
  },
]

export const capabilityGroups = allGroups.filter((group) => !group.hidden)
