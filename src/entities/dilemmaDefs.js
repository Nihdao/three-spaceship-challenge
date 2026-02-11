// Dilemma definitions — risk/reward trade-offs offered in the tunnel hub
// Structure: DILEMMA_ID: { id, description, bonus, malus }
// Effect types: DAMAGE_MULT, SPEED_MULT, HP_MAX_MULT, COOLDOWN_MULT
// Each dilemma can only be accepted once per run
export const DILEMMAS = {
  HIGH_RISK: {
    id: 'HIGH_RISK',
    name: 'High Risk',
    description: '+30% DMG / -20% Max HP',
    bonus: { type: 'DAMAGE_MULT', value: 1.3 },
    malus: { type: 'HP_MAX_MULT', value: 0.8 },
  },
  GLASS_CANNON: {
    id: 'GLASS_CANNON',
    name: 'Glass Cannon',
    description: '+50% DMG / -50% Max HP',
    bonus: { type: 'DAMAGE_MULT', value: 1.5 },
    malus: { type: 'HP_MAX_MULT', value: 0.5 },
  },
  SLOW_TANK: {
    id: 'SLOW_TANK',
    name: 'Slow Tank',
    description: '+50% Max HP / -20% Speed',
    bonus: { type: 'HP_MAX_MULT', value: 1.5 },
    malus: { type: 'SPEED_MULT', value: 0.8 },
  },
  FRAGILE_SPEEDSTER: {
    id: 'FRAGILE_SPEEDSTER',
    name: 'Fragile Speedster',
    description: '+30% Speed / -30% Max HP',
    bonus: { type: 'SPEED_MULT', value: 1.3 },
    malus: { type: 'HP_MAX_MULT', value: 0.7 },
  },
  TRIGGER_HAPPY: {
    id: 'TRIGGER_HAPPY',
    name: 'Trigger Happy',
    description: '-30% Cooldown / -15% DMG',
    bonus: { type: 'COOLDOWN_MULT', value: 0.7 },
    malus: { type: 'DAMAGE_MULT', value: 0.85 },
  },
  BERSERKER: {
    id: 'BERSERKER',
    name: 'Berserker',
    description: '+40% DMG / -25% Speed',
    bonus: { type: 'DAMAGE_MULT', value: 1.4 },
    malus: { type: 'SPEED_MULT', value: 0.75 },
  },
}
