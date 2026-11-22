import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { Menu, X } from 'lucide-react'
import { profile } from '../../data/profile'
import { useActiveSection } from '../../hooks/useActiveSection'
import { ResumeLink } from '../ui/ResumeLink'

export const NAV_ITEMS = [
  { id: 'work', label: 'Work' },
  { id: 'capabilities', label: 'Capabilities' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
] as const

const SECTION_IDS = NAV_ITEMS.map((item) => item.id)

export function Header() {
  const location = useLocation()
  const isHome = location.pathname === '/'
  const active = useActiveSection(SECTION_IDS, isHome)
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const toggle = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close the menu whenever the route or hash changes.
  useEffect(() => setOpen(false), [location.key])

  // While the mobile menu is open: lock scroll, make the page inert, close on Escape.
  useEffect(() => {
    if (!open) return
    const page = [document.getElementById('main'), document.getElementById('footer')]
    page.forEach((el) => el?.setAttribute('inert', ''))
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        toggle.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      page.forEach((el) => el?.removeAttribute('inert'))
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color] duration-500 ${
        scrolled || open ? 'border-b border-line bg-ink/85 backdrop-blur-md' : 'border-b border-transparent'
      }`}
    >
      <nav aria-label="Primary" className="mx-auto flex h-18 max-w-[90rem] items-center justify-between px-5 sm:px-8 lg:px-12">
        <Link to="/" className="group flex items-center gap-3" aria-label={`${profile.name} — home`}>
          <span className="grid size-9 place-items-center rounded-full border border-line-strong font-mono text-sm font-medium transition-colors duration-300 group-hover:border-lime group-hover:text-lime">
            {profile.monogram}
          </span>
          <span className="text-[0.95rem] font-medium tracking-tight">{profile.name}</span>
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => {
            const current = isHome && active === item.id
            return (
              <li key={item.id}>
                <Link
                  to={{ pathname: '/', hash: `#${item.id}` }}
                  aria-current={current ? 'location' : undefined}
                  className={`relative rounded-full px-4 py-2 text-sm transition-colors duration-300 hover:text-fg ${
                    current ? 'text-fg' : 'text-muted'
                  }`}
                >
                  {item.label}
                  <span
                    aria-hidden="true"
                    className={`absolute bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-lime transition-opacity duration-300 ${
                      current ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                </Link>
              </li>
            )
          })}
        </ul>

        <div className="flex items-center gap-2">
          <span className="hidden sm:block">
            <ResumeLink label="Résumé" className="!min-h-10 !px-4 text-sm" />
          </span>
          <button
            ref={toggle}
            type="button"
            className="grid size-11 place-items-center rounded-full border border-line-strong md:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
            <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
          </button>
        </div>
      </nav>

      <div
        id="mobile-menu"
        hidden={!open}
        className="h-[calc(100dvh-4.5rem)] overflow-y-auto border-t border-line bg-ink px-5 pb-10 pt-8 md:hidden"
      >
        <ul className="flex flex-col">
          {NAV_ITEMS.map((item, i) => (
            <li key={item.id} className="border-b border-line">
              <Link
                to={{ pathname: '/', hash: `#${item.id}` }}
                className="flex items-baseline gap-4 py-5 text-4xl font-medium tracking-tight"
                onClick={() => setOpen(false)}
              >
                <span className="label text-lime">0{i + 1}</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <ResumeLink className="mt-8 w-full" />
      </div>
    </header>
  )
}
