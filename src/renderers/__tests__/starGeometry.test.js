import { describe, it, expect } from 'vitest'
import { createStarGeometry } from '../StarfieldLayer.jsx'

describe('createStarGeometry', () => {
  it('should create geometry with correct vertex count', () => {
    const geo = createStarGeometry(100, 1000)
    const positions = geo.getAttribute('position')
    expect(positions.count).toBe(100)
    expect(positions.array.length).toBe(300)
    geo.dispose()
  })

  it('should create color attribute with matching vertex count', () => {
    const geo = createStarGeometry(50, 500)
    const colors = geo.getAttribute('color')
    expect(colors.count).toBe(50)
    expect(colors.array.length).toBe(150)
    geo.dispose()
  })

  it('should place stars within radius range (0.9x to 1.0x)', () => {
    const radius = 1000
    const geo = createStarGeometry(200, radius)
    const pos = geo.getAttribute('position').array
    for (let i = 0; i < 200; i++) {
      const x = pos[i * 3]
      const y = pos[i * 3 + 1]
      const z = pos[i * 3 + 2]
      const dist = Math.sqrt(x * x + y * y + z * z)
      expect(dist).toBeGreaterThanOrEqual(radius * 0.89)
      expect(dist).toBeLessThanOrEqual(radius * 1.01)
    }
    geo.dispose()
  })

  it('should use custom colorFn when provided', () => {
    const redColor = () => [1, 0, 0]
    const geo = createStarGeometry(10, 100, redColor)
    const colors = geo.getAttribute('color').array
    for (let i = 0; i < 10; i++) {
      expect(colors[i * 3]).toBe(1)
      expect(colors[i * 3 + 1]).toBe(0)
      expect(colors[i * 3 + 2]).toBe(0)
    }
    geo.dispose()
  })

  it('should use default white-blue color when no colorFn provided', () => {
    const geo = createStarGeometry(50, 100)
    const colors = geo.getAttribute('color').array
    for (let i = 0; i < 50; i++) {
      // Blue channel always 1
      expect(colors[i * 3 + 2]).toBe(1)
      // Red and green in [0.7, 1.0] range (blueShift)
      expect(colors[i * 3]).toBeGreaterThanOrEqual(0.7)
      expect(colors[i * 3]).toBeLessThanOrEqual(1.0)
      expect(colors[i * 3 + 1]).toBeGreaterThanOrEqual(0.7)
      expect(colors[i * 3 + 1]).toBeLessThanOrEqual(1.0)
    }
    geo.dispose()
  })

  it('should have a computed bounding sphere', () => {
    const geo = createStarGeometry(10, 500)
    expect(geo.boundingSphere).not.toBeNull()
    expect(geo.boundingSphere.radius).toBeGreaterThan(0)
    geo.dispose()
  })
})
