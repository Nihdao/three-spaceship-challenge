import * as THREE from 'three'

// Soft circular star texture (lazy-initialized to avoid top-level document access in Node/test environments)
let _starTexture = null

export function getStarTexture() {
  if (!_starTexture) {
    const size = 64
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    const half = size / 2
    const gradient = ctx.createRadialGradient(half, half, 0, half, half, half)
    gradient.addColorStop(0, 'rgba(255,255,255,1)')
    gradient.addColorStop(0.3, 'rgba(255,255,255,0.8)')
    gradient.addColorStop(0.7, 'rgba(255,255,255,0.15)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)
    _starTexture = new THREE.CanvasTexture(canvas)
  }
  return _starTexture
}
