import useGame from '../stores/useGame.jsx'
import MainMenu from './MainMenu.jsx'
import LevelUpModal from './LevelUpModal.jsx'

export default function Interface() {
  const phase = useGame((s) => s.phase)

  return (
    <>
      {phase === 'menu' && <MainMenu />}
      {phase === 'levelUp' && <LevelUpModal />}
    </>
  )
}
