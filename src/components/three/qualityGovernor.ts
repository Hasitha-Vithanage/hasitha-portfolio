/**
 * Decides when the 3D scene should step down in quality. It only reacts to
 * sustained slowness — never to the start-up stutter while shaders compile, to
 * brief dips while scrolling, or to the gap after a hidden tab — so capable
 * devices keep full quality (bloom included) for the whole visit.
 */

export interface GovernorSettings {
  warmup: number
  window: number
  minFps: number
  cooldown: number
  maxFrameGap: number
}

export const GOVERNOR: Readonly<GovernorSettings> = {
  /** Seconds ignored after start: shader compilation and the intro. */
  warmup: 6,
  /** Length of each measurement window, in seconds. */
  window: 4,
  /** Average frame rate below which a window counts as struggling. */
  minFps: 30,
  /** Seconds to let a downgrade take effect before measuring again. */
  cooldown: 3,
  /** A single frame longer than this is a pause (hidden tab, stopped loop), not slowness. */
  maxFrameGap: 0.25,
}

export interface QualityGovernor {
  /** Feed one frame's duration in seconds; returns true when quality should step down. */
  tick: (delta: number) => boolean
}

export function createQualityGovernor(settings: Readonly<GovernorSettings> = GOVERNOR): QualityGovernor {
  let wait = settings.warmup
  let windowTime = 0
  let frames = 0
  let previousWasLong = false

  return {
    tick(rawDelta) {
      // A pause (hidden tab, stopped loop) is one long gap between normal frames: ignore it.
      // Long frames back to back are a genuinely slow device and must count.
      const long = rawDelta > settings.maxFrameGap
      const isolatedGap = long && !previousWasLong
      previousWasLong = long
      if (isolatedGap) return false
      const delta = Math.min(rawDelta, 1)

      if (wait > 0) {
        wait -= delta
        return false
      }
      windowTime += delta
      frames += 1
      if (windowTime < settings.window) return false

      const fps = frames / windowTime
      windowTime = 0
      frames = 0
      if (fps >= settings.minFps) return false
      wait = settings.cooldown
      return true
    },
  }
}
