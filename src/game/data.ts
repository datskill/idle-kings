// Static game content: gathering skills (step 2) and crafting skills (step 3).

export type SkillId =
  | 'woodcutting' | 'mining' | 'fishing'
  | 'carpentry' | 'stonecutting' | 'smithing' | 'cooking'
  | 'weapons' | 'defence' | 'endurance'

export type SkillCategory = 'gathering' | 'crafting' | 'combat'

export interface ItemDef {
  id: string
  name: string
  sellPrice: number
}

export interface Stack {
  item: ItemId
  qty: number
}

/** Sub-sections inside a crafting skill, so building materials stand apart from tools and goods. */
export type ActionGroup = 'construction' | 'smelting' | 'tools' | 'arms'

export const ACTION_GROUPS: Record<ActionGroup, string> = {
  construction: 'Matériaux de construction',
  smelting: 'Fonte des lingots',
  tools: 'Outils et objets',
  arms: 'Armes et armures',
}

export interface ActionDef {
  id: string
  group?: ActionGroup
  skill: SkillId
  name: string
  levelRequired: number
  durationMs: number
  xp: number
  consumes: Stack[]
  produces: Stack[]
}

export interface SkillDef {
  id: SkillId
  name: string
  icon: string
  verb: string
  category: SkillCategory
}

/**
 * Owning a tool makes every action of its skill faster. Only the best owned tool counts.
 * Tools wear out: after `uses` actions one copy breaks and the next copy (or a worse tool) takes over.
 */
export interface ToolDef {
  item: ItemId
  skill: SkillId
  /** Duration multiplier, e.g. 0.85 = 15 % faster. */
  speed: number
  /** Actions one copy lasts before breaking. */
  uses: number
}

const ITEM_LIST = [
  // Wood
  ['birch_log', 'Bûche de bouleau', 1],
  ['oak_log', 'Bûche de chêne', 3],
  ['ash_log', 'Bûche de frêne', 7],
  ['beech_log', 'Bûche de hêtre', 14],
  ['yew_log', "Bûche d'if", 28],
  ['walnut_log', 'Bûche de noyer', 55],
  // Ore and stone
  ['stone', 'Pierre', 1],
  ['copper_ore', 'Minerai de cuivre', 3],
  ['tin_ore', "Minerai d'étain", 3],
  ['iron_ore', 'Minerai de fer', 9],
  ['coal', 'Charbon', 6],
  ['silver_ore', "Minerai d'argent", 30],
  ['gold_ore', "Minerai d'or", 60],
  // Raw fish
  ['raw_roach', 'Gardon cru', 1],
  ['raw_trout', 'Truite crue', 4],
  ['raw_pike', 'Brochet cru', 9],
  ['raw_eel', 'Anguille crue', 16],
  ['raw_herring', 'Hareng cru', 26],
  ['raw_salmon', 'Saumon cru', 40],
  ['raw_cod', 'Morue crue', 65],
  // Carpentry
  ['birch_plank', 'Planche de bouleau', 3],
  ['oak_plank', 'Planche de chêne', 8],
  ['tool_handle', "Manche d'outil", 10],
  ['ash_plank', 'Planche de frêne', 18],
  ['beech_plank', 'Planche de hêtre', 34],
  ['longbow', 'Arc long en if', 75],
  ['walnut_chest', 'Coffre en noyer', 140],
  // Stonecutting
  ['rubble', 'Moellon', 3],
  ['dressed_stone', 'Pierre de taille', 6],
  ['millstone', 'Meule', 20],
  // Smithing: bars
  ['bronze_bar', 'Lingot de bronze', 9],
  ['iron_bar', 'Lingot de fer', 30],
  ['steel_bar', "Lingot d'acier", 55],
  ['silver_bar', "Lingot d'argent", 75],
  ['gold_bar', "Lingot d'or", 140],
  // Smithing: tools
  ['bronze_axe', 'Hache en bronze', 40],
  ['bronze_pickaxe', 'Pioche en bronze', 40],
  ['bronze_hooks', 'Hameçons en bronze', 20],
  ['iron_axe', 'Hache en fer', 120],
  ['iron_pickaxe', 'Pioche en fer', 120],
  ['iron_hooks', 'Hameçons en fer', 60],
  ['steel_axe', 'Hache en acier', 220],
  ['steel_pickaxe', 'Pioche en acier', 220],
  ['steel_hooks', 'Hameçons en acier', 110],
  // Smithing: building hardware
  ['bronze_nails', 'Clous en bronze', 1],
  ['iron_fittings', 'Ferrures en fer', 7],
  // Cooking
  ['cooked_roach', 'Gardon grillé', 3],
  ['cooked_trout', 'Truite grillée', 9],
  ['cooked_pike', 'Brochet rôti', 19],
  ['cooked_eel', 'Anguille fumée', 33],
  ['cooked_herring', 'Hareng saur', 52],
  ['cooked_salmon', 'Saumon fumé', 80],
  ['cooked_cod', 'Morue séchée', 130],
  // Arms and armour
  ['bronze_sword', 'Épée en bronze', 30],
  ['bronze_helm', 'Casque en bronze', 28],
  ['bronze_mail', 'Cotte de mailles en bronze', 60],
  ['iron_sword', 'Épée en fer', 90],
  ['iron_helm', 'Casque en fer', 85],
  ['iron_mail', 'Cotte de mailles en fer', 180],
  ['steel_sword', 'Épée en acier', 170],
  ['steel_helm', 'Casque en acier', 160],
  ['steel_plate', "Armure de plates en acier", 380],
  ['oak_shield', 'Bouclier en chêne', 35],
  ['ash_shield', 'Écu en frêne', 110],
  ['pavise', 'Pavois en hêtre', 230],
  // Loot
  ['wolf_pelt', 'Peau de loup', 8],
  ['boar_hide', 'Cuir de sanglier', 12],
  ['stolen_purse', 'Bourse volée', 40],
  ['signet_ring', 'Chevalière', 150],
] as const

