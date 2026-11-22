import { Euler } from 'three'
import type { Graph } from '../../data/graph'

export interface ViewportSize {
  width: number
  height: number
}

export const mix = (a: number, b: number, t: number) => a + (b - a) * t
export const clamp01 = (t: number) => Math.min(1, Math.max(0, t))
export const smoothstep = (t: number) => {
  const x = clamp01(t)
  return x * x * (3 - 2 * x)
}

export const isPortrait = (viewport: ViewportSize) => viewport.width / viewport.height < 0.9

/** The camera's resting distance and field of view, used for all layout. */
export const CAMERA_DISTANCE = 8
export const CAMERA_FOV = 35

/**
 * The visible area at z = 0 for the camera at rest. Layout is always computed
 * from this, never from wherever the moving camera happens to be, so resizing
 * mid-scroll can't misplace the scene.
 */
export function referenceViewport(size: { width: number; height: number }): ViewportSize {
  const height = 2 * CAMERA_DISTANCE * Math.tan(((CAMERA_FOV / 2) * Math.PI) / 180)
  return { width: height * (size.width / size.height), height }
}

/**
 * Orbit rings around the core: complete circles, each tilted into its own plane.
 * Satellites ride exactly on these rings, so a node is never off its path.
 */
export const RINGS = [
  { radius: 1.55, tilt: new Euler(1.2, 0.2, 0), speed: 0.1, accent: false },
  { radius: 1.9, tilt: new Euler(1.75, -0.35, 0.25), speed: -0.07, accent: false },
  { radius: 2.3, tilt: new Euler(1.4, 0.55, -0.35), speed: 0.05, accent: true },
] as const

/** Projects ride the lime ring; disciplines share the two silver rings. */
const ACCENT_RING = RINGS.findIndex((ring) => ring.accent)

/**
 * Where the core sits for a given graph progress, in world units at z = 0.
 * In the hero it rests beside the headline (above it on narrow screens) and
 * stays there while the camera moves around it; it moves only to become the
 * centre of the graph.
 */
export function coreTransform(viewport: ViewportSize, network: number) {
  const portrait = isPortrait(viewport)
  const { width: w, height: h } = viewport

  const heroScale = portrait ? Math.min(0.62, w / 5.4) : Math.min(1, w / 9.2)
  const start = portrait ? [0, h * 0.25, 0] : [w * 0.215, 0.05, 0]
  const centre = [0, graphSpan(viewport).centreY, -0.5]

  const n1 = smoothstep(network)
  const position = [0, 1, 2].map((i) => mix(start[i], centre[i], n1)) as [number, number, number]
  const scale = mix(heroScale, portrait ? 0.17 : 0.3, n1)

  return { position, scale }
}

/**
 * The scroll-linked camera move. As the hero scrolls away the camera swings
 * around the sphere, rising and pulling back; approaching the graph it swings
 * back to face it head-on. `swing` peaks between the two (behind the project
 * cards) and is 0 at both ends, so the hero and the graph keep their framing.
 */
export function cameraShot(viewport: ViewportSize, hero: number, network: number) {
  const portrait = isPortrait(viewport)
  const swing = smoothstep(hero) * (1 - smoothstep(network))
  const anchor = coreTransform(viewport, 0).position

  // Aim well to the lower left of the sphere so, despite the foreshortening of the
  // swing, it settles in the upper right of the frame, clear of the section text.
  const target: [number, number, number] = [
    (anchor[0] - viewport.width * (portrait ? 0.05 : 0.5)) * swing,
    (anchor[1] - viewport.height * (portrait ? 0.2 : 0.4)) * swing,
    0,
  ]
  return {
    target,
    azimuth: swing * (portrait ? 0.3 : 0.62),
    elevation: swing * 0.24,
    // Pulling back keeps the sphere small, in the open space above each section's intro text.
    distance: CAMERA_DISTANCE + swing * 5,
  }
}

/**
 * Area of the viewport, in world units, that the formed graph spreads across.
 * The centre sits above the middle to leave room for the legend below it.
 */
export function graphSpan(viewport: ViewportSize) {
  return isPortrait(viewport)
    ? { x: viewport.width * 0.44, y: viewport.height * 0.25, centreY: viewport.height * 0.06 }
    : { x: Math.min(viewport.width * 0.4, viewport.height * 0.95), y: viewport.height * 0.32, centreY: viewport.height * 0.015 }
}

export interface GraphPlacement {
  /** Normalised position in the formed graph (x, y in -1 → 1, z in world units). */
  target: [number, number, number]
  /** Orbit used while the graph is folded around the core in the hero. */
  ring: number
  phase: number
}

const GROUP_ANGLES = [Math.PI * 0.75, Math.PI * 0.25, -Math.PI * 0.25, -Math.PI * 0.75]
const PROJECT_ANGLES = [Math.PI, 0, Math.PI / 2, -Math.PI / 2]

/**
 * Radial layout: disciplines on the diagonals with their skills fanned outward,
 * projects on the axes between them so skill → project links cross the graph.
 */
export function layoutGraph(graph: Graph): GraphPlacement[] {
  const groups = graph.nodes.filter((n) => n.kind === 'group')
  const projectTotal = graph.nodes.filter((n) => n.kind === 'project').length
  const silverRings = RINGS.map((_, r) => r).filter((r) => r !== ACCENT_RING)
  let projectCount = 0

  // Evenly spaced positions on each ring, so orbiting satellites never bunch up.
  const orbitFor = (node: Graph['nodes'][number], i: number) => {
    if (node.kind === 'project') {
      return { ring: ACCENT_RING, phase: (projectCount / projectTotal) * Math.PI * 2 + 0.4 }
    }
    if (node.kind === 'group') {
      const g = groups.findIndex((n) => n.id === node.id)
      const perRing = Math.ceil(groups.length / silverRings.length)
      return {
        ring: silverRings[g % silverRings.length],
        phase: (Math.floor(g / silverRings.length) / perRing) * Math.PI * 2 + (g % silverRings.length) * 1.1,
      }
    }
    // Skills are hidden while orbiting; they only need a valid ring.
    return { ring: silverRings[i % silverRings.length], phase: i }
  }

  return graph.nodes.map((node, i) => {
    const orbit = orbitFor(node, i)
    const polar = (angle: number, radius: number, z: number): [number, number, number] => [
      Math.cos(angle) * radius,
      Math.sin(angle) * radius,
      z,
    ]

    switch (node.kind) {
      case 'core':
        return { target: [0, 0, 0], ...orbit }
      case 'project':
        return { target: polar(PROJECT_ANGLES[projectCount++ % PROJECT_ANGLES.length], 0.6, 0.35), ...orbit }
      case 'group': {
        const g = groups.findIndex((n) => n.id === node.id)
        return { target: polar(GROUP_ANGLES[g % GROUP_ANGLES.length], 0.5, 0.1), ...orbit }
      }
      case 'skill': {
        const g = groups.findIndex((n) => n.groupId === node.groupId)
        const siblings = graph.nodes.filter((n) => n.kind === 'skill' && n.groupId === node.groupId)
        const k = siblings.findIndex((n) => n.id === node.id)
        const step = 0.2
        const angle = GROUP_ANGLES[g % GROUP_ANGLES.length] + (k - (siblings.length - 1) / 2) * step
        // Alternate radii so neighbouring labels don't collide.
        return { target: polar(angle, k % 2 ? 1 : 0.86, -0.15 - (k % 2) * 0.2), ...orbit }
      }
    }
  })
}
