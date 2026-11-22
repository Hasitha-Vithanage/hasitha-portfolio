import { ArrowUp } from 'lucide-react'
import { profile } from '../../data/profile'

export function Footer() {
  return (
    <footer id="footer" className="relative z-10 border-t border-line bg-ink" data-page-content>
      <div className="mx-auto flex max-w-[90rem] flex-col gap-6 px-5 py-10 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
        <p>
          © {new Date().getFullYear()} {profile.name}. Designed and built from scratch.
        </p>
        <p className="label">React · Three.js · GSAP</p>
        <a href="#top" className="inline-flex items-center gap-2 transition-colors hover:text-lime">
          Back to top <ArrowUp className="size-4" aria-hidden="true" />
        </a>
      </div>
    </footer>
  )
}
