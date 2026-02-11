import { describe, it, expect, vi, beforeEach } from 'vitest'

// Shared mock state via vi.hoisted — single source of truth for all Howl instances
const mockData = vi.hoisted(() => ({
  instances: [],
}))

vi.mock('howler', () => {
  class MockHowl {
    constructor(options) {
      this._options = options
      this._volume = options.volume ?? 1
      this._playing = false
      this._stopped = false
      this._unloaded = false
      this._events = {}
      this._fadeTo = null
      mockData.instances.push(this)
    }
    play() { this._playing = true; this._stopped = false; return 1 }
    stop() { this._playing = false; this._stopped = true; return this }
    unload() { this._unloaded = true; return this }
    volume(v) {
      if (v === undefined) return this._volume
      this._volume = v
      return this
    }
    fade(from, to, duration) {
      this._fadeFrom = from
      this._fadeTo = to
      this._fadeDuration = duration
      return this
    }
    // Test helper — simulate fade completion to trigger once('fade') callbacks
    _completeFade() {
      this._volume = this._fadeTo ?? this._volume
      if (this._events.fade) {
        const cbs = [...this._events.fade]
        this._events.fade = []
        cbs.forEach(fn => fn())
      }
    }
    once(event, fn) {
      if (!this._events[event]) this._events[event] = []
      this._events[event].push(fn)
      return this
    }
    on(event, fn) {
      if (!this._events[event]) this._events[event] = []
      this._events[event].push(fn)
      return this
    }
  }
  return {
    Howl: MockHowl,
    Howler: { ctx: { state: 'running' } },
  }
})

let audioManager

beforeEach(async () => {
  mockData.instances.length = 0
  vi.resetModules()
  audioManager = await import('../audioManager.js')
})

