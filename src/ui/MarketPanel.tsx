import { buyPrice, ITEMS, MARKET_MARKUP, MARKET_STOCK } from '../game/data'
import { buyItem, marketStock, owned } from '../game/engine'
import type { GameState } from '../game/state'
import { game } from '../game/store'
import { fmt } from './format'
import { PAGE_ICONS } from './icons'

const AMOUNTS = [1, 10, 100]

export function MarketPanel({ state }: { state: GameState }) {
  return (
    <section>
      <header className="panel-header">
        <h2>
          <PAGE_ICONS.market className="icon title-icon" /> Marché
        </h2>
        <div className="xp-line">
          Achète des matières premières pour gagner du temps. Les marchands prennent leur part : tout coûte {MARKET_MARKUP} fois le prix de revente.
          Tu ne peux acheter que ce que tu sais déjà produire. Pour vendre, passe par la Réserve.
        </div>
      </header>
      <table className="bank">
        <thead>
          <tr>
            <th>Marchandise</th>
            <th>En réserve</th>
            <th>Prix</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {marketStock(state).map((id) => {
            const price = buyPrice(id)
            return (
              <tr key={id}>
                <td>{ITEMS[id].name}</td>
                <td>{fmt(owned(state, id))}</td>
                <td>{fmt(price)} 🪙</td>
                <td className="row-actions">
                  {AMOUNTS.map((n) => (
                    <button key={n} disabled={state.gold < price * n} onClick={() => game.update((s) => void buyItem(s, id, n))}>
                      Acheter {n}
                    </button>
                  ))}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {marketStock(state).length < MARKET_STOCK.length && (
        <p className="muted small">Les marchands te proposeront d'autres marchandises quand tu sauras les produire toi-même.</p>
      )}
    </section>
  )
}
