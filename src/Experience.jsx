import { Perf } from 'r3f-perf'
import useGame from './stores/useGame.jsx'
import { useDebugMode } from './hooks/useDebugMode.jsx'
import { DebugControls } from './components/DebugControls.jsx'
import GameLoop from './GameLoop.jsx'
import GameplayScene from './scenes/GameplayScene.jsx'
import MenuScene from './scenes/MenuScene.jsx'
import BossScene from './scenes/BossScene.jsx'
import TunnelScene from './scenes/TunnelScene.jsx'

export default function Experience() {
  const phase = useGame((s) => s.phase)
  const prevCombatPhase = useGame((s) => s.prevCombatPhase)
  const isDebugMode = useDebugMode()

  // During levelUp, keep the scene from prevCombatPhase mounted
  const showGameplay = phase === 'gameplay' || phase === 'systemEntry' || phase === 'planetReward' || phase === 'gameOver' ||
    (phase === 'levelUp' && prevCombatPhase === 'gameplay')
  const showBoss = phase === 'boss' ||
    (phase === 'levelUp' && prevCombatPhase === 'boss')

  return (
    <>
      {isDebugMode && <Perf position="bottom-right" />}
      {isDebugMode && <DebugControls />}

      <GameLoop />

      {(phase === 'menu' || phase === 'shipSelect') && <MenuScene />}
      {showGameplay && <GameplayScene />}
      {showBoss && <BossScene />}
      {phase === 'tunnel' && <TunnelScene />}
      {/* GameplayScene stays mounted during gameOver (frozen, GameLoop paused) for visual continuity behind the overlay */}
    </>
  )
}
