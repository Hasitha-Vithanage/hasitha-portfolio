import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { MOTION_OK, gsap } from '../../lib/gsap'
import { FLIGHT_SECONDS, IMPLODE_SHARE, coreBridge, setSceneInput } from '../three/sceneStore'
import { Header } from '../navigation/Header'
import { Footer } from './Footer'
import { PageTransitionContext } from './pageTransition'

const LEAVE_SECONDS = 0.28
const ENTER_SECONDS = 0.5
/** How long the shockwave takes to sweep the new page into view after a supernova. */
const REVEAL_SECONDS = 1
/** Softness of the shockwave's inner edge, in pixels. */
const BLAST_EDGE = 60

/** A path with a file extension (e.g. /resume.pdf) is a static file, not a route. */
const isFile = (pathname: string) => /\.[a-z0-9]+$/i.test(pathname)

/**
 * The project to fly into, when leaving the home page for a case study while
 * the 3D scene is showing. Otherwise null, and the plain fade is used.
 */
function flightSlug(targetPath: string): string | null {
  if (window.location.pathname !== '/') return null
  const match = /^\/projects\/([^/]+)\/?$/.exec(targetPath)
  if (!match) return null
  return document.querySelector('[data-scene-layer] canvas') ? match[1] : null
}

/**
 * Fades the page out before a route change and back in after it, so moving
 * between the home page and case studies reads as one continuous experience.
 * Hash links within the same page are left to the scroll behaviour below.
 *
 * Only opacity is animated: a transform on the page would become the containing
 * block for the fixed WebGL layer and detach it from the viewport. The pages'
 * own intro animations supply the movement.
 */
function usePageTransition() {
  const page = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const leaving = useRef(false)
  const shownPath = useRef(pathname)
  const flare = useRef<HTMLDivElement>(null)
  const arrivingThroughBlast = useRef(false)

  /**
   * The detonation: a soft lime-white flash blooms from the collapsed core. The dark veil
   * around it deepens a little more slowly, so the scene's blast stays visible for a moment.
   */
  const detonate = useCallback(() => {
    const element = flare.current
    if (!element) return
    const onScreen = coreBridge.radius > 0
    const x = onScreen ? coreBridge.x : window.innerWidth / 2
    const y = onScreen ? coreBridge.y : window.innerHeight / 2
    gsap.set(element, {
      display: 'block',
      opacity: 0,
      '--x': `${x}px`,
      '--y': `${y}px`,
      '--hole': `${-BLAST_EDGE}px`,
      '--core': '0px',
      '--veil': 0,
      '--ring': 1,
    })
    gsap.to(element, { opacity: 1, duration: 0.3, ease: 'sine.inOut' })
    gsap.to(element, { '--core': '110px', duration: 0.6, ease: 'power3.out' })
    gsap.to(element, { '--veil': 0.95, duration: 0.4, delay: 0.08, ease: 'sine.in' })
  }, [])

  /** On arrival, the shockwave tears outward from the blast, revealing the case study inside it. */
  const reveal = useCallback(() => {
    const element = flare.current
    if (!element) return
    const x = Number.parseFloat(element.style.getPropertyValue('--x')) || window.innerWidth / 2
    const y = Number.parseFloat(element.style.getPropertyValue('--y')) || window.innerHeight / 2
    // Far enough to clear the furthest corner of the screen.
    const reach = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)) + BLAST_EDGE * 2
    gsap.to(element, {
      '--hole': `${reach}px`,
      duration: REVEAL_SECONDS,
      ease: 'power3.inOut',
      onComplete: () => gsap.set(element, { display: 'none' }),
    })
    // The shockwave's edge fades gradually over the second half, rather than vanishing at the corners.
    gsap.to(element, { '--ring': 0, duration: REVEAL_SECONDS * 0.55, delay: REVEAL_SECONDS * 0.45, ease: 'sine.in' })
  }, [])

  const transitionTo = useCallback(
    (to: string) => {
      const target = new URL(to, window.location.href)
      const samePage = target.pathname === window.location.pathname
      if (samePage || !page.current || !window.matchMedia(MOTION_OK).matches) {
        void navigate(to)
        return
      }
      if (leaving.current) return
      leaving.current = true

      // From the home page into a case study, the system goes supernova first: it implodes into
      // the core, the core detonates, and the case study is revealed through the expanding shockwave.
      // Only the page content fades, so the scene stays visible for the implosion.
      const slug = flightSlug(target.pathname)
      if (slug) {
        setSceneInput({ flyTo: slug, spotlight: null })
        gsap.to(page.current.querySelectorAll('[data-page-content]'), {
          opacity: 0,
          duration: FLIGHT_SECONDS * 0.4,
          ease: 'sine.inOut',
        })
        gsap.delayedCall(FLIGHT_SECONDS * IMPLODE_SHARE, detonate)
        // The page changes once the flash has fully bloomed and hides the switch.
        gsap.delayedCall(FLIGHT_SECONDS + 0.1, () => {
          arrivingThroughBlast.current = true
          void navigate(to)
        })
        return
      }

      gsap.to(page.current, {
        opacity: 0,
        duration: LEAVE_SECONDS,
        ease: 'power1.in',
        onComplete: () => void navigate(to),
      })
    },
    [navigate, detonate],
  )

  // Every in-app link goes through the transition, without each one opting in.
  // Capture phase runs before React Router's own click handler, which then
  // sees the event as handled and leaves the navigation to us.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const anchor = (event.target as Element | null)?.closest?.<HTMLAnchorElement>('a[href]')
      if (!anchor || (anchor.target && anchor.target !== '_self') || anchor.hasAttribute('download')) return
      const url = new URL(anchor.href)
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname || isFile(url.pathname)) return
      event.preventDefault()
      transitionTo(url.pathname + url.search + url.hash)
    }
    document.addEventListener('click', onClick, { capture: true })
    return () => document.removeEventListener('click', onClick, { capture: true })
  }, [transitionTo])

  // Fade the new page in. Layout effect, so it is hidden before the first paint.
  // Also runs after back/forward navigation, which has no fade-out.
  useLayoutEffect(() => {
    // Compared by path rather than a first-render flag, so StrictMode's repeated effects don't fade the initial load.
    if (shownPath.current === pathname) return
    shownPath.current = pathname
    leaving.current = false
    const element = page.current
    if (!element) return
    gsap.killTweensOf(element)
    // Content faded by a flight that has now arrived (the footer survives the route change).
    const flown = element.querySelectorAll('[data-page-content]')
    gsap.killTweensOf(flown)
    gsap.set(flown, { clearProps: 'opacity' })
    // Arriving through a supernova: the shockwave does the revealing, so no fade.
    if (arrivingThroughBlast.current) {
      arrivingThroughBlast.current = false
      gsap.set(element, { clearProps: 'opacity' })
      reveal()
      return
    }
    if (!window.matchMedia(MOTION_OK).matches) {
      gsap.set(element, { clearProps: 'opacity' })
      return
    }
    gsap.fromTo(element, { opacity: 0 }, { opacity: 1, duration: ENTER_SECONDS, ease: 'power2.out', clearProps: 'opacity' })
  }, [pathname, reveal])

  return { page, flare, transitionTo }
}

