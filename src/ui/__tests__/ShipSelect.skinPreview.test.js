import { describe, it, expect } from 'vitest'
import { getSkinForShip } from '../../entities/shipSkinDefs.js'
import { SHIPS } from '../../entities/shipDefs.js'

// Logic tests for the skin preview computation (Story 50.6, AC5/AC6/AC7)
// These cover the displaySkinId / displaySkinData expressions in ShipSelect.jsx:
//   const displaySkinId = hoveredSkinId ?? selectedSkinId
//   const displaySkinData = getSkinForShip(selectedShipId, displaySkinId)
//   backgroundColor: `${displaySkinData?.tintColor ?? selectedShip.colorTheme}18`
//   modelPath: displaySkinData?.modelPath ?? selectedShip.modelPath

function computePreview(selectedShipId, selectedSkinId, hoveredSkinId) {
  const selectedShip = SHIPS[selectedShipId]
  const displaySkinId = hoveredSkinId ?? selectedSkinId
  const displaySkinData = getSkinForShip(selectedShipId, displaySkinId)
  return {
    modelPath: displaySkinData?.modelPath ?? selectedShip.modelPath,
    bgColor: `${displaySkinData?.tintColor ?? selectedShip.colorTheme}18`,
  }
}

describe('ShipSelect — Skin Preview Logic (Story 50.6)', () => {
  // AC5: Hovering Eclipse swatch on Striker → SpaceshipB_3.glb + purple-pink bg
  it('AC5: hovering Eclipse on Striker shows SpaceshipB_3.glb with #cc44bb bg', () => {
    const { modelPath, bgColor } = computePreview('GLASS_CANNON', 'default', 'eclipse')
    expect(modelPath).toBe('./models/ships/SpaceshipB_3.glb')
    expect(bgColor).toBe('#cc44bb18')
  })

  // AC6: No hover → preview tracks selected skin
  it('AC6: no hover on Striker with default skin → base model SpaceshipB.glb', () => {
    const { modelPath, bgColor } = computePreview('GLASS_CANNON', 'default', null)
    expect(modelPath).toBe('./models/ships/SpaceshipB.glb')
    expect(bgColor).toBe('#cc550018')
  })

  it('AC6: no hover on Striker with eclipse selected → SpaceshipB_3.glb', () => {
    const { modelPath } = computePreview('GLASS_CANNON', 'eclipse', null)
    expect(modelPath).toBe('./models/ships/SpaceshipB_3.glb')
  })

  // AC7: Default skin has modelPath null → falls back to ship's base modelPath
  it('AC7: default skin on Striker (modelPath null) → ship.modelPath SpaceshipB.glb', () => {
    const skinData = getSkinForShip('GLASS_CANNON', 'default')
    expect(skinData.modelPath).toBeNull()
    const { modelPath } = computePreview('GLASS_CANNON', 'default', null)
    expect(modelPath).toBe('./models/ships/SpaceshipB.glb')
  })

  it('AC7: default skin on Fortress (modelPath null) → ship.modelPath SpaceshipC.glb', () => {
    const skinData = getSkinForShip('TANK', 'default')
    expect(skinData.modelPath).toBeNull()
    const { modelPath } = computePreview('TANK', 'default', null)
    expect(modelPath).toBe('./models/ships/SpaceshipC.glb')
  })

  it('AC7: default skin on Vanguard (modelPath null) → ship.modelPath Spaceship.glb', () => {
    const skinData = getSkinForShip('BALANCED', 'default')
    expect(skinData.modelPath).toBeNull()
    const { modelPath } = computePreview('BALANCED', 'default', null)
    expect(modelPath).toBe('./models/ships/Spaceship.glb')
  })

  // Stale hoveredSkinId after ship switch: getSkinForShip fallback keeps display coherent
  it('stale hoveredSkinId (eclipse) on Fortress → falls back to Fortress default skin', () => {
    // 'eclipse' does not exist on TANK; getSkinForShip returns skins[0] (Glacial)
    const stalePreview = computePreview('TANK', 'default', 'eclipse')
    // Background should use Glacial tintColor (#44aaff), NOT eclipse tintColor (#cc44bb)
    expect(stalePreview.bgColor).toBe('#44aaff18')
    expect(stalePreview.modelPath).toBe('./models/ships/SpaceshipC.glb')
  })
})
