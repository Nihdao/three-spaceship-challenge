import useGame from '../stores/useGame.jsx'
import LevelUpModal from './LevelUpModal.jsx'

export default function Interface() {
  const phase = useGame((s) => s.phase)

  return (
    <>
      {phase === 'levelUp' && <LevelUpModal />}
    </>
  )
}
