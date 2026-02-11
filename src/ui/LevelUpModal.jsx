import { useEffect, useState, useCallback } from 'react'
import useGame from '../stores/useGame.jsx'
import usePlayer from '../stores/usePlayer.jsx'
import useWeapons from '../stores/useWeapons.jsx'
import useBoons from '../stores/useBoons.jsx'
import { generateChoices } from '../systems/progressionSystem.js'
import { playSFX } from '../audio/audioManager.js'

export default function LevelUpModal() {
  const [choices, setChoices] = useState([])

  // Generate choices on mount
  useEffect(() => {
    const level = usePlayer.getState().currentLevel
    const equippedWeapons = useWeapons.getState().activeWeapons.map(w => ({ weaponId: w.weaponId, level: w.level }))
    const equippedBoonIds = useBoons.getState().activeBoons.map(b => b.boonId)
    const equippedBoons = useBoons.getState().getEquippedBoons()
    setChoices(generateChoices(level, equippedWeapons, equippedBoonIds, equippedBoons))
  }, [])

  const applyChoice = useCallback((choice) => {
    playSFX('button-click')
    if (choice.type === 'weapon_upgrade') {
      useWeapons.getState().upgradeWeapon(choice.id)
    } else if (choice.type === 'new_weapon') {
      useWeapons.getState().addWeapon(choice.id)
    } else if (choice.type === 'new_boon') {
      useBoons.getState().addBoon(choice.id)
    } else if (choice.type === 'boon_upgrade') {
      useBoons.getState().upgradeBoon(choice.id)
    }
    useGame.getState().resumeGameplay()
  }, [])

  // Keyboard selection
  useEffect(() => {
    const handler = (e) => {
      const key = e.code
      let index = -1
      if (key === 'Digit1' || key === 'Numpad1') index = 0
      else if (key === 'Digit2' || key === 'Numpad2') index = 1
      else if (key === 'Digit3' || key === 'Numpad3') index = 2
      else if (key === 'Digit4' || key === 'Numpad4') index = 3

      if (index >= 0 && index < choices.length) {
        applyChoice(choices[index])
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [choices, applyChoice])

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 font-game">
      <h1 className="text-3xl font-bold tracking-widest text-game-text mb-8 animate-fade-in">
        LEVEL UP!
      </h1>
      <div className="flex gap-4">
        {choices.map((choice, i) => (
          <div
            key={`${choice.type}_${choice.id}`}
            className="w-52 p-4 bg-game-bg-medium border border-game-border rounded-lg
                       hover:border-game-accent cursor-pointer transition-all animate-fade-in"
            style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'backwards' }}
            onClick={() => applyChoice(choice)}
          >
            <span
              className={
                choice.level
                  ? 'text-game-text-muted text-xs'
                  : 'text-game-accent text-xs font-bold'
              }
            >
              {choice.level ? `Lvl ${choice.level}` : 'NEW'}
            </span>
            <h3 className="text-game-text font-semibold mt-1">{choice.name}</h3>
            {choice.statPreview ? (
              <p className="text-game-text-muted text-sm mt-1">{choice.statPreview}</p>
            ) : (
              <p className="text-game-text-muted text-sm mt-1">{choice.description}</p>
            )}
            <span className="text-game-text-muted text-xs mt-2 block">[{i + 1}]</span>
          </div>
        ))}
      </div>
    </div>
  )
}
