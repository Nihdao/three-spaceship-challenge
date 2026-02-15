---
stepsCompleted: [1, 2, 3, 4]
session_active: false
workflow_completed: true
inputDocuments: []
session_topic: 'Implementation and prioritization of spaceship rogue-lite game improvements'
session_goals: 'Establish clear roadmap with prioritization, dependencies, and feature sequencing'
selected_approach: 'AI-Recommended Techniques'
techniques_used: ['Morphological Analysis', 'Six Thinking Hats', 'Solution Matrix']
ideas_generated: [28]
context_file: ''
---

# Brainstorming Session Results

**Facilitator:** Adam
**Date:** 2026-02-15

## Session Overview

**Topic:** Implementation and prioritization of spaceship rogue-lite game improvements

**Goals:** Establish clear roadmap with prioritization, dependencies, and feature sequencing

### Session Setup

Adam has developed 19 epics for a spaceship rogue-lite game and wants to discuss improvements that extend or sometimes challenge the initial architecture. The session focuses on organizing and prioritizing a comprehensive set of feature ideas across 7 major areas:

1. **Meta-progression** (Fragments system, permanent upgrades, ship leveling)
2. **UX Flow improvements** (Main menu, ship selection, galaxy choice)
3. **Controls revision** (Dual-stick: movement + independent aiming)
4. **Visual polish** (Particles, colors, darker space environments)
5. **Gameplay depth** (Enemy physics, tougher bosses, dynamic waves, rarity systems)
6. **Strategic choice systems** (Reroll/Banish/Skip, Respawn mechanics)
7. **Player feedback** (Global stats, Armory, visible progression)

The goal is to transform this comprehensive vision into an actionable implementation plan with clear priorities and sequencing.

## Technique Selection

**Approach:** AI-Recommended Techniques
**Analysis Context:** Implementation and prioritization of rogue-lite improvements with focus on roadmap and sequencing

**Recommended Techniques:**

- **Morphological Analysis:** Systematically map all ~30 features across key dimensions (player impact, technical complexity, architecture dependencies, dev cost)
- **Six Thinking Hats:** Evaluate feature clusters through 6 perspectives (facts, feelings, benefits, risks, creativity, process)
- **Solution Matrix:** Cross features with priority criteria to generate final sequenced roadmap

**AI Rationale:** Adam already has comprehensive feature ideas — the session needs structure and prioritization, not ideation. These three techniques progressively narrow from mapping to evaluation to actionable roadmap.

## Technique Execution Results

### Phase 1: Morphological Analysis — Feature Cartography

28 features mapped across 4 dimensions: Player Impact (1-5), Technical Complexity (1-5), Architecture Dependencies, Foundation vs Polish.

#### Cluster 1: Meta-Progression & Main Menu

| # | Feature | Impact | Complexity | Dependencies | F/P |
|---|---------|--------|------------|--------------|-----|
| 1 | Display Fragments (menu) | 3 | 1 | None | P |
| 2 | UPGRADES Menu screen | 4 | 3 | Depends on #3 | F |
| 3 | 14 Permanent Upgrades (Attack, Armor, MaxHP, Regen, AtkSpeed, Zone, Magnet, Luck, ExpBonus, Curse, Revival, Reroll, Skip, Banish) | 5 | 5 | FOUNDATION — #2,#4,#5 depend on it | F |
| 4 | Refund system | 4 | 1 | Depends on #3 | P |
| 5 | Enriched ship stats display | 3 | 2 | Depends on #3, #6 | P |
| 6 | Ship level (1-9) | 3 | 3 | Independent foundation | F |
| 7 | Level-based skins (tints at 3/6/9) | 3 | 2 | Depends on #6 | P |
| 8 | Galaxy choice screen | 4 | 3 | Independent | F |
| 9 | Galaxy challenges/modifiers (future) | 3 | 3 | Depends on #8 | P |

#### Cluster 2: In-Game Features

| # | Feature | Impact | Complexity | Dependencies | F/P |
|---|---------|--------|------------|--------------|-----|
| 10 | Purple vortex tint | 2 | 1 | None | P |
| 11 | Dual-stick controls (WASD + mouse aim) | 5 | 5 | FOUNDATION — #12,#13 depend on it | F |
| 12 | Crosshair | 4 | 1 | Depends on #11 | P |
| 13 | Ship inertia (acceleration/deceleration + proportional tilt) | 4 | 4 | Coupled with #11 | F |
| 14 | Particle trail | 2 | 2 | None | P |
| 15 | Less black universe (darker blue, per-galaxy) | 3 | 2 | None | P |
| 16 | Enemy physics (collision, no overlap) | 4 | 4 | Perf-sensitive, test after #11 | F |
| 17 | Tough boss (SpaceshipBoss.glb, ~100k HP, coexists with waves) | 5 | 3 | Related to #18 | F |
| 18 | Dynamic waves (non-linear, hard/easy alternation, progressive tiers) | 4 | 4 | Related to #17 | F |
| 19 | Boon/weapon rarity (white/blue/purple/gold, luck-influenced) | 3 | 3 | Related to #20 | F |
| 20 | Reroll/Banish/Skip mechanics | 4 | 3 | Related to #19 | F |
| 21 | Revival/Respawn (50% HP, 2-3s invincibility, UI) | 5 | 3 | Independent | F |
| 22 | Improved minimap (follows player, local zoom) | 4 | 2 | None | P |

