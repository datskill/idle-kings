import { SKILL_IDS, type ItemId, type SkillId } from './data'
import type { CombatState, CombatStyle, Slot } from './combat'
import type { BuildingId } from './domain'

export const SAVE_VERSION = 3

export interface ActiveAction {
  actionId: string
  progressMs: number
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
  }
}
