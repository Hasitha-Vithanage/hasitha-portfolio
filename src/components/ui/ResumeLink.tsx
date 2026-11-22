import { FileText } from 'lucide-react'
import { profile } from '../../data/profile'
import { isConfigured } from '../../utils/content'
import { buttonClass } from './Button'

interface ResumeLinkProps {
  variant?: 'primary' | 'secondary'
  label?: string
  className?: string
}

/**
 * Opens the configured résumé in a new tab. Until one is configured it renders
 * as a clearly marked, non-interactive placeholder instead of a dead link.
 */
export function ResumeLink({ variant = 'secondary', label = 'View Résumé', className = '' }: ResumeLinkProps) {
  const href = profile.links.resume

  if (!isConfigured(href)) {
    return (
      <span
        className={`${buttonClass('secondary', className)} cursor-not-allowed border-dashed border-lime/40 text-muted hover:border-lime/40 hover:bg-transparent active:scale-100`}
        title="Résumé not added yet — set links.resume in src/data/profile.ts"
        aria-disabled="true"
      >
        <FileText className="size-4" aria-hidden="true" />
        {label}
        <span className="label rounded-full bg-lime/10 px-2 py-0.5 text-[0.6rem] text-lime">Soon</span>
      </span>
    )
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={buttonClass(variant, className)}>
      <FileText className="size-4" aria-hidden="true" />
      {label}
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  )
}
