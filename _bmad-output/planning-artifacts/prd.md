---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish', 'step-12-complete']
workflowCompleted: true
completedAt: '2026-02-05'
inputDocuments:
  - '_bmad-output/brainstorming/brainstorming-session-2026-02-04.md'
  - '_bmad-output/planning-artifacts/research/market-roguelite-survivor-browser-games-research-2026-02-05.md'
documentCounts:
  briefs: 0
  research: 1
  brainstorming: 1
  projectDocs: 0
workflowType: 'prd'
classification:
  projectType: 'game-browser-webgl'
  domain: 'gaming-entertainment'
  complexity: 'medium'
  projectContext: 'greenfield'
  assets: '3D models + shaders/particles + arcade audio'
---

# Product Requirements Document - three-spaceship-challenge

**Author:** Adam
**Date:** 2026-02-05

## Executive Summary

**Product**: 3D Space Survivors-like browser game for Three.js Journey challenge

**Vision**: Deliver the first quality 3D survivors-like experience playable instantly in any browser — no download, no account, pure arcade fun.

**Target Users**:
- Casual players seeking quick power-fantasy sessions
- Survivors-like fans wanting a fresh 3D twist
- Three.js community evaluating technical excellence

**Differentiator**: Genre mixing (3D + survivors-like + browser) creates a Blue Ocean — no quality competitor exists in this intersection.

**Success Metric**: Top 3 placement in Three.js Journey challenge

**Timeline**: Solo developer, ~70-90 hours, deadline end February 2026

## Success Criteria

### User Success

- **Immediate "wow" moment**: When the game starts (after main menu), player sees a 3D arcade spaceship in action — no download required, instant browser gameplay
- **Engagement hook**: Player wants to "just one more run" after first death
- **Session satisfaction**: Complete run (2-3 systems) feels rewarding, not exhausting (~20-30 min)
- **Build discovery**: Player experiences meaningful weapon/boon synergies that feel powerful

### Business Success (Contest)

- **Primary goal**: Top 3 placement in Three.js Journey challenge
- **Visibility outcome**: Featured on threejs-journey.com/challenges, shared by community
- **Post-contest potential**: Traction for potential itch.io release or Steam wishlist campaign

### Technical Success

- **Performance**: Stable 60 FPS on Chrome (primary target)
- **Compatibility**: Functional on Firefox/Safari (secondary), mobile as bonus
- **Load time**: Playable within 5-10 seconds on average connection
- **Stability**: No crashes during a full 30-min run

### Measurable Outcomes

| Metric | Target |
|--------|--------|
| Average session duration | > 15 min |
| Replay rate (testers) | > 50% want to replay |
| Performance (Chrome) | 60 FPS stable |
| Contest placement | Top 3 |

## Product Scope

### MVP - Minimum Viable Product (Tier 1)

- Spaceship movement (smooth rotation + banking)
- Auto-fire facing direction
- Enemy spawns (types 1-2 fodder)
- XP + level-up system (weapon/boon choice)
- 3-4 weapons in pool
- 3-4 boons in pool
- 1 playable system (~10 min)
- 10-min timer + game over (death or timeout)
- Basic UI (HP, timer, XP, minimap)

### Growth Features - Contest Target (Tier 2)

- Planet scanning (silver minimum)
- Boss + wormhole activation (1v1 + shockwave clear)
- Wormhole tunnel transition (basic visual + upgrades UI)
- Enemy types 3-5
- Dash / Barrel roll (invulnerability)
- 6-7 total weapons
- Dilemmas (tunnel choices)
- Arcade music integration

### Vision - If Time Permits (Tier 3)

- 2nd system (2nd map, full run)
- Enemy types 6-8
- 10 weapons + 10 boons complete
- Meta-progression (quests, fragments, permanent upgrades)
- Narrative (radio guide, boss dialogues)
- Dangerous scenery (unstable stars, asteroids)
- HP sacrifice in tunnel
- Weapon/boon rarity system
- "XXXX System" banner + polish animations

