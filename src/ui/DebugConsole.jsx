import { useEffect, useRef, useState } from 'react'
import useDebugConsole from '../stores/useDebugConsole.jsx'
import useGame from '../stores/useGame.jsx'
import { GAME_CONFIG } from '../config/gameConfig.js'

export default function DebugConsole() {
  const isOpen = useDebugConsole((s) => s.isOpen)
  const commandHistory = useDebugConsole((s) => s.commandHistory)
  const toggleConsole = useDebugConsole((s) => s.toggleConsole)
  const runCommand = useDebugConsole((s) => s.runCommand)
  const clearHistory = useDebugConsole((s) => s.clearHistory)
  const [input, setInput] = useState('')
  const inputRef = useRef(null)
  const historyRef = useRef(null)

  // Autofocus input when console opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Auto-scroll history to bottom
  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight
    }
  }, [commandHistory])

  // Global keyboard listener for toggle hotkey
  useEffect(() => {
    if (!GAME_CONFIG.DEBUG_CONSOLE_ENABLED) return

    const handleKeyDown = (e) => {
      if (e.key === 'b' || e.key === 'B') {
        // Don't toggle if typing in the console input field
        if (document.activeElement && document.activeElement.tagName === 'INPUT') return

        const phase = useGame.getState().phase
        const isOpen = useDebugConsole.getState().isOpen

        // Only allow toggle during gameplay (or boss), not during modals/menus
        if (!isOpen && phase !== 'gameplay' && phase !== 'boss') return

        e.preventDefault()
        e.stopPropagation()
        toggleConsole()
        return
      }

      if (useDebugConsole.getState().isOpen && e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        toggleConsole()
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [toggleConsole])

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed) return

    if (trimmed.toLowerCase() === 'clearconsole') {
      // Add the command to history first, then clear
      runCommand(trimmed)
      clearHistory()
    } else {
      runCommand(trimmed)
    }
    setInput('')
  }

  // Prevent game input keys from propagating when typing in console
  const handleInputKeyDown = (e) => {
    e.stopPropagation()
    if (e.key === 'Escape') {
      e.preventDefault()
      toggleConsole()
    }
  }

  if (!isOpen) return null

  return (
    <div
      data-testid="debug-console"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '40%',
        background: 'rgba(0, 0, 0, 0.92)',
        color: '#00ff00',
        fontFamily: "'Courier New', monospace",
        fontSize: '13px',
        padding: '10px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        borderTop: '1px solid #333',
      }}
    >
      {/* Header */}
      <div style={{ color: '#666', fontSize: '11px', marginBottom: '6px', flexShrink: 0 }}>
        DEBUG CONSOLE — Type 'help' for commands. Press B or Escape to close.
      </div>

      {/* Command history */}
      <div
        ref={historyRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          marginBottom: '8px',
        }}
      >
        {commandHistory.map((cmd, idx) => (
          <div key={idx} style={{ marginBottom: '4px' }}>
            <div style={{ color: '#00aaff' }}>
              {'> '}{cmd.input}
            </div>
            <div
              style={{
                color: cmd.success ? '#00ff00' : '#ff4444',
                marginLeft: '16px',
                whiteSpace: 'pre-wrap',
              }}
            >
              {cmd.output}
            </div>
          </div>
        ))}
      </div>

      {/* Input form */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          alignItems: 'center',
          borderTop: '1px solid #333',
          paddingTop: '6px',
          flexShrink: 0,
        }}
      >
        <span style={{ color: '#00aaff', marginRight: '6px' }}>{'>'}</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleInputKeyDown}
          placeholder="Type 'help' for commands"
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            color: '#00ff00',
            fontFamily: "'Courier New', monospace",
            fontSize: '13px',
            outline: 'none',
          }}
        />
      </form>
    </div>
  )
}
