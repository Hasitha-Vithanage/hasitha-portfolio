import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { isExternalUrl } from '../../utils/content'

type Variant = 'primary' | 'secondary' | 'ghost'

const base =
  'group/button inline-flex min-h-12 items-center justify-center gap-2.5 rounded-full px-6 text-[0.95rem] font-medium tracking-tight transition-[background-color,color,border-color,transform] duration-300 ease-out-expo active:scale-[0.98]'

const variants: Record<Variant, string> = {
  primary: 'bg-lime text-ink hover:bg-fg',
  secondary: 'border border-line-strong text-fg hover:border-fg/60 hover:bg-fg/5',
  ghost: 'px-0 text-fg hover:text-lime',
}

export const buttonClass = (variant: Variant = 'primary', extra = '') => `${base} ${variants[variant]} ${extra}`

interface ButtonLinkProps {
  to: string
  variant?: Variant
  className?: string
  children: ReactNode
  /** Opens external URLs and documents in a new tab. */
  newTab?: boolean
}

/** A link styled as a button; uses the router for internal paths. */
export function ButtonLink({ to, variant = 'primary', className = '', children, newTab }: ButtonLinkProps) {
  const classes = buttonClass(variant, className)
  if (isExternalUrl(to) || newTab) {
    return (
      <a href={to} className={classes} {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
        {children}
      </a>
    )
  }
  return (
    <Link to={to} className={classes}>
      {children}
    </Link>
  )
}
