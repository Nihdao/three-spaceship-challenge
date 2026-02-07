import PlayerShip from '../renderers/PlayerShip.jsx'
import EnemyRenderer from '../renderers/EnemyRenderer.jsx'
import EnvironmentRenderer from '../renderers/EnvironmentRenderer.jsx'
import { usePlayerCamera } from '../hooks/usePlayerCamera.jsx'
import { useHybridControls } from '../hooks/useHybridControls.jsx'

function CameraRig() {
  usePlayerCamera()
  return null
}

function Controls() {
  useHybridControls()
  return null
}

export default function GameplayScene() {
  return (
    <>
      <Controls />
      <CameraRig />

      {/* Lighting */}
      <ambientLight intensity={0.35} />
      <directionalLight position={[10, 20, 10]} intensity={1} />

      {/* Player */}
      <PlayerShip />

      {/* Enemies */}
      <EnemyRenderer />

      {/* Space environment */}
      <EnvironmentRenderer />
    </>
  )
}
