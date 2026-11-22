import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router'
import { profile } from '../../data/profile'
import { projects } from '../../data/projects'
import { isConfigured } from '../../utils/content'
import { coreBridge, sceneInput, subscribeSceneInput } from './sceneStore'

/** Callouts start while the scan band is still crossing the sphere, as if reading its result. */
const OPEN_DELAY_MS = 450
/** Seconds for one leader line to draw, and between one callout and the next. */
const DRAW_SECONDS = 0.35
const STAGGER_SECONDS = 0.16
const CLOSE_MS = 250
const EDGE = 16
/** Width reserved for a callout's text when keeping it on screen. */
const TEXT_WIDTH = 230
/** Below this viewport width the callouts stack in a column under the sphere. */
const NARROW = 768

const current = profile.experience.find((entry) => entry.current) ?? profile.experience[0]
const links = [
  { label: 'Résumé', href: profile.links.resume },
  { label: 'GitHub', href: profile.links.github },
  { label: 'LinkedIn', href: profile.links.linkedin },
].filter((link) => isConfigured(link.href))

/** Off-white with a lime underline: lime text alone is unreadable where the lime orbit ring passes behind it. */
const LINK =
  'text-fg underline decoration-lime/70 decoration-1 underline-offset-4 transition-colors hover:text-lime hover:decoration-lime'

interface Callout {
  label: string
  value: ReactNode
}

/** Clockwise from upper left, matching the order of the sphere's anchor points. */
function callouts(close: () => void): Callout[] {
  const list: Callout[] = [
    {
      label: 'Role',
      value: (
        <>
          {current.role}
          <br />
          <span className="text-muted">
            {current.organisation} · {profile.location}
          </span>
        </>
      ),
    },
    {
      label: 'Stack',
      value: (
        // Each technology stays whole when the line wraps ("Spring Boot", not "Spring / Boot").
        <span className="inline-flex flex-wrap gap-x-2">
          {profile.coreStack.map((tech, i) => (
            <span key={tech} className="whitespace-nowrap">
              {tech}
              {i < profile.coreStack.length - 1 && <span className="text-muted"> ·</span>}
            </span>
          ))}
        </span>
      ),
    },
  ]
  if (links.length > 0) {
    list.push({
      label: 'Links',
      value: (
        <span className="inline-flex flex-wrap gap-x-3">
          {links.map((link) => (
            <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className={LINK}>
              {link.label}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          ))}
        </span>
      ),
    })
  }
  list.push({
    label: 'Work',
    value: (
      <Link to={{ pathname: '/', hash: '#work' }} onClick={close} className={LINK}>
        {projects.length} case studies →
      </Link>
    ),
  })
  return list
}

/** Where each callout's line runs and its text sits, recomputed every frame from the sphere's screen position. */
function layoutCallouts(count: number) {
  const { x, y, radius, anchors } = coreBridge
  const narrow = window.innerWidth < NARROW

  return Array.from({ length: count }, (_, i) => {
    const ax = anchors[i * 2]
    const ay = anchors[i * 2 + 1]

    if (narrow) {
      // A spine drops from the bottom of the sphere; each callout branches off it to the right.
      const spine = Math.min(Math.max(x - radius * 0.6, EDGE + 4), window.innerWidth - TEXT_WIDTH - EDGE - 16)
      const top = y + radius + 28 + i * 58
      const path = `M ${x} ${y + radius * 0.92} V ${y + radius + 14} H ${spine} V ${top} H ${spine + 12}`
      return { path, left: spine + 18, top, side: 'right' as const }
    }

    // Callouts lead diagonally away from their quadrant, then run level to the text.
    const right = ax >= x
    const below = ay >= y
    let endX = x + (right ? 1 : -1) * radius * 1.6
    endX = right ? Math.min(endX, window.innerWidth - TEXT_WIDTH - EDGE) : Math.max(endX, TEXT_WIDTH + EDGE)
    const endY = Math.min(Math.max(y + (below ? 1 : -1) * radius * 1.12, EDGE + 20), window.innerHeight - EDGE - 60)
    const elbowX = endX - (right ? 1 : -1) * radius * 0.3
    const path = `M ${ax} ${ay} L ${elbowX} ${endY} L ${endX} ${endY}`
    return { path, left: right ? endX + 8 : endX - 8, top: endY, side: right ? ('right' as const) : ('left' as const) }
  })
}

/**
 * Telemetry callouts: when the hero sphere is clicked, its scan "reads" the
 * subject and projects the result into the space around it. Leader lines draw
 * out from points on the sphere's surface and end in short readouts, which
 * follow the sphere as it moves. The text is real HTML (sharp, selectable,
 * links work), rendered at page level above the content; the lines are SVG.
 * Closed with Esc, a click elsewhere, or by scrolling the sphere away.
 */