export type ItemId = (typeof ITEM_LIST)[number][0]

export const ITEMS = Object.fromEntries(ITEM_LIST.map(([id, name, sellPrice]) => [id, { id, name, sellPrice }])) as Record<ItemId, ItemDef>

/** Order items appear in the storehouse. */
export const ITEM_ORDER: ItemId[] = ITEM_LIST.map(([id]) => id)

export const SKILLS: Record<SkillId, SkillDef> = {
  woodcutting: { id: 'woodcutting', name: 'Bûcheronnage', icon: '🪓', verb: 'Abattre', category: 'gathering' },
  mining: { id: 'mining', name: 'Minage', icon: '⛏️', verb: 'Extraire', category: 'gathering' },
  fishing: { id: 'fishing', name: 'Pêche', icon: '🎣', verb: 'Pêcher', category: 'gathering' },
  carpentry: { id: 'carpentry', name: 'Menuiserie', icon: '🪚', verb: 'Fabriquer', category: 'crafting' },
  stonecutting: { id: 'stonecutting', name: 'Taille de pierre', icon: '🧱', verb: 'Tailler', category: 'crafting' },
  smithing: { id: 'smithing', name: 'Forge', icon: '⚒️', verb: 'Forger', category: 'crafting' },
  cooking: { id: 'cooking', name: 'Cuisine', icon: '🍳', verb: 'Cuisiner', category: 'crafting' },
  weapons: { id: 'weapons', name: "Maniement d'armes", icon: '🗡️', verb: 'Combattre', category: 'combat' },
  defence: { id: 'defence', name: 'Défense', icon: '🛡️', verb: 'Combattre', category: 'combat' },
  endurance: { id: 'endurance', name: 'Endurance', icon: '❤️', verb: 'Combattre', category: 'combat' },
}

const s = (item: ItemId, qty = 1): Stack => ({ item, qty })

function action(
  skill: SkillId, id: string, name: string, levelRequired: number, seconds: number, xp: number,
  produces: Stack | Stack[], consumes: Stack[] = [],
): ActionDef {
  return {
    id, skill, name, levelRequired, durationMs: seconds * 1000, xp, consumes,
    produces: Array.isArray(produces) ? produces : [produces],
  }
}

