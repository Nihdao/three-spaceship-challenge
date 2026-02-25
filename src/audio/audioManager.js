import { Howl, Howler } from 'howler'

/**
 * Audio Manager - Graceful Error Handling (Story 26.5)
 *
 * This module handles missing audio files gracefully:
 * - SFX: onloaderror logs warnings, playSFX() returns early if sound not loaded
 * - Music: onloaderror logs warnings, prevents play()/fade() on failed loads
 *
 * Expected Missing Placeholders (as of Story 26.5):
 * - boss-theme.mp3 → fallback: gameplay music continues during boss phase
 * - level-up.mp3 → fallback: silent (no level-up sound)
 * - boss-attack.mp3, boss-hit.mp3, hp-recover.mp3 → fallback: silent
 *
 * Actual files (.wav) vs. Manifest paths (.mp3):
 * - Many SFX files in public/audio/sfx/ are .wav but assetManifest.js references .mp3
 * - This was fixed in Story 26.4 (Complete SFX Placeholder Mapping)
 * - Howler.js handles this gracefully: onloaderror warns, game continues
 */

// Volume categories per UX audio patterns (Story 28.3: rebalanced for SFX clarity)
// music 35%, sfx actions 80%, sfx feedback+ 100%, sfx feedback- 120%, ui 70%, events 150%
// Note: Howler.js clamps individual sound volume to [0, 1]. Values above 1.0
// (sfxFeedbackNegative, events) are intentional: they act as priority weights
// that boost these SFX relative to others when the player reduces sfxVolume
// in Options (e.g. sfxVolume=0.6 → events plays at 0.9 vs sfxAction at 0.48).
// At default sfxVolume=1.0, these values clamp to 1.0 (max).
export const VOLUME_CATEGORIES = {
  music: 0.35,              // down from 1.0 — gameplay music no longer drowns SFX
  sfxAction: 0.8,           // unchanged — weapon SFX level kept as-is
  sfxFeedbackPositive: 1.0, // up from 0.9 — explosions, scan-complete more audible
  sfxFeedbackNegative: 1.2, // up from 1.0 — damage-taken more urgent (priority weight, see note above)
  ui: 0.7,                  // up from 0.5 — button sounds more audible
  events: 1.5,              // up from 1.2 — boss-defeat, game-over-impact more impactful (priority weight)
}

// SFX key → volume category mapping
const SFX_CATEGORY_MAP = {
  'laser-fire': 'sfxAction',
  'explosion': 'sfxFeedbackPositive',
  'level-up': 'sfxFeedbackPositive',
  'damage-taken': 'sfxFeedbackNegative',
  'button-hover': 'ui',
  'button-click': 'ui',
  'game-over-impact': 'events',
  'dash-whoosh': 'sfxAction',
  'dash-ready': 'ui',
  'scan-start': 'ui',
  'scan-complete': 'sfxFeedbackPositive',
  'wormhole-spawn': 'sfxFeedbackPositive',
  'wormhole-activate': 'sfxFeedbackPositive',
  'boss-attack': 'sfxAction',
  'boss-hit': 'sfxFeedbackPositive',
  'boss-phase': 'events',
  'boss-defeat': 'events',
  'upgrade-purchase': 'sfxFeedbackPositive',
  'dilemma-accept': 'sfxFeedbackNegative',
  'dilemma-refuse': 'ui',
  'hp-recover': 'sfxFeedbackPositive',
  'high-score': 'events',
  // Story 11.3: New weapon SFX entries
  'railgun-fire': 'sfxAction',
  'trishot-fire': 'sfxAction',
  'shotgun-fire': 'sfxAction',
  'satellite-fire': 'sfxAction',
  'drone-fire': 'sfxAction',
  'beam-fire': 'sfxAction',
  'explosive-fire': 'sfxAction',
  // Story 19.1: Rare XP gem pickup SFX
  'xp_rare_pickup': 'sfxFeedbackPositive',
  // Story 19.3: Fragment gem pickup SFX
  'fragment_pickup': 'sfxFeedbackPositive',
  // Story 44.5: Rare item pickup SFX
  'rare-item-collect': 'sfxFeedbackPositive',
  // Story 30.1: Companion dialogue notification
  'ui-message': 'ui',
}