#### Cluster 3: HUD & Long-Term Progression

| # | Feature | Impact | Complexity | Dependencies | F/P |
|---|---------|--------|------------|--------------|-----|
| 23 | Rectangular HP bar redesign ("80/100" inside) | 2 | 1 | None | P |
| 24 | Persistent global stats (kills, time survived, most used weapons/boons) | 2 | 3 | Foundation for #25 | F |
| 25 | Stats screen (main menu) | 2 | 2 | Depends on #24 | P |
| 26 | Armory screen (weapons/boons/items catalog) | 3 | 2 | None | P |
| 27 | Items system (future — DOT, longer dodge, etc.) | 3 | 4 | Future | F |
| 28 | Cumulative timer (remaining time carries between systems) | 4 | 2 | None | F |

### Phase 2: Six Thinking Hats — Multi-Angle Evaluation

**White Hat (Facts):**
- 4 features at Impact 5: #3, #11, #17, #21
- 2 features at Complexity 5: #3, #11 (the two biggest efforts)
- 3 dependency chains: #3→(#2,#4,#5) | #11→(#12,#13) | #24→#25
- Best Impact/Complexity ratios: #21 (5/3), #17 (5/3), #28 (4/2)
- 5 quick wins (complexity 1-2): #1, #10, #12, #23, #22

