import { ACTIONS_BY_ID, buyPrice, ITEMS, MARKET_STOCK, TOOLS, type ActionDef, type ItemId, type SkillId, type ToolDef } from './data'
import { BUILDINGS, BUILDINGS_BY_ID, buildingCost, TIERS, TITLES, type BuildingId } from './domain'
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
  /** Écus collected in taxes. */
  taxes: number
}

export function emptyReport(): TickReport {
  return { elapsedMs: 0, completions: 0, xp: {}, items: {}, levelsGained: {}, stopped: null, taxes: 0 }
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

// ---------- Domain ----------

export function buildingLevel(state: GameState, id: BuildingId): number {
  return state.buildings[id] ?? 0
}

export function totalBuildingLevels(state: GameState): number {
  return BUILDINGS.reduce((sum, b) => sum + buildingLevel(state, b.id), 0)
}

/** Index into TIERS. */
export function settlementTier(state: GameState): number {
  const total = totalBuildingLevels(state)
  let tier = 0
  for (let i = 0; i < TIERS.length; i++) if (total >= TIERS[i].minLevels) tier = i
  return tier
}

function effectSum(state: GameState, match: (b: (typeof BUILDINGS)[number]) => number): number {
  return BUILDINGS.reduce((sum, b) => sum + match(b) * buildingLevel(state, b.id), 0)
}

/** Duration multiplier from buildings for a skill, e.g. 0.8 = 20 % faster. */
export function buildingSpeed(state: GameState, skill: SkillId): number {
  return 1 - effectSum(state, (b) => (b.effect.kind === 'speed' && b.effect.skill === skill ? b.effect.perLevel : 0))
}

export function sellBonus(state: GameState): number {
  return effectSum(state, (b) => (b.effect.kind === 'sellBonus' ? b.effect.perLevel : 0))
}

export function sellPriceOf(state: GameState, item: ItemId): number {
  return Math.round(ITEMS[item].sellPrice * (1 + sellBonus(state)) * 100) / 100
}

/** Taxes collected per minute. */
export function taxPerMinute(state: GameState): number {
  const base = effectSum(state, (b) => (b.effect.kind === 'tax' ? b.effect.perLevel : 0))
  const multiplier = 1 + effectSum(state, (b) => (b.effect.kind === 'taxMultiplier' ? b.effect.perLevel : 0)) + TITLES[state.title].taxBonus
  return base * multiplier * TIERS[settlementTier(state)].taxMultiplier
}

export function xpBonus(state: GameState): number {
  return TITLES[state.title].xpBonus
}

export type BuildCheck = { ok: true } | { ok: false; reason: string }

export function canBuild(state: GameState, id: BuildingId): BuildCheck {
  const def = BUILDINGS_BY_ID[id]
  const level = buildingLevel(state, id)
  if (level >= def.maxLevel) return { ok: false, reason: 'Niveau maximum atteint' }
  if (settlementTier(state) < def.tierRequired) return { ok: false, reason: `Nécessite : ${TIERS[def.tierRequired].name}` }
  const cost = buildingCost(def, level + 1)
  if (state.gold < cost.gold) return { ok: false, reason: 'Pas assez d’écus' }
  for (const { item, qty } of cost.items) if (owned(state, item) < qty) return { ok: false, reason: 'Matériaux manquants' }
  return { ok: true }
}

/** Build or upgrade one level. Returns true on success. */
export function build(state: GameState, id: BuildingId): boolean {
  if (!canBuild(state, id).ok) return false
  const level = buildingLevel(state, id)
  const cost = buildingCost(BUILDINGS_BY_ID[id], level + 1)
  state.gold -= cost.gold
  for (const { item, qty } of cost.items) {
    const next = owned(state, item) - qty
    if (next > 0) state.bank[item] = next
    else delete state.bank[item]
  }
  state.buildings[id] = level + 1
  return true
}

export function canBuyNextTitle(state: GameState): BuildCheck {
  const next = TITLES[state.title + 1]
  if (!next) return { ok: false, reason: 'Tu règnes déjà' }
  if (settlementTier(state) < next.tierRequired) return { ok: false, reason: `Nécessite : ${TIERS[next.tierRequired].name}` }
  if (next.building && buildingLevel(state, next.building.id) < next.building.level) {
    return { ok: false, reason: `Nécessite : ${BUILDINGS_BY_ID[next.building.id].name} niveau ${next.building.level}` }
  }
  if (state.gold < next.cost) return { ok: false, reason: 'Pas assez d’écus' }
  return { ok: true }
}

export function buyNextTitle(state: GameState): boolean {
  if (!canBuyNextTitle(state).ok) return false
  state.gold -= TITLES[state.title + 1].cost
  state.title += 1
  return true
}

// ---------- Actions ----------

export function actionDuration(state: GameState, action: ActionDef): number {
  const tool = bestTool(state, action.skill)
  return Math.round(action.durationMs * (tool?.speed ?? 1) * buildingSpeed(state, action.skill))
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
  const taxes = (taxPerMinute(state) * dtMs) / 60_000
  state.gold += taxes
  report.taxes += taxes
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
    const gained = action.xp * completions * (1 + xpBonus(state))
    skill.xp += gained
    const after = levelForXp(skill.xp)

    for (const { item, qty } of action.consumes) addItem(state, report, item, -qty * completions)
    for (const { item, qty } of action.produces) addItem(state, report, item, qty * completions)

    report.completions += completions
    report.xp[action.skill] = (report.xp[action.skill] ?? 0) + gained
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
