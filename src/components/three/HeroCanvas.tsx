import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Bloom, EffectComposer, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { Fog } from 'three'
import { Core, type CoreRig } from './Core'
import { Dust } from './Dust'
import { Network } from './Network'
import { Lighting } from './Lighting'
import { CAMERA_DISTANCE, CAMERA_FOV, cameraShot, referenceViewport } from './layout'
import { INTRO_DURATION, INTRO_MAX_STEP, introAlreadyPlayed, markIntroPlayed } from './intro'
import { createQualityGovernor } from './qualityGovernor'
import { FLIGHT_SECONDS, sceneInput, subscribeSceneInput, type SceneMotion } from './sceneStore'

/** Length of the pulse sent across the rings when a message is sent. */
const BURST_SECONDS = 2.2
/** Length of the scan that sweeps the sphere when it is clicked. */
const SCAN_SECONDS = 1.5

interface SceneProps {
  reducedMotion: boolean
  compact: boolean
  /** How far lime accents are pushed above white: >1 only when bloom is on, so they glow. */
  glow: number
}

function Scene({ reducedMotion, compact, glow }: SceneProps) {
  const invalidate = useThree((state) => state.invalidate)
  const size = useThree((state) => state.size)
  const viewport = useMemo(() => referenceViewport(size), [size])
  const motion = useRef<SceneMotion>({
    ...sceneInput,
    time: 0,
    intro: reducedMotion || introAlreadyPlayed() ? 1 : 0,
    // Effects at rest. (Set after the spread: sceneInput's counters share these names.)
    burst: 1,
    scan: 1,
    fly: 0,
  })
  // The message and click counts already handled, so effects fire only for new events.
  const handledSignal = useRef(sceneInput.signal)
  const handledScan = useRef(sceneInput.scan)
  const rig = useRef<CoreRig>({ core: null, rings: [] })

  // In on-demand mode (reduced motion) render only when scroll input changes.
  useEffect(() => (reducedMotion ? subscribeSceneInput(() => invalidate()) : undefined), [reducedMotion, invalidate])

  // Smooth the raw input once per frame, before any other frame callback reads it.
  useFrame((state, delta) => {
    const m = motion.current
    const dt = Math.min(delta, 1 / 10)
    const scroll = reducedMotion ? 1 : 1 - Math.exp(-dt * 5)
    const pointer = reducedMotion ? 1 : 1 - Math.exp(-dt * 2.5)
    m.hero += (sceneInput.hero - m.hero) * scroll
    m.network += (sceneInput.network - m.network) * scroll
    m.finale += (sceneInput.finale - m.finale) * scroll
    // A sent message starts a pulse (skipped when motion is reduced).
    if (sceneInput.signal !== handledSignal.current) {
      handledSignal.current = sceneInput.signal
      if (!reducedMotion) m.burst = 0
    }
    if (m.burst < 1) m.burst = Math.min(1, m.burst + dt / BURST_SECONDS)
    // Clicking the sphere runs a scan across its plating.
    if (sceneInput.scan !== handledScan.current) {
      handledScan.current = sceneInput.scan
      if (!reducedMotion) m.scan = 0
    }
    if (m.scan < 1) m.scan = Math.min(1, m.scan + dt / SCAN_SECONDS)
    m.pointerX += ((reducedMotion ? 0 : sceneInput.pointerX) - m.pointerX) * pointer
    m.pointerY += ((reducedMotion ? 0 : sceneInput.pointerY) - m.pointerY) * pointer
    if (!reducedMotion) m.time += dt
    if (m.intro < 1) {
      // Counted as played once it starts, so leaving mid-way never causes a second run.
      markIntroPlayed()
      m.intro = reducedMotion ? 1 : Math.min(1, m.intro + Math.min(delta, INTRO_MAX_STEP) / INTRO_DURATION)
    }

    // Scroll-linked shot: the camera swings around the sphere between the hero and the graph.
    // With reduced motion it holds its resting position.
    const shot = cameraShot(viewport, reducedMotion ? 0 : m.hero, m.network)
    const [tx, ty, tz] = shot.target
    const camera = state.camera
    camera.position.set(
      tx + Math.sin(shot.azimuth) * Math.cos(shot.elevation) * shot.distance,
      ty + Math.sin(shot.elevation) * shot.distance,
      tz + Math.cos(shot.azimuth) * Math.cos(shot.elevation) * shot.distance,
    )
    // Restrained pointer parallax on top, nearly stilled once the graph is formed so nodes stay put under the cursor.
    const parallax = 1 - m.network * 0.85
    camera.position.x += m.pointerX * 0.35 * parallax
    camera.position.y += m.pointerY * 0.22 * parallax
    camera.lookAt(tx, ty, tz)

    // Supernova into a project (the graph and dust read this; the camera holds still).
    m.fly = sceneInput.flyTo ? Math.min(1, m.fly + dt / FLIGHT_SECONDS) : 0

    // Keep the fog band around the subject as the camera pulls back, so the sphere isn't greyed out.
    if (state.scene.fog instanceof Fog) {
      state.scene.fog.near = shot.distance - 0.5
      state.scene.fog.far = shot.distance + 7
    }
  }, -1)

  return (
    <>
      <fog attach="fog" args={['#090B0F', 7.5, 15]} />
      <Lighting motion={motion} />
      <Dust motion={motion} compact={compact} />
      <Core motion={motion} rig={rig} glow={glow} />
      <Network motion={motion} rig={rig} reducedMotion={reducedMotion} glow={glow} />
    </>
  )
}

