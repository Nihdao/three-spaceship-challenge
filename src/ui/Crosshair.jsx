import { useControlsStore } from '../stores/useControlsStore.jsx'
import useGame from '../stores/useGame.jsx'
import { GAME_CONFIG } from '../config/gameConfig.js'

// Story 21.2: Crosshair overlay that follows mouse cursor during gameplay
export default function Crosshair() {
  const phase = useGame((s) => s.phase)
  const mouseScreenPos = useControlsStore((s) => s.mouseScreenPos)

  // Only show during active combat phases (AC 3)
  if (phase !== 'gameplay' && phase !== 'boss') return null

  return (
    <div
      data-testid="crosshair"
      className="fixed pointer-events-none z-50"
      style={{
        left: `${mouseScreenPos[0]}px`,
        top: `${mouseScreenPos[1]}px`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {/* Neon purple crosshair design - perfectly symmetric */}
      <div
        style={{
          width: `${GAME_CONFIG.CROSSHAIR_SIZE}px`,
          height: `${GAME_CONFIG.CROSSHAIR_SIZE}px`,
          position: 'relative',
          filter: `drop-shadow(0 0 ${GAME_CONFIG.CROSSHAIR_GLOW_RADIUS}px rgba(216, 167, 255, ${GAME_CONFIG.CROSSHAIR_GLOW_OPACITY}))`,
        }}
      >
        {/* Horizontal line - perfectly centered */}
        <div
          style={{
            position: 'absolute',
            width: `${GAME_CONFIG.CROSSHAIR_SIZE}px`,
            height: `${GAME_CONFIG.CROSSHAIR_LINE_THICKNESS}px`,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: GAME_CONFIG.CROSSHAIR_COLOR,
            opacity: GAME_CONFIG.CROSSHAIR_OPACITY,
          }}
        />
        {/* Vertical line - perfectly centered */}
        <div
          style={{
            position: 'absolute',
            width: `${GAME_CONFIG.CROSSHAIR_LINE_THICKNESS}px`,
            height: `${GAME_CONFIG.CROSSHAIR_SIZE}px`,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: GAME_CONFIG.CROSSHAIR_COLOR,
            opacity: GAME_CONFIG.CROSSHAIR_OPACITY,
          }}
        />
        {/* Small center dot for precise aiming - subtle */}
        <div
          style={{
            position: 'absolute',
            width: `${GAME_CONFIG.CROSSHAIR_CENTER_DOT_SIZE}px`,
            height: `${GAME_CONFIG.CROSSHAIR_CENTER_DOT_SIZE}px`,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: '#ffffff',
            opacity: 0.8,
          }}
        />
      </div>
    </div>
  )
}

// Future gamepad support (Subtask 5.2):
// When gamepad connected, compute mouseScreenPos from:
//   - Ship screen position (project world position to screen)
//   - Right stick direction (angle)
//   - Fixed radius from ship center (e.g., 80px)
// For now, mouseScreenPos comes from mouse input via event listener
