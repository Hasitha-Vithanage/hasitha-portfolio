import { Color } from 'three'
import { smoothstep } from './layout'

/**
 * Accent tone per section. The rim light and glow shift subtly as you scroll:
 * signature lime in the hero, a cooler, quieter mint behind the project cards,
 * then a slightly brighter lime as the graph forms (matching its HTML labels),
 * and back to the signature lime at full strength for the contact finale.
 */
export const MOOD = {
  hero: new Color('#B6FF4A'),
  work: new Color('#62F2B0'),
  graph: new Color('#C8FF3C'),
} as const

export interface Mood {
  color: Color
  /** Multiplier for rim and glow brightness. */
  intensity: number
}

/** Writes the tone for the given scroll state into `out` (no allocation per frame). */
export function moodAt(hero: number, network: number, out: Mood, finale = 0): Mood {
  const h = smoothstep(hero)
  const n = smoothstep(network)
  const f = smoothstep(finale)
  out.color.copy(MOOD.hero).lerp(MOOD.work, h).lerp(MOOD.graph, n).lerp(MOOD.hero, f)
  // Quieter in between; full strength in the hero, the graph and the finale.
  out.intensity = 1 - 0.2 * h * (1 - n) * (1 - f)
  return out
}

export const createMood = (): Mood => ({ color: MOOD.hero.clone(), intensity: 1 })
