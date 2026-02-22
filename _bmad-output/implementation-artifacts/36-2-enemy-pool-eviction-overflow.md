# Story 36.2: Enemy Pool Eviction on Overflow

Status: backlog

## Story

As a developer,
I want new enemy waves to always spawn even when the pool is full,
So that late-game tension never stalls due to stale old-wave enemies.

## Acceptance Criteria

1. **[Eviction au lieu de discard]** Quand `spawnEnemies(instructions)` est appelé et que `enemies.length >= MAX_ENEMIES_ON_SCREEN`, le code N'échoue plus silencieusement. À la place, les ennemis les plus vieux non-élites sont évincés pour faire de la place.

2. **[Nombre d'évictions minimal]** Exactement `max(0, (enemies.length + instructions.length) - MAX_ENEMIES_ON_SCREEN)` ennemis sont évincés — ni plus ni moins.

3. **[Critère "plus vieux"]** Les ennemis sont triés par ID numérique (suffixe de `enemy_${n}`) : le plus petit ID = le plus vieux = le premier évincé.

4. **[Ennemis protégés]** Les ennemis avec `behavior === 'boss'` ou `tier === 'ELITE'` ne sont JAMAIS évincés. Si tous les ennemis évincables sont boss/elite, la vague est partiellement ou totalement ignorée (éviction aussi agressive que possible sans toucher aux protégés).

5. **[Eviction silencieuse]** Les ennemis évincés disparaissent sans explosion, sans drop XP, sans loot, sans `_teleportEvents`. Simple `splice` de l'array.

6. **[MAX_ENEMIES_ON_SCREEN inchangé]** La valeur reste 100 — seul le comportement "plein = discard" change en "plein = éviction".

7. **[Nouvelles vagues spawnent normalement]** Après éviction, les nouvelles vagues sont ajoutées à `enemies` en suivant le code de spawn normal (positions, behaviors, stats).

## Tasks / Subtasks

- [ ] Task 1: Localiser le code de spawn dans `useEnemies.jsx`
  - [ ] Trouver `spawnEnemies()` et le bloc `if (enemies.length >= MAX_ENEMIES_ON_SCREEN) return` (ou équivalent)

- [ ] Task 2: Implémenter la logique d'éviction
  - [ ] Calculer `slotsNeeded = Math.max(0, (enemies.length + instructions.length) - MAX_ENEMIES_ON_SCREEN)`
  - [ ] Si `slotsNeeded === 0` : aucune éviction, comportement normal
  - [ ] Filtrer les candidats à l'éviction : `enemies.filter(e => e.behavior !== 'boss' && e.tier !== 'ELITE')`
  - [ ] Trier par ID numérique croissant : `parseInt(e.id.replace('enemy_', ''))`
  - [ ] Prendre les `slotsNeeded` premiers candidats
  - [ ] Les retirer de `enemies` (filter ou splice)
  - [ ] Continuer avec le spawn des nouvelles vagues

- [ ] Task 3: Tests
  - [ ] Test : pool à 100/100 + 5 nouvelles vagues → 5 plus vieux non-elite évincés, pool reste à 100
  - [ ] Test : pool avec 95 normaux + 5 ELITE → tente d'évincer 5 normaux uniquement
  - [ ] Test : pool 100% boss/elite → nouvelles vagues partiellement ignorées (0 évictions possibles)
  - [ ] Test : les ennemis évincés ne génèrent pas de `_teleportEvents`
  - [ ] Test : après éviction, pool.length = MAX_ENEMIES_ON_SCREEN (ou ≤ si pas assez d'évincables)

## Technical Notes

**Logique d'éviction :**
```js
function spawnEnemies(instructions) {
  const enemies = get().enemies
  const slotsNeeded = Math.max(0, (enemies.length + instructions.length) - MAX_ENEMIES_ON_SCREEN)

  let currentEnemies = enemies
  if (slotsNeeded > 0) {
    // Candidats évincables : non-boss, non-elite
    const evictable = enemies
      .filter(e => e.behavior !== 'boss' && e.tier !== 'ELITE')
      .sort((a, b) => {
        const idA = parseInt(a.id.replace('enemy_', ''), 10)
        const idB = parseInt(b.id.replace('enemy_', ''), 10)
        return idA - idB
      })

    const toEvict = new Set(evictable.slice(0, slotsNeeded).map(e => e.id))
    currentEnemies = enemies.filter(e => !toEvict.has(e.id))
  }

  // Spawn les nouvelles vagues normalement
  const newEnemies = instructions.map(instr => createEnemy(instr, nextId++))
  set({ enemies: [...currentEnemies, ...newEnemies] })
}
```

**Performance note :**
Le tri est O(n log n) mais ne s'exécute que quand le pool est plein (cas rare en début de run). Pour 100 ennemis max, le tri est négligeable (< 0.1ms). Le `new Set(...)` pour l'éviction est O(k) où k = nombre d'évictions.

**Vérification du format ID :**
Avant d'implémenter, vérifier le format exact des IDs dans `useEnemies.jsx`. Si le format est différent de `enemy_${n}`, adapter le parsing. Si les IDs ne sont pas numériquement ordonnés (ex: UUIDs), utiliser le champ `spawnTime` si disponible, ou ajouter un champ `spawnOrder` lors du spawn.

**Cohérence avec le leash (36.1) :**
L'éviction est silencieuse et indépendante du leash. Un ennemi peut être à la fois candidat au leash (trop loin) ET à l'éviction (trop vieux) — l'éviction prend la priorité puisqu'elle se produit au moment du spawn, pas pendant le tick.
