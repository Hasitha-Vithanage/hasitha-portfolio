import { useRef } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react'
import { coverImage, getProject, projects, type Project } from '../../data/projects'
import { usePageMeta } from '../../hooks/usePageMeta'
import { MOTION_OK, gsap, useGSAP } from '../../lib/gsap'
import { isConfigured } from '../../utils/content'
import { ProjectPreview } from '../../components/projects/ProjectPreview'
import { GithubIcon } from '../../components/ui/BrandIcons'
import { Text } from '../../components/ui/Text'
import NotFound from '../NotFound/NotFound'

function ProjectLinks({ project }: { project: Project }) {
  const { source, demo, more = [] } = project.links
  const linkClass = 'inline-flex items-center gap-2 text-fg transition-colors hover:text-lime'
  return (
    <ul className="space-y-2">
      <li>
        {isConfigured(source) ? (
          <a href={source} target="_blank" rel="noopener noreferrer" className={linkClass}>
            <GithubIcon className="size-4" /> {more.length > 0 ? 'Frontend source' : 'Source code'}{' '}
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        ) : (
          <Text value={source} />
        )}
      </li>
      {more.map((link) => (
        <li key={link.href}>
          <a href={link.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
            <GithubIcon className="size-4" /> {link.label} <span className="sr-only">(opens in a new tab)</span>
          </a>
        </li>
      ))}
      {demo && (
        <li>
          {demo === '/' ? (
            <Link to="/" className={linkClass}>
              <ExternalLink className="size-4" aria-hidden="true" /> You are viewing it
            </Link>
          ) : isConfigured(demo) ? (
            <a href={demo} target="_blank" rel="noopener noreferrer" className={linkClass}>
              <ExternalLink className="size-4" aria-hidden="true" /> Live demo <span className="sr-only">(opens in a new tab)</span>
            </a>
          ) : (
            <Text value={demo} />
          )}
        </li>
      )}
    </ul>
  )
}

function ProjectView({ project }: { project: Project }) {
  usePageMeta(project.title, project.summary)
  const scope = useRef<HTMLElement>(null)
  const position = projects.indexOf(project)
  const next = projects[(position + 1) % projects.length]

  useGSAP(
    () => {
      gsap.matchMedia().add(MOTION_OK, () => {
        gsap.from('[data-intro]', { opacity: 0, y: 24, duration: 1.1, ease: 'expo.out', stagger: 0.08 })
        gsap.from('[data-intro-preview]', {
          clipPath: 'inset(12% 0% 0% 0% round 1rem)',
          opacity: 0,
          duration: 1.4,
          ease: 'expo.out',
          delay: 0.25,
        })
      })
    },
    { scope, dependencies: [project.slug], revertOnUpdate: true },
  )

  const meta = [
    { label: 'Role', content: <Text value={project.role} /> },
    {
      label: 'Stack',
      content: (
        <span className="flex flex-wrap gap-x-2">
          {project.stack.map((item, i) => (
            <span key={item}>
              <Text value={item} />
              {i < project.stack.length - 1 && <span className="text-muted">,</span>}
            </span>
          ))}
        </span>
      ),
    },
    { label: 'Status', content: <Text value={project.status} /> },
    { label: 'Links', content: <ProjectLinks project={project} /> },
  ]

  return (
    <article ref={scope} aria-labelledby="project-title">
      <header id="top" className="px-5 pb-16 pt-32 sm:px-8 md:pt-40 lg:px-12">
        <div className="mx-auto max-w-[90rem]">
          <Link
            to={{ pathname: '/', hash: '#work' }}
            className="label inline-flex min-h-11 items-center gap-2 text-muted transition-colors hover:text-lime"
            data-intro
          >
            <ArrowLeft className="size-4" aria-hidden="true" /> All work
          </Link>

          <div className="mt-10 grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <p className="label flex flex-wrap items-center gap-3 text-muted" data-intro>
                <span className="text-lime">{project.index}</span>
                <span className="h-px w-10 bg-line-strong" aria-hidden="true" />
                {project.category} · <Text value={project.year} />
              </p>
              <h1
                id="project-title"
                className="mt-6 text-[clamp(2.75rem,7vw,6.5rem)] font-medium leading-[0.95] tracking-[-0.045em]"
                data-intro
              >
                {project.title}
              </h1>
              <p className="mt-8 max-w-2xl text-lg text-muted md:text-xl" data-intro>
                {project.summary}
              </p>
              {project.draft && (
                <p className="mt-6 inline-block rounded-xl border border-dashed border-lime/50 px-4 py-3 text-sm text-lime" data-intro>
                  This case study is a placeholder template awaiting real project content.
                </p>
              )}
            </div>

            <dl className="grid content-end gap-6 border-t border-line pt-8 sm:grid-cols-2 lg:col-span-4 lg:grid-cols-1 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
              {meta.map((item) => (
                <div key={item.label} data-intro>
                  <dt className="label text-muted">{item.label}</dt>
                  <dd className="mt-2">{item.content}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </header>

      <div className="px-5 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[90rem]" data-intro-preview>
          <ProjectPreview
            kind={project.preview}
            image={coverImage(project)}
            className="aspect-[16/9] rounded-2xl border border-line md:aspect-[21/9]"
          />
        </div>
      </div>

      <div className="px-5 py-24 sm:px-8 md:py-32 lg:px-12">
        <div className="mx-auto grid max-w-[90rem] gap-12 lg:grid-cols-12">
          <nav aria-label="Case study sections" className="hidden lg:col-span-3 lg:block">
            <ol className="sticky top-28 space-y-1 border-l border-line">
              {project.sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="-ml-px block border-l border-transparent py-1.5 pl-5 text-sm text-muted transition-colors hover:border-lime hover:text-fg"
                  >
                    {section.heading}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="space-y-20 lg:col-span-8 lg:col-start-5">
            {project.sections.map((section, i) => (
              <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`} className="scroll-mt-28">
                <p className="label text-lime">{String(i + 1).padStart(2, '0')}</p>
                <h2 id={`${section.id}-title`} className="mt-3 text-3xl font-medium tracking-tight md:text-4xl">
                  {section.heading}
                </h2>
                {section.body?.map((paragraph) => (
                  <p key={paragraph} className="mt-5 max-w-3xl text-[1.0625rem] text-fg/85">
                    <Text value={paragraph} />
                  </p>
                ))}
                {section.list && (
                  <ul className="mt-6 max-w-3xl divide-y divide-line border-y border-line">
                    {section.list.map((item) => (
                      <li key={item} className="flex gap-4 py-4 text-fg/85">
                        <span aria-hidden="true" className="mt-[0.75em] h-px w-4 shrink-0 bg-lime" />
                        <span>
                          <Text value={item} />
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}

            <section id="screenshots" aria-labelledby="screenshots-title" className="scroll-mt-28">
              <h2 id="screenshots-title" className="text-3xl font-medium tracking-tight md:text-4xl">
                Screenshots
              </h2>
              <ul className="mt-8 grid gap-5 sm:grid-cols-2">
                {project.screenshots.map((shot) => (
                  <li key={shot.caption} className={project.screenshots.length === 1 ? 'sm:col-span-2' : ''}>
                    <figure>
                      {shot.src ? (
                        <a href={shot.src} target="_blank" rel="noopener noreferrer" className="block">
                          <img
                            src={shot.src}
                            alt={shot.caption}
                            loading="lazy"
                            width={shot.width ?? 1600}
                            height={shot.height ?? 900}
                            className="h-auto w-full rounded-xl border border-line transition-colors hover:border-lime/40"
                          />
                          <span className="sr-only">(opens full size in a new tab)</span>
                        </a>
                      ) : (
                        <div className="grid aspect-video place-items-center rounded-xl border border-dashed border-lime/30 bg-surface p-6 text-center">
                          <Text value={shot.caption} />
                        </div>
                      )}
                      {shot.src && <figcaption className="mt-3 text-sm text-muted">{shot.caption}</figcaption>}
                    </figure>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </div>

      <nav aria-label="Next project" className="border-t border-line px-5 sm:px-8 lg:px-12">
        <Link
          to={`/projects/${next.slug}`}
          className="group mx-auto flex max-w-[90rem] flex-col gap-4 py-16 md:flex-row md:items-end md:justify-between md:py-24"
        >
          <span>
            <span className="label text-muted">Next case study</span>
            <span className="mt-4 block text-[clamp(2rem,5vw,4.5rem)] font-medium leading-none tracking-[-0.04em] transition-colors duration-300 group-hover:text-lime">
              {next.title}
            </span>
          </span>
          <ArrowRight className="size-10 shrink-0 transition-transform duration-500 group-hover:translate-x-2 md:size-14" aria-hidden="true" />
        </Link>
      </nav>
    </article>
  )
}

export default function ProjectDetails() {
  const { slug } = useParams()
  const project = getProject(slug)
  if (!project) return <NotFound />
  return <ProjectView key={project.slug} project={project} />
}