const withGroup = (group: ActionGroup, a: ActionDef): ActionDef => ({ ...a, group })

// Tiers share similar unlock levels across skills so progress feels even.
export const ACTIONS: ActionDef[] = [
  // Gathering
  action('woodcutting', 'cut_birch', 'Bouleau', 1, 3, 10, s('birch_log')),
  action('woodcutting', 'cut_oak', 'Chêne', 10, 4, 22, s('oak_log')),
  action('woodcutting', 'cut_ash', 'Frêne', 25, 5, 42, s('ash_log')),
  action('woodcutting', 'cut_beech', 'Hêtre', 40, 6, 66, s('beech_log')),
  action('woodcutting', 'cut_yew', 'If', 55, 7, 98, s('yew_log')),
  action('woodcutting', 'cut_walnut', 'Noyer', 70, 8, 136, s('walnut_log')),

  action('mining', 'mine_stone', 'Carrière de pierre', 1, 3, 10, s('stone')),
  action('mining', 'mine_copper', 'Filon de cuivre', 5, 3.5, 16, s('copper_ore')),
  action('mining', 'mine_tin', "Filon d'étain", 5, 3.5, 16, s('tin_ore')),
  action('mining', 'mine_coal', 'Veine de charbon', 15, 4.5, 30, s('coal')),
  action('mining', 'mine_iron', 'Filon de fer', 20, 5, 40, s('iron_ore')),
    action('mining', 'mine_silver', "Filon d'argent", 50, 7, 95, s('silver_ore')),
  action('mining', 'mine_gold', "Filon d'or", 70, 8, 136, s('gold_ore')),

  action('fishing', 'fish_roach', 'Gardon (étang)', 1, 3, 10, s('raw_roach')),
  action('fishing', 'fish_trout', 'Truite (ruisseau)', 10, 4, 22, s('raw_trout')),
  action('fishing', 'fish_pike', 'Brochet (rivière)', 25, 5, 42, s('raw_pike')),
  action('fishing', 'fish_eel', 'Anguille (marais)', 35, 5.5, 55, s('raw_eel')),
  action('fishing', 'fish_herring', 'Hareng (côte)', 50, 6, 80, s('raw_herring')),
  action('fishing', 'fish_salmon', 'Saumon (estuaire)', 60, 7, 105, s('raw_salmon')),
  action('fishing', 'fish_cod', 'Morue (haute mer)', 75, 8, 140, s('raw_cod')),

  // Carpentry
  withGroup('construction', action('carpentry', 'make_birch_plank', 'Planche de bouleau', 1, 3, 9, s('birch_plank'), [s('birch_log', 2)])),
  withGroup('tools', action('carpentry', 'make_handle', "Manche d'outil", 5, 3.5, 15, s('tool_handle'), [s('oak_log', 2)])),
  withGroup('construction', action('carpentry', 'make_oak_plank', 'Planche de chêne', 10, 4, 22, s('oak_plank'), [s('oak_log', 2)])),
  withGroup('construction', action('carpentry', 'make_ash_plank', 'Planche de frêne', 25, 5, 42, s('ash_plank'), [s('ash_log', 2)])),
  withGroup('construction', action('carpentry', 'make_beech_plank', 'Planche de hêtre', 40, 6, 66, s('beech_plank'), [s('beech_log', 2)])),
  withGroup('arms', action('carpentry', 'make_oak_shield', 'Bouclier en chêne', 15, 5, 40, s('oak_shield'), [s('oak_plank', 3), s('bronze_bar')])),
  withGroup('arms', action('carpentry', 'make_ash_shield', 'Écu en frêne', 30, 6, 90, s('ash_shield'), [s('ash_plank', 3), s('iron_bar')])),
  withGroup('arms', action('carpentry', 'make_pavise', 'Pavois en hêtre', 45, 7, 170, s('pavise'), [s('beech_plank', 4), s('steel_bar')])),
  withGroup('arms', action('carpentry', 'make_longbow', 'Arc long en if', 55, 7, 98, s('longbow'), [s('yew_log', 2)])),
  withGroup('tools', action('carpentry', 'make_walnut_chest', 'Coffre en noyer', 70, 8, 136, s('walnut_chest'), [s('walnut_log', 2), s('iron_bar')])),

  // Stonecutting
  withGroup('construction', action('stonecutting', 'cut_rubble', 'Moellon', 1, 3, 9, s('rubble'), [s('stone', 2)])),
  withGroup('construction', action('stonecutting', 'cut_dressed', 'Pierre de taille', 15, 4.5, 30, s('dressed_stone'), [s('stone', 3)])),
  withGroup('tools', action('stonecutting', 'cut_millstone', 'Meule', 35, 7, 80, s('millstone'), [s('stone', 8)])),

  // Smithing: smelting
  withGroup('smelting', action('smithing', 'smelt_bronze', 'Lingot de bronze', 1, 3, 10, s('bronze_bar'), [s('copper_ore'), s('tin_ore')])),
  withGroup('smelting', action('smithing', 'smelt_iron', 'Lingot de fer', 20, 5, 40, s('iron_bar'), [s('iron_ore'), s('coal')])),
  withGroup('smelting', action('smithing', 'smelt_steel', "Lingot d'acier", 40, 6, 66, s('steel_bar'), [s('iron_ore'), s('coal', 2)])),
  withGroup('smelting', action('smithing', 'smelt_silver', "Lingot d'argent", 50, 7, 95, s('silver_bar'), [s('silver_ore'), s('coal')])),
  withGroup('smelting', action('smithing', 'smelt_gold', "Lingot d'or", 65, 8, 130, s('gold_bar'), [s('gold_ore'), s('coal')])),
  // Smithing: hardware for buildings
  withGroup('construction', action('smithing', 'forge_bronze_nails', 'Clous en bronze', 2, 3, 12, s('bronze_nails', 12), [s('bronze_bar')])),
  withGroup('construction', action('smithing', 'forge_iron_fittings', 'Ferrures en fer', 21, 5, 45, s('iron_fittings', 5), [s('iron_bar')])),
  // Smithing: tools
  withGroup('tools', action('smithing', 'forge_bronze_hooks', 'Hameçons en bronze', 3, 4, 20, s('bronze_hooks'), [s('bronze_bar')])),
  withGroup('tools', action('smithing', 'forge_bronze_axe', 'Hache en bronze', 5, 5, 35, s('bronze_axe'), [s('bronze_bar', 2), s('tool_handle')])),
  withGroup('tools', action('smithing', 'forge_bronze_pickaxe', 'Pioche en bronze', 5, 5, 35, s('bronze_pickaxe'), [s('bronze_bar', 2), s('tool_handle')])),
  withGroup('tools', action('smithing', 'forge_iron_hooks', 'Hameçons en fer', 22, 5, 60, s('iron_hooks'), [s('iron_bar')])),
  withGroup('tools', action('smithing', 'forge_iron_axe', 'Hache en fer', 25, 6, 120, s('iron_axe'), [s('iron_bar', 3), s('tool_handle')])),
  withGroup('tools', action('smithing', 'forge_iron_pickaxe', 'Pioche en fer', 25, 6, 120, s('iron_pickaxe'), [s('iron_bar', 3), s('tool_handle')])),
  withGroup('tools', action('smithing', 'forge_steel_hooks', "Hameçons en acier", 42, 6, 110, s('steel_hooks'), [s('steel_bar')])),
  withGroup('tools', action('smithing', 'forge_steel_axe', "Hache en acier", 45, 7, 220, s('steel_axe'), [s('steel_bar', 3), s('tool_handle')])),
  withGroup('tools', action('smithing', 'forge_steel_pickaxe', "Pioche en acier", 45, 7, 220, s('steel_pickaxe'), [s('steel_bar', 3), s('tool_handle')])),
  // Smithing: arms and armour
  withGroup('arms', action('smithing', 'forge_bronze_sword', 'Épée en bronze', 8, 5, 35, s('bronze_sword'), [s('bronze_bar', 2), s('tool_handle')])),
  withGroup('arms', action('smithing', 'forge_bronze_helm', 'Casque en bronze', 10, 5, 35, s('bronze_helm'), [s('bronze_bar', 2)])),
  withGroup('arms', action('smithing', 'forge_bronze_mail', 'Cotte de mailles en bronze', 14, 7, 70, s('bronze_mail'), [s('bronze_bar', 4)])),
  withGroup('arms', action('smithing', 'forge_iron_sword', 'Épée en fer', 28, 6, 120, s('iron_sword'), [s('iron_bar', 2), s('tool_handle')])),
  withGroup('arms', action('smithing', 'forge_iron_helm', 'Casque en fer', 30, 6, 120, s('iron_helm'), [s('iron_bar', 2)])),
  withGroup('arms', action('smithing', 'forge_iron_mail', 'Cotte de mailles en fer', 33, 8, 240, s('iron_mail'), [s('iron_bar', 4)])),
  withGroup('arms', action('smithing', 'forge_steel_sword', 'Épée en acier', 48, 7, 220, s('steel_sword'), [s('steel_bar', 2), s('tool_handle')])),
  withGroup('arms', action('smithing', 'forge_steel_helm', 'Casque en acier', 50, 7, 220, s('steel_helm'), [s('steel_bar', 2)])),
  withGroup('arms', action('smithing', 'forge_steel_plate', 'Armure de plates en acier', 53, 9, 500, s('steel_plate'), [s('steel_bar', 5)])),

  // Cooking
  action('cooking', 'cook_roach', 'Gardon grillé', 1, 2.5, 8, s('cooked_roach'), [s('raw_roach')]),
  action('cooking', 'cook_trout', 'Truite grillée', 10, 3, 18, s('cooked_trout'), [s('raw_trout')]),
  action('cooking', 'cook_pike', 'Brochet rôti', 25, 3.5, 32, s('cooked_pike'), [s('raw_pike')]),
  action('cooking', 'cook_eel', 'Anguille fumée', 35, 4, 44, s('cooked_eel'), [s('raw_eel')]),
  action('cooking', 'cook_herring', 'Hareng saur', 50, 4.5, 62, s('cooked_herring'), [s('raw_herring')]),
  action('cooking', 'cook_salmon', 'Saumon fumé', 60, 5, 80, s('cooked_salmon'), [s('raw_salmon')]),
  action('cooking', 'cook_cod', 'Morue séchée', 75, 5.5, 105, s('cooked_cod'), [s('raw_cod')]),
]

