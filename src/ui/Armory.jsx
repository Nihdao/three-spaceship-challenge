import { useState, useEffect } from 'react'
import { WEAPONS } from '../entities/weaponDefs.js'
import { BOONS } from '../entities/boonDefs.js'
import useArmory from '../stores/useArmory.jsx'
import { playSFX } from '../audio/audioManager.js'

export const ARMORY_TABS = ['Weapons', 'Boons']

/**
 * Returns static tab/data info for the Armory screen.
 * Exported for testing.
 */
export function getArmoryTabData() {
  return {
    tabs: ARMORY_TABS,
    weaponIds: Object.keys(WEAPONS).filter(id => (WEAPONS[id].rarityWeight ?? 1) !== 0),
    boonIds: Object.keys(BOONS),
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

function getBadgeText(id) {
  const parts = id.split('_')
  if (parts.length === 1) return id.slice(0, 2)
  return parts.map(word => word[0]).join('').slice(0, 2)
}

function WeaponCard({ weaponId }) {
  const def = WEAPONS[weaponId]
  const isDiscovered = useArmory(s => s.isDiscovered('weapons', weaponId))

  return (
    <div
      className="p-3 select-none"
      style={{ background: 'var(--rs-bg-raised)', border: '1px solid var(--rs-border)', clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)' }}
    >
      <div className="flex items-start gap-2">
        {isDiscovered ? (
          <div style={{
            width: 28,
            height: 28,
            background: 'var(--rs-bg-raised)',
            border: '1px solid var(--rs-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Space Mono', monospace",
            fontWeight: 600,
            fontSize: 10,
            color: 'var(--rs-orange)',
            flexShrink: 0,
            userSelect: 'none',
            letterSpacing: '-0.02em',
          }}>
            {getBadgeText(weaponId)}
          </div>
        ) : (
          <div style={{
            width: 28,
            height: 28,
            background: 'var(--rs-bg-raised)',
            border: '1px solid var(--rs-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Space Mono', monospace",
            fontWeight: 600,
            fontSize: 10,
            color: 'var(--rs-text-dim, var(--rs-text-muted))',
            flexShrink: 0,
            userSelect: 'none',
            opacity: 0.5,
          }}>
            ??
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold truncate" style={{ color: isDiscovered ? 'var(--rs-text)' : 'var(--rs-text-muted)' }}>
            {isDiscovered ? def.name : '???'}
          </h3>
          <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--rs-text-muted)' }}>
            {isDiscovered ? def.description : 'Undiscovered weapon'}
          </p>
          {isDiscovered && (
            <span className="text-xs mt-1 block" style={{ color: 'var(--rs-teal)' }}>✓ Discovered</span>
          )}
        </div>
      </div>
    </div>
  )
}

function BoonCard({ boonId }) {
  const def = BOONS[boonId]
  const isDiscovered = useArmory(s => s.isDiscovered('boons', boonId))
  const description = def.tiers[0].description

  return (
    <div
      className="p-3 select-none"
      style={{ background: 'var(--rs-bg-raised)', border: '1px solid var(--rs-border)', clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)' }}
    >
      <div className="flex items-start gap-2">
        {isDiscovered ? (
          <div style={{
            width: 28,
            height: 28,
            background: 'var(--rs-bg-raised)',
            border: '1px solid var(--rs-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Space Mono', monospace",
            fontWeight: 600,
            fontSize: 10,
            color: 'var(--rs-violet)',
            flexShrink: 0,
            userSelect: 'none',
            letterSpacing: '-0.02em',
          }}>
            {getBadgeText(boonId)}
          </div>
        ) : (
          <div style={{
            width: 28,
            height: 28,
            background: 'var(--rs-bg-raised)',
            border: '1px solid var(--rs-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Space Mono', monospace",
            fontWeight: 600,
            fontSize: 10,
            color: 'var(--rs-text-dim, var(--rs-text-muted))',
            flexShrink: 0,
            userSelect: 'none',
            opacity: 0.5,
          }}>
            ??
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold truncate" style={{ color: isDiscovered ? 'var(--rs-text)' : 'var(--rs-text-muted)' }}>
            {isDiscovered ? def.name : '???'}
          </h3>
          <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--rs-text-muted)' }}>
            {isDiscovered ? description : 'Undiscovered boon'}
          </p>
          {isDiscovered && (
            <span className="text-xs mt-1 block" style={{ color: 'var(--rs-violet)' }}>✓ Discovered</span>
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
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center animate-fade-in" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
      <div style={{
        background: 'var(--rs-bg-surface)',
        border: '1px solid var(--rs-border)',
        clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)',
        width: 'clamp(640px, 70vw, 960px)',
        maxHeight: '85vh',
        overflowY: 'auto',
        position: 'relative',
      }}>

        {/* Zone header — titre + tabs, séparée du contenu par une ligne */}
        <div style={{ borderBottom: '1px solid var(--rs-border)' }}>

          {/* Ligne 1 : bouton BACK + titre + compteur */}
          <div className="flex items-center justify-between" style={{ padding: '1.5rem 2rem 0.75rem' }}>
            <button
              onClick={() => { playSFX('button-click'); onClose() }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--rs-text-muted, #888)',
                fontSize: '0.875rem',
                letterSpacing: '0.1em',
                cursor: 'pointer',
                padding: '0.25rem 0.5rem',
                userSelect: 'none',
              }}
            >
              &larr; BACK
            </button>

            <h1
              className="select-none"
              style={{
                fontFamily: 'Bebas Neue, sans-serif',
                fontSize: '1.5rem',
                letterSpacing: '0.15em',
                color: 'var(--rs-text, #e8e6f0)',
              }}
            >
              ARMORY
            </h1>

            <div
              className="text-xs select-none"
              style={{ color: 'var(--rs-text-muted, #888)', minWidth: '6rem', textAlign: 'right' }}
            >
              {totalWeapons} WEAPONS · {totalBoons} BOONS
            </div>
          </div>

          {/* Ligne 2 : tabs intégrées */}
          <div style={{ display: 'flex', paddingLeft: '2rem' }}>
            {ARMORY_TABS.map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); playSFX('button-hover') }}
                style={{
                  padding: '0.5rem 1.25rem',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tab
                    ? '2px solid var(--rs-orange)'
                    : '2px solid transparent',
                  color: activeTab === tab
                    ? 'var(--rs-text, #e8e6f0)'
                    : 'var(--rs-text-muted, #888)',
                  fontFamily: 'inherit',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s, color 0.15s',
                  outline: 'none',
                  userSelect: 'none',
                }}
              >
                {tab}
              </button>
            ))}
          </div>

        </div>

        {/* Contenu des onglets */}
        <div style={{ padding: '1.5rem 2rem' }}>
          {activeTab === 'Weapons' && <WeaponsGrid />}
          {activeTab === 'Boons' && <BoonsGrid />}
        </div>

        {/* Keyboard hint */}
        <p
          className="text-xs text-center select-none"
          style={{ color: 'var(--rs-text-muted, #888)', opacity: 0.3, padding: '0 2rem 1rem' }}
        >
          ESC to close · TAB to switch tabs
        </p>

      </div>
    </div>
  )
}