export function ScanReadout({ reducedMotion }: { reducedMotion: boolean }) {
  const [phase, setPhase] = useState<'closed' | 'open' | 'closing'>('closed')
  // Changes with every scan, so the callouts replay when the sphere is clicked again.
  const [run, setRun] = useState(0)
  const paths = useRef<(SVGPathElement | null)[]>([])
  const dots = useRef<(SVGCircleElement | null)[]>([])
  const texts = useRef<(HTMLDivElement | null)[]>([])

  const close = () => setPhase((value) => (value === 'open' ? 'closing' : value))
  const items = callouts(close)

  // Open after each scan.
  useEffect(() => {
    let handled = sceneInput.scan
    let timer: ReturnType<typeof setTimeout> | undefined
    const unsubscribe = subscribeSceneInput(() => {
      if (sceneInput.scan === handled) return
      handled = sceneInput.scan
      clearTimeout(timer)
      timer = setTimeout(
        () => {
          setRun((value) => value + 1)
          setPhase('open')
        },
        reducedMotion ? 0 : OPEN_DELAY_MS,
      )
    })
    return () => {
      unsubscribe()
      clearTimeout(timer)
    }
  }, [reducedMotion])

  useEffect(() => {
    if (phase !== 'closing') return
    const timer = setTimeout(() => setPhase('closed'), CLOSE_MS)
    return () => clearTimeout(timer)
  }, [phase])

  // Follow the sphere every frame, drawing each line out in turn and then revealing its text.
  useEffect(() => {
    if (phase === 'closed') return
    const started = performance.now()
    let frame = 0
    const tick = () => {
      const elapsed = (performance.now() - started) / 1000
      layoutCallouts(items.length).forEach((callout, i) => {
        const drawn = reducedMotion ? 1 : Math.min(1, Math.max(0, (elapsed - i * STAGGER_SECONDS) / DRAW_SECONDS))
        const path = paths.current[i]
        if (path) {
          path.setAttribute('d', callout.path)
          path.style.strokeDashoffset = String(1 - drawn)
        }
        const dot = dots.current[i]
        if (dot) {
          const [cx, cy] = callout.path.slice(2).split(' ')
          dot.setAttribute('cx', cx)
          dot.setAttribute('cy', cy)
        }
        const text = texts.current[i]
        if (text) {
          text.style.transform = `translate3d(${callout.left.toFixed(1)}px, ${callout.top.toFixed(1)}px, 0)${
            callout.side === 'left' ? ' translateX(-100%)' : ''
          } translateY(-0.6rem)`
          text.dataset.side = callout.side
          if (drawn >= 1 && !text.dataset.shown) text.dataset.shown = 'true'
        }
      })
      frame = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(frame)
    // `items` is rebuilt each render but always has the same length and order, so it is not a dependency.
  }, [phase, run, reducedMotion])

  useEffect(() => {
    if (phase !== 'open') return
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && close()
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null
      if (!target?.closest('[data-telemetry-text]')) close()
    }
    // The callouts belong to the sphere's resting pose; scrolling it away closes them.
    const onScroll = () => !coreBridge.clickable && close()
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('scroll', onScroll)
    }
  }, [phase])

  if (phase === 'closed') return null

  return createPortal(
    <div
      key={run}
      data-telemetry
      aria-label={`Profile telemetry: ${profile.name}`}
      role="region"
      aria-live="polite"
      className={`pointer-events-none fixed inset-0 z-[45] transition-opacity duration-200 ${
        phase === 'closing' ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <svg className="absolute inset-0 size-full overflow-visible" aria-hidden="true">
        {items.map((item, i) => (
          <g key={item.label}>
            <path
              ref={(node) => {
                paths.current[i] = node
              }}
              pathLength={1}
              fill="none"
              stroke="var(--color-lime)"
              strokeOpacity={0.75}
              strokeWidth={1}
              strokeDasharray="1"
              strokeDashoffset="1"
            />
            <circle
              ref={(node) => {
                dots.current[i] = node
              }}
              r={2.5}
              fill="var(--color-lime)"
            />
          </g>
        ))}
      </svg>
      {items.map((item, i) => (
        <div
          key={item.label}
          ref={(node) => {
            texts.current[i] = node
          }}
          data-telemetry-text
          className="telemetry-text pointer-events-auto absolute left-0 top-0 max-w-[15rem] font-mono text-xs leading-relaxed"
        >
          <p className="label text-[0.6rem] text-lime">
            <span className="text-muted">{`${String(i + 1).padStart(2, '0')} //`}</span> {item.label}
          </p>
          <div className="mt-1 text-fg">{item.value}</div>
        </div>
      ))}
    </div>,
    document.body,
  )
}
