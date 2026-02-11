import { describe, it, expect } from 'vitest'
import { getProgressBarProps } from '../primitives/ProgressBar.jsx'

describe('ProgressBar logic', () => {
  it('computes width percentage from value/max', () => {
    const props = getProgressBarProps({ value: 75, max: 100, variant: 'hp' })
    expect(props.widthPercent).toBe('75%')
  })

  it('clamps width to 0% when value is 0', () => {
    const props = getProgressBarProps({ value: 0, max: 100, variant: 'hp' })
    expect(props.widthPercent).toBe('0%')
  })

  it('clamps width to 100% when value exceeds max', () => {
    const props = getProgressBarProps({ value: 150, max: 100, variant: 'hp' })
    expect(props.widthPercent).toBe('100%')
  })

  it('defaults max to 100 when not provided', () => {
    const props = getProgressBarProps({ value: 30, variant: 'xp' })
    expect(props.widthPercent).toBe('30%')
  })

  it('includes pulse class when pulse is true', () => {
    const props = getProgressBarProps({ value: 20, max: 100, variant: 'hp', pulse: true })
    expect(props.fillClassName).toContain('animate-pulse-glow')
  })

  it('does not include pulse class when pulse is false', () => {
    const props = getProgressBarProps({ value: 50, max: 100, variant: 'hp', pulse: false })
    expect(props.fillClassName).not.toContain('animate-pulse-glow')
  })

  it('applies hp variant color', () => {
    const props = getProgressBarProps({ value: 50, max: 100, variant: 'hp' })
    expect(props.fillClassName).toContain('bg-game-hp')
  })

  it('applies xp variant color', () => {
    const props = getProgressBarProps({ value: 50, max: 100, variant: 'xp' })
    expect(props.fillClassName).toContain('bg-game-xp')
  })

  it('applies cooldown variant color', () => {
    const props = getProgressBarProps({ value: 50, max: 100, variant: 'cooldown' })
    expect(props.fillClassName).toContain('bg-game-cooldown')
  })

  it('applies boss variant color (same as hp)', () => {
    const props = getProgressBarProps({ value: 50, max: 100, variant: 'boss' })
    expect(props.fillClassName).toContain('bg-game-hp')
  })

  it('falls back to hp color for unknown variant', () => {
    const props = getProgressBarProps({ value: 50, max: 100, variant: 'unknown' })
    expect(props.fillClassName).toContain('bg-game-hp')
  })

  it('handles negative values by clamping to 0%', () => {
    const props = getProgressBarProps({ value: -10, max: 100, variant: 'hp' })
    expect(props.widthPercent).toBe('0%')
  })
})
