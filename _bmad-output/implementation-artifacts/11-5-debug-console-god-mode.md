# Story 11.5: Debug Console & God Mode

Status: backlog

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want a debug console accessible via a subtle hotkey that provides god mode commands,
So that I can quickly test game features by manipulating player state (XP, levels, weapons, boons), enemy spawning, and other parameters without manual playtesting.

## Acceptance Criteria

1. **Given** gameplay is active **When** developer presses the console toggle hotkey (tilde ~ or backtick `) **Then** the debug console appears as an overlay **And** input focus shifts to the console

2. **Given** the console is open **When** developer types a command and presses Enter **Then** the command executes and feedback is displayed **And** command is added to command history

3. **Given** the console provides player commands **When** developer executes XP/level commands **Then** player XP or level is modified immediately **And** level-up modal appears if leveling up

4. **Given** the console provides enemy commands **When** developer executes spawn/clear commands **Then** enemies are spawned or removed from the game world **And** spatial hash is updated accordingly

5. **Given** the console provides weapon/boon commands **When** developer executes add/modify commands **Then** weapons or boons are added to player inventory or modified to specified levels **And** player stats are recalculated

6. **Given** the console is open **When** developer types `help` **Then** all available commands are listed with usage examples **And** command syntax is clearly documented

7. **Given** the console is open **When** developer presses Escape or the toggle hotkey again **Then** the console closes **And** input focus returns to gameplay

## Tasks / Subtasks

- [ ] Task 1: Design console UI and interaction pattern (AC: #1, #7)
  - [ ] 1.1: Design console overlay appearance (dark semi-transparent background, input field, command history display)
  - [ ] 1.2: Choose console toggle hotkey (backtick ` recommended, tilde ~ alternative)
  - [ ] 1.3: Design command syntax pattern (e.g., `addxp <amount>`, `spawn <enemyType> <count>`, `setlevel <level>`)
  - [ ] 1.4: Design console z-index layering (above HUD, below modals)
  - [ ] 1.5: Design console input behavior (autofocus on open, blur on close, submit on Enter, close on Escape)

