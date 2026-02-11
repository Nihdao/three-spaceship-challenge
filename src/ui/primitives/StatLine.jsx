export function getStatLineProps({ label, value, icon }) {
  const valueStr = String(value)
  return {
    label,
    value: valueStr,
    hasIcon: !!icon,
    labelClassName: 'text-game-text font-game',
    valueClassName: 'text-game-text font-game tabular-nums',
  }
}

export default function StatLine({ label, value, icon }) {
  const { value: valueStr, labelClassName, valueClassName } = getStatLineProps({ label, value, icon })

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <span className={labelClassName} style={{ fontSize: 'clamp(12px, 1.2vw, 16px)' }}>
          {label}
        </span>
      </div>
      <span className={valueClassName} style={{ fontSize: 'clamp(12px, 1.2vw, 16px)' }}>
        {valueStr}
      </span>
    </div>
  )
}
