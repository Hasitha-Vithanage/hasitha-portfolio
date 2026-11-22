import { describe, expect, it } from 'vitest'
import type { Color } from 'three'
import { MOOD, createMood, moodAt } from './mood'

const expectColor = (actual: Color, expected: Color) =>
  (['r', 'g', 'b'] as const).forEach((channel) => expect(actual[channel]).toBeCloseTo(expected[channel], 6))

describe('section mood', () => {
  it('uses the signature lime at full strength in the hero', () => {
    const tone = moodAt(0, 0, createMood())
    expectColor(tone.color, MOOD.hero)
    expect(tone.intensity).toBe(1)
  })

  it('cools and quietens behind the project cards', () => {
    const tone = moodAt(1, 0, createMood())
    expectColor(tone.color, MOOD.work)
    expect(tone.intensity).toBeCloseTo(0.8)
  })

  it('returns to a full-strength lime as the graph forms', () => {
    const tone = moodAt(1, 1, createMood())
    expectColor(tone.color, MOOD.graph)
    expect(tone.intensity).toBe(1)
  })

  it('returns to the signature lime at full strength for the contact finale', () => {
    const tone = moodAt(1, 0, createMood(), 1)
    expectColor(tone.color, MOOD.hero)
    expect(tone.intensity).toBe(1)
  })

  it('blends gradually rather than switching', () => {
    const half = moodAt(0.5, 0, createMood()).color
    const toHero = Math.abs(half.g - MOOD.hero.g) + Math.abs(half.b - MOOD.hero.b)
    const toWork = Math.abs(half.g - MOOD.work.g) + Math.abs(half.b - MOOD.work.b)
    expect(toHero).toBeGreaterThan(0)
    expect(toWork).toBeGreaterThan(0)
  })
})