**Red Hat (Feelings):**
- #11 (dual-stick) is THE pivotal game differentiator vs Vampire Survivors / Megabonk
- #3 (permanent upgrades) is the "one more run" factor that makes it a true rogue-lite
- Visual features (#10, #14, #15) feel good but don't change gameplay
- Adam's main concern: performance impact, not implementation difficulty

**Yellow Hat (Benefits):**
- #3 unlocks the entire meta-game loop: upgrades → menu → refund → stats display
- #11 unlocks tactical depth: aiming → crosshair → inertia → justifies harder enemies
- #21 + #20 together create a safety net allowing players to accept increasing difficulty

**Black Hat (Risks):**
- #11 + #13: Inertia poorly calibrated with dual-stick could feel sluggish — needs playtest iteration
- #16: Hundreds of mobs with separation forces could tank performance — needs spatial optimization
- #18 + #16 combined: Spawn peaks + physics = potential frame drops
- #3 at 14 upgrades at once: Scope creep risk — should be phased in batches

**Green Hat (Creative Insights):**
- Phase #3 in 3 batches: combat stats → utility stats → meta stats
- #16 and #18 reinforce each other: collision + wave alternation creates natural mob walls
- Sequential development (no branching) since features are done one at a time

**Blue Hat (Process Synthesis):**
- Two foundations first (#3, #11) — everything else depends on or benefits from them
- Quick wins sprinkled between heavy features for momentum
- Perf-sensitive features (#16, #18) after #11 for proper testing with real controls
- Meta-game content (#6, #8, #24-26) last — depth, not foundation

### Phase 3: Solution Matrix — Prioritized Roadmap

#### Epic 20 — Permanent Upgrades System (Meta-Game Foundation)

| Order | # | Feature | Impact | Complexity |
|-------|---|---------|--------|------------|
| 20.1 | 3 | Upgrades batch 1: Attack, Armor, MaxHP, Regen, AtkSpeed, Zone | 5 | 3 |
| 20.2 | 2 | UPGRADES Menu screen | 4 | 3 |
| 20.3 | 1 | Display Fragments | 3 | 1 |
| 20.4 | 3 | Upgrades batch 2: Magnet, Luck, ExpBonus, Curse | 5 | 2 |
| 20.5 | 3 | Upgrades batch 3: Revival, Reroll, Skip, Banish | 5 | 2 |
| 20.6 | 4 | Refund system | 4 | 1 |
| 20.7 | 5 | Enriched ship stats display | 3 | 2 |
| 20.8 | 23 | HP bar redesign | 2 | 1 |

#### Epic 21 — Dual-Stick Controls (Gameplay Foundation)

| Order | # | Feature | Impact | Complexity |
|-------|---|---------|--------|------------|
| 21.1 | 11 | Dual-stick controls | 5 | 5 |
| 21.2 | 12 | Crosshair | 4 | 1 |
| 21.3 | 13 | Ship inertia | 4 | 4 |
| 21.4 | 10 | Purple vortex | 2 | 1 |

#### Epic 22 — Combat Depth (Strategic Systems)

| Order | # | Feature | Impact | Complexity |
|-------|---|---------|--------|------------|
| 22.1 | 21 | Revival/Respawn | 5 | 3 |
| 22.2 | 20 | Reroll/Banish/Skip | 4 | 3 |
| 22.3 | 19 | Boon/weapon rarity | 3 | 3 |
| 22.4 | 17 | Tough boss | 5 | 3 |

#### Epic 23 — Wave & Enemy Systems (Dynamic Pressure)

| Order | # | Feature | Impact | Complexity |
|-------|---|---------|--------|------------|
| 23.1 | 18 | Dynamic waves | 4 | 4 |
| 23.2 | 16 | Enemy physics | 4 | 4 |
| 23.3 | 28 | Cumulative timer | 4 | 2 |

#### Epic 24 — Visual Polish & QoL

| Order | # | Feature | Impact | Complexity |
|-------|---|---------|--------|------------|
| 24.1 | 22 | Improved minimap | 4 | 2 |
| 24.2 | 15 | Less black universe | 3 | 2 |
| 24.3 | 14 | Particle trail | 2 | 2 |

#### Epic 25 — Meta & Content

| Order | # | Feature | Impact | Complexity |
|-------|---|---------|--------|------------|
| 25.1 | 6 | Ship level (1-9) | 3 | 3 |
| 25.2 | 7 | Level-based skins | 3 | 2 |
| 25.3 | 8 | Galaxy choice screen | 4 | 3 |
| 25.4 | 26 | Armory screen | 3 | 2 |
| 25.5 | 24 | Persistent global stats | 2 | 3 |
| 25.6 | 25 | Stats screen | 2 | 2 |

#### Future (Out of Scope)

- #9 Galaxy Challenges
- #27 Items system

### Sequencing Rationale

- **Epic 20 → 21**: Both foundations. Upgrades first because it enriches the existing game loop without breaking current controls.
- **Epic 22 after both foundations**: Strategic systems leverage upgrades (revival, reroll as permanent stats) and benefit from dual-stick (player can handle pressure).
- **Epic 23 after 22**: Dynamic waves + enemy physics must be tested with real controls and real difficulty systems.
- **Epic 24-25 last**: Polish and content — the game is already solid at this point.
- **Quick wins (#1, #10, #12, #23) sprinkled within epics** for development momentum.

## Idea Organization and Prioritization

**Thematic Organization:**

| Theme | Features | Epic | Priority |
|-------|----------|------|----------|
| Meta-Game Foundation | #1, #2, #3, #4, #5, #23 | Epic 20 | Top |
| Controls Revolution | #10, #11, #12, #13 | Epic 21 | Top |
| Strategic Combat | #17, #19, #20, #21 | Epic 22 | High |
| Dynamic Pressure | #16, #18, #28 | Epic 23 | High |
| Visual Polish | #14, #15, #22 | Epic 24 | Standard |
| Meta Content | #6, #7, #8, #24, #25, #26 | Epic 25 | Standard |
| Future Scope | #9, #27 | — | Deferred |

**Prioritization Results:**

- **Top Priority:** Epic 20 (Permanent Upgrades) and Epic 21 (Dual-Stick Controls) — the two foundations everything else builds on
- **Quick Win Opportunities:** #1, #10, #12, #23, #28 — low complexity, sprinkled between heavy features
- **Breakthrough Concept:** Dual-stick aiming (#11) as game differentiator vs Vampire Survivors / Megabonk genre

**Action Planning:**

1. Transform Epics 20-25 into BMad stories in backlog
2. Start with Epic 20.1 — permanent upgrades store (batch 1: Attack, Armor, MaxHP, Regen, AtkSpeed, Zone)
3. Phase #3 in 3 batches to manage scope: combat → utility → meta stats
4. Monitor performance on #16 and #18 with profiling during development

## Session Summary and Insights

**Key Achievements:**

- 28 features fully cartographied across 4 dimensions (Impact, Complexity, Dependencies, Foundation/Polish)
- 6 sequenced epics with clear dependency chains and rationale
- Risk-aware ordering: perf-sensitive features placed after control refactor
- Phasing strategy for the largest feature (#3) to prevent scope creep

**Session Reflections:**

This session transformed a rich but unstructured vision into a clear, sequenced implementation plan. The Morphological Analysis revealed the true dependency structure, Six Thinking Hats challenged assumptions about priority (notably surfacing performance as the primary risk), and the Solution Matrix produced a roadmap that balances ambition with pragmatism. The key insight: two foundations (#3 and #11) must come first because they fundamentally change what the game is — everything else is built on top.

## Creative Facilitation Narrative

Adam came into this session with a comprehensive and ambitious vision for evolving his spaceship rogue-lite. Rather than needing idea generation, the session focused on structuring and prioritizing ~28 features across 7 major areas. The three-phase approach (Morphological Analysis → Six Thinking Hats → Solution Matrix) progressively narrowed from mapping to evaluation to actionable roadmap. Key breakthrough: identifying the two critical foundations (#3 Permanent Upgrades and #11 Dual-Stick Controls) that unlock everything else, and phasing #3 into 3 batches to reduce scope risk. Adam's main concern — performance — was addressed by sequencing perf-sensitive features (#16, #18) after the control refactor for proper testing.
