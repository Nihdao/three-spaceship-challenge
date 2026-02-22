# Epic 37: Companion & UI Polish

Reskin du composant `CompanionDialogue` pour respecter le design system Redshift (correction de tous les anti-patterns identifiés), ajout de nouveaux dialogues orientés exploration/scan, et mise à jour du dialogue de spawn du trou de ver pour le nouveau déclencheur scan-based.

## Epic Goals

- Corriger les 7 anti-patterns Redshift dans `CompanionDialogue.jsx` (Inter, blur, rgba white border, `#cc66ff` hardcodé, `rgba(0,0,0,0.75)`)
- Ajouter des lignes de dialogue d'arrivée mentionnant la mission de scan des planètes
- Ajouter un événement `'near-wormhole-threshold'` pour signaler au joueur qu'il est proche du déclenchement
- Vérifier la cohérence du dialogue `'wormhole-spawn'` avec le nouveau déclencheur (scan vs timer)

## Epic Context

`CompanionDialogue.jsx` contient exactement les anti-patterns listés dans le Redshift design system : `fontFamily: 'Inter, system-ui'`, `background: rgba(0,0,0,0.75)` + `backdropFilter: blur(4px)`, `border: rgba(255,255,255,0.1)`, `color: '#cc66ff'` hardcodé. Par ailleurs, les dialogues d'arrivée système ne mentionnent pas la mission de scan des planètes pour trouver le trou de ver — ce qui laisse le joueur sans guidance narrative au début de la partie. Cet epic est court mais finalise l'identité visuelle du système companion et aligne le contenu narratif avec les nouvelles mécaniques d'exploration de l'Epic 34.

## Stories

### Story 37.1: CompanionDialogue Reskin — Redshift Design System

As a player,
I want the companion dialogue to match the Redshift visual identity,
So that the UI feels cohesive and intentional rather than generic.

**Acceptance Criteria:**

**Given** the companion dialogue panel
**When** rendered
**Then** `background` is `var(--rs-bg-surface)` (opaque — pas de backdrop-filter)
**And** `backdropFilter` / `blur` est supprimé
**And** `border` is replaced by `border-left: 3px solid var(--rs-violet)` (identification du personnage)
**And** `border-radius` est remplacé par un `clip-path` angulaire: `polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)`

**Given** typography
**When** companion panel renders text
**Then** companion name uses `font-family: 'Rajdhani', sans-serif`, `font-weight: 700`, `color: var(--rs-violet)`, `letter-spacing: 0.08em`, `font-size: 0.7rem`
**And** dialogue body uses `font-family: 'Rajdhani', sans-serif`, `font-weight: 400`, `color: var(--rs-text)`, `font-size: 0.875rem`
**And** `fontFamily: 'Inter, system-ui, sans-serif'` est supprimé

**Given** companion avatar
**When** image is loaded
**Then** avatar `border` is `2px solid var(--rs-violet)` (était absent ou rgba générique)
**And** `border-radius: 0.25rem` (moins arrondi — plus angulaire)

**Given** animation
**When** dialogue slides in or fades out
**Then** les animations `animate-companion-slide-in` et `animate-companion-fade-out` sont préservées (inchangées)

**Given** color values
**When** the component file is reviewed
**Then** no hardcoded hex values remain (`#cc66ff` → `var(--rs-violet)`, etc.)
**And** the 8 Redshift anti-patterns are absent from this component

### Story 37.2: Companion Dialogues — Exploration & Scan Guidance

As a player,
I want ARIA to hint at scanning planets when I arrive in a system,
So that the exploration objective is clear from the start without reading a tutorial.

**Acceptance Criteria:**

**Given** `companionDefs.js` — `system-arrival-*` events
**When** new lines are added to `system-arrival-1`, `system-arrival-2`, `system-arrival-3`
**Then** each event has at least 2 lines that mention scanning planets to find/open the wormhole
**And** the existing lines are preserved (new lines are added, not replacing)

**Example lines (à adapter):
- "Scan the planets in this sector — that's how we find the passage out."
- "Detecting multiple planet signatures. Get scanning, that's our way through."
- "The wormhole won't reveal itself. We need to sweep those planets first."
- "This system's wormhole is dormant. Scan enough planets and it'll wake up."

