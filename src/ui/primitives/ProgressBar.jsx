const VARIANT_COLORS = {
  hp: 'var(--rs-hp)',
  xp: 'var(--rs-violet)',
  cooldown: 'var(--rs-dash-cd)',
  boss: 'var(--rs-hp)',
}

export function getProgressBarProps({ value, max = 100, variant = 'hp', pulse = false }) {
  const ratio = Math.min(1, Math.max(0, value / max))
  const widthPercent = `${Math.round(ratio * 100)}%`
  const fillColor = VARIANT_COLORS[variant] || VARIANT_COLORS.hp
  const pulseClass = pulse ? 'animate-pulse-glow' : ''
  const fillClassName = `h-full transition-[width] duration-150 ease-out ${pulseClass}`.trim()

  return { widthPercent, fillClassName, fillColor }
}

export default function ProgressBar({ value, max = 100, variant = 'hp', pulse = false }) {
  const { widthPercent, fillClassName, fillColor } = getProgressBarProps({ value, max, variant, pulse })

  return (
    <div className="relative h-full w-full overflow-hidden bg-white/10" style={{ clipPath: 'polygon(0 0, calc(100% - 2px) 0, 100% 2px, 100% 100%, 0 100%)' }}>
      <div
        data-testid="progress-fill"
        className={fillClassName}
        style={{ width: widthPercent, backgroundColor: fillColor }}
      />
    </div>
  )
}
