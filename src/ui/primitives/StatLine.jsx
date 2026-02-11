export default function StatLine({ label, value, icon, tooltip }) {
  return (
    <div className="flex items-center justify-between gap-4 group">
      <span className="text-game-text-muted text-xs tracking-widest flex items-center gap-1.5">
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {label}
        {tooltip && (
          <span
            className="ml-0.5 text-[10px] opacity-40 group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100 transition-opacity cursor-help outline-none"
            title={tooltip}
            tabIndex={0}
            role="img"
            aria-label={tooltip}
          >
            &#9432;
          </span>
        )}
      </span>
      <span className="text-game-text font-bold tabular-nums" style={{ fontSize: 'clamp(12px, 1.2vw, 16px)' }}>
        {String(value)}
      </span>
    </div>
  )
}
