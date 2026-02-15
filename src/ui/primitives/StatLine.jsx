export default function StatLine({ label, value, icon, bonusValue }) {
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

  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-game-text-muted text-xs tracking-widest flex items-center gap-1.5">
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {label}
      </span>
      <div className="flex items-center gap-1">
        <span className="text-game-text font-bold tabular-nums" style={{ fontSize: 'clamp(12px, 1.2vw, 16px)' }}>
          {String(value)}
        </span>
        {hasBonus && (
          <span className="text-[10px] text-green-400 bg-green-400/10 px-1 rounded">
            {formatBonus(bonusValue)}
          </span>
        )}
      </div>
    </div>
  )
}