## User Journeys

### Journey 1: Alex, the Casual Player

**Situation**: Alex, 28, web developer, looking for a game to decompress during lunch break. He scrolls Reddit and sees a post "Check out this 3D survivor game in your browser".

**Opening Scene**: Alex clicks the link. No download, no account needed. In 5 seconds, he sees the main menu. He clicks "Play".

**Rising Action**: His spaceship appears in space. Controls are intuitive — WASD to move, auto-fire handles the rest. First enemies arrive, he dodges, they die. XP, level up, he picks a new weapon randomly. "Oh, it shoots lasers from the sides now, cool."

**Climax**: At 7 minutes, the screen is filled with enemies and projectiles. His ship has become a destruction machine. He feels powerful. "It's chaos but I love it."

**Resolution**: He dies at 9 minutes. "Damn, I was close." He checks the time — break is over. He bookmarks the link. "I'll do another run tonight."

**Capabilities Revealed**: Instant load, no-account play, intuitive controls, auto-fire, satisfying power progression, quick sessions

---

### Journey 2: Marie, the Engaged Player

**Situation**: Marie, 24, Vampire Survivors and Brotato fan, has already done 3 runs. She now wants to understand synergies and optimize.

**Opening Scene**: Marie starts a new game with a goal: test the "Corrosive trail + Movement speed" build. She read that moving a lot maximizes damage.

**Rising Action**: She strategically chooses her level-ups, refuses weapons that don't serve her build. She scans a gold planet to get a specific boon. She manages her positioning to maximize trail coverage.

**Climax**: She finds the wormhole, activates it. The shockwave clears all mobs. The boss appears. She knows its patterns now — she dodges the beams, keeps her trail active, and defeats it with 2 minutes remaining.

**Resolution**: Transition tunnel. She accumulated many Fragments. She takes a risky dilemma (+30% damage, -20% HP) for the next system. "Let's go, system 2."

**Capabilities Revealed**: Build diversity, strategic choices, planet scanning rewards, boss mechanics, tunnel decisions, meta-progression

---

### Journey 3: Bruno, Three.js Contest Judge

**Situation**: Bruno Simon evaluates challenge submissions. He opens the link for "Spaceship Survivors".

**Opening Scene**: The page loads. Bruno mentally notes: "Fast loading, good sign." The menu appears — clean design, catchy arcade music. He quickly inspects DevTools: "WebGL, Three.js, no heavy framework, interesting."

**Rising Action**: He starts a game. Immediately impressed by the shaders on the spaceship, explosion particles, dynamic lighting. "Oh, the ship banking in turns, that's a nice touch." He tests the limits — zoom, camera rotation, performance with many enemies.

**Climax**: At 5 minutes, the screen is filled with effects. FPS remains stable. "They optimized well." He reaches the boss, appreciates the cinematic wormhole transition.

**Resolution**: He notes his observations: concept originality, technical quality, visual polish, performance. "This one deserves a top spot."

**Capabilities Revealed**: Fast load, visual polish, shader quality, smooth animations, stable performance, technical excellence

---

### Journey 4: Tom, the Curious Friend

**Situation**: Tom receives a Discord message from his buddy Adam: "Yo, check my game for the Three.js contest" with a link.

**Opening Scene**: Tom clicks. No download. "Oh it's directly in the browser, convenient." He sees the menu, clicks Play without reading instructions.

**Rising Action**: He understands controls in 10 seconds. "Ah ok I move, it shoots automatically." He dies quickly the first time. "Wait, let me try again." Second run, he understands level-up, picks weapons, survives longer.

**Climax**: He reaches 8 minutes, sees his ship become overpowered. "Wow the effects are so cool!" He takes a screenshot of the on-screen chaos.

**Resolution**: He replies on Discord: "Dude this is awesome! I made it to 8 min, what's your score?" He shares the link in another server. "You guys need to try this."

