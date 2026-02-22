export default function StatLine({ label, value, icon, bonusValue, compact = false }) {
  // Determine if bonus badge should be shown
  const hasBonus = bonusValue !== undefined && bonusValue > 0

  // Format bonus value for display
  const formatBonus = (val) => {
    if (typeof val === 'number') {
      const formatted = val % 1 === 0 ? val : val.toFixed(1)
      return `+${formatted}`
    }
    return `+${val}`
  }

  const Icon = typeof icon === 'function' ? icon : null

  return (
    <div className="flex items-center justify-between gap-2">
      <span className={`text-game-text-muted ${compact ? 'text-[10px]' : 'text-xs'} tracking-widest flex items-center gap-1`}>
        {icon && (
          <span className="flex-shrink-0">
            {Icon ? <Icon size={14} color="currentColor" /> : icon}
          </span>
        )}
        {label}
      </span>
      <div className="flex items-center gap-1">
        <span className="text-game-text font-bold tabular-nums" style={{ fontSize: compact ? '11px' : 'clamp(12px, 1.2vw, 16px)' }}>
          {String(value)}
        </span>
        {hasBonus && (
          <span className="text-[9px] text-green-400 bg-green-400/10 px-1 rounded">
            {formatBonus(bonusValue)}
          </span>
        )}
      </div>
    </div>
  )
}
