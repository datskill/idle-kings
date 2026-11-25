import { ACTIONS_BY_ID, buyPrice, MARKET_STOCK, TOOLS, type ActionDef, type ItemId, type SkillId, type ToolDef } from './data'
import type { GameState } from './state'
import { levelForXp } from './xp'

/** Offline progress is capped so a long absence stays fair and fast to compute. */
export const OFFLINE_CAP_MS = 12 * 60 * 60 * 1000

export type StopReason = 'missing_materials'

export interface TickReport {
  elapsedMs: number
  completions: number
  xp: Partial<Record<SkillId, number>>
  /** Net change per item: positive when produced, negative when consumed. */
  items: Partial<Record<ItemId, number>>
  levelsGained: Partial<Record<SkillId, number>>
  stopped: StopReason | null
}

export function emptyReport(): TickReport {
  return { elapsedMs: 0, completions: 0, xp: {}, items: {}, levelsGained: {}, stopped: null }
}

export function skillLevel(state: GameState, skill: SkillId): number {
  return levelForXp(state.skills[skill].xp)
}

export function owned(state: GameState, item: ItemId): number {
  return state.bank[item] ?? 0
}

/** The best tool the player owns for a skill, if any. */
export function bestTool(state: GameState, skill: SkillId): ToolDef | null {
  let best: ToolDef | null = null
  for (const t of TOOLS) {
    if (t.skill === skill && owned(state, t.item) > 0 && (!best || t.speed < best.speed)) best = t
  }
  return best
}

export function actionDuration(state: GameState, action: ActionDef): number {
  const tool = bestTool(state, action.skill)
  return Math.round(action.durationMs * (tool?.speed ?? 1))
}

/** How many times the player can afford the action's inputs right now. */
export function affordable(state: GameState, action: ActionDef): number {
  let n = Infinity
  for (const { item, qty } of action.consumes) n = Math.min(n, Math.floor(owned(state, item) / qty))
  return n
}

export function canStart(state: GameState, actionId: string): boolean {
  const action = ACTIONS_BY_ID[actionId]
  return !!action && skillLevel(state, action.skill) >= action.levelRequired && affordable(state, action) >= 1
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

function addItem(state: GameState, report: TickReport, item: ItemId, delta: number) {
  const next = owned(state, item) + delta
  if (next > 0) state.bank[item] = next
  else delete state.bank[item]
  report.items[item] = (report.items[item] ?? 0) + delta
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

  // Tools never change mid-action (crafting a tool consumes no tool), so the
  // duration is constant for the whole interval.
  const duration = actionDuration(state, action)
  active.progressMs += dtMs
  const wanted = Math.floor(active.progressMs / duration)
  const completions = Math.min(wanted, affordable(state, action))

  if (completions > 0) {
    const skill = state.skills[action.skill]
    const before = levelForXp(skill.xp)
    skill.xp += action.xp * completions
    const after = levelForXp(skill.xp)

    for (const { item, qty } of action.consumes) addItem(state, report, item, -qty * completions)
    for (const { item, qty } of action.produces) addItem(state, report, item, qty * completions)

    report.completions += completions
    report.xp[action.skill] = (report.xp[action.skill] ?? 0) + action.xp * completions
    if (after > before) {
      report.levelsGained[action.skill] = (report.levelsGained[action.skill] ?? 0) + (after - before)
    }
  }

  if (completions < wanted || affordable(state, action) < 1) {
    state.active = null
    report.stopped = 'missing_materials'
  } else {
    active.progressMs -= completions * duration
  }
  return report
}

/** Bring the state up to `now`, applying the offline cap. */
export function catchUp(state: GameState, now: number): TickReport {
  const elapsed = Math.min(Math.max(0, now - state.lastTick), OFFLINE_CAP_MS)
  state.lastTick = now
  return advance(state, elapsed)
}

/** Sell up to `qty` of an item at its resale price. */
export function sellItem(state: GameState, item: ItemId, qty: number, price: number): void {
  const n = Math.min(owned(state, item), Math.max(0, Math.floor(qty)))
  if (n === 0) return
  const next = owned(state, item) - n
  if (next > 0) state.bank[item] = next
  else delete state.bank[item]
  state.gold += n * price
}

/** Buy up to `qty` of a market item, limited by the gold the player has. Returns how many were bought. */
export function buyItem(state: GameState, item: ItemId, qty: number): number {
  if (!MARKET_STOCK.includes(item)) return 0
  const price = buyPrice(item)
  const n = Math.min(Math.max(0, Math.floor(qty)), Math.floor(state.gold / price))
  if (n === 0) return 0
  state.gold -= n * price
  state.bank[item] = owned(state, item) + n
  return n
}
