// Static game content. Step 1 ships a single skill to exercise the engine;
// step 2 adds the other gathering skills.

export type SkillId = 'woodcutting'
export type ItemId = 'birch_log' | 'oak_log' | 'ash_log' | 'yew_log'

export interface ItemDef {
  id: ItemId
  name: string
  sellPrice: number
}

export interface ActionDef {
  id: string
  skill: SkillId
  name: string
  levelRequired: number
  durationMs: number
  xp: number
  produces: { item: ItemId; qty: number }[]
}

export interface SkillDef {
  id: SkillId
  name: string
  icon: string
  verb: string
}

export const ITEMS: Record<ItemId, ItemDef> = {
  birch_log: { id: 'birch_log', name: 'Bûche de bouleau', sellPrice: 1 },
  oak_log: { id: 'oak_log', name: 'Bûche de chêne', sellPrice: 4 },
  ash_log: { id: 'ash_log', name: 'Bûche de frêne', sellPrice: 10 },
  yew_log: { id: 'yew_log', name: "Bûche d'if", sellPrice: 25 },
}

export const SKILLS: Record<SkillId, SkillDef> = {
  woodcutting: { id: 'woodcutting', name: 'Bûcheronnage', icon: '🪓', verb: 'Abattre' },
}

export const ACTIONS: ActionDef[] = [
  { id: 'cut_birch', skill: 'woodcutting', name: 'Bouleau', levelRequired: 1, durationMs: 3000, xp: 10, produces: [{ item: 'birch_log', qty: 1 }] },
  { id: 'cut_oak', skill: 'woodcutting', name: 'Chêne', levelRequired: 10, durationMs: 4000, xp: 22, produces: [{ item: 'oak_log', qty: 1 }] },
  { id: 'cut_ash', skill: 'woodcutting', name: 'Frêne', levelRequired: 25, durationMs: 5000, xp: 45, produces: [{ item: 'ash_log', qty: 1 }] },
  { id: 'cut_yew', skill: 'woodcutting', name: 'If', levelRequired: 45, durationMs: 7000, xp: 90, produces: [{ item: 'yew_log', qty: 1 }] },
]

export const ACTIONS_BY_ID: Record<string, ActionDef> = Object.fromEntries(ACTIONS.map((a) => [a.id, a]))

export const SKILL_IDS = Object.keys(SKILLS) as SkillId[]
