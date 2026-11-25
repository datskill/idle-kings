import { describe, expect, it } from 'vitest'
import { actionDuration, advance, buyItem, catchUp, OFFLINE_CAP_MS, sellItem, toggleAction } from './engine'
import { ACTIONS_BY_ID, buyPrice } from './data'
import { exportSave, importSave, loadFromStorage, saveToStorage, STORAGE_KEY, type KeyValueStore } from './save'
import { newGame } from './state'
import { levelForXp, levelProgress, MAX_LEVEL, xpForLevel } from './xp'

function memoryStore(): KeyValueStore & { data: Map<string, string> } {
  const data = new Map<string, string>()
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  }
}

describe('xp curve', () => {
  it('is strictly increasing and round-trips with levelForXp', () => {
    for (let l = 2; l <= MAX_LEVEL; l++) {
      expect(xpForLevel(l)).toBeGreaterThan(xpForLevel(l - 1))
      expect(levelForXp(xpForLevel(l))).toBe(l)
      expect(levelForXp(xpForLevel(l) - 1)).toBe(l - 1)
    }
    expect(levelForXp(1e12)).toBe(MAX_LEVEL)
    expect(levelProgress(0)).toBe(0)
  })
})

describe('engine', () => {
  it('completes actions and grants xp and items', () => {
    const s = newGame(0)
    toggleAction(s, 'cut_birch')
    const r = advance(s, 3000 * 5 + 1200)
    expect(r.completions).toBe(5)
    expect(s.bank.birch_log).toBe(5)
    expect(s.skills.woodcutting.xp).toBe(50)
    expect(s.active?.progressMs).toBe(1200)
  })

  it('refuses actions above the player level', () => {
    const s = newGame(0)
    toggleAction(s, 'cut_oak')
    expect(s.active).toBeNull()
  })

  it('toggles the same action off', () => {
    const s = newGame(0)
    toggleAction(s, 'cut_birch')
    toggleAction(s, 'cut_birch')
    expect(s.active).toBeNull()
  })

  it('caps offline progress', () => {
    const s = newGame(0)
    toggleAction(s, 'cut_birch')
    const r = catchUp(s, 48 * 3600 * 1000)
    expect(r.elapsedMs).toBe(OFFLINE_CAP_MS)
    expect(r.completions).toBe(OFFLINE_CAP_MS / 3000)
    expect(r.levelsGained.woodcutting).toBeGreaterThan(0)
  })

  it('sells items for gold', () => {
    const s = newGame(0)
    s.bank.birch_log = 3
    sellItem(s, 'birch_log', 10, 1)
    expect(s.gold).toBe(3)
    expect(s.bank.birch_log).toBeUndefined()
  })
})

describe('save', () => {
  it('round-trips through storage', () => {
    const s = newGame(0)
    toggleAction(s, 'cut_birch')
    advance(s, 10_000)
    const store = memoryStore()
    saveToStorage(s, store)
    expect(loadFromStorage(store)).toEqual(s)
  })

  it('round-trips through export text', () => {
    const s = newGame(0)
    s.gold = 42
    s.bank.oak_log = 7
    expect(importSave(exportSave(s))).toEqual(s)
  })

  it('rejects garbage imports with a readable error', () => {
    expect(() => importSave('pas une sauvegarde')).toThrow(/sauvegarde/)
    expect(() => importSave(btoa('{"version":999}'))).toThrow(/Version/)
  })

  it('drops unknown items and keeps a corrupt save aside', () => {
    const store = memoryStore()
    store.setItem(STORAGE_KEY, JSON.stringify({ version: 1, bank: { dragon_scale: 3, birch_log: 2 } }))
    expect(loadFromStorage(store)?.bank).toEqual({ birch_log: 2 })

    store.setItem(STORAGE_KEY, '{broken')
    expect(loadFromStorage(store)).toBeNull()
    expect([...store.data.keys()].some((k) => k.includes('.corrupt.'))).toBe(true)
  })
})

describe('content', () => {
  it('every skill has a level-1 action and every action produces a known item', async () => {
    const { ACTIONS, ITEMS, SKILL_IDS } = await import('./data')
    for (const skill of SKILL_IDS) {
      expect(ACTIONS.some((a) => a.skill === skill && a.levelRequired === 1)).toBe(true)
    }
    for (const a of ACTIONS) for (const p of a.produces) expect(ITEMS[p.item]).toBeDefined()
    expect(new Set(ACTIONS.map((a) => a.id)).size).toBe(ACTIONS.length)
  })

  it('keeps the late game long', () => {
    expect(xpForLevel(MAX_LEVEL)).toBeGreaterThan(20_000_000)
  })
})

