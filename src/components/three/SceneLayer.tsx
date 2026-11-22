import { Component, Suspense, lazy, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useMediaQuery, useReducedMotion } from '../../hooks/useMediaQuery'
import { gsap } from '../../lib/gsap'
import { supportsWebGL } from '../../utils/webgl'
import { GraphLabels } from './GraphLabels'
import { ScenePoster } from './ScenePoster'
import { ScanReadout } from './ScanReadout'
import { FLIGHT_SECONDS, coreBridge, sceneInput, setSceneInput, subscribeSceneInput } from './sceneStore'

const HeroCanvas = lazy(() => import('./HeroCanvas'))

/** After a lost GPU context: wait this long, then rebuild the canvas. */
const RECOVER_DELAY_MS = 1200
/** This many losses within the window means the device is struggling; stay on the static poster. */
const MAX_LOSSES = 2
const LOSS_WINDOW_MS = 60_000

/** How much a hovered project card raises the faded scene's opacity (it rests at 0.18 behind the cards). */
const SPOTLIGHT_LIFT = 0.32
/** Elements that keep their own clicks, even over the sphere. */
const INTERACTIVE =
  'a, button, input, textarea, select, label, summary, [role="button"], [data-telemetry-text], [tabindex]:not([tabindex="-1"])'

class SceneErrorBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch() {
    this.props.onError()
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

interface SceneLayerProps {
  /** False once the scene has scrolled out of view; stops the render loop. */
  active: boolean
}

/**
 * Fixed, decorative background layer holding the WebGL scene. The HTML page
 * scrolls above it; the layer never receives pointer events.
 */
export function SceneLayer({ active }: SceneLayerProps) {
  const reducedMotion = useReducedMotion()
  const compact = useMediaQuery('(max-width: 767px)')
  const finePointer = useMediaQuery('(pointer: fine)')
  const layer = useRef<HTMLDivElement>(null)
  const [webgl] = useState(supportsWebGL)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  // Context-loss recovery: the poster stands in while the canvas is rebuilt (a new key mounts a fresh one).
  const [lost, setLost] = useState(false)
  const [canvasKey, setCanvasKey] = useState(0)
  const losses = useRef<number[]>([])
  const recovery = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(recovery.current), [])

  const onContextLost = useCallback(() => {
    setReady(false)
    setLost(true)
    const now = performance.now()
    losses.current = [...losses.current.filter((time) => now - time < LOSS_WINDOW_MS), now]
    // Lost again soon after recovering: the device is struggling, so keep the static poster for this visit.
    if (losses.current.length >= MAX_LOSSES) {
      setFailed(true)
      return
    }
    clearTimeout(recovery.current)
    recovery.current = setTimeout(() => {
      setCanvasKey((key) => key + 1)
      setLost(false)
    }, RECOVER_DELAY_MS)
  }, [])

  useEffect(() => {
    if (!finePointer || reducedMotion) return
    const onMove = (event: PointerEvent) => {
      setSceneInput({
        pointerX: (event.clientX / window.innerWidth) * 2 - 1,
        pointerY: -((event.clientY / window.innerHeight) * 2 - 1),
      })
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [finePointer, reducedMotion])

  // Clicking the sphere runs a scan across it. The layer takes no pointer events, so clicks are
  // matched against the sphere's on-screen position; anything interactive on top keeps its click.
  useEffect(() => {
    if (!active || !ready) return
    let pointing = false
    const overSphere = (event: MouseEvent) => {
      if (!coreBridge.clickable) return false
      const target = event.target as Element | null
      if (target?.closest(INTERACTIVE)) return false
      const distance = Math.hypot(event.clientX - coreBridge.x, event.clientY - coreBridge.y)
      return distance < coreBridge.radius * 0.95
    }
    const setPointing = (next: boolean) => {
      if (next === pointing) return
      pointing = next
      document.body.style.cursor = next ? 'pointer' : ''
    }
    const onMove = (event: PointerEvent) => setPointing(event.pointerType === 'mouse' && overSphere(event))
    const onClick = (event: MouseEvent) => {
      if (event.button !== 0 || !overSphere(event)) return
      // Selecting text over the sphere shouldn't count as a click on it.
      if (window.getSelection()?.toString()) return
      setSceneInput({ scan: sceneInput.scan + 1 })
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('click', onClick)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('click', onClick)
      setPointing(false)
    }
  }, [active, ready])

  // While a project card is hovered, lift the layer out of its faded state so the card's satellite can be seen.
  // During a supernova into a project, lift it fully so the implosion is seen at full strength.
  useEffect(() => {
    const element = layer.current
    if (!element) return
    const liftFor = () => {
      if (sceneInput.flyTo) return 1
      return sceneInput.spotlight === null ? 0 : SPOTLIGHT_LIFT
    }
    let lift = liftFor()
    return subscribeSceneInput(() => {
      const next = liftFor()
      if (next !== lift) {
        lift = next
        const duration = sceneInput.flyTo ? FLIGHT_SECONDS * 0.4 : 0.6
        gsap.to(element, {
          '--scene-lift': next,
          duration: reducedMotion ? 0 : duration,
          ease: 'power2.out',
          // Only replaces an earlier lift. (`true` would kill every tween on the layer,
          // including Home's scroll fades, freezing the scene at whatever level it had.)
          overwrite: 'auto',
        })
      }
    })
  }, [reducedMotion])

  return (
    <div
      ref={layer}
      data-scene-layer
      className="pointer-events-none fixed inset-0 z-0"
      // Scroll fade (--scene-fade, from Home) plus the card spotlight or supernova lift. Opacity above 1 is clamped by the browser.
      style={{ opacity: 'calc(var(--scene-fade, 1) + var(--scene-lift, 0))' }}
      aria-hidden="true"
    >
      {/* Atmosphere: faint grid and a lime glow behind the core */}
      <div className="grid-lines absolute inset-0 [mask-image:radial-gradient(ellipse_at_70%_45%,black_10%,transparent_65%)]" />
      <div className="absolute left-1/2 top-[28%] h-[60vmax] w-[60vmax] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(182,255,74,0.08),transparent_60%)] md:left-[70%] md:top-1/2" />

      {/*
        Only a fallback for when WebGL is missing or fails. While the 3D scene loads,
        the atmosphere above stands alone and the intro assembles the sphere.
      */}
      <ScenePoster visible={!webgl || failed || lost} />

      {webgl && !failed && (
        <SceneErrorBoundary
          onError={() => {
            setReady(false)
            setFailed(true)
          }}
        >
          <Suspense fallback={null}>
            <div className={`absolute inset-0 transition-opacity duration-500 ${ready ? 'opacity-100' : 'opacity-0'}`}>
              {!lost && (
                <HeroCanvas
                  key={canvasKey}
                  active={active}
                  reducedMotion={reducedMotion}
                  compact={compact}
                  onReady={() => setReady(true)}
                  onContextLost={onContextLost}
                />
              )}
            </div>
            {ready && <GraphLabels />}
            {ready && <ScanReadout reducedMotion={reducedMotion} />}
          </Suspense>
        </SceneErrorBoundary>
      )}
    </div>
  )
}
