import PlayerShip from '../renderers/PlayerShip.jsx'
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
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 20, 10]} intensity={1} />

      {/* Player */}
      <PlayerShip />

      {/* Temporary ground grid — will be replaced by space environment in Story 1.3 */}
      <gridHelper args={[400, 40, '#444444', '#222222']} />
    </>
  )
}