describe('audioManager', () => {
  describe('VOLUME_CATEGORIES', () => {
    it('exports correct default levels per UX audio spec', () => {
      const vc = audioManager.VOLUME_CATEGORIES
      expect(vc.music).toBe(1.0)
      expect(vc.sfxAction).toBe(0.8)
      expect(vc.sfxFeedbackPositive).toBe(0.9)
      expect(vc.sfxFeedbackNegative).toBe(1.0)
      expect(vc.ui).toBe(0.5)
      expect(vc.events).toBe(1.2)
    })
  })

  describe('playMusic', () => {
    it('creates a Howl with correct src, loop, and volume', () => {
      audioManager.playMusic('menu.mp3')
      expect(mockData.instances).toHaveLength(1)
      const howl = mockData.instances[0]
      expect(howl._options.src).toEqual(['menu.mp3'])
      expect(howl._options.loop).toBe(true)
      expect(howl._options.volume).toBe(1.0)
      expect(howl._playing).toBe(true)
    })

    it('stops and unloads previous music before playing new track', () => {
      audioManager.playMusic('track1.mp3')
      const first = mockData.instances[0]
      audioManager.playMusic('track2.mp3')
      expect(first._stopped).toBe(true)
      expect(first._unloaded).toBe(true)
      expect(mockData.instances).toHaveLength(2)
      expect(mockData.instances[1]._playing).toBe(true)
    })

    it('force-stops fading tracks to prevent audio overlap', () => {
      audioManager.playMusic('track1.mp3')
      audioManager.fadeOutMusic(500) // track1 now fading
      const fadingTrack = mockData.instances[0]
      // Fade NOT completed — track is still in fadingOutTracks
      audioManager.playMusic('track2.mp3')
      // cleanupFadingTracks should force-stop the fading track
      expect(fadingTrack._stopped).toBe(true)
      expect(fadingTrack._unloaded).toBe(true)
    })
  })

  describe('stopMusic', () => {
    it('stops and unloads current music', () => {
      audioManager.playMusic('test.mp3')
      const howl = mockData.instances[0]
      audioManager.stopMusic()
      expect(howl._stopped).toBe(true)
      expect(howl._unloaded).toBe(true)
    })

    it('does not throw when no music is playing', () => {
      expect(() => audioManager.stopMusic()).not.toThrow()
    })
  })

  describe('fadeOutMusic', () => {
    it('fades current music volume to 0 over given duration', () => {
      audioManager.playMusic('test.mp3')
      const howl = mockData.instances[0]
      audioManager.fadeOutMusic(500)
      expect(howl._fadeFrom).toBe(1.0)
      expect(howl._fadeTo).toBe(0)
      expect(howl._fadeDuration).toBe(500)
    })

    it('stops and unloads the track after fade completes', () => {
      audioManager.playMusic('test.mp3')
      const howl = mockData.instances[0]
      audioManager.fadeOutMusic(500)
      howl._completeFade()
      expect(howl._stopped).toBe(true)
      expect(howl._unloaded).toBe(true)
    })

    it('does not throw when no music is playing', () => {
      expect(() => audioManager.fadeOutMusic()).not.toThrow()
    })
  })

  describe('crossfadeMusic', () => {
    it('fades out old track and fades in new track', () => {
      audioManager.playMusic('old.mp3')
      const oldTrack = mockData.instances[0]
      audioManager.crossfadeMusic('new.mp3', 1000)
      expect(oldTrack._fadeTo).toBe(0)
      expect(oldTrack._fadeDuration).toBe(1000)
      const newTrack = mockData.instances[1]
      expect(newTrack._options.src).toEqual(['new.mp3'])
      expect(newTrack._options.loop).toBe(true)
      expect(newTrack._playing).toBe(true)
      expect(newTrack._fadeTo).toBe(1.0)
    })

    it('cleans up stale fading tracks before starting crossfade', () => {
      audioManager.playMusic('track1.mp3')
      audioManager.fadeOutMusic(500) // track1 fading, not completed
      const fadingTrack = mockData.instances[0]
      audioManager.crossfadeMusic('track2.mp3', 1000)
      expect(fadingTrack._stopped).toBe(true)
      expect(fadingTrack._unloaded).toBe(true)
    })

    it('works when no previous music is playing', () => {
      audioManager.crossfadeMusic('new.mp3', 500)
      expect(mockData.instances).toHaveLength(1)
      expect(mockData.instances[0]._playing).toBe(true)
    })
  })

  describe('setMusicVolume', () => {
    it('updates volume on current music track', () => {
      audioManager.playMusic('test.mp3')
      const howl = mockData.instances[0]
      audioManager.setMusicVolume(0.5)
      expect(howl._volume).toBe(0.5)
    })
  })

  describe('setSFXVolume', () => {
    it('propagates new master volume to all preloaded sounds', () => {
      audioManager.preloadSounds({
        'laser-fire': 'sfx/laser.mp3',
        'button-click': 'sfx/click.mp3',
      })
      const laserHowl = mockData.instances[0]
      const clickHowl = mockData.instances[1]

      audioManager.setSFXVolume(0.5)
      // laser-fire: sfxAction (0.8) * 0.5 = 0.4
      expect(laserHowl._volume).toBeCloseTo(0.4)
      // button-click: ui (0.5) * 0.5 = 0.25
      expect(clickHowl._volume).toBeCloseTo(0.25)
    })
  })

  describe('preloadSounds', () => {
    it('creates Howl instances with category-appropriate volumes', () => {
      audioManager.preloadSounds({
        'laser-fire': 'sfx/laser.mp3',
        'game-over-impact': 'sfx/impact.mp3',
        'button-hover': 'sfx/hover.mp3',
      })
      expect(mockData.instances).toHaveLength(3)
      // laser-fire: sfxAction = 0.8
      expect(mockData.instances[0]._options.volume).toBeCloseTo(0.8)
      // game-over-impact: events = 1.2
      expect(mockData.instances[1]._options.volume).toBeCloseTo(1.2)
      // button-hover: ui = 0.5
      expect(mockData.instances[2]._options.volume).toBeCloseTo(0.5)
    })

    it('sets preload: true on all Howl instances', () => {
      audioManager.preloadSounds({ 'test': 'sfx/test.mp3' })
      expect(mockData.instances[0]._options.preload).toBe(true)
    })
  })

  describe('playSFX', () => {
    it('plays a preloaded sound', () => {
      audioManager.preloadSounds({ 'laser-fire': 'sfx/laser.mp3' })
      const howl = mockData.instances[0]
      audioManager.playSFX('laser-fire')
      expect(howl._playing).toBe(true)
    })

    it('silently returns for missing key without throwing', () => {
      expect(() => audioManager.playSFX('nonexistent')).not.toThrow()
    })

    it('recalculates volume at play time after setSFXVolume change', () => {
      audioManager.preloadSounds({ 'laser-fire': 'sfx/laser.mp3' })
      const howl = mockData.instances[0]
      audioManager.setSFXVolume(0.5)
      audioManager.playSFX('laser-fire')
      // sfxAction (0.8) * 0.5 = 0.4
      expect(howl._volume).toBeCloseTo(0.4)
    })

    it('ducks music volume for events category sounds', () => {
      audioManager.playMusic('music.mp3')
      const musicHowl = mockData.instances[0]
      audioManager.preloadSounds({ 'game-over-impact': 'sfx/impact.mp3' })

      audioManager.playSFX('game-over-impact')
      // Music should be ducked to 30% of musicVolume
      expect(musicHowl._volume).toBeCloseTo(0.3)
    })

    it('does not duck music for non-events category sounds', () => {
      audioManager.playMusic('music.mp3')
      const musicHowl = mockData.instances[0]
      audioManager.preloadSounds({ 'laser-fire': 'sfx/laser.mp3' })

      audioManager.playSFX('laser-fire')
      expect(musicHowl._volume).toBe(1.0)
    })
  })

  describe('stopAllSFX', () => {
    it('stops all preloaded sounds', () => {
      audioManager.preloadSounds({
        'laser-fire': 'sfx/laser.mp3',
        'explosion': 'sfx/boom.mp3',
      })
      audioManager.playSFX('laser-fire')
      audioManager.playSFX('explosion')
      audioManager.stopAllSFX()
      expect(mockData.instances[0]._stopped).toBe(true)
      expect(mockData.instances[1]._stopped).toBe(true)
    })
  })

  describe('isUnlocked', () => {
    it('returns true when audio context is running', () => {
      expect(audioManager.isUnlocked()).toBe(true)
    })
  })
})
