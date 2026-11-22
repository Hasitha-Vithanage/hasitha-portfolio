import { describe, expect, it } from 'vitest'
import { GOVERNOR, createQualityGovernor } from './qualityGovernor'

/** Runs `seconds` of frames at `fps` and returns how many downgrades were requested. */
function run(governor: ReturnType<typeof createQualityGovernor>, fps: number, seconds: number) {
  let downgrades = 0
  for (let t = 0; t < seconds; t += 1 / fps) if (governor.tick(1 / fps)) downgrades++
  return downgrades
}

describe('quality governor', () => {
  it('keeps full quality on a healthy device for a long visit', () => {
    const governor = createQualityGovernor()
    expect(run(governor, 144, 120)).toBe(0)
    expect(run(governor, 60, 120)).toBe(0)
  })

  it('ignores the start-up stutter while shaders compile', () => {
    const governor = createQualityGovernor()
    expect(run(governor, 8, 2)).toBe(0) // very slow first seconds
    expect(run(governor, 60, 60)).toBe(0)
  })

  it('ignores brief dips such as a heavy scroll', () => {
    const governor = createQualityGovernor()
    run(governor, 60, GOVERNOR.warmup)
    let downgrades = 0
    for (let i = 0; i < 20; i++) {
      downgrades += run(governor, 20, 0.5) // half a second of jank…
      downgrades += run(governor, 60, 3.5) // …inside an otherwise smooth window
    }
    expect(downgrades).toBe(0)
  })

  it('treats a single long gap between frames as a pause, not slowness', () => {
    const governor = createQualityGovernor()
    run(governor, 60, GOVERNOR.warmup + 1)
    let downgrades = 0
    for (let i = 0; i < 20; i++) {
      if (governor.tick(30)) downgrades++ // returning from a hidden tab
      downgrades += run(governor, 60, 2)
    }
    expect(downgrades).toBe(0)
  })

  it('still steps down on a very slow device whose every frame is long', () => {
    const governor = createQualityGovernor()
    expect(run(governor, 3, 30)).toBeGreaterThanOrEqual(1)
  })

  it('steps down once per sustained slow window, with a cooldown between steps', () => {
    const governor = createQualityGovernor()
    run(governor, 60, GOVERNOR.warmup)
    // One slow window triggers the first step…
    expect(run(governor, 20, GOVERNOR.window)).toBe(1)
    // …then the cooldown passes before the next window can trigger again.
    expect(run(governor, 20, GOVERNOR.cooldown)).toBe(0)
    expect(run(governor, 20, GOVERNOR.window)).toBe(1)
  })
})