**Capabilities Revealed**: Shareable URL, no-friction onboarding, learn-by-playing, screenshot-worthy moments, social sharing

---

### Journey Requirements Summary

| Journey | Key Capabilities Required |
|---------|--------------------------|
| **Casual (Alex)** | Instant load, no account, intuitive controls, auto-fire, quick satisfaction, bookmarkable |
| **Engaged (Marie)** | Build diversity, strategic depth, planet rewards, boss mechanics, tunnel choices, meta-progression |
| **Judge (Bruno)** | Technical excellence, shader quality, stable FPS, smooth animations, visual polish |
| **Friend (Tom)** | Shareable URL, zero-friction start, learn-by-playing, screenshot moments, social hooks |

## Innovation & Novel Patterns

### Detected Innovation Areas

1. **Genre Mixing: 3D Survivors-like in Browser**
   - Combining survivors-like gameplay + 3D graphics + WebGL browser delivery
   - No quality competitor exists in this intersection (Blue Ocean)
   - Differentiates from 2D pixel art standard of the genre

2. **First-of-Kind Positioning**
   - "First quality 3D space survivors-like playable instantly in browser"
   - Zero-download, zero-account barrier to entry
   - Unique value proposition for contest and market

3. **Wormhole Tunnel Hub Concept**
   - Strategic decision hub between systems (upgrades + dilemmas + HP sacrifice)
   - Breaks the continuous flow of traditional survivors-like
   - Adds roguelite depth without complexity overhead

4. **Space Theme Differentiation**
   - Majority of survivors-like use fantasy/medieval themes
   - "Interstellar" narrative (saving humanity) adds emotional stakes
   - Enables unique visual language (nebulas, stars, cosmic enemies)

### Validation Approach

| Innovation | Validation Method |
|------------|-------------------|
| 3D Browser | Performance testing across browsers, FPS benchmarks |
| Genre mixing | Tester feedback on "feel" vs Vampire Survivors |
| Tunnel hub | Playtest: do players engage with decisions or skip? |
| Space theme | Visual impact assessment, contest judge feedback |

### Risk Mitigation

| Risk | Mitigation |
|------|------------|
| 3D performance issues | Aggressive optimization, LOD, instancing, particle limits |
| Too complex for casual | Keep controls simple (WASD + auto-fire), complexity in builds not inputs |
| Tunnel breaks flow | Make it quick, visually rewarding, decisions meaningful but fast |
| Space theme feels generic | Strong visual identity, unique enemy designs, distinctive audio |

## Game (Browser WebGL) Specific Requirements

### Technical Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | React Three Fiber | v9.1.0 |
| React | React | v19.0 |
| 3D Engine | Three.js | v0.174.0 |
| Helpers | Drei | v10.0.4 |
| Physics | Rapier | v2.0 |
| State | Zustand | v5.0 |
| Build | Vite | v6.2.2 |
| Effects | Postprocessing | v3.0.4 |
| Debug | Leva + r3f-perf | latest |

### Asset Pipeline

| Asset Type | Format | Source | Loading |
|------------|--------|--------|---------|
| 3D Models | GLB/GLTF | Polypizza, free assets | useGLTF (Drei) |
| Textures | PNG/WebP | Bundled or lazy-loaded | useTexture (Drei) |
| Audio | MP3/OGG | itch.io free assets | Howler.js or Web Audio API |
| Fonts | WOFF2 | Google Fonts or bundled | CSS @font-face |

### State Architecture

**Existing stores to extend:**
- `useGame` — Game phases, timer, score → extend for HP, XP, weapons, boons
- `useCameraStore` — Camera state
- `useControlsStore` — Input handling

**New stores needed:**
- `usePlayer` — HP, position, active weapons, active boons, invulnerability state
- `useEnemies` — Enemy pool, spawn logic, positions
- `useWeapons` — Weapon definitions, levels, cooldowns
- `useBoons` — Boon definitions, active effects
- `useLevel` — Current system, timer, planets, wormhole state

