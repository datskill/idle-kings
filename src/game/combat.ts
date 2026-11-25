// Combat (step 5): enemies, equipment, food and the fight simulation.
import { ITEMS, type ItemId, type SkillId } from './data'
import type { GameState } from './state'
import { levelForXp } from './xp'

export type Slot = 'weapon' | 'head' | 'body' | 'shield'
export type CombatStyle = 'weapons' | 'defence'

export const SLOTS: { id: Slot; name: string }[] = [
  { id: 'weapon', name: 'Arme' },
  { id: 'head', name: 'Tête' },
  { id: 'body', name: 'Corps' },
  { id: 'shield', name: 'Bouclier' },
]

export interface GearDef {
  item: ItemId
  slot: Slot
  attack: number
  strength: number
  defence: number
  /** Level of the matching combat skill needed to equip it. */
  levelRequired: number
}

const gear = (item: ItemId, slot: Slot, attack: number, strength: number, defence: number, levelRequired: number): GearDef => ({
  item, slot, attack, strength, defence, levelRequired,
})

export const GEAR: GearDef[] = [
  gear('bronze_sword', 'weapon', 8, 7, 0, 1),
  gear('iron_sword', 'weapon', 18, 16, 0, 20),
  gear('longbow', 'weapon', 26, 20, 0, 30),
  gear('steel_sword', 'weapon', 32, 30, 0, 40),
  gear('bronze_helm', 'head', 0, 0, 5, 1),
  gear('iron_helm', 'head', 0, 0, 11, 20),
  gear('steel_helm', 'head', 0, 0, 18, 40),
  gear('bronze_mail', 'body', 0, 0, 12, 1),
  gear('iron_mail', 'body', 0, 0, 24, 20),
  gear('steel_plate', 'body', 0, 0, 40, 40),
  gear('oak_shield', 'shield', 0, 0, 7, 1),
  gear('ash_shield', 'shield', 0, 0, 14, 20),
  gear('pavise', 'shield', 0, 0, 24, 40),
]

export const GEAR_BY_ITEM = Object.fromEntries(GEAR.map((g) => [g.item, g])) as Partial<Record<ItemId, GearDef>>

/** HP restored by each food. */
export const FOOD: Partial<Record<ItemId, number>> = {
  cooked_roach: 4,
  cooked_trout: 8,
  cooked_pike: 12,
  cooked_eel: 16,
  cooked_herring: 20,
  cooked_salmon: 26,
  cooked_cod: 32,
}

export interface LootDef {
  item: ItemId
  /** Chance per kill, 0..1. */
  chance: number
  qty: [number, number]
}

export interface EnemyDef {
  id: string
  name: string
  area: string
  hp: number
  attack: number
  defence: number
  maxHit: number
  speedMs: number
  gold: [number, number]
  loot: LootDef[]
}

const loot = (item: ItemId, chance: number, min = 1, max = min): LootDef => ({ item, chance, qty: [min, max] })

export const AREAS = ['Forêt seigneuriale', 'Grand chemin', 'Marches frontalières']

export const ENEMIES: EnemyDef[] = [
  { id: 'wolf', name: 'Loup', area: AREAS[0], hp: 15, attack: 1, defence: 1, maxHit: 1, speedMs: 2600, gold: [0, 2], loot: [loot('wolf_pelt', 0.5)] },
  { id: 'boar', name: 'Sanglier', area: AREAS[0], hp: 30, attack: 4, defence: 5, maxHit: 3, speedMs: 3000, gold: [0, 3], loot: [loot('boar_hide', 0.5)] },
  { id: 'poacher', name: 'Braconnier', area: AREAS[0], hp: 55, attack: 18, defence: 16, maxHit: 6, speedMs: 2800, gold: [5, 20], loot: [loot('wolf_pelt', 0.4, 1, 2), loot('raw_pike', 0.3, 1, 3), loot('longbow', 0.01)] },
  { id: 'brigand', name: 'Brigand', area: AREAS[1], hp: 45, attack: 12, defence: 10, maxHit: 5, speedMs: 2600, gold: [5, 15], loot: [loot('copper_ore', 0.3, 1, 3), loot('tin_ore', 0.3, 1, 3), loot('bronze_bar', 0.1)] },
  { id: 'mercenary', name: 'Mercenaire déserteur', area: AREAS[1], hp: 90, attack: 35, defence: 35, maxHit: 9, speedMs: 2600, gold: [20, 50], loot: [loot('iron_bar', 0.2, 1, 2), loot('stolen_purse', 0.1), loot('iron_sword', 0.01)] },
  { id: 'felon_knight', name: 'Chevalier félon', area: AREAS[2], hp: 150, attack: 55, defence: 60, maxHit: 14, speedMs: 2800, gold: [50, 120], loot: [loot('steel_bar', 0.2, 1, 2), loot('silver_bar', 0.1), loot('signet_ring', 0.03)] },
  { id: 'routier', name: 'Capitaine de routiers', area: AREAS[2], hp: 250, attack: 75, defence: 75, maxHit: 18, speedMs: 2400, gold: [120, 300], loot: [loot('gold_bar', 0.1), loot('stolen_purse', 0.3, 1, 2), loot('steel_plate', 0.005)] },
]

