const VARIANT_COLORS = {
  hp: 'bg-game-hp',
  xp: 'bg-game-xp',
  cooldown: 'bg-game-cooldown',
  boss: 'bg-game-hp',
}

export function getProgressBarProps({ value, max = 100, variant = 'hp', pulse = false }) {
  const ratio = Math.min(1, Math.max(0, value / max))
  const widthPercent = `${Math.round(ratio * 100)}%`
  const colorClass = VARIANT_COLORS[variant] || VARIANT_COLORS.hp
  const pulseClass = pulse ? 'animate-pulse-glow' : ''
  const fillClassName = `h-full transition-[width] duration-150 ease-out ${colorClass} ${pulseClass}`.trim()

  return { widthPercent, fillClassName }
}

export default function ProgressBar({ value, max = 100, variant = 'hp', pulse = false }) {
  const { widthPercent, fillClassName } = getProgressBarProps({ value, max, variant, pulse })

  return (
    <div className="relative h-full w-full overflow-hidden rounded-sm bg-white/10">
      <div
        data-testid="progress-fill"
        className={fillClassName}
        style={{ width: widthPercent }}
      />
    </div>
  )
}
