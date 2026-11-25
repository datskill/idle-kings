import { ACTIONS_BY_ID, type ItemId, type SkillId } from './data'
import type { GameState } from './state'
import { levelForXp } from './xp'

/** Offline progress is capped so a long absence stays fair and fast to compute. */
export const OFFLINE_CAP_MS = 12 * 60 * 60 * 1000

export interface TickReport {
  elapsedMs: number
  completions: number
  xp: Partial<Record<SkillId, number>>
  items: Partial<Record<ItemId, number>>
  levelsGained: Partial<Record<SkillId, number>>
}

export function emptyReport(): TickReport {
  return { elapsedMs: 0, completions: 0, xp: {}, items: {}, levelsGained: {} }
}

export function skillLevel(state: GameState, skill: SkillId): number {
  return levelForXp(state.skills[skill].xp)
}

export function canStart(state: GameState, actionId: string): boolean {
  const action = ACTIONS_BY_ID[actionId]
  return !!action && skillLevel(state, action.skill) >= action.levelRequired
}

/** Start (or toggle off) an action. Mutates state. */
export function toggleAction(state: GameState, actionId: string): void {
  if (state.active?.actionId === actionId) {
    state.active = null
    return
  }
  if (!canStart(state, actionId)) return
  state.active = { actionId, progressMs: 0 }
}

/**
 * Advance the simulation by `dtMs`. Mutates `state` and returns what happened.
 * Pure with respect to time: the caller decides how much time has passed.
 */
export function advance(state: GameState, dtMs: number, report: TickReport = emptyReport()): TickReport {
  if (dtMs <= 0) return report
  report.elapsedMs += dtMs
  const active = state.active
  if (!active) return report
  const action = ACTIONS_BY_ID[active.actionId]
  if (!action) {
    state.active = null
    return report
  }

  active.progressMs += dtMs
  const completions = Math.floor(active.progressMs / action.durationMs)
  if (completions === 0) return report
  active.progressMs -= completions * action.durationMs

  const skill = state.skills[action.skill]
  const before = levelForXp(skill.xp)
  const gainedXp = action.xp * completions
  skill.xp += gainedXp
  const after = levelForXp(skill.xp)

  for (const { item, qty } of action.produces) {
    const n = qty * completions
    state.bank[item] = (state.bank[item] ?? 0) + n
    report.items[item] = (report.items[item] ?? 0) + n
  }
  report.completions += completions
  report.xp[action.skill] = (report.xp[action.skill] ?? 0) + gainedXp
  if (after > before) {
    report.levelsGained[action.skill] = (report.levelsGained[action.skill] ?? 0) + (after - before)
  }
  return report
}

/** Bring the state up to `now`, applying the offline cap. */
export function catchUp(state: GameState, now: number): TickReport {
  const elapsed = Math.min(Math.max(0, now - state.lastTick), OFFLINE_CAP_MS)
  state.lastTick = now
  return advance(state, elapsed)
}

export function sellItem(state: GameState, item: ItemId, qty: number, price: number): void {
  const have = state.bank[item] ?? 0
  const n = Math.min(have, Math.max(0, Math.floor(qty)))
  if (n === 0) return
  state.bank[item] = have - n
  if (state.bank[item] === 0) delete state.bank[item]
  state.gold += n * price
}
