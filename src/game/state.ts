import { SKILL_IDS, type ItemId, type SkillId } from './data'

export const SAVE_VERSION = 1

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
  }
}
