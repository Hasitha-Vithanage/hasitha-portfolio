/**
 * Personal content for the whole site.
 *
 * Any value wrapped in square brackets — e.g. "[Add LinkedIn URL]" — is a placeholder.
 * Placeholders render with a dashed lime outline and are never turned into links,
 * so it is always obvious what still needs to be supplied.
 */

export interface ExperienceEntry {
  role: string
  organisation: string
  period: string
  current?: boolean
  summary: string
  highlights: string[]
}

export interface EducationEntry {
  qualification: string
  institution: string
  period: string
}

export interface Certification {
  name: string
  issuer: string
  year: string
}

export const profile = {
  /** Shown in the navigation, page titles and footer. */
  name: 'Hasitha Vithanage',
  /** One or two characters for the navigation mark. */
  monogram: 'H',
  location: 'Sri Lanka',
  /** The handful of technologies to lead with, e.g. in the readout when the hero sphere is clicked. */
  coreStack: ['Angular', 'ASP.NET Core', 'Spring Boot', 'SQL'],

  hero: {
    label: 'Associate Full-Stack Software Engineer',
    headline: ['Building software.', 'Engineering trust.'],
    /** The word in the headline to highlight with the accent colour. */
    accentWord: 'trust.',
    intro:
      'I build full-stack web applications with Angular and ASP.NET Core — from the interface to the API and the database — with a tester’s eye for how they could fail.',
  },

  links: {
    email: 'hasithavithanageict@gmail.com',
    github: 'https://github.com/Hasitha-Vithanage',
    linkedin: 'https://www.linkedin.com/in/hasitha-vithanage-0aab67270/',
    /** A URL, or a path to a PDF in /public such as "/resume.pdf". */
    resume: '/Hasitha_Vithanage.pdf',
  },

  about: {
    lead: 'I’m a full-stack engineer who started in quality assurance — so I build applications end to end, and think hard about how they could fail.',
    paragraphs: [
      'Testing enterprise software before I moved into development shaped how I approach a problem: understand the requirement properly, write code across the stack that the next person can maintain, and verify honestly before anything ships.',
      'Outside day-to-day work I am learning cybersecurity and ethical hacking. Understanding how systems are attacked makes me better at building ones that hold up.',
    ],
    principles: [
      {
        title: 'Understand before building',
        body: 'Clarify the problem, the users and the edge cases first. Most defects start as misunderstandings.',
      },
      {
        title: 'Quality is designed in',
        body: 'Testability, clear states and sensible errors are part of the design, not a final inspection step.',
      },
      {
        title: 'Usable by everyone',
        body: 'Semantic markup, keyboard support and readable contrast are baseline requirements.',
      },
      {
        title: 'Keep learning in the open',
        body: 'New tools, security practices and better techniques — documented and applied to real work.',
      },
    ],
    interests: [
      'Software quality and reliability',
      'Full-stack web development',
      'API and system design',
      'Interactive 3D on the web',
      'Cybersecurity and ethical hacking',
      'Linux',
    ],
  },

  experience: [
    {
      role: 'Associate Software Engineer',
      organisation: 'CK Orbits',
      period: 'Oct 2026 – Present',
      current: true,
      summary: 'Developing enterprise web and mobile applications with Angular and ASP.NET Core in an Agile/Scrum team.',
      highlights: [
        'Build frontend features in Angular — reusable components, forms, services, API integration and application workflows.',
        'Develop backend APIs and business logic with ASP.NET Core and C#, using Entity Framework Core and SQL for data access, queries and stored procedures.',
        'Implement features from business requirements, user stories and technical specifications, following established coding and architectural practices.',
      ],
    },
    {
      role: 'Associate Software Quality Assurance Engineer',
      organisation: 'CK Orbits',
      period: 'Apr 2026 – Oct 2026',
      summary: 'Assured the quality of enterprise web and mobile applications built with Angular and ASP.NET Core.',
      highlights: [
        'Validated new features with functional, integration, regression and smoke testing.',
        'Worked across the full lifecycle — requirement analysis, testing, debugging, release validation and production support.',
        'Collaborated with developers, QA engineers and business analysts through sprint planning, development, testing and release.',
      ],
    },
    {
      role: 'Software Quality Assurance Intern',
      organisation: 'ConInnova',
      period: 'Oct 2024 – Apr 2026',
      summary: 'Tested the CivCost web and mobile applications as part of an Agile/Scrum team.',
      highlights: [
        'Performed manual testing across multiple modules to validate functionality, usability and behaviour against requirements.',
        'Designed and executed test cases, test scenarios and test data from business and technical specifications.',
        'Logged, tracked and managed defects in Azure DevOps through their full lifecycle.',
        'Ran regression testing to verify fixes and keep the system stable after enhancements.',
      ],
    },
  ] as ExperienceEntry[],

  education: [
    {
      qualification: 'Bachelor of Information Technology (BIT)',
      institution: 'University of Colombo School of Computing',
      period: '2024 – 2026',
    },
    {
      qualification: 'Higher Diploma in Information Technology',
      institution: 'University of Colombo School of Computing',
      period: '2023 – 2024',
    },
    {
      qualification: 'Diploma in Information Technology',
      institution: 'University of Colombo School of Computing',
      period: '2022 – 2023',
    },
  ] as EducationEntry[],

  /** Leave empty to hide the section. */
  certifications: [] as Certification[],
}

export type Profile = typeof profile