- [ ] Task 2: Implement console UI component (AC: #1, #2, #7)
  - [ ] 2.1: Create DebugConsole.jsx component (HTML overlay div with input field and command history)
  - [ ] 2.2: Implement console toggle state (useDebugConsole Zustand store with `isOpen`, `toggleConsole()`)
  - [ ] 2.3: Implement keyboard listener for console toggle hotkey (backtick or tilde)
  - [ ] 2.4: Implement input field autofocus on open, blur on close
  - [ ] 2.5: Implement command history display (last 10 commands + results, scrollable)
  - [ ] 2.6: Implement command input submission (on Enter, parse and execute command, clear input field)
  - [ ] 2.7: Implement console close on Escape key
  - [ ] 2.8: Style console with CSS (dark background rgba(0,0,0,0.8), monospace font, green text for retro terminal feel)

- [ ] Task 3: Implement command parser and executor (AC: #2)
  - [ ] 3.1: Create commandParser.js utility (parseCommand function, splits input into command + args)
  - [ ] 3.2: Create commandRegistry.js (maps command names to handler functions)
  - [ ] 3.3: Implement executeCommand function (looks up command in registry, calls handler with args, returns result message)
  - [ ] 3.4: Implement command validation (check arg count, types, ranges before execution)
  - [ ] 3.5: Implement error handling (invalid command, invalid args, execution errors)
  - [ ] 3.6: Implement success/error feedback messages (green for success, red for errors)

- [ ] Task 4: Implement player god mode commands (AC: #3)
  - [ ] 4.1: Implement `addxp <amount>` command (adds XP to player, triggers level-up if threshold reached)
  - [ ] 4.2: Implement `setlevel <level>` command (sets player level directly, updates XP threshold)
  - [ ] 4.3: Implement `godmode` or `invincible` command (toggles player invincibility, sets currentHP to maxHP on hit)
  - [ ] 4.4: Implement `sethp <amount>` command (sets player currentHP, clamped to maxHP)
  - [ ] 4.5: Implement `setmaxhp <amount>` command (sets player maxHP, adjusts currentHP if needed)
  - [ ] 4.6: Test player commands (verify XP adds correctly, level-up modal appears, HP changes apply)

- [ ] Task 5: Implement enemy god mode commands (AC: #4)
  - [ ] 5.1: Implement `spawn <enemyType> <count>` command (spawns N enemies of specified type near player)
  - [ ] 5.2: Implement `clear` or `killall` command (removes all active enemies from game world, updates spatial hash)
  - [ ] 5.3: Implement `spawnwave <waveLevel>` command (spawns a full enemy wave at specified level)
  - [ ] 5.4: Implement `stopspawn` command (disables automatic enemy spawning until toggled back)
  - [ ] 5.5: Implement `resumespawn` command (re-enables automatic enemy spawning)
  - [ ] 5.6: Test enemy commands (verify spawn works with different enemy types, clear removes all, wave spawns correct count/level)

- [ ] Task 6: Implement weapon/boon god mode commands (AC: #5)
  - [ ] 6.1: Implement `addweapon <weaponId>` command (adds weapon to next available slot, level 1)
  - [ ] 6.2: Implement `setweaponlevel <slotIndex> <level>` command (upgrades weapon in slot to specified level, clamped to maxLevel)
  - [ ] 6.3: Implement `removeweapon <slotIndex>` command (removes weapon from slot)
  - [ ] 6.4: Implement `addboon <boonId>` command (adds boon to next available slot, level 1)
  - [ ] 6.5: Implement `setboonlevel <slotIndex> <level>` command (upgrades boon in slot to specified level, clamped to maxLevel)
  - [ ] 6.6: Implement `removeboon <slotIndex>` command (removes boon from slot)
  - [ ] 6.7: Test weapon/boon commands (verify add works, level upgrades apply, remove clears slot)

- [ ] Task 7: Implement help and utility commands (AC: #6)
  - [ ] 7.1: Implement `help` command (lists all available commands with syntax and description)
  - [ ] 7.2: Implement `clear` command for console history (clears command history display, not enemies)
  - [ ] 7.3: Implement `listweapons` command (lists all available weaponDef IDs)
  - [ ] 7.4: Implement `listboons` command (lists all available boonDef IDs)
  - [ ] 7.5: Implement `listenemies` command (lists all available enemy types)
  - [ ] 7.6: Test help commands (verify all commands documented, list commands show correct IDs)

- [ ] Task 8: Integrate console into GameplayScene (AC: #1, #7)
  - [ ] 8.1: Import DebugConsole component in GameplayScene.jsx
  - [ ] 8.2: Render DebugConsole conditionally based on useDebugConsole.isOpen state
  - [ ] 8.3: Ensure console keyboard listener doesn't conflict with gameplay inputs (only listen when not in modal)
  - [ ] 8.4: Test console toggle in gameplay (verify opens/closes correctly, doesn't break game flow)

- [ ] Task 9: Production safety and configuration (AC: #1)
  - [ ] 9.1: Add DEBUG_CONSOLE_ENABLED flag to gameConfig.js (defaults to true for development)
  - [ ] 9.2: Conditionally render DebugConsole only if DEBUG_CONSOLE_ENABLED is true
  - [ ] 9.3: Document how to disable console for production builds (set flag to false)
  - [ ] 9.4: Test console disabled state (verify console doesn't appear when flag is false)

- [ ] Task 10: Edge case validation and polish
  - [ ] 10.1: Test console with invalid commands (verify error messages display correctly)
  - [ ] 10.2: Test console with invalid arguments (e.g., negative XP, out-of-range level)
  - [ ] 10.3: Test console during modals (verify console doesn't open during level-up/pause/game-over)
  - [ ] 10.4: Test command history overflow (verify only last 10 commands displayed, older ones scroll out)
  - [ ] 10.5: Test rapid command execution (verify commands don't conflict or break state)
  - [ ] 10.6: Test weapon/boon add when slots full (verify error message or no-op behavior)
  - [ ] 10.7: Test enemy spawn at max enemy count (verify spawn respects ENEMY_CAP or warns if exceeded)
  - [ ] 10.8: Polish console styling (ensure readable, doesn't obstruct critical HUD elements)

## Dev Notes

### Architecture Context

**6-Layer Architecture Alignment:**
- **UI Layer** → `src/ui/DebugConsole.jsx` (console UI overlay, input field, command history display)
- **Stores Layer** → `src/stores/useDebugConsole.jsx` (console state: isOpen, command history, toggleConsole())
- **Systems Layer** → `src/systems/commandSystem.js` (command parser, registry, executor, command handlers)
- **Data Layer** → `src/config/gameConfig.js` (DEBUG_CONSOLE_ENABLED flag, console configuration)
- **Integration** → `src/scenes/GameplayScene.jsx` (renders DebugConsole component conditionally)

**Existing Infrastructure:**
- **Zustand stores:** usePlayer, useWeapons, useBoons, useEnemies (all provide state manipulation actions)
- **GameLoop:** Single high-priority useFrame, all game state updates happen here
- **HUD:** HTML overlay divs in GameplayScene.jsx (console will be another overlay)

**Console Implementation Pattern:**
- Console is a pure UI layer component (no game logic, only calls existing store actions)
- Command handlers wrap existing store actions (e.g., `addxp` calls `usePlayer.getState().gainXP(amount)`)
- Console state is separate from game state (doesn't affect gameplay, only developer testing)

### Technical Requirements

**Console UI Specifications:**
```javascript
// useDebugConsole.jsx — Zustand store for console state
import { create } from 'zustand'

export const useDebugConsole = create((set, get) => ({
  isOpen: false,
  commandHistory: [], // Array of { input: string, output: string, success: bool }

  toggleConsole: () => set(state => ({ isOpen: !state.isOpen })),

  executeCommand: (input) => {
    const result = executeCommandFn(input) // Calls commandSystem.js
    const { commandHistory } = get()
    const newHistory = [
      ...commandHistory.slice(-9), // Keep last 9 commands
      { input, output: result.message, success: result.success, timestamp: Date.now() }
    ]
    set({ commandHistory: newHistory })
  },

  clearHistory: () => set({ commandHistory: [] }),

  reset: () => set({ isOpen: false, commandHistory: [] }),
}))
```

**DebugConsole.jsx Component:**
```jsx
import React, { useEffect, useRef, useState } from 'react'
import { useDebugConsole } from '../stores/useDebugConsole'
import { executeCommand } from '../systems/commandSystem'

export function DebugConsole() {
  const { isOpen, commandHistory, toggleConsole, executeCommand: storeExecute } = useDebugConsole()
  const [input, setInput] = useState('')
  const inputRef = useRef(null)

  // Autofocus input when console opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Keyboard listener for toggle hotkey (backtick)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '`' || e.key === '~') {
        e.preventDefault()
        toggleConsole()
      }
      if (isOpen && e.key === 'Escape') {
        toggleConsole()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, toggleConsole])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (input.trim()) {
      storeExecute(input.trim())
      setInput('')
    }
  }

  if (!isOpen) return null

  return (
    <div className="debug-console">
      <div className="console-history">
        {commandHistory.map((cmd, idx) => (
          <div key={idx} className={cmd.success ? 'success' : 'error'}>
            <span className="prompt">&gt; {cmd.input}</span>
            <span className="output">{cmd.output}</span>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="console-input-form">
        <span className="prompt">&gt; </span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="console-input"
          placeholder="Type 'help' for commands"
        />
      </form>
    </div>
  )
}
```

**commandSystem.js — Command Parser & Registry:**
```javascript
import { usePlayer } from '../stores/usePlayer'
import { useWeapons } from '../stores/useWeapons'
import { useBoons } from '../stores/useBoons'
import { useEnemies } from '../stores/useEnemies'
import { WEAPONS } from '../entities/weaponDefs'
import { BOONS } from '../entities/boonDefs'

// Command registry maps command names to handler functions
const COMMANDS = {
  help: {
    handler: () => {
      const commandList = Object.entries(COMMANDS)
        .map(([name, def]) => `${name}: ${def.description}`)
        .join('\n')
      return { success: true, message: `Available commands:\n${commandList}` }
    },
    description: 'List all available commands'
  },

  addxp: {
    handler: (args) => {
      const amount = parseInt(args[0])
      if (isNaN(amount) || amount < 0) {
        return { success: false, message: 'Usage: addxp <amount>' }
      }
      usePlayer.getState().gainXP(amount)
      return { success: true, message: `Added ${amount} XP` }
    },
    description: 'addxp <amount> — Add XP to player'
  },

  setlevel: {
    handler: (args) => {
      const level = parseInt(args[0])
      if (isNaN(level) || level < 1) {
        return { success: false, message: 'Usage: setlevel <level>' }
      }
      usePlayer.getState().setLevel(level) // Assumes setLevel action exists or needs to be added
      return { success: true, message: `Set level to ${level}` }
    },
    description: 'setlevel <level> — Set player level directly'
  },

  spawn: {
    handler: (args) => {
      const enemyType = args[0]
      const count = parseInt(args[1]) || 1
      if (!enemyType || count < 1) {
        return { success: false, message: 'Usage: spawn <enemyType> <count>' }
      }
      // Call enemy spawn system (may need to add spawnEnemyDebug action)
      useEnemies.getState().spawnDebug(enemyType, count)
      return { success: true, message: `Spawned ${count} ${enemyType}` }
    },
    description: 'spawn <enemyType> <count> — Spawn enemies near player'
  },

  killall: {
    handler: () => {
      useEnemies.getState().clearAll()
      return { success: true, message: 'Cleared all enemies' }
    },
    description: 'killall — Remove all enemies from the game world'
  },

  addweapon: {
    handler: (args) => {
      const weaponId = args[0]
      if (!WEAPONS[weaponId]) {
        return { success: false, message: `Unknown weapon: ${weaponId}` }
      }
      const result = useWeapons.getState().addWeapon(weaponId)
      if (!result.success) {
        return { success: false, message: result.message || 'Failed to add weapon (slots full?)' }
      }
      return { success: true, message: `Added weapon: ${weaponId}` }
    },
    description: 'addweapon <weaponId> — Add weapon to next available slot'
  },

  addboon: {
    handler: (args) => {
      const boonId = args[0]
      if (!BOONS[boonId]) {
        return { success: false, message: `Unknown boon: ${boonId}` }
      }
      const result = useBoons.getState().addBoon(boonId)
      if (!result.success) {
        return { success: false, message: result.message || 'Failed to add boon (slots full?)' }
      }
      return { success: true, message: `Added boon: ${boonId}` }
    },
    description: 'addboon <boonId> — Add boon to next available slot'
  },

  // Additional commands: setweaponlevel, setboonlevel, listweapons, listboons, etc.
}

export function executeCommand(input) {
  const [commandName, ...args] = input.trim().split(/\s+/)
  const command = COMMANDS[commandName.toLowerCase()]

  if (!command) {
    return { success: false, message: `Unknown command: ${commandName}. Type 'help' for commands.` }
  }

  try {
    return command.handler(args)
  } catch (error) {
    return { success: false, message: `Error executing ${commandName}: ${error.message}` }
  }
}
```

**Console Styling (DebugConsole.css):**
```css
.debug-console {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40%;
  background: rgba(0, 0, 0, 0.9);
  color: #00ff00; /* Green terminal text */
  font-family: 'Courier New', monospace;
  font-size: 14px;
  padding: 10px;
  z-index: 9999; /* Above HUD */
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.console-history {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 10px;
}

.console-history .success {
  color: #00ff00;
}

.console-history .error {
  color: #ff4444;
}

.console-history .prompt {
  color: #00aaff;
  margin-right: 5px;
}

.console-history .output {
  display: block;
  margin-left: 20px;
  white-space: pre-wrap;
}

.console-input-form {
  display: flex;
  align-items: center;
  border-top: 1px solid #333;
  padding-top: 5px;
}

.console-input-form .prompt {
  color: #00aaff;
  margin-right: 5px;
}

.console-input {
  flex: 1;
  background: transparent;
  border: none;
  color: #00ff00;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  outline: none;
}
```

### Command List Specifications

**Player Commands:**
- `addxp <amount>` — Adds XP to player, triggers level-up if threshold crossed
- `setlevel <level>` — Sets player level directly (updates XP threshold)
- `godmode` or `invincible` — Toggles player invincibility (currentHP always maxHP on hit)
- `sethp <amount>` — Sets currentHP (clamped to maxHP)
- `setmaxhp <amount>` — Sets maxHP (adjusts currentHP if needed)

**Enemy Commands:**
- `spawn <enemyType> <count>` — Spawns N enemies of type near player
- `killall` or `clear` — Removes all active enemies
- `spawnwave <waveLevel>` — Spawns a full enemy wave at specified difficulty
- `stopspawn` — Disables automatic enemy spawning
- `resumespawn` — Re-enables automatic enemy spawning

**Weapon Commands:**
- `addweapon <weaponId>` — Adds weapon to next available slot at level 1
- `setweaponlevel <slotIndex> <level>` — Upgrades weapon in slot to level (clamped to maxLevel)
- `removeweapon <slotIndex>` — Removes weapon from slot

**Boon Commands:**
- `addboon <boonId>` — Adds boon to next available slot at level 1
- `setboonlevel <slotIndex> <level>` — Upgrades boon in slot to level (clamped to maxLevel)
- `removeboon <slotIndex>` — Removes boon from slot

**Utility Commands:**
- `help` — Lists all available commands with syntax
- `clear` — Clears console command history display
- `listweapons` — Lists all available weapon IDs from weaponDefs.js
- `listboons` — Lists all available boon IDs from boonDefs.js
- `listenemies` — Lists all available enemy types

### Integration Notes

**Keyboard Conflict Avoidance:**
- Console toggle listens globally but only toggles if no modal is open (check useGamePhase.modalOpen state)
- When console is open, gameplay inputs (movement, dash, pause) should still work (console doesn't block game loop)
- Console input field should have stopPropagation on keydown to prevent WASD/space keys from controlling ship while typing

**Production Safety:**
- `gameConfig.js` has `DEBUG_CONSOLE_ENABLED: true` flag (defaults to true for development)
- `GameplayScene.jsx` conditionally renders `<DebugConsole />` only if `DEBUG_CONSOLE_ENABLED === true`
- For production builds, set flag to `false` to prevent console from appearing
- Console keyboard listener should also check this flag before toggling

**Store Action Requirements:**
Some commands may require new actions in stores:
- `usePlayer.setLevel(level)` — Sets level directly (may not exist, currently only gainXP triggers level-up)
- `useEnemies.spawnDebug(type, count)` — Spawns enemies manually (bypasses wave system)
- `useEnemies.clearAll()` — Removes all enemies (may exist as reset(), verify)
- `useWeapons.addWeapon(id)` — Adds weapon to next slot (verify if exists or needs wrapping)
- `useBoons.addBoon(id)` — Adds boon to next slot (verify if exists or needs wrapping)

If these actions don't exist, add them in respective stores with minimal logic (just direct state manipulation for god mode).

### Testing Checklist

**Console UI Testing:**
- [ ] Console toggles open/close with backtick or tilde key
- [ ] Console closes with Escape key when open
- [ ] Console input autofocuses when opened
- [ ] Command history displays correctly (last 10 commands, scrollable)
- [ ] Console styling is readable and doesn't obstruct critical HUD elements
- [ ] Console doesn't open during modals (level-up, pause, game-over)

**Player Command Testing:**
- [ ] `addxp <amount>` adds XP correctly, triggers level-up modal if threshold crossed
- [ ] `setlevel <level>` sets level directly, updates XP threshold
- [ ] `godmode` toggles invincibility (player takes no damage)
- [ ] `sethp <amount>` sets currentHP correctly (clamped to maxHP)
- [ ] `setmaxhp <amount>` sets maxHP correctly, adjusts currentHP if needed

**Enemy Command Testing:**
- [ ] `spawn <enemyType> <count>` spawns N enemies of correct type near player
- [ ] `killall` removes all active enemies from game world
- [ ] `spawnwave <waveLevel>` spawns correct wave difficulty and count
- [ ] `stopspawn` disables automatic enemy spawning
- [ ] `resumespawn` re-enables automatic enemy spawning

**Weapon/Boon Command Testing:**
- [ ] `addweapon <weaponId>` adds weapon to next available slot at level 1
- [ ] `setweaponlevel <slotIndex> <level>` upgrades weapon to specified level
- [ ] `removeweapon <slotIndex>` removes weapon from slot
- [ ] `addboon <boonId>` adds boon to next available slot at level 1
- [ ] `setboonlevel <slotIndex> <level>` upgrades boon to specified level
- [ ] `removeboon <slotIndex>` removes boon from slot

**Utility Command Testing:**
- [ ] `help` lists all available commands with syntax
- [ ] `clear` clears command history display
- [ ] `listweapons` lists all weaponDef IDs
- [ ] `listboons` lists all boonDef IDs
- [ ] `listenemies` lists all enemy types

**Edge Case Testing:**
- [ ] Invalid command shows error message
- [ ] Invalid arguments show usage help
- [ ] Negative/out-of-range values are rejected with error
- [ ] Rapid command execution doesn't break state
- [ ] Adding weapon/boon when slots full shows error or no-op
- [ ] Spawning enemies at max count warns or caps correctly
- [ ] Console disabled in production (DEBUG_CONSOLE_ENABLED = false)

### Performance Considerations

**NFR1: 60 FPS Gameplay:**
- Console UI is pure HTML/CSS overlay (no 3D rendering, no performance impact)
- Console keyboard listener is a single global event listener (negligible overhead)
- Command execution happens once per Enter keypress (not per frame, no continuous load)
- No impact on game loop performance (commands modify state once, game loop reads as normal)

**Memory Profile:**
- Console state: isOpen boolean, commandHistory array (max 10 entries * ~100 bytes each = ~1KB)
- Total additional memory: < 2KB for console UI and state
- No additional assets loaded (pure code feature)

### References

- [Source: src/stores/usePlayer.jsx — Player state (XP, level, HP)]
- [Source: src/stores/useWeapons.jsx — Weapon slots and management]
- [Source: src/stores/useBoons.jsx — Boon slots and management]
- [Source: src/stores/useEnemies.jsx — Enemy spawning and management]
- [Source: src/entities/weaponDefs.js — Weapon definitions for validation]
- [Source: src/entities/boonDefs.js — Boon definitions for validation]
- [Source: src/scenes/GameplayScene.jsx — HUD and UI integration]
- [Source: src/config/gameConfig.js — Configuration flags]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

### Completion Notes List

- Story 11.5 context created for debug console and god mode commands
- Console UI pattern designed: HTML overlay with input field, command history, retro terminal styling
- Console toggle hotkey chosen: backtick (`) or tilde (~) as subtle developer-friendly key
- Command system architecture: commandParser.js (parse input), commandRegistry.js (map commands to handlers), executeCommand (validate and execute)
- Command categories defined: Player (XP, level, HP, godmode), Enemy (spawn, clear, wave), Weapon/Boon (add, modify, remove), Utility (help, list)
- Production safety flag: DEBUG_CONSOLE_ENABLED in gameConfig.js (true for dev, false for production)
- Integration point: GameplayScene.jsx renders DebugConsole conditionally based on flag and isOpen state
- Testing checklist covering UI, all command categories, edge cases, and production safety
- Performance impact: negligible (pure HTML/CSS overlay, no game loop changes, no additional assets)

### File List

- `src/ui/DebugConsole.jsx` — Console UI component (overlay, input, history)
- `src/stores/useDebugConsole.jsx` — Console state store (isOpen, commandHistory, toggleConsole, executeCommand)
- `src/systems/commandSystem.js` — Command parser, registry, executor, command handlers
- `src/config/gameConfig.js` — Add DEBUG_CONSOLE_ENABLED flag
- `src/scenes/GameplayScene.jsx` — Integrate DebugConsole component conditionally
- `src/stores/usePlayer.jsx` — Add setLevel action if not exists
- `src/stores/useEnemies.jsx` — Add spawnDebug, clearAll actions if not exist
- `src/ui/DebugConsole.css` — Console styling (retro terminal theme)
