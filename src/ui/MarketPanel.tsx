import { buyPrice, ITEMS, MARKET_MARKUP, MARKET_STOCK } from '../game/data'
import { buyItem, owned } from '../game/engine'
import type { GameState } from '../game/state'
import { game } from '../game/store'
import { fmt } from './format'

const AMOUNTS = [1, 10, 100]

export function MarketPanel({ state }: { state: GameState }) {
  return (
    <section>
      <header className="panel-header">
        <h2>🏪 Marché</h2>
        <div className="xp-line">
          Achète des matières premières pour gagner du temps. Les marchands prennent leur part : tout coûte {MARKET_MARKUP} fois le prix de revente.
          Pour vendre, passe par la Réserve.
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
          {MARKET_STOCK.map((id) => {
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
    </section>
  )
}
