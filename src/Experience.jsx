import { Perf } from 'r3f-perf'
import useGame from './stores/useGame.jsx'
import { useDebugMode } from './hooks/useDebugMode.jsx'
import GameLoop from './GameLoop.jsx'
import GameplayScene from './scenes/GameplayScene.jsx'
import MenuScene from './scenes/MenuScene.jsx'
import BossScene from './scenes/BossScene.jsx'
import TunnelScene from './scenes/TunnelScene.jsx'

export default function Experience() {
  const phase = useGame((s) => s.phase)
  const isDebugMode = useDebugMode()

  return (
    <>
      {isDebugMode && <Perf position="bottom-right" />}

      <GameLoop />

      {phase === 'menu' && <MenuScene />}
      {(phase === 'gameplay' || phase === 'levelUp' || phase === 'gameOver') && <GameplayScene />}
      {phase === 'boss' && <BossScene />}
      {phase === 'tunnel' && <TunnelScene />}
      {/* GameplayScene stays mounted during gameOver (frozen, GameLoop paused) for visual continuity behind the overlay */}
    </>
  )
}
