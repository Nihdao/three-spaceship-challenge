import { describe, it, expect } from 'vitest'
import { getRectangularHPBarProps } from '../primitives/RectangularHPBar.jsx'

describe('RectangularHPBar logic', () => {
  it('computes width percentage from value/max', () => {
    const props = getRectangularHPBarProps({ value: 75, max: 100 })
    expect(props.widthPercent).toBe('75%')
  })

  it('clamps width to 0% when value is 0', () => {
    const props = getRectangularHPBarProps({ value: 0, max: 100 })
    expect(props.widthPercent).toBe('0%')
  })

  it('clamps width to 100% when value equals max', () => {
    const props = getRectangularHPBarProps({ value: 100, max: 100 })
    expect(props.widthPercent).toBe('100%')
  })

  it('clamps width to 100% when value exceeds max', () => {
    const props = getRectangularHPBarProps({ value: 150, max: 100 })
    expect(props.widthPercent).toBe('100%')
  })

  it('handles negative values by clamping to 0%', () => {
    const props = getRectangularHPBarProps({ value: -10, max: 100 })
    expect(props.widthPercent).toBe('0%')
  })

  it('displays HP text in "currentHP/maxHP" format', () => {
    const props = getRectangularHPBarProps({ value: 85, max: 100 })
    expect(props.hpText).toBe('85/100')
  })

  it('displays HP text with Math.ceil for fractional values', () => {
    const props = getRectangularHPBarProps({ value: 85.7, max: 100 })
    expect(props.hpText).toBe('86/100')
  })

  it('applies normal glow when pulse is false', () => {
    const props = getRectangularHPBarProps({ value: 50, max: 100, pulse: false })
    expect(props.boxShadow).toBe('0 0 8px rgba(255, 68, 102, 0.5)')
  })

  it('applies intensified glow when pulse is true', () => {
    const props = getRectangularHPBarProps({ value: 20, max: 100, pulse: true })
    expect(props.boxShadow).toBe('0 0 16px rgba(255, 68, 102, 0.8)')
  })

  it('applies pulse animation when pulse is true', () => {
    const props = getRectangularHPBarProps({ value: 20, max: 100, pulse: true })
    expect(props.animation).toBe('hpPulse 500ms ease-in-out infinite alternate')
  })

  it('does not apply pulse animation when pulse is false', () => {
    const props = getRectangularHPBarProps({ value: 50, max: 100, pulse: false })
    expect(props.animation).toBe('none')
  })

  it('defaults pulse to false when not provided', () => {
    const props = getRectangularHPBarProps({ value: 50, max: 100 })
    expect(props.animation).toBe('none')
    expect(props.boxShadow).toBe('0 0 8px rgba(255, 68, 102, 0.5)')
  })

  it('handles low HP (10/100) with correct width and text', () => {
    const props = getRectangularHPBarProps({ value: 10, max: 100 })
    expect(props.widthPercent).toBe('10%')
    expect(props.hpText).toBe('10/100')
  })

  it('handles critical HP (1/100) with correct width and text', () => {
    const props = getRectangularHPBarProps({ value: 1, max: 100 })
    expect(props.widthPercent).toBe('1%')
    expect(props.hpText).toBe('1/100')
  })

  it('handles zero HP (0/100) with correct width and text', () => {
    const props = getRectangularHPBarProps({ value: 0, max: 100 })
    expect(props.widthPercent).toBe('0%')
    expect(props.hpText).toBe('0/100')
  })

  it('handles fractional HP close to zero (0.1 → displays as 1/100)', () => {
    const props = getRectangularHPBarProps({ value: 0.1, max: 100 })
    expect(props.hpText).toBe('1/100')
    expect(props.widthPercent).toBe('0%')
  })
})
