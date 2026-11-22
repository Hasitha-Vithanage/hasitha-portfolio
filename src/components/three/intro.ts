import { clamp01 } from './layout'

/** Length of the opening sequence, in seconds. */
export const INTRO_DURATION = 2.6

/**
 * Longest step the intro may take in one frame. A stutter while the scene warms
 * up then slows the intro briefly instead of skipping its opening.
 */
export const INTRO_MAX_STEP = 1 / 20

/**
 * The intro plays once per visit. Returning to the home page from a case study
 * remounts the scene, but should show it already assembled.
 */
let played = false
export const introAlreadyPlayed = () => played
export const markIntroPlayed = () => {
  played = true
}

const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t))
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/** Progress of one stage that runs from `start` to `start + length`, both as fractions of the intro. */
const stage = (intro: number, start: number, length: number) => clamp01((intro - start) / length)

/**
 * Per-element progress for a given overall intro progress (0 → 1):
 * the sphere grows in first, then each ring traces itself, then satellites settle.
 */
export function introStages(intro: number) {
  return {
    sphere: easeOutExpo(stage(intro, 0, 0.4)),
    seam: easeInOutCubic(stage(intro, 0.28, 0.4)),
    ring: (i: number) => easeInOutCubic(stage(intro, 0.14 + i * 0.14, 0.46)),
    satellites: easeOutCubic(stage(intro, 0.46, 0.54)),
  }
}
