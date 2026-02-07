import { Howl } from 'howler'

// Audio manager — centralized sound control (to be fully implemented in Story 4.5)

let currentMusic = null

export function playMusic(src, options = {}) {
  stopMusic()
  currentMusic = new Howl({
    src: [src],
    loop: true,
    volume: options.volume ?? 0.5,
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

export function playSFX(src, options = {}) {
  const sfx = new Howl({
    src: [src],
    volume: options.volume ?? 0.7,
    ...options,
  })
  sfx.play()
  // Auto-cleanup when sound finishes to prevent memory accumulation
  sfx.once('end', () => sfx.unload())
}

export function setVolume(volume) {
  if (currentMusic) {
    currentMusic.volume(volume)
  }
}
