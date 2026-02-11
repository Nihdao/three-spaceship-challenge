import { describe, it, expect } from 'vitest'
import { getStatLineProps } from '../primitives/StatLine.jsx'

describe('StatLine logic', () => {
  it('returns label and value as-is', () => {
    const props = getStatLineProps({ label: 'Time', value: '05:30' })
    expect(props.label).toBe('Time')
    expect(props.value).toBe('05:30')
  })

  it('converts numeric value to string', () => {
    const props = getStatLineProps({ label: 'Kills', value: 42 })
    expect(props.value).toBe('42')
  })

  it('includes tabular-nums in value class', () => {
    const props = getStatLineProps({ label: 'Level', value: 5 })
    expect(props.valueClassName).toContain('tabular-nums')
  })

  it('includes text-game-text in label class', () => {
    const props = getStatLineProps({ label: 'Test', value: '0' })
    expect(props.labelClassName).toContain('text-game-text')
  })

  it('includes text-game-text in value class', () => {
    const props = getStatLineProps({ label: 'Test', value: '0' })
    expect(props.valueClassName).toContain('text-game-text')
  })

  it('handles icon being provided (truthy)', () => {
    const props = getStatLineProps({ label: 'Weapons', value: 'Laser', icon: true })
    expect(props.hasIcon).toBe(true)
  })

  it('handles icon not provided (falsy)', () => {
    const props = getStatLineProps({ label: 'Weapons', value: 'Laser' })
    expect(props.hasIcon).toBe(false)
  })
})