let currentMusic = null
let currentGameplayTrack = null // Store last selected gameplay track for debugging
let masterVolume = 1.0
let musicVolume = VOLUME_CATEGORIES.music
let sfxVolume = 1.0 // master SFX multiplier
const sfxPool = {} // { key: Howl instance }
let fadingOutTracks = []
let scanLoopSound = null // Separate from sfxPool — special looping sound

// Force-stop any tracks still fading out to prevent audio overlap
function cleanupFadingTracks() {
  for (let i = 0; i < fadingOutTracks.length; i++) {
    fadingOutTracks[i].stop()
    fadingOutTracks[i].unload()
  }
  fadingOutTracks = []
}

export function playMusic(src, options = {}) {
  cleanupFadingTracks()
  stopMusic()
  currentMusic = new Howl({
    src: [src],
    loop: true,
    volume: options.volume ?? musicVolume,
    onloaderror: (id, err) => {
      console.warn(`Audio: failed to load music "${src}":`, err)
      currentMusic = null // Defensive: prevent play() on failed Howl
    },
    ...options,
  })
  // Defensive: check if Howl creation succeeded before calling play()
  if (currentMusic) {
    try {
      currentMusic.play()
    } catch (err) {
      console.warn(`Audio: failed to play music "${src}":`, err)
    }
  }
}

export function stopMusic() {
  if (currentMusic) {
    currentMusic.stop()
    currentMusic.unload()
    currentMusic = null
  }
}

export function fadeOutMusic(duration = 500) {
  if (!currentMusic) return
  const old = currentMusic
  currentMusic = null
  old.fade(old.volume(), 0, duration)
  fadingOutTracks.push(old)
  old.once('fade', () => {
    old.stop()
    old.unload()
    const idx = fadingOutTracks.indexOf(old)
    if (idx !== -1) fadingOutTracks.splice(idx, 1)
  })
}

export function crossfadeMusic(newSrc, duration = 1000, options = {}) {
  cleanupFadingTracks()
  const oldMusic = currentMusic
  if (oldMusic) {
    oldMusic.fade(oldMusic.volume(), 0, duration)
    fadingOutTracks.push(oldMusic)
    oldMusic.once('fade', () => {
      oldMusic.stop()
      oldMusic.unload()
      const idx = fadingOutTracks.indexOf(oldMusic)
      if (idx !== -1) fadingOutTracks.splice(idx, 1)
    })
  }
  currentMusic = new Howl({
    src: [newSrc],
    loop: true,
    volume: 0,
    onloaderror: (id, err) => {
      console.warn(`Audio: failed to load music "${newSrc}":`, err)
      currentMusic = null // Defensive: prevent fade() on failed Howl
    },
    ...options,
  })
  // Defensive: check if Howl creation succeeded before calling play()/fade()
  if (currentMusic) {
    try {
      currentMusic.play()
      currentMusic.fade(0, options.volume ?? musicVolume, duration)
    } catch (err) {
      console.warn(`Audio: failed to play/fade music "${newSrc}":`, err)
    }
  }
}

export function setMusicVolume(vol) {
  musicVolume = vol
  if (currentMusic) {
    currentMusic.volume(vol)
  }
}

export function setSFXVolume(vol) {
  sfxVolume = vol
  // Propagate new master volume to all preloaded sounds
  for (const key in sfxPool) {
    const category = SFX_CATEGORY_MAP[key] || 'sfxAction'
    const categoryVol = VOLUME_CATEGORIES[category] ?? 1.0
    sfxPool[key].volume(categoryVol * sfxVolume)
  }
}

export function preloadSounds(soundMap) {
  for (const [key, src] of Object.entries(soundMap)) {
    const category = SFX_CATEGORY_MAP[key] || 'sfxAction'
    const categoryVol = VOLUME_CATEGORIES[category] ?? 1.0
    sfxPool[key] = new Howl({
      src: [src],
      volume: categoryVol * sfxVolume,
      preload: true,
      onloaderror: (id, err) => {
        console.warn(`Audio: failed to load "${key}":`, err)
      },
    })
  }
}

