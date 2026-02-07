import { Html } from '@react-three/drei'
import useGame from '../stores/useGame.jsx'

// Temporary start screen — will be replaced by proper menu in Story 4.1
export default function MenuScene() {
  const startGameplay = useGame((s) => s.startGameplay)

  return (
    <Html fullscreen>
      <div
        onClick={startGameplay}
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          background: '#000',
          color: '#888',
          fontSize: '24px',
          fontFamily: 'monospace',
        }}
      >
        Click to Start
      </div>
    </Html>
  )
}