### Performance Considerations

| Concern | Strategy |
|---------|----------|
| Many enemies | InstancedMesh for enemy rendering |
| Projectiles | Object pooling, reuse geometries |
| Particles | GPU particles via postprocessing or custom shaders |
| Frame budget | r3f-perf monitoring, 60 FPS target |
| Memory | Dispose textures/geometries on scene transitions |
| Mobile (bonus) | LOD, reduced particle counts, touch controls |

### Implementation Considerations

- **Collision detection**: Rapier for physics-based or custom spatial hashing for performance
- **Camera**: Top-down follow with smooth interpolation (existing hooks can be adapted)
- **Controls**: Existing `useHybridControls` hook as base, adapt for WASD + potential touch
- **Audio**: Consider Howler.js for cross-browser audio management, spatial audio optional

## Project Scoping & Phased Development

### Resource Assessment

| Resource | Value |
|----------|-------|
| Team | Solo developer |
| Time/day | 3-4 hours |
| Deadline | End of February 2026 |
| Total dev time | ~70-90 hours |

### MVP Strategy & Philosophy

**MVP Approach:** Experience MVP — prove the "3D survivors-like in browser" feels good and looks impressive

**Contest Strategy:** Tier 2 as primary target, Tier 3 elements as stretch goals

**Core Principle:** Polish over quantity — a polished Tier 2 beats a buggy Tier 3

### Realistic Scope Assessment

| Phase | Feasibility | Priority |
|-------|-------------|----------|
| **Tier 1 (MVP)** | Must complete | Week 1-2 |
| **Tier 2 (Contest)** | Primary target | Week 2-3 |
| **Tier 3 (Stretch)** | If time permits | Final days |

### Risk Mitigation Strategy

**Technical Risk #1: Performance with many enemies**
- Mitigation: InstancedMesh from day 1, object pooling, enemy cap (~50-100 max on screen)
- Fallback: Reduce enemy count, simplify visuals if FPS drops
- Test early: Stress test with 100+ enemies before adding features

**Technical Risk #2: Balancing (weapons, enemies, progression)**
- Mitigation: Start with simple values, iterate based on playtesting
- Fallback: Copy Vampire Survivors ratios as baseline
- Approach: "Feel good first, balance later" — fun > perfect balance for contest

**Resource Risk: Time crunch**
- Mitigation: Strict tier discipline — finish Tier 1 completely before starting Tier 2
- Fallback: Ship polished Tier 1 + partial Tier 2 rather than buggy Tier 3
- Decision point: Week 2 assessment — if behind, cut Tier 3 entirely

### Development Milestones

| Week | Target | Deliverable |
|------|--------|-------------|
| **Week 1** | Tier 1 core | Playable loop: move, shoot, enemies, XP, level-up |
| **Week 2** | Tier 1 complete + Tier 2 start | 1 system playable, basic UI, boss started |
| **Week 3** | Tier 2 focus | Boss, tunnel, dash, planets, audio |
| **Final days** | Polish + Tier 3 stretch | Bug fixes, visual polish, 2nd system if time |

## Functional Requirements

### Player Control

- **FR1**: Player can move the spaceship in all directions using keyboard (WASD/arrows)
- **FR2**: Player can see the spaceship rotate smoothly toward movement direction
- **FR3**: Player can see the spaceship bank/tilt during turns
- **FR4**: Player can perform a dash/barrel roll to become temporarily invulnerable (Tier 2)
- **FR5**: Player can see visual feedback when invulnerable during dash

### Combat System

- **FR6**: Player's spaceship automatically fires weapons in facing direction
- **FR7**: Player can deal damage to enemies when projectiles hit them
- **FR8**: Player can see enemies die with visual feedback (explosion/particles)
- **FR9**: Player can equip up to 4 weapons simultaneously (slot 1 = base weapon fixed)
- **FR10**: Player can see weapon projectiles with distinct visuals per weapon type
- **FR11**: Player can upgrade weapons through level-up choices (levels 1-9)

