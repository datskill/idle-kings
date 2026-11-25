// Static game content: gathering skills (step 2).

export type SkillId = 'woodcutting' | 'mining' | 'fishing'

export type ItemId =
  // Wood
  | 'birch_log' | 'oak_log' | 'ash_log' | 'beech_log' | 'yew_log' | 'walnut_log'
  // Ore and stone
  | 'stone' | 'copper_ore' | 'tin_ore' | 'iron_ore' | 'coal' | 'silver_ore' | 'gold_ore'
  // Raw fish
  | 'raw_roach' | 'raw_trout' | 'raw_pike' | 'raw_eel' | 'raw_herring' | 'raw_salmon' | 'raw_cod'

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

const item = (id: ItemId, name: string, sellPrice: number): [ItemId, ItemDef] => [id, { id, name, sellPrice }]

export const ITEMS: Record<ItemId, ItemDef> = Object.fromEntries([
  item('birch_log', 'Bûche de bouleau', 1),
  item('oak_log', 'Bûche de chêne', 3),
  item('ash_log', 'Bûche de frêne', 7),
  item('beech_log', 'Bûche de hêtre', 14),
  item('yew_log', "Bûche d'if", 28),
  item('walnut_log', 'Bûche de noyer', 55),

  item('stone', 'Pierre', 1),
  item('copper_ore', 'Minerai de cuivre', 3),
  item('tin_ore', "Minerai d'étain", 3),
  item('iron_ore', 'Minerai de fer', 9),
  item('coal', 'Charbon', 14),
  item('silver_ore', "Minerai d'argent", 30),
  item('gold_ore', "Minerai d'or", 60),

  item('raw_roach', 'Gardon cru', 1),
  item('raw_trout', 'Truite crue', 4),
  item('raw_pike', 'Brochet cru', 9),
  item('raw_eel', 'Anguille crue', 16),
  item('raw_herring', 'Hareng cru', 26),
  item('raw_salmon', 'Saumon cru', 40),
  item('raw_cod', 'Morue crue', 65),
]) as Record<ItemId, ItemDef>

export const SKILLS: Record<SkillId, SkillDef> = {
  woodcutting: { id: 'woodcutting', name: 'Bûcheronnage', icon: '🪓', verb: 'Abattre' },
  mining: { id: 'mining', name: 'Minage', icon: '⛏️', verb: 'Extraire' },
  fishing: { id: 'fishing', name: 'Pêche', icon: '🎣', verb: 'Pêcher' },
}

/** Compact constructor: one action producing one unit of one item. */
function gather(skill: SkillId, id: string, name: string, levelRequired: number, seconds: number, xp: number, produces: ItemId): ActionDef {
  return { id, skill, name, levelRequired, durationMs: seconds * 1000, xp, produces: [{ item: produces, qty: 1 }] }
}

// Tiers share the same unlock levels across skills so progress feels even.
// XP per second rises with each tier: roughly 3.3, 5.5, 8.3, 11, 14, 17.
export const ACTIONS: ActionDef[] = [
  gather('woodcutting', 'cut_birch', 'Bouleau', 1, 3, 10, 'birch_log'),
  gather('woodcutting', 'cut_oak', 'Chêne', 10, 4, 22, 'oak_log'),
  gather('woodcutting', 'cut_ash', 'Frêne', 25, 5, 42, 'ash_log'),
  gather('woodcutting', 'cut_beech', 'Hêtre', 40, 6, 66, 'beech_log'),
  gather('woodcutting', 'cut_yew', 'If', 55, 7, 98, 'yew_log'),
  gather('woodcutting', 'cut_walnut', 'Noyer', 70, 8, 136, 'walnut_log'),

  gather('mining', 'mine_stone', 'Carrière de pierre', 1, 3, 10, 'stone'),
  gather('mining', 'mine_copper', 'Filon de cuivre', 5, 3.5, 16, 'copper_ore'),
  gather('mining', 'mine_tin', "Filon d'étain", 5, 3.5, 16, 'tin_ore'),
  gather('mining', 'mine_iron', 'Filon de fer', 20, 5, 40, 'iron_ore'),
  gather('mining', 'mine_coal', 'Veine de charbon', 35, 6, 62, 'coal'),
  gather('mining', 'mine_silver', "Filon d'argent", 50, 7, 95, 'silver_ore'),
  gather('mining', 'mine_gold', "Filon d'or", 70, 8, 136, 'gold_ore'),

  gather('fishing', 'fish_roach', 'Gardon (étang)', 1, 3, 10, 'raw_roach'),
  gather('fishing', 'fish_trout', 'Truite (ruisseau)', 10, 4, 22, 'raw_trout'),
  gather('fishing', 'fish_pike', 'Brochet (rivière)', 25, 5, 42, 'raw_pike'),
  gather('fishing', 'fish_eel', 'Anguille (marais)', 35, 5.5, 55, 'raw_eel'),
  gather('fishing', 'fish_herring', 'Hareng (côte)', 50, 6, 80, 'raw_herring'),
  gather('fishing', 'fish_salmon', 'Saumon (estuaire)', 60, 7, 105, 'raw_salmon'),
  gather('fishing', 'fish_cod', 'Morue (haute mer)', 75, 8, 140, 'raw_cod'),
]

export const ACTIONS_BY_ID: Record<string, ActionDef> = Object.fromEntries(ACTIONS.map((a) => [a.id, a]))

export const SKILL_IDS = Object.keys(SKILLS) as SkillId[]