**Given** a new event `'near-wormhole-threshold'`
**When** the player scans a planet and `scannedCount === threshold - 1` (une planète avant le seuil)
**Then** `useCompanion.trigger('near-wormhole-threshold')` is called from GameLoop (dans la section scan completed)
**And** this event fires at most once per system (one-shot via `markShown` / `hasShown` pattern)

**Given** `companionDefs.js` — `'near-wormhole-threshold'` event
**When** defined
**Then** lines include:
- "One more scan. The wormhole is almost ready."
- "Almost there — one more planet and the passage opens."
- "Last scan. Do it and we're through."
**And** duration is 4 seconds

**Given** `'wormhole-spawn'` event
**When** reviewed for the new scan-based trigger
**Then** existing lines remain valid (they fire after the wormhole appears, not before)
**And** no changes needed to these lines (they're already neutral about the cause)

**Given** `system-arrival-1` specifically (first system, first run impression)
**When** player arrives in system 1
**Then** at least one line from the new pool is strongly directive: makes it clear that scanning planets is the primary task

## Technical Notes

**Redshift variables required (must be in `src/style.css` @theme):**
```css
--rs-bg-surface:  #1a1528;
--rs-violet:      #9b5de5;
--rs-text:        #f5f0e8;
--rs-border:      #2e2545;
```
Vérifier que ces variables existent avant d'implémenter — les ajouter si manquantes.

**`near-wormhole-threshold` trigger in GameLoop (section 7g — scan completed):**
```js
if (scanResult.completed) {
  stopScanLoop()
  playSFX('scan-complete')
  useGame.getState().triggerPlanetReward(scanResult.tier)

  // Near-threshold companion hint (one-shot)
  const scannedCount = useLevel.getState().planets.filter(p => p.scanned).length
  const threshold = /* galaxyConfig.wormholeThreshold × planetCount */
  if (scannedCount === threshold - 1 && !useCompanion.getState().hasShown('near-wormhole-threshold')) {
    useCompanion.getState().trigger('near-wormhole-threshold')
    useCompanion.getState().markShown('near-wormhole-threshold')
  }
}
```

**Anti-patterns à corriger dans CompanionDialogue.jsx (liste exhaustive):**
1. `fontFamily: 'Inter, system-ui, sans-serif'` → Rajdhani
2. `background: 'rgba(0,0,0,0.75)'` → `var(--rs-bg-surface)`
3. `backdropFilter: 'blur(4px)'` → supprimer
4. `border: '1px solid rgba(255,255,255,0.1)'` → `borderLeft: '3px solid var(--rs-violet)'`
5. `borderRadius: '0.75rem'` → clip-path angulaire
6. `color: '#cc66ff'` (nom companion) → `var(--rs-violet)`
7. Absence de Rajdhani → ajouter fontFamily sur les deux textes

**Files touched:**
- `src/ui/CompanionDialogue.jsx` — reskin complet (37.1)
- `src/entities/companionDefs.js` — nouvelles lignes scan, near-threshold event (37.2)
- `src/GameLoop.jsx` — trigger near-wormhole-threshold après scan (37.2)
- `src/style.css` — vérification/ajout des variables --rs-* si manquantes (37.1)

## Dependencies

- Epic 30 (Companion Narrative System) — infrastructure useCompanion, markShown/hasShown pattern
- Story 34.4 (Wormhole Scan Trigger) — le threshold est calculé depuis galaxyConfig (cohérence)
- Redshift Design System (skill chargé) — palette et typographie de référence

## Success Metrics

- Aucun anti-pattern Redshift dans `CompanionDialogue.jsx` post-story (QA: revue ligne par ligne)
- Le dialogue de début de partie inclut un message clair sur le scan des planètes (QA: 5 démarrages)
- Le message "one more scan" apparaît bien à la 11e planète (QA: debug scan rapide)
- Le composant ne casse pas visuellement sur les résolutions 1280×720 et 1920×1080 (QA: resize)
- `backdrop-filter` absent des outils dev Chrome (QA: inspect element)
