import { SKILL_IDS, type ItemId, type SkillId } from './data'
import { buildingLevel, settlementTier, skillLevel } from './engine'
import type { BuildingId } from './domain'
import type { GameState } from './state'

/** Where a goal sends the player: a skill screen or a page. */
export type GoalLink = SkillId | 'domain' | 'combat' | 'bank' | 'market'

export interface GoalDef {
  id: string
  /** Quests come in chapters, one at a time. Feats are long-term and always visible. */
  kind: 'quest' | 'feat'
  /** Quests only: chapter index into CHAPTERS. */
  chapter: number
  name: string
  target: number
  progress: (s: GameState) => number
  /** Écus given when the reward is collected. */
  reward: number
  link?: GoalLink
}

export const CHAPTERS = [
  { name: 'Premiers pas', intro: 'Ton domaine n’est qu’une clairière. Mets tes gens au travail.' },
  { name: 'Le hameau s’éveille', intro: 'Des outils et des bras : le hameau commence à vivre.' },
  { name: 'Vers le village', intro: 'Assez de maisons et d’ateliers pour mériter le nom de village.' },
  { name: 'Baron', intro: 'Le suzerain remarque ton domaine. Prouve que tu mérites un titre.' },
  { name: 'Le bourg', intro: 'Marchands et artisans affluent. Le bourg doit se défendre.' },
  { name: 'La couronne', intro: 'Un château, des remparts, et peut-être une couronne.' },
]

const made = (...items: ItemId[]) => (s: GameState) => items.reduce((n, i) => n + (s.stats.produced[i] ?? 0), 0)
const killed = (...ids: string[]) => (s: GameState) => ids.reduce((n, id) => n + (s.stats.kills[id] ?? 0), 0)
const totalKills = (s: GameState) => Object.values(s.stats.kills).reduce((a, b) => a + b, 0)
const level = (skill: SkillId) => (s: GameState) => skillLevel(s, skill)
const built = (id: BuildingId) => (s: GameState) => buildingLevel(s, id)
const tier = (s: GameState) => settlementTier(s)
const title = (s: GameState) => s.title
const goldEarned = (s: GameState) => s.stats.taxes + s.stats.loot + s.stats.sales
export const totalLevel = (s: GameState) => SKILL_IDS.reduce((n, id) => n + skillLevel(s, id), 0)

type Spec = [id: string, name: string, target: number, progress: (s: GameState) => number, reward: number, link?: GoalLink]

const quests = (chapter: number, specs: Spec[]): GoalDef[] =>
  specs.map(([id, name, target, progress, reward, link]) => ({ id, kind: 'quest', chapter, name, target, progress, reward, link }))

const HOUR = 3_600_000