/**
 * Shared page frame. Also owns scroll behaviour on navigation: hash links
 * scroll to (and focus) their section, new pages start at the top.
 */
export function Layout() {
  const location = useLocation()
  const previousPath = useRef(location.pathname)
  const { page, flare, transitionTo } = usePageTransition()

  useEffect(() => {
    const samePage = previousPath.current === location.pathname
    previousPath.current = location.pathname
    const id = decodeURIComponent(location.hash.slice(1))
    const target = id ? document.getElementById(id) : null

    if (!target) {
      if (!samePage) window.scrollTo({ top: 0, behavior: 'instant' })
      return
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    target.scrollIntoView({ behavior: samePage && !reduced ? 'smooth' : 'instant', block: 'start' })
    // Move keyboard focus with the scroll so the next Tab continues from the section.
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
    target.focus({ preventScroll: true })
  }, [location.key, location.pathname, location.hash])

  return (
    <PageTransitionContext.Provider value={transitionTo}>
      <a
        href="#main"
        className="fixed left-4 top-4 z-[60] -translate-y-24 rounded-full bg-lime px-5 py-3 font-medium text-ink transition-transform focus:translate-y-0"
      >
        Skip to content
      </a>
      <Header />
      {/* The header stays put; only the page content transitions. */}
      <div ref={page}>
        <main id="main" tabIndex={-1} className="relative">
          <Outlet />
        </main>
        <Footer />
      </div>
      {/* Supernova flash and shockwave: outside the page so it survives the route change it covers. */}
      <div ref={flare} className="supernova pointer-events-none fixed inset-0 z-[70]" style={{ display: 'none' }} aria-hidden="true">
        <div className="supernova__fill" />
        <div className="supernova__ring" />
      </div>
    </PageTransitionContext.Provider>
  )
}