### Progression System

- **FR12**: Player can gain XP by killing enemies
- **FR13**: Player can see XP bar filling toward next level
- **FR14**: Player can choose between weapon or boon options when leveling up
- **FR15**: Player can equip up to 3 boons that affect all weapons globally
- **FR16**: Player can see current HP and take damage from enemies
- **FR17**: Player can die when HP reaches zero (game over)

### Enemy System

- **FR18**: System spawns enemies progressively over time
- **FR19**: Player can encounter different enemy types with distinct behaviors
- **FR20**: Player can see enemies visually distinct by type
- **FR21**: Enemies can deal damage to player on contact or via projectiles
- **FR22**: System increases enemy spawn rate/difficulty over time

### Environment & Exploration

- **FR23**: Player can navigate a space environment with visual boundaries
- **FR24**: Player can see planets of different tiers (silver/gold/platinum) (Tier 2)
- **FR25**: Player can scan planets by staying within their zone (Tier 2)
- **FR26**: Player can receive rewards (weapons/boons) from scanned planets (Tier 2)
- **FR27**: Player loses scan progress if leaving planet zone before completion (Tier 2)

### Boss Encounters (Tier 2)

- **FR28**: Player can find and activate a dormant wormhole
- **FR29**: System clears all enemies with shockwave when wormhole activates
- **FR30**: Player can fight a boss in isolated 1v1 arena
- **FR31**: Player can see boss attack patterns (telegraphed attacks)
- **FR32**: Player can defeat boss to complete the system

### Tunnel Hub (Tier 2)

- **FR33**: Player can enter wormhole tunnel between systems
- **FR34**: Player can spend Fragments on permanent upgrades in tunnel
- **FR35**: Player can accept or refuse dilemmas (bonus with malus)
- **FR36**: Player can sacrifice Fragments to recover HP (Tier 3)
- **FR37**: Player can exit tunnel to enter next system

### Game Flow & UI

- **FR38**: Player can see main menu with Play option
- **FR39**: Player can see HUD displaying HP, timer, XP, and minimap
- **FR40**: Player can see game over screen with stats when dying
- **FR41**: Player can see victory screen when completing all systems
- **FR42**: Player can restart from main menu after game over/victory
- **FR43**: System enforces 10-minute timer per system (game over if time expires)

### Audio & Feedback

- **FR44**: Player can hear background music during gameplay
- **FR45**: Player can hear sound effects for weapons, hits, level-ups
- **FR46**: Player can see visual feedback for damage taken (screen flash/shake)

## Non-Functional Requirements

### Performance

- **NFR1**: Game maintains 60 FPS on Chrome with mid-range hardware (GTX 1060 / M1 equivalent)
- **NFR2**: Game maintains 30+ FPS minimum during intense combat (100+ enemies on screen)
- **NFR3**: Initial load time < 10 seconds on average broadband connection
- **NFR4**: Scene transitions (tunnel, boss arena) complete within 2 seconds
- **NFR5**: No frame drops during level-up selection UI

### Compatibility

- **NFR6**: Full functionality on Chrome (latest 2 versions) — primary target
- **NFR7**: Playable on Firefox and Safari (latest versions) — secondary target
- **NFR8**: Graceful degradation on older browsers (error message, not crash)
- **NFR9**: Mobile browser playable as bonus (touch controls optional)

### Reliability

- **NFR10**: No crashes during a full 30-minute run
- **NFR11**: Game state auto-saves to localStorage between systems (Tier 2)
- **NFR12**: Graceful handling of browser tab unfocus (pause or continue)

### Usability

- **NFR13**: Controls learnable within 30 seconds without tutorial
- **NFR14**: Core gameplay understandable within first run
- **NFR15**: UI readable at 1080p resolution minimum