export const GOALS: GoalDef[] = [
  ...quests(0, [
    ['q_birch', 'Abattre 20 bouleaux', 20, made('birch_log'), 15, 'woodcutting'],
    ['q_stone', 'Extraire 20 pierres', 20, made('stone'), 15, 'mining'],
    ['q_roach', 'Pêcher 10 gardons', 10, made('raw_roach'), 10, 'fishing'],
    ['q_cook_roach', 'Griller 10 gardons', 10, made('cooked_roach'), 10, 'cooking'],
    ['q_birch_plank', 'Fabriquer 10 planches de bouleau', 10, made('birch_plank'), 20, 'carpentry'],
    ['q_rubble', 'Tailler 5 moellons', 5, made('rubble'), 20, 'stonecutting'],
    ['q_first_house', 'Bâtir une première maison', 1, built('houses'), 30, 'domain'],
  ]),
  ...quests(1, [
    ['q_wc10', 'Atteindre le niveau 10 en Bûcheronnage', 10, level('woodcutting'), 50, 'woodcutting'],
    ['q_bronze', 'Fondre 10 lingots de bronze', 10, made('bronze_bar'), 40, 'smithing'],
    ['q_handles', "Fabriquer 3 manches d'outil", 3, made('tool_handle'), 40, 'carpentry'],
    ['q_bronze_tool', 'Forger une hache ou une pioche en bronze', 1, made('bronze_axe', 'bronze_pickaxe'), 60, 'smithing'],
    ['q_wolves', 'Vaincre 10 loups', 10, killed('wolf'), 40, 'combat'],
    ['q_sell', 'Vendre pour 100 écus de marchandises', 100, (s) => s.stats.sales, 30, 'bank'],
    ['q_houses4', 'Avoir 4 maisons', 4, built('houses'), 100, 'domain'],
  ]),
  ...quests(2, [
    ['q_works', 'Bâtir le camp de bûcherons, la carrière et le ponton', 3,
      (s) => (['lumber_camp', 'quarry', 'fishing_pier'] as BuildingId[]).filter((id) => buildingLevel(s, id) > 0).length, 150, 'domain'],
    ['q_sword', 'Forger une épée en bronze', 1, made('bronze_sword'), 80, 'smithing'],
    ['q_boars', 'Vaincre 10 sangliers', 10, killed('boar'), 120, 'combat'],
    ['q_cook100', 'Cuisiner 100 poissons', 100,
      made('cooked_roach', 'cooked_trout', 'cooked_pike', 'cooked_eel', 'cooked_herring', 'cooked_salmon', 'cooked_cod'), 100, 'cooking'],
    ['q_village', 'Atteindre le palier Village', 1, tier, 200, 'domain'],
  ]),
  ...quests(3, [
    ['q_baron', 'Devenir Baron', 1, title, 300, 'domain'],
    ['q_forge', 'Bâtir la forge du village', 1, built('forge'), 200, 'domain'],
    ['q_iron', 'Fondre 50 lingots de fer', 50, made('iron_bar'), 300, 'smithing'],
    ['q_brigands', 'Vaincre 25 brigands', 25, killed('brigand'), 400, 'combat'],
    ['q_bourg', 'Atteindre le palier Bourg', 2, tier, 800, 'domain'],
  ]),
  ...quests(4, [
    ['q_vicomte', 'Devenir Vicomte', 2, title, 1_000, 'domain'],
    ['q_church', "Agrandir l'église au niveau 2", 2, built('church'), 1_500, 'domain'],
    ['q_mercenaries', 'Vaincre 25 mercenaires déserteurs', 25, killed('mercenary'), 2_000, 'combat'],
    ['q_comte', 'Devenir Comte', 3, title, 3_000, 'domain'],
    ['q_ville', 'Atteindre le palier Ville', 3, tier, 5_000, 'domain'],
  ]),
  ...quests(5, [
    ['q_walls', 'Élever les remparts au niveau 3', 3, built('walls'), 10_000, 'domain'],
    ['q_duc', 'Devenir Duc', 4, title, 20_000, 'domain'],
    ['q_knights', 'Vaincre 50 chevaliers félons', 50, killed('felon_knight'), 30_000, 'combat'],
    ['q_castle', 'Achever le château (niveau 3)', 3, built('castle'), 50_000, 'domain'],
    ['q_roi', 'Être couronné Roi', 5, title, 0, 'domain'],
  ]),
  ...(
    [
      ['f_wolves100', 'Louvetier : vaincre 100 loups', 100, killed('wolf'), 100],
      ['f_kills1000', 'Vétéran : vaincre 1 000 ennemis', 1_000, totalKills, 1_000],
      ['f_routiers', 'Fléau des routiers : vaincre 100 capitaines de routiers', 100, killed('routier'), 25_000],
      ['f_actions1000', 'Travailleur : 1 000 actions de récolte ou d’artisanat', 1_000, (s) => s.stats.actions, 200],
      ['f_actions10000', 'Infatigable : 10 000 actions', 10_000, (s) => s.stats.actions, 2_000],
      ['f_gold1000', 'Bourse garnie : gagner 1 000 écus', 1_000, goldEarned, 100],
      ['f_gold100k', 'Banquier : gagner 100 000 écus', 100_000, goldEarned, 5_000],
      ['f_total100', 'Touche-à-tout : 100 niveaux de métier au total', 100, totalLevel, 500],
      ['f_total500', 'Maître de tous les métiers : 500 niveaux au total', 500, totalLevel, 20_000],
      ['f_play10h', 'Fidèle : 10 heures de règne', 10 * HOUR, (s) => s.stats.playMs, 500],
      ['f_play100h', 'Lignée : 100 heures de règne', 100 * HOUR, (s) => s.stats.playMs, 10_000],
      ['f_defeat', 'Mordre la poussière : être mis hors de combat', 1, (s) => s.stats.defeats, 20],
    ] as Spec[]
  ).map(([id, name, target, progress, reward, link]): GoalDef => ({ id, kind: 'feat', chapter: -1, name, target, progress, reward, link })),
]

export const GOALS_BY_ID: Record<string, GoalDef> = Object.fromEntries(GOALS.map((g) => [g.id, g]))
export const QUESTS = GOALS.filter((g) => g.kind === 'quest')
export const FEATS = GOALS.filter((g) => g.kind === 'feat')

export function goalProgress(state: GameState, goal: GoalDef): number {
  return Math.min(goal.target, Math.max(0, goal.progress(state)))
}

export function isGoalDone(state: GameState, goal: GoalDef): boolean {
  return goal.progress(state) >= goal.target
}

export function isClaimed(state: GameState, id: string): boolean {
  return state.goalsClaimed.includes(id)
}

/** The first chapter with a quest whose reward is not collected, or CHAPTERS.length when all are. */
export function currentChapter(state: GameState): number {
  const open = QUESTS.find((q) => !isClaimed(state, q.id))
  return open ? open.chapter : CHAPTERS.length
}

/** Goals the player can see: quests up to the current chapter, and every feat. */
export function visibleGoals(state: GameState): GoalDef[] {
  const chapter = currentChapter(state)
  return GOALS.filter((g) => g.kind === 'feat' || g.chapter <= chapter)
}

/** Visible goals that are done and waiting for their reward. */
export function claimableGoals(state: GameState): GoalDef[] {
  return visibleGoals(state).filter((g) => !isClaimed(state, g.id) && isGoalDone(state, g))
}

/** Collect a goal's reward. Returns true on success. */
export function claimGoal(state: GameState, id: string): boolean {
  const goal = GOALS_BY_ID[id]
  if (!goal || isClaimed(state, id) || !isGoalDone(state, goal)) return false
  if (goal.kind === 'quest' && goal.chapter > currentChapter(state)) return false
  state.goalsClaimed.push(id)
  state.gold += goal.reward
  return true
}
