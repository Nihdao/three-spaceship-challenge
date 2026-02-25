import { describe, it, expect } from 'vitest'
import { FragmentIcon } from '../icons/index.jsx'

describe('FragmentIcon (Story 42.3)', () => {
  it('is exported as a function component', () => {
    expect(typeof FragmentIcon).toBe('function')
  })

  it('renders an svg element with correct size and fill', () => {
    const el = FragmentIcon({ size: 16, color: '#ff00ff' })
    expect(el.type).toBe('svg')
    expect(el.props.width).toBe(16)
    expect(el.props.height).toBe(16)
    expect(el.props.fill).toBe('#ff00ff')
  })

  it('defaults to size 14 and currentColor fill', () => {
    const el = FragmentIcon({})
    expect(el.props.width).toBe(14)
    expect(el.props.height).toBe(14)
    expect(el.props.fill).toBe('currentColor')
  })

  it('forwards style prop to the svg element (regression: inline alignment)', () => {
    const style = { display: 'inline-block', verticalAlign: 'middle', marginLeft: 2 }
    const el = FragmentIcon({ style })
    expect(el.props.style).toEqual(style)
  })

  it('renders without style prop without throwing', () => {
    expect(() => FragmentIcon({ size: 14 })).not.toThrow()
    const el = FragmentIcon({ size: 14 })
    expect(el.props.style).toBeUndefined()
  })
})