export const ENEMIES_BY_ID: Record<string, EnemyDef> = Object.fromEntries(ENEMIES.map((e) => [e.id, e]))

export const PLAYER_SPEED_MS = 2600
export const RESPAWN_MS = 1500
/** Natural healing during a fight: 1 HP every this many ms. */
export const REGEN_MS_PER_HP = 6000
/** Auto-eat below this share of max HP. */
export const EAT_THRESHOLD = 0.5

export interface CombatState {
  enemyId: string
  enemyHp: number
  playerTimer: number
  enemyTimer: number
}

export interface CombatReport {
  kills: Record<string, number>
  defeated: boolean
  foodEaten: number
  gold: number
  xp: Partial<Record<SkillId, number>>
  items: Partial<Record<ItemId, number>>
}

export function emptyCombatReport(): CombatReport {
  return { kills: {}, defeated: false, foodEaten: 0, gold: 0, xp: {}, items: {} }
}

// ---------- Random numbers (injectable for tests) ----------

let rng: () => number = Math.random
export function setRandom(fn: () => number) {
  rng = fn
}
const randInt = (min: number, max: number) => min + Math.floor(rng() * (max - min + 1))

// ---------- Player stats ----------

const lvl = (state: GameState, skill: SkillId) => levelForXp(state.skills[skill].xp)

export function maxHp(state: GameState): number {
  return 40 + 6 * lvl(state, 'endurance')
}

export function combatLevel(state: GameState): number {
  return Math.floor((lvl(state, 'weapons') + lvl(state, 'defence') + lvl(state, 'endurance')) / 3)
}

export function gearBonus(state: GameState): { attack: number; strength: number; defence: number } {
  const total = { attack: 0, strength: 0, defence: 0 }
  for (const item of Object.values(state.equipment)) {
    const g = item && GEAR_BY_ITEM[item]
    if (!g) continue
    total.attack += g.attack
    total.strength += g.strength
    total.defence += g.defence
  }
  return total
}

export function playerAccuracy(state: GameState): number {
  return (lvl(state, 'weapons') + 8) * (64 + gearBonus(state).attack)
}

export function playerMaxHit(state: GameState): number {
  return Math.max(1, Math.floor(1 + ((lvl(state, 'weapons') + 8) * (64 + gearBonus(state).strength)) / 320))
}

export function playerDefenceRoll(state: GameState): number {
  return (lvl(state, 'defence') + 8) * (64 + gearBonus(state).defence)
}

const enemyAccuracy = (e: EnemyDef) => (e.attack + 8) * 64
const enemyDefenceRoll = (e: EnemyDef) => (e.defence + 8) * 64

/** Chance that an attack with `acc` lands against `def`. */
export function hitChance(acc: number, def: number): number {
  return acc > def ? 1 - (def + 2) / (2 * (acc + 1)) : acc / (2 * (def + 1))
}

/** Rough odds shown in the UI: share of the fight the player wins, ignoring food. */
export function playerHitChance(state: GameState, e: EnemyDef) {
  return hitChance(playerAccuracy(state), enemyDefenceRoll(e))
}
export function enemyHitChance(state: GameState, e: EnemyDef) {
  return hitChance(enemyAccuracy(e), playerDefenceRoll(state))
}

// ---------- Equipment ----------

export function canEquip(state: GameState, item: ItemId): boolean {
  const g = GEAR_BY_ITEM[item]
  if (!g || (state.bank[item] ?? 0) < 1) return false
  const skill: SkillId = g.slot === 'weapon' ? 'weapons' : 'defence'
  return lvl(state, skill) >= g.levelRequired
}

