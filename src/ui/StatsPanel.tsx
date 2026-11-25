import { ENEMIES } from '../game/combat'
import { ITEMS, type ItemId } from '../game/data'
import { totalBuildingLevels } from '../game/engine'
import { totalLevel } from '../game/goals'
import type { GameState } from '../game/state'
import { fmt, fmtDuration } from './format'
import { PAGE_ICONS } from './icons'

const dateFmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' })

function Block({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div className="settings-block">
      <h3>{title}</h3>
      <dl className="kv">
        {rows.map(([k, v]) => (
          <div key={k} className="kv-row">
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export function StatsPanel({ state }: { state: GameState }) {
  const st = state.stats
  const kills = Object.values(st.kills).reduce((a, b) => a + b, 0)
  const produced = (Object.entries(st.produced) as [ItemId, number][]).sort((a, b) => b[1] - a[1])
  const earned = st.taxes + st.loot + st.sales

  return (
    <section>
      <header className="panel-header">
        <h2>
          <PAGE_ICONS.stats className="icon title-icon" /> Statistiques
        </h2>
        <div className="xp-line">Ton règne a commencé le {dateFmt.format(state.createdAt)}.</div>
      </header>

      <div className="stats-grid">
        <Block
          title="Règne"
          rows={[
            ['Temps de jeu', fmtDuration(st.playMs)],
            ['Niveau total des métiers', fmt(totalLevel(state))],
            ['Niveaux de bâtiments', fmt(totalBuildingLevels(state))],
            ['Actions réalisées', fmt(st.actions)],
            ['Objets produits', fmt(produced.reduce((n, [, q]) => n + q, 0))],
          ]}
        />
        <Block
          title="Trésor"
          rows={[
            ['Écus gagnés', fmt(earned)],
            ['dont impôts', fmt(st.taxes)],
            ['dont butin', fmt(st.loot)],
            ['dont ventes', fmt(st.sales)],
            ['Écus dépensés', fmt(st.spent)],
            ['Objets vendus', fmt(st.itemsSold)],
            ['Objets achetés', fmt(st.itemsBought)],
          ]}
        />
        <Block
          title="Guerre"
          rows={[
            ['Ennemis vaincus', fmt(kills)],
            ...ENEMIES.filter((e) => st.kills[e.id]).map((e): [string, string] => [e.name, fmt(st.kills[e.id])]),
            ['Mis hors de combat', fmt(st.defeats)],
            ['Repas avalés', fmt(st.foodEaten)],
          ]}
        />
        {produced.length > 0 && (
          <Block title="Production" rows={produced.slice(0, 8).map(([id, n]): [string, string] => [ITEMS[id].name, fmt(n)])} />
        )}
      </div>
      <p className="muted small-note">Les statistiques sont comptées depuis leur ajout au jeu.</p>
    </section>
  )
}
