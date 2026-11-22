import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ArrowUpRight, ExternalLink } from 'lucide-react'
import type { Project } from '../../data/projects'
import { sceneInput, setSceneInput } from '../three/sceneStore'
import { isConfigured } from '../../utils/content'
import { GithubIcon } from '../ui/BrandIcons'
import { ProjectCardMedia, useTilt } from './ProjectCardMedia'

interface ProjectCardProps {
  project: Project
  /** Alternates the preview side on wide screens. */
  flip?: boolean
}

export function ProjectCard({ project, flip = false }: ProjectCardProps) {
  const href = `/projects/${project.slug}`
  const titleId = `project-${project.slug}`
  const [hovered, setHovered] = useState(false)
  const tilt = useTilt<HTMLAnchorElement>()

  // Light this project's satellite in the background scene while the card has the pointer or keyboard focus.
  const spotlight = (on: boolean) => {
    if (on) setSceneInput({ spotlight: project.slug })
    else if (sceneInput.spotlight === project.slug) setSceneInput({ spotlight: null })
  }
  useEffect(
    () => () => {
      if (sceneInput.spotlight === project.slug) setSceneInput({ spotlight: null })
    },
    [project.slug],
  )

  return (
    <article
      aria-labelledby={titleId}
      className="group grid items-center gap-8 md:grid-cols-12 md:gap-10"
      data-project-card
      onPointerEnter={(event) => {
        if (event.pointerType !== 'mouse') return
        setHovered(true)
        spotlight(true)
      }}
      onPointerLeave={() => {
        setHovered(false)
        spotlight(false)
      }}
      onFocus={() => spotlight(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) spotlight(false)
      }}
    >
      {/* The preview duplicates the case-study link for pointer users only. */}
      <Link
        ref={tilt}
        to={href}
        tabIndex={-1}
        aria-hidden="true"
        className={`relative block overflow-hidden rounded-2xl border border-line md:col-span-7 ${flip ? 'md:order-2 md:col-start-6' : ''}`}
        data-project-preview
      >
        <ProjectCardMedia project={project} active={hovered} className="aspect-[16/10]" />
        <span className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-lime/0 transition duration-500 group-hover:ring-lime/40" />
      </Link>

      <div className={`md:col-span-5 ${flip ? 'md:order-1 md:col-start-1 md:row-start-1' : ''}`}>
        <div className="label mb-5 flex flex-wrap items-center gap-3 text-muted">
          <span className="text-lime">{project.index}</span>
          <span className="h-px w-8 bg-line-strong" aria-hidden="true" />
          {project.category}
          {project.draft && (
            <span className="rounded-full border border-dashed border-lime/50 px-2 py-0.5 text-[0.6rem] text-lime">
              Placeholder case study
            </span>
          )}
        </div>
        <h3 id={titleId} className="text-[clamp(1.9rem,3.2vw,2.75rem)] font-medium leading-[1.05] tracking-[-0.03em]">
          {project.title}
        </h3>
        <p className="mt-5 max-w-xl text-muted">{project.summary}</p>

        <ul className="mt-6 flex flex-wrap gap-2" aria-label="Technologies and topics">
          {project.tags.map((tag) => (
            <li key={tag} className="rounded-full border border-line px-3 py-1 font-mono text-xs text-fg/80">
              {tag}
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link
            to={href}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-fg px-5 text-sm font-medium text-ink transition-colors duration-300 hover:bg-lime"
          >
            View Case Study
            <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
            <span className="sr-only">: {project.title}</span>
          </Link>
          {isConfigured(project.links.source) && (
            <a
              href={project.links.source}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 text-sm text-muted transition-colors hover:text-fg"
            >
              <GithubIcon className="size-4" /> Source <span className="sr-only">code for {project.title} (opens in a new tab)</span>
            </a>
          )}
          {isConfigured(project.links.demo) && project.links.demo !== '/' && (
            <a
              href={project.links.demo}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 text-sm text-muted transition-colors hover:text-fg"
            >
              <ExternalLink className="size-4" aria-hidden="true" /> Live demo{' '}
              <span className="sr-only">of {project.title} (opens in a new tab)</span>
            </a>
          )}
        </div>
      </div>
    </article>
  )
}