describe('crafting', () => {
  it('consumes inputs and stops when they run out', () => {
    const s = newGame(0)
    s.bank.birch_log = 5
    toggleAction(s, 'make_birch_plank')
    expect(s.active).not.toBeNull()
    const r = advance(s, 60_000)
    expect(r.completions).toBe(2)
    expect(s.bank.birch_plank).toBe(2)
    expect(s.bank.birch_log).toBe(1)
    expect(r.items.birch_log).toBe(-4)
    expect(r.stopped).toBe('missing_materials')
    expect(s.active).toBeNull()
  })

  it('cannot start without materials', () => {
    const s = newGame(0)
    toggleAction(s, 'smelt_bronze')
    expect(s.active).toBeNull()
  })

  it('tools speed up gathering, best tool wins', () => {
    const s = newGame(0)
    const birch = ACTIONS_BY_ID.cut_birch
    expect(actionDuration(s, birch)).toBe(3000)
    s.bank.bronze_axe = 1
    expect(actionDuration(s, birch)).toBe(2700)
    s.skills.woodcutting.xp = 1e9
    s.bank.steel_axe = 1
    expect(actionDuration(s, birch)).toBe(2100)
    toggleAction(s, 'cut_birch')
    advance(s, 2100 * 10)
    expect(s.bank.birch_log).toBe(10)
  })

  it('buys from the market within the gold available', () => {
    const s = newGame(0)
    s.gold = buyPrice('stone') * 3 + 1
    expect(buyItem(s, 'stone', 10)).toBe(3)
    expect(s.bank.stone).toBe(3)
    expect(s.gold).toBe(1)
    expect(buyItem(s, 'gold_bar', 1)).toBe(0)
  })

  it('every consumed item can be obtained somehow', async () => {
    const { ACTIONS } = await import('./data')
    const produced = new Set(ACTIONS.flatMap((a) => a.produces.map((p) => p.item)))
    for (const a of ACTIONS) for (const c of a.consumes) expect(produced.has(c.item)).toBe(true)
  })
})

describe('domain', () => {
  it('builds with materials and gold, then grows the settlement', async () => {
    const { build, buildingLevel, settlementTier, taxPerMinute } = await import('./engine')
    const s = newGame(0)
    expect(build(s, 'houses')).toBe(false)
    s.gold = 1e6
    s.bank.birch_plank = 1000
    s.bank.rubble = 1000
    s.bank.oak_plank = 1000
    expect(build(s, 'houses')).toBe(true)
    expect(buildingLevel(s, 'houses')).toBe(1)
    expect(s.bank.birch_plank).toBe(990)
    expect(taxPerMinute(s)).toBe(2)
    // Village-tier buildings stay locked in a hamlet.
    expect(build(s, 'market_hall')).toBe(false)
    for (let i = 0; i < 7; i++) build(s, 'houses')
    expect(settlementTier(s)).toBe(1)
    expect(taxPerMinute(s)).toBe(16 * 1.5)
  })

  it('collects taxes over time, offline too', async () => {
    const s = newGame(0)
    s.buildings.houses = 5
    const r = catchUp(s, 3600_000)
    expect(r.taxes).toBeCloseTo(10 * 60)
    expect(s.gold).toBeCloseTo(600)
  })

  it('buildings speed up skills and the market hall raises prices', async () => {
    const { sellPriceOf } = await import('./engine')
    const s = newGame(0)
    s.buildings.lumber_camp = 5
    expect(actionDuration(s, ACTIONS_BY_ID.cut_birch)).toBe(2400)
    s.bank.bronze_axe = 1
    expect(actionDuration(s, ACTIONS_BY_ID.cut_birch)).toBe(2160)
    s.buildings.market_hall = 2
    expect(sellPriceOf(s, 'oak_log')).toBeCloseTo(3.3)
  })

  it('titles require tier, buildings and gold, and boost xp', async () => {
    const { buyNextTitle, canBuyNextTitle } = await import('./engine')
    const s = newGame(0)
    s.gold = 1e7
    expect(canBuyNextTitle(s).ok).toBe(false) // Baron needs a village
    s.buildings.houses = 8
    expect(buyNextTitle(s)).toBe(true)
    expect(s.title).toBe(1)
    toggleAction(s, 'cut_birch')
    advance(s, 3000)
    expect(s.skills.woodcutting.xp).toBeCloseTo(10.5)
  })

  it('migrates a version 1 save to an empty domain', () => {
    const v1 = { version: 1, createdAt: 0, lastTick: 0, gold: 3, bank: {}, skills: {}, active: null }
    const s = importSave(btoa(JSON.stringify(v1)))
    expect(s.buildings).toEqual({})
    expect(s.title).toBe(0)
    expect(s.version).toBe(2)
  })
})