export function playSFX(key) {
  const sound = sfxPool[key]
  if (!sound) return // Graceful: no sound loaded for this key

  // Recalculate volume at play time to reflect any setSFXVolume changes
  const category = SFX_CATEGORY_MAP[key] || 'sfxAction'
  const categoryVol = VOLUME_CATEGORIES[category] ?? 1.0
  sound.volume(categoryVol * sfxVolume)

  // Duck music for events category (UX spec: "events 120%, ducked music")
  if (category === 'events' && currentMusic) {
    const duckedTrack = currentMusic
    duckedTrack.volume(musicVolume * 0.3)
    setTimeout(() => {
      if (currentMusic === duckedTrack) duckedTrack.volume(musicVolume)
    }, 1500)
  }

  sound.play()
}

export function stopAllSFX() {
  for (const key in sfxPool) {
    sfxPool[key].stop()
  }
}

export function setMasterVolume(vol) {
  masterVolume = vol
  Howler.volume(vol)
}

export function getMasterVolume() {
  return masterVolume
}

export function getMusicVolume() {
  return musicVolume
}

export function getSfxVolume() {
  return sfxVolume
}

export function loadAudioSettings() {
  try {
    const raw = localStorage.getItem('audioSettings')
    if (!raw) return
    const saved = JSON.parse(raw)
    if (typeof saved.masterVolume === 'number') {
      masterVolume = Math.max(0, Math.min(1, saved.masterVolume / 100))
      Howler.volume(masterVolume)
    }
    if (typeof saved.musicVolume === 'number') {
      musicVolume = Math.max(0, Math.min(1, saved.musicVolume / 100))
      if (currentMusic) currentMusic.volume(musicVolume)
    }
    if (typeof saved.sfxVolume === 'number') {
      sfxVolume = Math.max(0, Math.min(1, saved.sfxVolume / 100))
    }
  } catch {
    // Invalid JSON or localStorage unavailable — use defaults
  }
}

export function isUnlocked() {
  try {
    return Howler.ctx?.state === 'running'
  } catch {
    return false
  }
}

// Resume suspended AudioContext after first user interaction (browser autoplay policy)
export function unlockAudioContext() {
  try {
    if (Howler.ctx && Howler.ctx.state === 'suspended') {
      Howler.ctx.resume()
    }
  } catch {
    // AudioContext not available
  }
}

// Story 26.1: Select random gameplay music from array of tracks
export function selectRandomGameplayMusic(tracks) {
  if (!Array.isArray(tracks)) {
    console.warn('selectRandomGameplayMusic: tracks must be an array, got', typeof tracks)
    return null
  }
  if (tracks.length === 0) {
    console.warn('selectRandomGameplayMusic: tracks array is empty')
    return null
  }
  const randomIndex = Math.floor(Math.random() * tracks.length)
  currentGameplayTrack = tracks[randomIndex]
  return currentGameplayTrack
}

export function getCurrentGameplayTrack() {
  return currentGameplayTrack
}

// Story 26.3: Scan sound looping system
export function playScanLoop() {
  if (scanLoopSound) {
    scanLoopSound.stop()
    scanLoopSound.unload()
  }
  const category = SFX_CATEGORY_MAP['scan-start'] || 'ui'
  const categoryVol = VOLUME_CATEGORIES[category] ?? 1.0
  scanLoopSound = new Howl({
    src: ['audio/sfx/scan-start.wav'],
    loop: true,
    volume: categoryVol * sfxVolume,
    onloaderror: (id, err) => {
      console.warn('Audio: failed to load scan loop "scan-start":', err)
    },
  })
  try {
    scanLoopSound.play()
  } catch (err) {
    console.warn('Audio: failed to play scan loop:', err)
  }
}

export function stopScanLoop() {
  if (scanLoopSound) {
    scanLoopSound.stop()
    scanLoopSound.unload()
    scanLoopSound = null
  }
}
