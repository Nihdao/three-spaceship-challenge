export function getRectangularHPBarProps({ value, max, pulse = false }) {
  const ratio = Math.min(1, Math.max(0, value / max))
  const widthPercent = `${Math.round(ratio * 100)}%`
  const hpText = `${Math.ceil(value)}/${max}`
  const boxShadow = pulse
    ? '0 0 16px rgba(255, 68, 102, 0.8)'
    : '0 0 8px rgba(255, 68, 102, 0.5)'
  const animation = pulse ? 'hpPulse 500ms ease-in-out infinite alternate' : 'none'

  return { widthPercent, hpText, boxShadow, animation }
}

export default function RectangularHPBar({ value, max, pulse = false }) {
  const { widthPercent, hpText, boxShadow, animation } = getRectangularHPBarProps({
    value,
    max,
    pulse,
  })

  return (
    <div
      data-testid="hp-bar-container"
      className="relative"
      style={{
        width: 'clamp(140px, 14vw, 220px)',
        height: 'clamp(18px, 1.8vw, 26px)',
        backgroundColor: 'rgba(0,0,0,0.4)',
        border: '1px solid rgba(255, 68, 102, 0.4)',
        boxShadow,
        overflow: 'hidden',
        transition: 'box-shadow 300ms ease-out',
        animation,
      }}
    >
      {/* Gradient fill bar */}
      <div
        data-testid="hp-bar-fill"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: widthPercent,
          background: 'linear-gradient(90deg, #ff4466 0%, #cc0033 100%)',
          transition: 'width 150ms ease-out',
        }}
      />

      {/* HP text overlay */}
      <div
        data-testid="hp-bar-text"
        style={{
          position: 'absolute',
          top: '50%',
          left: '8px',
          transform: 'translateY(-50%)',
          fontSize: 'clamp(9px, 0.9vw, 12px)',
          fontWeight: 'bold',
          color: '#ffffff',
          textShadow: '0 1px 2px rgba(0,0,0,0.8)',
          zIndex: 1,
        }}
      >
        {hpText}
      </div>
    </div>
  )
}
