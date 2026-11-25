// The player's domain: buildings, settlement tiers and noble titles (step 4).
import type { ItemId, SkillId, Stack } from './data'

export type BuildingId =
  | 'houses' | 'lumber_camp' | 'quarry' | 'fishing_pier'
  | 'carpenter' | 'mason_lodge' | 'forge' | 'bakehouse'
  | 'market_hall' | 'church' | 'walls' | 'castle'

export type BuildingEffect =
  /** Each level makes one skill's actions faster. */
  | { kind: 'speed'; skill: SkillId; perLevel: number }
  /** Each level adds écus per minute of taxes. */
  | { kind: 'tax'; perLevel: number }
  /** Each level multiplies all taxes. */
  | { kind: 'taxMultiplier'; perLevel: number }
  /** Each level raises resale prices. */
  | { kind: 'sellBonus'; perLevel: number }
  /** No direct effect; required for later content. */
  | { kind: 'none' }

export interface BuildingDef {
  id: BuildingId
  name: string
  icon: string
  description: string
  maxLevel: number
  /** Settlement tier index required to build the first level. */
  tierRequired: number
  /** Cost of level 1; each next level costs `growth` times more. */
  baseCost: { gold: number; items: Stack[] }
  growth: number
  effect: BuildingEffect
}

const st = (item: ItemId, qty: number): Stack => ({ item, qty })

export const BUILDINGS: BuildingDef[] = [
  {
    id: 'houses', name: 'Maisons', icon: '🏠', description: 'Accueillent des familles qui paient la taille.',
    maxLevel: 15, tierRequired: 0, growth: 1.35,
    baseCost: { gold: 20, items: [st('birch_plank', 10), st('rubble', 5)] },
    effect: { kind: 'tax', perLevel: 2 },
  },
  {
    id: 'lumber_camp', name: 'Camp de bûcherons', icon: '🪓', description: 'Des bras en plus pour abattre les arbres.',
    maxLevel: 5, tierRequired: 0, growth: 1.8,
    baseCost: { gold: 30, items: [st('birch_plank', 15)] },
    effect: { kind: 'speed', skill: 'woodcutting', perLevel: 0.04 },
  },
  {
    id: 'quarry', name: 'Carrière', icon: '⛏️', description: 'Étais et treuils pour les mineurs.',
    maxLevel: 5, tierRequired: 0, growth: 1.8,
    baseCost: { gold: 30, items: [st('birch_plank', 10), st('rubble', 10)] },
    effect: { kind: 'speed', skill: 'mining', perLevel: 0.04 },
  },
  {
    id: 'fishing_pier', name: 'Ponton de pêche', icon: '🎣', description: 'Des barques et des filets partagés.',
    maxLevel: 5, tierRequired: 0, growth: 1.8,
    baseCost: { gold: 30, items: [st('oak_plank', 8)] },
    effect: { kind: 'speed', skill: 'fishing', perLevel: 0.04 },
  },
  {
    id: 'carpenter', name: 'Atelier du charpentier', icon: '🪚', description: 'Établis et outils de qualité.',
    maxLevel: 5, tierRequired: 1, growth: 1.8,
    baseCost: { gold: 80, items: [st('oak_plank', 20), st('bronze_bar', 5)] },
    effect: { kind: 'speed', skill: 'carpentry', perLevel: 0.04 },
  },
  {
    id: 'mason_lodge', name: 'Loge des maçons', icon: '🧱', description: 'La confrérie des tailleurs de pierre.',
    maxLevel: 5, tierRequired: 1, growth: 1.8,
    baseCost: { gold: 80, items: [st('oak_plank', 10), st('dressed_stone', 15)] },
    effect: { kind: 'speed', skill: 'stonecutting', perLevel: 0.04 },
  },
  {
    id: 'forge', name: 'Forge du village', icon: '⚒️', description: 'Un bas fourneau et une enclume solide.',
    maxLevel: 5, tierRequired: 1, growth: 1.8,
    baseCost: { gold: 100, items: [st('dressed_stone', 15), st('bronze_bar', 10)] },
    effect: { kind: 'speed', skill: 'smithing', perLevel: 0.04 },
  },
  {
    id: 'bakehouse', name: 'Four banal', icon: '🍳', description: 'Le four commun où tout le village cuisine.',
    maxLevel: 5, tierRequired: 1, growth: 1.8,
    baseCost: { gold: 80, items: [st('rubble', 20), st('oak_plank', 10)] },
    effect: { kind: 'speed', skill: 'cooking', perLevel: 0.04 },
  },
  {
    id: 'market_hall', name: 'Halle du marché', icon: '🏪', description: 'Attire les marchands : tu revends plus cher.',
    maxLevel: 5, tierRequired: 1, growth: 2,
    baseCost: { gold: 300, items: [st('oak_plank', 30), st('dressed_stone', 20)] },
    effect: { kind: 'sellBonus', perLevel: 0.05 },
  },
  {
    id: 'church', name: 'Église', icon: '⛪', description: 'Rassemble la paroisse et fait prospérer le domaine.',
    maxLevel: 5, tierRequired: 2, growth: 2,
    baseCost: { gold: 1500, items: [st('dressed_stone', 60), st('ash_plank', 30), st('silver_bar', 5)] },
    effect: { kind: 'taxMultiplier', perLevel: 0.1 },
  },
  {
    id: 'walls', name: 'Remparts', icon: '🛡️', description: 'Protègent la ville. Indispensables avant un château.',
    maxLevel: 3, tierRequired: 2, growth: 2.2,
    baseCost: { gold: 3000, items: [st('dressed_stone', 120), st('iron_bar', 30)] },
    effect: { kind: 'none' },
  },
  {
    id: 'castle', name: 'Château', icon: '🏰', description: 'Le siège de ta lignée. Chaque niveau augmente fortement les impôts.',
    maxLevel: 3, tierRequired: 3, growth: 2.5,
    baseCost: { gold: 25000, items: [st('dressed_stone', 300), st('beech_plank', 100), st('steel_bar', 50), st('gold_bar', 10)] },
    effect: { kind: 'taxMultiplier', perLevel: 0.5 },
  },
]

