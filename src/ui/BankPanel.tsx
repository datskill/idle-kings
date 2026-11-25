import { useState } from 'react'
import { FOOD, GEAR_BY_ITEM } from '../game/combat'
import { ACTIONS, ITEM_ORDER, ITEMS, SKILLS, TOOLS, type ItemId, type SkillId } from '../game/data'
import { sellItem, sellPriceOf, toolUses } from '../game/engine'
import type { GameState } from '../game/state'
import { game } from '../game/store'
import { fmt, fmt2 } from './format'
import { PAGE_ICONS, SKILL_ICONS } from './icons'

/** Group items by the skill that makes them; anything else is loot. */
const PRODUCER: Partial<Record<ItemId, SkillId>> = {}
for (const a of ACTIONS) for (const p of a.produces) PRODUCER[p.item] ??= a.skill

function itemHint(state: GameState, item: ItemId): string | null {
  const gear = GEAR_BY_ITEM[item]
  if (gear) {
    return [gear.attack && `att +${gear.attack}`, gear.strength && `force +${gear.strength}`, gear.defence && `déf +${gear.defence}`]
      .filter(Boolean)
      .join(' · ')
  }
  if (FOOD[item]) return `Soigne ${FOOD[item]} PV`
  const tool = TOOLS.find((t) => t.item === item)
  if (tool) return `${SKILLS[tool.skill].name} ${Math.round((1 - tool.speed) * 100)} % plus rapide · dure ${fmt(toolUses(state, tool))} actions`
  return null
}

export function BankPanel({ state }: { state: GameState }) {
  const [selected, setSelected] = useState<ItemId | null>(null)
  const entries = ITEM_ORDER.filter((id) => (state.bank[id] ?? 0) > 0)
  const groups = new Map<SkillId | 'loot', ItemId[]>()
  for (const id of entries) {
    const key = PRODUCER[id] ?? 'loot'
    groups.set(key, [...(groups.get(key) ?? []), id])
  }
  const sel = selected && (state.bank[selected] ?? 0) > 0 ? selected : null
  const total = entries.reduce((sum, id) => sum + (state.bank[id] ?? 0) * sellPriceOf(state, id), 0)

  return (
    <section>
      <header className="panel-header">
        <h2>
          <PAGE_ICONS.bank className="icon title-icon" /> Réserve
        </h2>
        <div className="xp-line">
          {entries.length} sortes d'objets · valeur de revente {fmt(total)} écus
        </div>
      </header>

      {entries.length === 0 ? (
        <p className="empty">La réserve est vide. Envoie tes gens couper du bois, miner ou pêcher !</p>
      ) : (
        <div className="bank-layout">
          <div>
            {[...groups].map(([key, items]) => {
              const Icon = key === 'loot' ? PAGE_ICONS.loot : SKILL_ICONS[key]
              return (
                <div key={key} className="action-group">
                  <h3 className="group-title">
                    <Icon className="icon" aria-hidden /> {key === 'loot' ? 'Butin' : SKILLS[key].name}
                  </h3>
                  <div className="item-grid">
                    {items.map((id) => (
                      <button key={id} className={`item-tile ${sel === id ? 'selected' : ''}`} onClick={() => setSelected(id)}>
                        <span className="item-name">{ITEMS[id].name}</span>
                        <span className="item-qty">{fmt(state.bank[id] ?? 0)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          <aside className="item-detail settings-block">
            {sel ? (
              <>
                <h3>{ITEMS[sel].name}</h3>
                {itemHint(state, sel) && <p className="muted">{itemHint(state, sel)}</p>}
                <dl className="kv">
                  <dt>En réserve</dt>
                  <dd>{fmt(state.bank[sel] ?? 0)}</dd>
                  <dt>Prix unitaire</dt>
                  <dd>{fmt2(sellPriceOf(state, sel))} écus</dd>
                  <dt>Valeur totale</dt>
                  <dd>{fmt((state.bank[sel] ?? 0) * sellPriceOf(state, sel))} écus</dd>
                </dl>
                <div className="btn-row">
                  {[1, 10].map((n) => (
                    <button
                      key={n}
                      disabled={(state.bank[sel] ?? 0) < n}
                      onClick={() => game.update((s) => sellItem(s, sel, n, sellPriceOf(s, sel)))}
                    >
                      Vendre {n}
                    </button>
                  ))}
                  <button className="primary" onClick={() => game.update((s) => sellItem(s, sel, s.bank[sel] ?? 0, sellPriceOf(s, sel)))}>
                    Tout vendre
                  </button>
                </div>
              </>
            ) : (
              <p className="muted">Choisis un objet pour voir son prix et le vendre.</p>
            )}
          </aside>
        </div>
      )}
    </section>
  )
}
