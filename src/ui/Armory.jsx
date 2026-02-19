import { useState, useEffect } from 'react'
import { WEAPONS } from '../entities/weaponDefs.js'
import { BOONS } from '../entities/boonDefs.js'
import useArmory from '../stores/useArmory.jsx'
import { playSFX } from '../audio/audioManager.js'

export const ARMORY_TABS = ['Weapons', 'Boons', 'Items']

/**
 * Returns static tab/data info for the Armory screen.
 * Exported for testing.
 */
export function getArmoryTabData() {
  return {
    tabs: ARMORY_TABS,
    weaponIds: Object.keys(WEAPONS),
    boonIds: Object.keys(BOONS),
    itemsComingSoon: true,
  }
}

// Weapon emoji icons by weapon ID
const WEAPON_ICONS = {
  LASER_FRONT: '⚡',
  SPREAD_SHOT: '💥',
  MISSILE_HOMING: '🚀',
  PLASMA_BOLT: '🔮',
  RAILGUN: '⚙️',
  TRI_SHOT: '🌟',
  SHOTGUN: '🔫',
  SATELLITE: '🛸',
  DRONE: '🤖',
  BEAM: '☄️',
  EXPLOSIVE_ROUND: '💣',
}

// Boon emoji icons by boon ID
const BOON_ICONS = {
  DAMAGE_AMP: '⚔️',
  SPEED_BOOST: '💨',
  COOLDOWN_REDUCTION: '⏱️',
  CRIT_CHANCE: '🎯',
  CRIT_MULTIPLIER: '💥',
  PROJECTILE_SPEED: '🏹',
  MAX_HP_UP: '🛡️',
  HP_REGEN: '💚',
  DAMAGE_REDUCTION: '🔰',
  XP_GAIN: '🧠',
  FRAGMENT_GAIN: '💎',
  PICKUP_RADIUS: '🧲',
}

function WeaponCard({ weaponId }) {
  const def = WEAPONS[weaponId]
  const isDiscovered = useArmory(s => s.isDiscovered('weapons', weaponId))
  const icon = WEAPON_ICONS[weaponId] || '🔫'

  return (
    <div className="border rounded-lg p-3 bg-black/40 backdrop-blur-sm border-game-border select-none">
      <div className="flex items-start gap-2">
        <span className={`text-2xl flex-shrink-0 ${!isDiscovered ? 'opacity-30' : ''}`}>
          {isDiscovered ? icon : '❓'}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className={`text-sm font-semibold truncate ${isDiscovered ? 'text-game-text' : 'text-game-text-muted'}`}>
            {isDiscovered ? def.name : '???'}
          </h3>
          <p className="text-xs text-game-text-muted mt-0.5 line-clamp-2">
            {isDiscovered ? def.description : 'Undiscovered weapon'}
          </p>
          {isDiscovered && (
            <span className="text-xs text-[#00ffcc] mt-1 block">✓ Discovered</span>
          )}
        </div>
      </div>
    </div>
  )
}

function BoonCard({ boonId }) {
  const def = BOONS[boonId]
  const isDiscovered = useArmory(s => s.isDiscovered('boons', boonId))
  const icon = BOON_ICONS[boonId] || '✨'
  const description = def.tiers[0].description

  return (
    <div className="border rounded-lg p-3 bg-black/40 backdrop-blur-sm border-game-border select-none">
      <div className="flex items-start gap-2">
        <span className={`text-2xl flex-shrink-0 ${!isDiscovered ? 'opacity-30' : ''}`}>
          {isDiscovered ? icon : '❓'}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className={`text-sm font-semibold truncate ${isDiscovered ? 'text-game-text' : 'text-game-text-muted'}`}>
            {isDiscovered ? def.name : '???'}
          </h3>
          <p className="text-xs text-game-text-muted mt-0.5 line-clamp-2">
            {isDiscovered ? description : 'Undiscovered boon'}
          </p>
          {isDiscovered && (
            <span className="text-xs text-[#cc66ff] mt-1 block">✓ Discovered</span>
          )}
        </div>
      </div>
    </div>
  )
}

function WeaponsGrid() {
  const weaponIds = Object.keys(WEAPONS)
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {weaponIds.map(weaponId => (
        <WeaponCard key={weaponId} weaponId={weaponId} />
      ))}
    </div>
  )
}

function BoonsGrid() {
  const boonIds = Object.keys(BOONS)
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {boonIds.map(boonId => (
        <BoonCard key={boonId} boonId={boonId} />
      ))}
    </div>
  )
}

function ItemsPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center py-16 select-none">
      <span className="text-4xl mb-4 opacity-30">📦</span>
      <p className="text-xl font-bold tracking-widest text-game-text-muted opacity-40">
        COMING SOON
      </p>
      <p className="text-sm text-game-text-muted opacity-30 mt-2">
        Items will be available in a future update
      </p>
    </div>
  )
}

/**
 * Returns display data for a weapon card given discovery state.
 * Exported for testing.
 */
export function getWeaponCardDisplayData(weaponId, isDiscovered) {
  const def = WEAPONS[weaponId]
  const icon = WEAPON_ICONS[weaponId] || '🔫'
  return {
    name: isDiscovered ? def.name : '???',
    description: isDiscovered ? def.description : 'Undiscovered weapon',
    icon: isDiscovered ? icon : '❓',
    isDiscovered,
  }
}

/**
 * Returns display data for a boon card given discovery state.
 * Exported for testing.
 */
export function getBoonCardDisplayData(boonId, isDiscovered) {
  const def = BOONS[boonId]
  const icon = BOON_ICONS[boonId] || '✨'
  return {
    name: isDiscovered ? def.name : '???',
    description: isDiscovered ? def.tiers[0].description : 'Undiscovered boon',
    icon: isDiscovered ? icon : '❓',
    isDiscovered,
  }
}

/**
 * Returns the next tab after cycling from currentTab.
 * Exported for testing.
 */
export function computeNextTab(currentTab, shiftKey = false) {
  const currentIdx = ARMORY_TABS.indexOf(currentTab)
  const nextIdx = (currentIdx + (shiftKey ? -1 + ARMORY_TABS.length : 1)) % ARMORY_TABS.length
  return ARMORY_TABS[nextIdx]
}

export default function Armory({ onClose }) {
  const [activeTab, setActiveTab] = useState('Weapons')

  // Keyboard: Escape to close, Tab to navigate tabs
  useEffect(() => {
    const handler = (e) => {
      if (e.code === 'Escape') {
        e.preventDefault()
        playSFX('button-click')
        onClose()
      } else if (e.code === 'Tab') {
        e.preventDefault()
        const currentIdx = ARMORY_TABS.indexOf(activeTab)
        const nextIdx = (currentIdx + (e.shiftKey ? -1 + ARMORY_TABS.length : 1)) % ARMORY_TABS.length
        setActiveTab(ARMORY_TABS[nextIdx])
        playSFX('button-hover')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, activeTab])

  const totalWeapons = Object.keys(WEAPONS).length
  const totalBoons = Object.keys(BOONS).length

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center font-game animate-fade-in">
      {/* Content — no backdrop, 3D background visible directly */}
      <div className="relative w-full max-w-4xl px-6 py-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => { playSFX('button-click'); onClose() }}
            className="px-4 py-2 text-sm tracking-widest text-game-text-muted hover:text-game-text transition-colors select-none cursor-pointer"
          >
            &larr; BACK
          </button>

          <h1
            className="text-2xl font-bold tracking-[0.15em] text-game-text select-none"
            style={{ textShadow: '0 0 30px rgba(204, 102, 255, 0.3)' }}
          >
            ARMORY
          </h1>

          <div className="text-xs text-game-text-muted select-none w-24 text-right">
            {totalWeapons} WEAPONS · {totalBoons} BOONS
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex gap-2 mb-6">
          {ARMORY_TABS.map(tab => (
            <button
              key={tab}
              onClick={tab !== 'Items' ? () => { setActiveTab(tab); playSFX('button-hover') } : undefined}
              className={`
                px-5 py-2 text-sm font-semibold tracking-wider rounded border transition-all duration-150
                outline-none select-none
                ${tab === 'Items'
                  ? 'border-game-border/40 text-game-text-muted/40 cursor-not-allowed opacity-50'
                  : activeTab === tab
                    ? 'border-game-accent text-game-text bg-game-accent/10 cursor-pointer'
                    : 'border-game-border text-game-text-muted hover:border-game-accent hover:text-game-text cursor-pointer'
                }
              `}
              disabled={tab === 'Items'}
            >
              {tab}
              {tab === 'Items' && (
                <span className="ml-1 text-xs opacity-60">soon</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'Weapons' && <WeaponsGrid />}
        {activeTab === 'Boons' && <BoonsGrid />}
        {activeTab === 'Items' && <ItemsPlaceholder />}

        {/* Keyboard hint */}
        <p className="text-game-text-muted text-xs mt-6 opacity-30 text-center select-none">
          ESC to close · TAB to switch tabs
        </p>
      </div>
    </div>
  )
}
