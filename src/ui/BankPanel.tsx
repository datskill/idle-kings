import { ITEM_ORDER, ITEMS } from '../game/data'
import { sellItem } from '../game/engine'
import type { GameState } from '../game/state'
import { game } from '../game/store'
import { fmt } from './format'

export function BankPanel({ state }: { state: GameState }) {
  const entries = ITEM_ORDER.map((id) => [id, state.bank[id] ?? 0] as const).filter(([, n]) => n > 0)
  return (
    <section>
      <header className="panel-header">
        <h2>📦 Réserve</h2>
        <div className="xp-line">Tout ce que ton domaine a produit.</div>
      </header>
      {entries.length === 0 ? (
        <p className="muted">La réserve est vide. Envoie tes gens couper du bois, miner ou pêcher !</p>
      ) : (
        <table className="bank">
          <thead>
            <tr>
              <th>Objet</th>
              <th>Quantité</th>
              <th>Prix</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {entries.map(([id, n]) => (
              <tr key={id}>
                <td>{ITEMS[id].name}</td>
                <td>{fmt(n)}</td>
                <td>{ITEMS[id].sellPrice} 🪙</td>
                <td className="row-actions">
                  <button onClick={() => game.update((s) => sellItem(s, id, 1, ITEMS[id].sellPrice))}>Vendre 1</button>
                  <button onClick={() => game.update((s) => sellItem(s, id, n, ITEMS[id].sellPrice))}>Tout vendre</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
