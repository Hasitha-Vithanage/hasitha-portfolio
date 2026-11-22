import type { ReactNode } from 'react'

interface SectionHeadingProps {
  id: string
  index: string
  label: string
  title: ReactNode
  intro?: string
  className?: string
}

/** Numbered label, large heading and optional intro used to open each home section. */
export function SectionHeading({ id, index, label, title, intro, className = '' }: SectionHeadingProps) {
  return (
    <header className={`grid gap-8 md:grid-cols-12 md:items-end ${className}`}>
      <div className="md:col-span-7">
        <p className="label mb-6 flex items-center gap-3 text-muted" data-reveal>
          <span className="text-lime">{index}</span>
          <span className="h-px w-10 bg-line-strong" aria-hidden="true" />
          {label}
        </p>
        <h2 id={id} className="text-[clamp(2.4rem,5.4vw,4.75rem)] font-medium leading-[0.98] tracking-[-0.035em]" data-reveal>
          {title}
        </h2>
      </div>
      {intro && (
        <p className="max-w-md text-muted md:col-span-4 md:col-start-9 md:pb-2" data-reveal>
          {intro}
        </p>
      )}
    </header>
  )
}
