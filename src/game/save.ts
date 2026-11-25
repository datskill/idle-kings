import { ACTIONS_BY_ID, ITEMS, SKILL_IDS } from './data'
import { ENEMIES_BY_ID, GEAR_BY_ITEM, maxHp, type Slot } from './combat'
import { BUILDINGS_BY_ID, TITLES, type BuildingId } from './domain'
import { newGame, SAVE_VERSION, type GameState, type GameStats } from './state'
import { GOALS_BY_ID } from './goals'

export const STORAGE_KEY = 'idle-kings.save'

/** Minimal storage interface so tests can pass an in-memory store. */
export interface KeyValueStore {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin)
}

function fromBase64(b64: string): string {
  const bin = atob(b64.trim())
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

/**
 * Validate and upgrade raw parsed data into a GameState.
 * Unknown items/skills/actions are dropped; missing fields get defaults.
 */
export function migrate(raw: unknown): GameState {
  if (!raw || typeof raw !== 'object') throw new Error('Sauvegarde invalide')
  const data = raw as Record<string, unknown>
  if (typeof data.version !== 'number' || data.version > SAVE_VERSION) {
    throw new Error('Version de sauvegarde inconnue')
  }
  const base = newGame(typeof data.createdAt === 'number' ? data.createdAt : Date.now())
  const num = (v: unknown, d = 0) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : d)

  base.lastTick = num(data.lastTick, Date.now())
  base.gold = num(data.gold)

  const bank = (data.bank ?? {}) as Record<string, unknown>
  for (const [id, qty] of Object.entries(bank)) {
    if (id in ITEMS && num(qty) > 0) base.bank[id as keyof typeof ITEMS] = Math.floor(num(qty))
  }

  const skills = (data.skills ?? {}) as Record<string, { xp?: unknown }>
  for (const id of SKILL_IDS) base.skills[id].xp = num(skills[id]?.xp)

  const active = data.active as { actionId?: unknown; progressMs?: unknown } | null
  if (active && typeof active.actionId === 'string' && ACTIONS_BY_ID[active.actionId]) {
    base.active = { actionId: active.actionId, progressMs: num(active.progressMs) }
  }
  // Version 2 added the domain. Version 1 saves simply start with no buildings.
  const buildings = (data.buildings ?? {}) as Record<string, unknown>
  for (const [id, level] of Object.entries(buildings)) {
    const def = BUILDINGS_BY_ID[id as BuildingId]
    if (def && num(level) >= 1) base.buildings[def.id] = Math.min(def.maxLevel, Math.floor(num(level)))
  }
  base.title = Math.min(TITLES.length - 1, Math.floor(num(data.title)))
  // Version 3 added combat.
  if (data.combatStyle === 'defence') base.combatStyle = 'defence'
  const equipment = (data.equipment ?? {}) as Record<string, unknown>
  for (const [slot, item] of Object.entries(equipment)) {
    const g = typeof item === 'string' ? GEAR_BY_ITEM[item as keyof typeof ITEMS] : undefined
    if (g && g.slot === slot) base.equipment[slot as Slot] = g.item
  }
  if (typeof data.food === 'string' && data.food in ITEMS) base.food = data.food as keyof typeof ITEMS
  const combat = data.combat as Record<string, unknown> | null
  if (combat && typeof combat.enemyId === 'string' && ENEMIES_BY_ID[combat.enemyId]) {
    base.combat = {
      enemyId: combat.enemyId,
      enemyHp: num(combat.enemyHp, ENEMIES_BY_ID[combat.enemyId].hp),
      playerTimer: num(combat.playerTimer),
      enemyTimer: num(combat.enemyTimer),
    }
    base.active = null
  }
  base.hp = Math.min(maxHp(base), num(data.hp, maxHp(base))) || maxHp(base)
  // Version 4 added statistics and goals. Older saves start with empty counters.
  const stats = (data.stats ?? {}) as Record<string, unknown>
  for (const key of ['playMs', 'actions', 'defeats', 'foodEaten', 'taxes', 'loot', 'sales', 'spent', 'itemsSold', 'itemsBought', 'buildLevels'] as const) {
    base.stats[key] = num(stats[key])
  }
  const counts = (v: unknown, valid: (id: string) => boolean) => {
    const out: Record<string, number> = {}
    for (const [id, n] of Object.entries((v ?? {}) as Record<string, unknown>)) if (valid(id) && num(n) > 0) out[id] = num(n)
    return out
  }
  base.stats.produced = counts(stats.produced, (id) => id in ITEMS) as GameStats['produced']
  base.stats.kills = counts(stats.kills, (id) => id in ENEMIES_BY_ID)
  if (Array.isArray(data.goalsClaimed)) {
    base.goalsClaimed = [...new Set(data.goalsClaimed.filter((id): id is string => typeof id === 'string' && id in GOALS_BY_ID))]
  }
  // Future format changes: add `if (data.version < N) { ... }` upgrade steps here.
  return base
}

export function serialize(state: GameState): string {
  return JSON.stringify(state)
}

export function deserialize(json: string): GameState {
  return migrate(JSON.parse(json))
}

export function exportSave(state: GameState): string {
  return toBase64(serialize(state))
}

export function importSave(text: string): GameState {
  let json: string
  try {
    json = fromBase64(text)
  } catch {
    throw new Error("Le texte collé n'est pas une sauvegarde Idle Kings")
  }
  try {
    return deserialize(json)
  } catch (e) {
    throw new Error(e instanceof SyntaxError ? "Le texte collé n'est pas une sauvegarde Idle Kings" : (e as Error).message)
  }
}

export function saveToStorage(state: GameState, store: KeyValueStore): void {
  store.setItem(STORAGE_KEY, serialize(state))
}

/** Returns null when there is no save yet. A corrupt save is kept aside, not lost. */
export function loadFromStorage(store: KeyValueStore): GameState | null {
  const raw = store.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return deserialize(raw)
  } catch {
    store.setItem(`${STORAGE_KEY}.corrupt.${Date.now()}`, raw)
    return null
  }
}