/** Move an item from the bank to its slot; the previous item goes back to the bank. */
export function equip(state: GameState, item: ItemId): boolean {
  if (!canEquip(state, item)) return false
  const g = GEAR_BY_ITEM[item]!
  unequip(state, g.slot)
  const left = (state.bank[item] ?? 0) - 1
  if (left > 0) state.bank[item] = left
  else delete state.bank[item]
  state.equipment[g.slot] = item
  return true
}

export function unequip(state: GameState, slot: Slot): void {
  const item = state.equipment[slot]
  if (!item) return
  state.bank[item] = (state.bank[item] ?? 0) + 1
  delete state.equipment[slot]
}

// ---------- Fight ----------

export function startCombat(state: GameState, enemyId: string): boolean {
  const e = ENEMIES_BY_ID[enemyId]
  if (!e) return false
  state.active = null
  state.combat = { enemyId, enemyHp: e.hp, playerTimer: PLAYER_SPEED_MS, enemyTimer: e.speedMs }
  if (state.hp <= 0) state.hp = maxHp(state)
  return true
}

export function stopCombat(state: GameState): void {
  state.combat = null
}

function gain(state: GameState, report: CombatReport, skill: SkillId, xp: number) {
  state.skills[skill].xp += xp
  report.xp[skill] = (report.xp[skill] ?? 0) + xp
}

function giveItem(state: GameState, report: CombatReport, item: ItemId, qty: number) {
  state.bank[item] = (state.bank[item] ?? 0) + qty
  report.items[item] = (report.items[item] ?? 0) + qty
}

function tryEat(state: GameState, report: CombatReport) {
  const max = maxHp(state)
  while (state.food && state.hp <= max * EAT_THRESHOLD) {
    const have = state.bank[state.food] ?? 0
    if (have < 1) return
    const heal = FOOD[state.food] ?? 0
    if (have > 1) state.bank[state.food] = have - 1
    else delete state.bank[state.food]
    report.items[state.food] = (report.items[state.food] ?? 0) - 1
    state.hp = Math.min(max, state.hp + heal)
    report.foodEaten++
  }
}

/**
 * Advance a fight by `dtMs`, event by event. Mutates state.
 * `xpBonus` comes from the player's title.
 */
export function advanceCombat(state: GameState, dtMs: number, xpBonus: number, report: CombatReport = emptyCombatReport()): CombatReport {
  const c = state.combat
  if (!c) return report
  const e = ENEMIES_BY_ID[c.enemyId]
  if (!e) {
    state.combat = null
    return report
  }
  const styleSkill: SkillId = state.combatStyle
  let remaining = dtMs

  while (remaining > 0 && state.combat) {
    const step = Math.min(remaining, c.playerTimer, c.enemyTimer)
    remaining -= step
    c.playerTimer -= step
    c.enemyTimer -= step
    state.hp = Math.min(maxHp(state), state.hp + step / REGEN_MS_PER_HP)

    if (c.playerTimer <= 0) {
      c.playerTimer += PLAYER_SPEED_MS
      if (c.enemyHp > 0 && rng() < playerHitChance(state, e)) {
        const dmg = Math.min(c.enemyHp, randInt(1, playerMaxHit(state)))
        c.enemyHp -= dmg
        gain(state, report, styleSkill, dmg * 4 * (1 + xpBonus))
        gain(state, report, 'endurance', dmg * 1.33 * (1 + xpBonus))
      }
      if (c.enemyHp <= 0) {
        report.kills[e.id] = (report.kills[e.id] ?? 0) + 1
        const gold = randInt(e.gold[0], e.gold[1])
        state.gold += gold
        report.gold += gold
        for (const l of e.loot) if (rng() < l.chance) giveItem(state, report, l.item, randInt(l.qty[0], l.qty[1]))
        // Next enemy of the same kind arrives after a short pause.
        c.enemyHp = e.hp
        c.playerTimer = RESPAWN_MS + PLAYER_SPEED_MS
        c.enemyTimer = RESPAWN_MS + e.speedMs
        continue
      }
    }

    if (c.enemyTimer <= 0) {
      c.enemyTimer += e.speedMs
      if (rng() < enemyHitChance(state, e)) {
        state.hp -= randInt(1, e.maxHit)
        tryEat(state, report)
        if (state.hp <= 0) {
          report.defeated = true
          state.combat = null
          state.hp = maxHp(state)
        }
      }
    }
  }
  return report
}

export function isFood(item: ItemId): boolean {
  return FOOD[item] !== undefined && item in ITEMS
}
