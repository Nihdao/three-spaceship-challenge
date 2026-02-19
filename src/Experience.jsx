import { Perf } from 'r3f-perf'
import useGame from './stores/useGame.jsx'
import { useDebugMode } from './hooks/useDebugMode.jsx'
import { DebugControls } from './components/DebugControls.jsx'
import GameLoop from './GameLoop.jsx'
import GameplayScene from './scenes/GameplayScene.jsx'
import MenuScene from './scenes/MenuScene.jsx'
import TunnelScene from './scenes/TunnelScene.jsx'
// Story 17.4: BossScene no longer used — boss fight happens in GameplayScene

export default function Experience() {
  const phase = useGame((s) => s.phase)
  const prevCombatPhase = useGame((s) => s.prevCombatPhase)
  const isDebugMode = useDebugMode()

  // Story 17.4: Boss fight now happens during 'gameplay' phase
  // During levelUp, keep the scene from prevCombatPhase mounted
  const showGameplay = phase === 'gameplay' || phase === 'systemEntry' || phase === 'planetReward' || phase === 'gameOver' ||
    (phase === 'levelUp' && (prevCombatPhase === 'gameplay' || prevCombatPhase === 'boss'))

  return (
    <>
      {isDebugMode && <Perf position="bottom-right" />}
      {isDebugMode && <DebugControls />}

      <GameLoop />

      {(phase === 'menu' || phase === 'shipSelect' || phase === 'galaxyChoice') && <MenuScene />}
      {showGameplay && <GameplayScene />}
      {phase === 'tunnel' && <TunnelScene />}
      {/* GameplayScene stays mounted during gameOver (frozen, GameLoop paused) for visual continuity behind the overlay */}
    </>
  )
}
