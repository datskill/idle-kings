/* eslint-disable react-refresh/only-export-components -- icon maps live next to the icon component */
// Icons from Game-icons.net (CC BY 3.0, see README), via react-icons.
import type { IconType } from 'react-icons'
import {
  GiAnvilImpact, GiBrickWall, GiCampfire, GiCastle, GiCheckedShield, GiChest, GiChurch, GiCog, GiCookingPot,
  GiCrossedSwords, GiCrown, GiFishingBoat, GiFishingPole, GiHammerNails, GiHandSaw, GiHearts, GiHouse, GiMining,
  GiShop, GiStoneBlock, GiStoneTower, GiTwoCoins, GiVillage, GiWoodAxe, GiWoodenPier, GiStonePile, GiBroadsword,
  GiWoodPile, GiAnvil, GiOpenTreasureChest, GiScrollUnfurled, GiLaurelsTrophy, GiAbacus, GiCheckMark, GiQuillInk,
} from 'react-icons/gi'
import type { SkillId } from '../game/data'
import type { BuildingId } from '../game/domain'

export const SKILL_ICONS: Record<SkillId, IconType> = {
  woodcutting: GiWoodAxe,
  mining: GiMining,
  fishing: GiFishingPole,
  carpentry: GiHandSaw,
  stonecutting: GiStoneBlock,
  smithing: GiAnvilImpact,
  cooking: GiCookingPot,
  weapons: GiBroadsword,
  defence: GiCheckedShield,
  endurance: GiHearts,
}

export const BUILDING_ICONS: Record<BuildingId, IconType> = {
  houses: GiHouse,
  lumber_camp: GiWoodPile,
  quarry: GiStonePile,
  fishing_pier: GiWoodenPier,
  carpenter: GiHammerNails,
  mason_lodge: GiBrickWall,
  forge: GiAnvil,
  bakehouse: GiCampfire,
  market_hall: GiShop,
  church: GiChurch,
  walls: GiStoneTower,
  castle: GiCastle,
}

export const PAGE_ICONS = {
  domain: GiVillage,
  bank: GiChest,
  market: GiShop,
  combat: GiCrossedSwords,
  settings: GiCog,
  gold: GiTwoCoins,
  crown: GiCrown,
  boat: GiFishingBoat,
  loot: GiOpenTreasureChest,
  goals: GiScrollUnfurled,
  quest: GiQuillInk,
  feat: GiLaurelsTrophy,
  stats: GiAbacus,
  check: GiCheckMark,
}

export function SkillIcon({ skill, className }: { skill: SkillId; className?: string }) {
  const Icon = SKILL_ICONS[skill]
  return <Icon className={`icon ${className ?? ''}`} aria-hidden />
}
