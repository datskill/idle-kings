import { SKILL_IDS, type ItemId, type SkillId } from './data'
import type { CombatState, CombatStyle, Slot } from './combat'
import type { BuildingId } from './domain'

export const SAVE_VERSION = 4

export interface ActiveAction {
  actionId: string
  progressMs: number
}

/** Lifetime counters shown on the statistics screen and used by goals. */
export interface GameStats {
  /** Simulated time, offline included. */
  playMs: number
  /** Gathering and crafting actions completed. */
  actions: number
  /** Items gathered or crafted, by item. */
  produced: Partial<Record<ItemId, number>>
  /** Enemies defeated, by enemy id. */
  kills: Record<string, number>
  defeats: number
  foodEaten: number
  taxes: number
  loot: number
  sales: number
  /** Écus spent on buildings, titles and the market. */
  spent: number
  itemsSold: number
  itemsBought: number
  /** Building levels built. */
  buildLevels: number
}

export function newStats(): GameStats {
  return { playMs: 0, actions: 0, produced: {}, kills: {}, defeats: 0, foodEaten: 0, taxes: 0, loot: 0, sales: 0, spent: 0, itemsSold: 0, itemsBought: 0, buildLevels: 0 }
}

export interface GameState {
  version: number
  createdAt: number
  /** Wall-clock time the simulation has been advanced to. */
  lastTick: number
  gold: number
  bank: Partial<Record<ItemId, number>>
  skills: Record<SkillId, { xp: number }>
  active: ActiveAction | null
  /** Building levels; missing = not built. */
  buildings: Partial<Record<BuildingId, number>>
  /** Index into TITLES. */
  title: number
  /** Current fight, or null. Mutually exclusive with `active`. */
  combat: CombatState | null
  /** Which skill gets the main share of combat XP. */
  combatStyle: CombatStyle
  equipment: Partial<Record<Slot, ItemId>>
  /** Food eaten automatically in combat. */
  food: ItemId | null
  hp: number
  stats: GameStats
  /** Goals whose reward has been collected. */
  goalsClaimed: string[]
}

export function newGame(now = Date.now()): GameState {
  return {
    version: SAVE_VERSION,
    createdAt: now,
    lastTick: now,
    gold: 0,
    bank: {},
    skills: Object.fromEntries(SKILL_IDS.map((id) => [id, { xp: 0 }])) as GameState['skills'],
    active: null,
    buildings: {},
    title: 0,
    combat: null,
    combatStyle: 'weapons',
    equipment: {},
    food: null,
    hp: 46,
    stats: newStats(),
    goalsClaimed: [],
  }
}
