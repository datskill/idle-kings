import { ITEMS, SKILLS } from '../game/data'
import { BUILDINGS, buildingCost, TIERS, TITLES, type BuildingDef } from '../game/domain'
import {
  build, buildingLevel, buyNextTitle, canBuild, canBuyNextTitle, owned, sellBonus, settlementTier, taxPerMinute,
  totalBuildingLevels, xpBonus,
} from '../game/engine'
import type { GameState } from '../game/state'
import { game } from '../game/store'
import { fmt } from './format'

const pct = (x: number) => `${Math.round(x * 100)} %`

function effectText(def: BuildingDef, level: number): string {
  const e = def.effect
  switch (e.kind) {
    case 'speed':
      return `${SKILLS[e.skill].name} ${pct(e.perLevel * level)} plus rapide`
    case 'tax':
      return `+${fmt(e.perLevel * level)} écus/min d'impôts (avant multiplicateurs)`
    case 'taxMultiplier':
      return `Impôts +${pct(e.perLevel * level)}`
    case 'sellBonus':
      return `Prix de revente +${pct(e.perLevel * level)}`
    case 'none':
      return 'Fortifie le domaine'
  }
}

function BuildingCard({ state, def }: { state: GameState; def: BuildingDef }) {
  const level = buildingLevel(state, def.id)
  const maxed = level >= def.maxLevel
  const locked = settlementTier(state) < def.tierRequired
  const check = canBuild(state, def.id)
  const cost = maxed ? null : buildingCost(def, level + 1)

  return (
    <div className={`card building ${locked ? 'locked' : ''}`}>
      <div className="card-title">
        {locked ? '🔒' : def.icon} {def.name}
        <span className="building-level">
          {level}/{def.maxLevel}
        </span>
      </div>
      <div className="card-meta">
        <p className="building-desc">{def.description}</p>
        {locked ? (
          <>Nécessite : {TIERS[def.tierRequired].name}</>
        ) : (
          <>
            <div className="effect">{level > 0 ? effectText(def, level) : 'Pas encore construit'}</div>
            {!maxed && <div className="effect next">Niveau suivant : {effectText(def, level + 1)}</div>}
            {cost && (
              <div className="recipe">
                <div className="recipe-label">Coût</div>
                <div className={state.gold < cost.gold ? 'short' : undefined}>
                  {fmt(cost.gold)} écus <span className="have">({fmt(state.gold)})</span>
                </div>
                {cost.items.map(({ item, qty }) => (
                  <div key={item} className={owned(state, item) < qty ? 'short' : undefined}>
                    {fmt(qty)} × {ITEMS[item].name} <span className="have">({fmt(owned(state, item))})</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      {!locked && !maxed && (
        <button className="build-btn" disabled={!check.ok} onClick={() => game.update((s) => void build(s, def.id))}>
          {check.ok ? (level === 0 ? 'Construire' : 'Améliorer') : check.reason}
        </button>
      )}
    </div>
  )
}

export function DomainPanel({ state }: { state: GameState }) {
  const tier = settlementTier(state)
  const total = totalBuildingLevels(state)
  const nextTier = TIERS[tier + 1]
  const title = TITLES[state.title]
  const nextTitle = TITLES[state.title + 1]
  const titleCheck = canBuyNextTitle(state)
  const tierProgress = nextTier ? (total - TIERS[tier].minLevels) / (nextTier.minLevels - TIERS[tier].minLevels) : 1

  return (
    <section>
      <header className="panel-header">
        <h2>
          🏘️ Domaine : {TIERS[tier].name}
        </h2>
        <div className="xp-line">
          {nextTier ? (
            <>
              {total} niveaux de bâtiments · {nextTier.name} à {nextTier.minLevels}
            </>
          ) : (
            <>{total} niveaux de bâtiments · palier maximum</>
          )}
        </div>
        <div className="bar">
          <div className="bar-fill xp" style={{ width: `${Math.min(1, tierProgress) * 100}%` }} />
        </div>
        <div className="domain-stats">
          <span>💰 {fmt(taxPerMinute(state))} écus/min d'impôts</span>
          <span>× {TIERS[tier].taxMultiplier} ({TIERS[tier].name})</span>
          {sellBonus(state) > 0 && <span>🏪 revente +{pct(sellBonus(state))}</span>}
          {xpBonus(state) > 0 && <span>📜 XP +{pct(xpBonus(state))}</span>}
        </div>
      </header>

      <div className="title-box">
        <div>
          <div className="recipe-label">Ton titre</div>
          <div className="title-name">👑 {title.name}</div>
        </div>
        {nextTitle ? (
          <div className="title-next">
            <div>
              Prochain titre : <strong>{nextTitle.name}</strong> pour {fmt(nextTitle.cost)} écus
            </div>
            <div className="muted">
              XP +{pct(nextTitle.xpBonus)} · impôts +{pct(nextTitle.taxBonus)}
            </div>
            <button disabled={!titleCheck.ok} onClick={() => game.update((s) => void buyNextTitle(s))}>
              {titleCheck.ok ? `Devenir ${nextTitle.name}` : titleCheck.reason}
            </button>
          </div>
        ) : (
          <div className="title-next">Tu as atteint le sommet : longue vie au Roi !</div>
        )}
      </div>

      <div className="cards">
        {BUILDINGS.map((b) => (
          <BuildingCard key={b.id} state={state} def={b} />
        ))}
      </div>
    </section>
  )
}