export const ACTIONS_BY_ID: Record<string, ActionDef> = Object.fromEntries(ACTIONS.map((a) => [a.id, a]))

export const SKILL_IDS = Object.keys(SKILLS) as SkillId[]

export const TOOLS: ToolDef[] = [
  { item: 'bronze_axe', skill: 'woodcutting', speed: 0.9, uses: 1000 },
  { item: 'iron_axe', skill: 'woodcutting', speed: 0.8, uses: 2500 },
  { item: 'steel_axe', skill: 'woodcutting', speed: 0.7, uses: 6000 },
  { item: 'bronze_pickaxe', skill: 'mining', speed: 0.9, uses: 1000 },
  { item: 'iron_pickaxe', skill: 'mining', speed: 0.8, uses: 2500 },
  { item: 'steel_pickaxe', skill: 'mining', speed: 0.7, uses: 6000 },
  { item: 'bronze_hooks', skill: 'fishing', speed: 0.9, uses: 1000 },
  { item: 'iron_hooks', skill: 'fishing', speed: 0.8, uses: 2500 },
  { item: 'steel_hooks', skill: 'fishing', speed: 0.7, uses: 6000 },
]

/** What the market sells. Buying costs several times the resale price. */
export const MARKET_MARKUP = 4
export const MARKET_STOCK: ItemId[] = [
  'birch_log', 'oak_log', 'stone', 'copper_ore', 'tin_ore', 'iron_ore', 'coal', 'raw_roach', 'raw_trout', 'tool_handle',
]

export function buyPrice(item: ItemId): number {
  return ITEMS[item].sellPrice * MARKET_MARKUP
}
