import { Howl, Howler } from 'howler'

// Volume categories per UX audio patterns
// music 100%, sfx actions 80%, sfx feedback+ 90%, sfx feedback- 100%, ui 50%, events 120%
export const VOLUME_CATEGORIES = {
  music: 1.0,
  sfxAction: 0.8,
  sfxFeedbackPositive: 0.9,
  sfxFeedbackNegative: 1.0,
  ui: 0.5,
  events: 1.2,
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
}

let currentMusic = null
let musicVolume = VOLUME_CATEGORIES.music
let sfxVolume = 1.0 // master SFX multiplier
const sfxPool = {} // { key: Howl instance }
let fadingOutTracks = []

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
    ...options,
  })
  currentMusic.play()
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
    ...options,
  })
  currentMusic.play()
  currentMusic.fade(0, options.volume ?? musicVolume, duration)
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

export function isUnlocked() {
  try {
    return Howler.ctx?.state === 'running'
  } catch {
    return false
  }
}