export const BUILDINGS_BY_ID = Object.fromEntries(BUILDINGS.map((b) => [b.id, b])) as Record<BuildingId, BuildingDef>
export const BUILDING_IDS = BUILDINGS.map((b) => b.id)

export function buildingCost(def: BuildingDef, nextLevel: number): { gold: number; items: Stack[] } {
  const f = Math.pow(def.growth, nextLevel - 1)
  return {
    gold: Math.ceil(def.baseCost.gold * f),
    items: def.baseCost.items.map(({ item, qty }) => ({ item, qty: Math.ceil(qty * f) })),
  }
}

/** Settlement tiers, reached by the total number of building levels. */
export interface TierDef {
  name: string
  minLevels: number
  /** Taxes are multiplied by this. */
  taxMultiplier: number
}

export const TIERS: TierDef[] = [
  { name: 'Hameau', minLevels: 0, taxMultiplier: 1 },
  { name: 'Village', minLevels: 8, taxMultiplier: 1.5 },
  { name: 'Bourg', minLevels: 22, taxMultiplier: 2.5 },
  { name: 'Ville', minLevels: 40, taxMultiplier: 4 },
]

/** Noble titles, bought in order. The first one is the starting title. */
export interface TitleDef {
  name: string
  cost: number
  tierRequired: number
  /** Extra requirement: building at minimum level. */
  building?: { id: BuildingId; level: number }
  /** Bonus to all XP gained, e.g. 0.05 = +5 %. */
  xpBonus: number
  /** Bonus to taxes. */
  taxBonus: number
}

export const TITLES: TitleDef[] = [
  { name: 'Seigneur', cost: 0, tierRequired: 0, xpBonus: 0, taxBonus: 0 },
  { name: 'Baron', cost: 2_000, tierRequired: 1, xpBonus: 0.05, taxBonus: 0.1 },
  { name: 'Vicomte', cost: 12_000, tierRequired: 2, xpBonus: 0.1, taxBonus: 0.25 },
  { name: 'Comte', cost: 40_000, tierRequired: 2, building: { id: 'church', level: 2 }, xpBonus: 0.15, taxBonus: 0.45 },
  { name: 'Duc', cost: 150_000, tierRequired: 3, building: { id: 'walls', level: 3 }, xpBonus: 0.2, taxBonus: 0.7 },
  { name: 'Roi', cost: 1_000_000, tierRequired: 3, building: { id: 'castle', level: 3 }, xpBonus: 0.3, taxBonus: 1 },
]
