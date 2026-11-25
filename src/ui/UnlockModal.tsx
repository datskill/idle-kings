import { game } from '../game/store'
import { UnlockList } from './UnlockList'

export function UnlockModal({ ids }: { ids: string[] }) {
  return (
    <div className="modal-backdrop" onClick={() => game.dismissUnlocks()}>
      <div className="modal unlock" onClick={(e) => e.stopPropagation()}>
        <div className="unlock-icon">🎉</div>
        <h2>{ids.length > 1 ? 'Nouveaux paliers débloqués' : 'Nouveau palier débloqué'}</h2>
        <UnlockList ids={ids} />
        <button onClick={() => game.dismissUnlocks()}>Parfait</button>
      </div>
    </div>
  )
}
