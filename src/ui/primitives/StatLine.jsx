export default function StatLine({ label, value, icon, bonusValue, compact = false, mono = false }) {
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
      <span className={`${compact ? 'text-[11px]' : 'text-xs'} tracking-widest flex items-center gap-1`} style={{ color: 'var(--rs-text-muted)' }}>
        {icon && (
          <span className="flex-shrink-0">
            {Icon ? <Icon size={14} color="currentColor" /> : icon}
          </span>
        )}
        {label}
      </span>
      <div className="flex items-center gap-1">
        <span className="font-bold tabular-nums" style={{ color: 'var(--rs-text)', fontSize: compact ? '12px' : 'clamp(12px, 1.2vw, 16px)', ...(mono && { fontFamily: "'Space Mono', monospace" }) }}>
          {String(value)}
        </span>
        {hasBonus && (
          <span style={{ fontSize: '9px', color: 'var(--rs-success)', backgroundColor: 'rgba(45,198,83,0.1)', padding: '0 4px', clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 0 100%)' }}>
            {formatBonus(bonusValue)}
          </span>
        )}
      </div>
    </div>
  )
}
