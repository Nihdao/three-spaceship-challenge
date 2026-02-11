import { useEffect } from 'react'
import useGame from '../stores/useGame.jsx'
import useAudio from '../hooks/useAudio.jsx'
import MainMenu from './MainMenu.jsx'
import LevelUpModal from './LevelUpModal.jsx'
import HUD from './HUD.jsx'
import GameOverScreen from './GameOverScreen.jsx'
import VictoryScreen from './VictoryScreen.jsx'

export default function Interface() {
  const phase = useGame((s) => s.phase)
  useAudio()

  // Debug-only: press V during gameplay to trigger victory screen (temporary — replaced by real victory condition in Epic 6)
  useEffect(() => {
    if (!window.location.hash.includes('#debug')) return
    if (phase !== 'gameplay') return
    const handler = (e) => {
      if (e.code === 'KeyV') useGame.getState().triggerVictory()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [phase])

  return (
    <>
      {phase === 'menu' && <MainMenu />}
      {(phase === 'gameplay' || phase === 'levelUp') && <HUD />}
      {phase === 'levelUp' && <LevelUpModal />}
      {phase === 'gameOver' && <GameOverScreen />}
      {phase === 'victory' && <VictoryScreen />}
    </>
  )
}