/**
 * Bloom picks up only what is brighter than white — the boosted lime accents —
 * so the chrome and its reflections stay crisp. Post-processing takes over tone
 * mapping from the renderer, so it is applied here as the final pass.
 */
function Effects() {
  return (
    <EffectComposer multisampling={4}>
      {/* A soft threshold edge, so pixels near the cut-off fade in rather than popping on and off. */}
      <Bloom mipmapBlur luminanceThreshold={0.9} luminanceSmoothing={0.45} intensity={0.8} radius={0.72} />
      <ToneMapping mode={ToneMappingMode.NEUTRAL} />
    </EffectComposer>
  )
}

export interface HeroCanvasProps {
  active: boolean
  reducedMotion: boolean
  compact: boolean
  onReady: () => void
  /** The browser took the GPU context away (driver reset, sleep, memory pressure); the canvas is now blank. */
  onContextLost: () => void
}

/**
 * Watches frame times and asks for a lower quality tier only when the device is
 * genuinely struggling (see qualityGovernor). Not used in on-demand mode, where
 * frames are only drawn on scroll and the frame rate means nothing.
 */
function QualityWatch({ onDowngrade }: { onDowngrade: () => void }) {
  const [governor] = useState(createQualityGovernor)
  useFrame((_, delta) => {
    if (governor.tick(delta)) onDowngrade()
  })
  return null
}

/** Quality tiers, stepped through only downwards: full → lower resolution → no bloom. */
const LOWEST_TIER = 2

export default function HeroCanvas({ active, reducedMotion, compact, onReady, onContextLost }: HeroCanvasProps) {
  const [tier, setTier] = useState(0)
  const maxDpr = compact ? 1.5 : 1.75
  const dpr = [maxDpr, 1.25, 1][tier]
  // Bloom is a desktop enhancement, dropped only as the last step.
  const bloom = !compact && tier < LOWEST_TIER

  let frameloop: 'always' | 'demand' | 'never' = 'always'
  if (!active) frameloop = 'never'
  else if (reducedMotion) frameloop = 'demand'

  return (
    <Canvas
      dpr={[1, dpr]}
      frameloop={frameloop}
      camera={{ position: [0, 0, CAMERA_DISTANCE], fov: CAMERA_FOV, near: 0.1, far: 40 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        // A lost context isn't an error the boundary can catch: it just leaves a blank canvas.
        gl.domElement.addEventListener(
          'webglcontextlost',
          (event) => {
            event.preventDefault()
            onContextLost()
          },
          { once: true },
        )
        requestAnimationFrame(onReady)
      }}
    >
      {/*
        Quality only ever steps down. Switching back up would rebuild the render
        buffers each time the frame rate recovered, which shows as flicker.
      */}
      {!reducedMotion && tier < LOWEST_TIER && (
        <QualityWatch onDowngrade={() => setTier((current) => Math.min(current + 1, LOWEST_TIER))} />
      )}
      <Scene reducedMotion={reducedMotion} compact={compact} glow={bloom ? 2.4 : 1} />
      {bloom && <Effects />}
    </Canvas>
  )
}
