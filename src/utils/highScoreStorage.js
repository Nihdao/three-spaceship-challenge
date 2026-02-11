export const STORAGE_KEY_HIGH_SCORE = 'SPACESHIP_HIGH_SCORE'

export function getHighScore() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_HIGH_SCORE)
    if (stored !== null) {
      const parsed = parseInt(stored, 10)
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
    }
  } catch {
    // localStorage unavailable
  }
  return 0
}

export function setHighScore(score) {
  try {
    localStorage.setItem(STORAGE_KEY_HIGH_SCORE, String(score))
  } catch {
    // localStorage unavailable or quota exceeded
  }
}

