/**
 * A tiny mutable store shared by the HTML page and the WebGL scene.
 *
 * Scroll and pointer handlers write here; the render loop reads it every frame.
 * Keeping it outside React means scrolling never re-renders the scene tree.
 */

export interface SceneInput {
  /** 0 → 1 as the hero scrolls out of view. */
  hero: number
  /** 0 → 1 as the graph stage scrolls in; drives the network formation. */
  network: number
  /** Normalised pointer position, -1 → 1. */
  pointerX: number
  pointerY: number
  /** Id of the graph node being hovered or focused, from the canvas or the legend. */
  focus: string | null
  /** Slug of the project whose card is hovered or focused; its orbiting satellite lights up. */
  spotlight: string | null
  /** 0 → 1 as the contact section scrolls in: the system returns for the finale. */
  finale: number
  /** Incremented each time a message is sent from the contact form; each change sends a pulse across the rings. */
  signal: number
  /** Incremented each time the sphere is clicked; each change runs a scan across its plating. */
  scan: number
  /** Slug of the project going supernova, on the way to its case study. */
  flyTo: string | null
}

/**
 * Supernova into a case study: the whole system implodes into the core, which then
 * detonates. Always the core, so the blast starts somewhere predictable and visible
 * rather than wherever the project's satellite happened to be on its orbit.
 * FLIGHT_SECONDS covers both stages; IMPLODE_SHARE is the implosion's part of it.
 */
export const FLIGHT_SECONDS = 0.85
export const IMPLODE_SHARE = 0.7

/** Implosion progress for a supernova progress: eased in and out, so the collapse gathers pace and lands softly. */
export const implodeAt = (fly: number) => {
  const t = Math.min(1, fly / IMPLODE_SHARE)
  return t * t * (3 - 2 * t)
}

/** Blast progress for a supernova progress, 0 until the implosion is complete. */
export const blastAt = (fly: number) => Math.min(1, Math.max(0, (fly - IMPLODE_SHARE) / (1 - IMPLODE_SHARE)))

export const sceneInput: SceneInput = {
  hero: 0,
  network: 0,
  pointerX: 0,
  pointerY: 0,
  focus: null,
  spotlight: null,
  finale: 0,
  signal: 0,
  scan: 0,
  flyTo: null,
}

const listeners = new Set<() => void>()

export function setSceneInput(patch: Partial<SceneInput>) {
  Object.assign(sceneInput, patch)
  listeners.forEach((listener) => listener())
}

export function subscribeSceneInput(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Smoothed values derived from the input inside the render loop. */
export interface SceneMotion {
  hero: number
  network: number
  pointerX: number
  pointerY: number
  /** Seconds of idle animation elapsed (frozen when motion is reduced). */
  time: number
  /** Opening sequence progress, 0 → 1. Starts at 1 when it has already played or motion is reduced. */
  intro: number
  finale: number
  /** Progress of the latest message pulse, 0 → 1; rests at 1 when there is none. */
  burst: number
  /** Progress of the latest click scan, 0 → 1; rests at 1 when there is none. */
  scan: number
  /** Progress of the supernova into a project, 0 → 1; 0 when there is none. */
  fly: number
}

/**
 * Written by the render loop for the DOM side: where each graph node is on screen
 * (for hit-testing pointer and touch input) and the label elements to position.
 */
export const coreBridge = {
  /** The sphere's centre and radius on screen, in client pixels. */
  x: 0,
  y: 0,
  radius: 0,
  /** True when the sphere is in a resting, uncovered pose where clicking it makes sense. */
  clickable: false,
  /** Screen positions (x, y pairs) of the points on the sphere's surface that telemetry callouts start from. */
  anchors: new Float32Array(8),
}

export const graphBridge = {
  /** Per node: client x, client y, and 1 if the node can be interacted with. */
  screen: new Float32Array(0),
  labels: [] as (HTMLElement | null)[],
  /**
   * Centre of a supernova (the core) in world space, for the dust, written by the graph each frame.
   * Its position on screen, where the page's flash starts, is coreBridge.x/y.
   * A plain object: this store is also imported by page code that shouldn't pull in three.js.
   */
  flightTarget: { x: 0, y: 0, z: 0 },
  hasFlightTarget: false,
}
