import { ENEMIES_BY_ID } from '../game/combat'
import { ITEMS, SKILLS, type ItemId, type SkillId } from '../game/data'
import { OFFLINE_CAP_MS, type TickReport } from '../game/engine'
import { game } from '../game/store'
import { fmt, fmtDuration } from './format'
import { UnlockList } from './UnlockList'
import { SkillIcon } from './icons'

export function OfflineModal({ report }: { report: TickReport }) {
  return (
    <div className="modal-backdrop" onClick={() => game.dismissOfflineReport()}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Bon retour, Majesté</h2>
        <p className="muted">
          Pendant ton absence ({fmtDuration(report.elapsedMs)}
          {report.elapsedMs >= OFFLINE_CAP_MS && ', maximum atteint'}), tes gens ont travaillé :
        </p>
        <ul>
          {report.taxes >= 1 && <li>💰 Impôts : +{fmt(report.taxes)} écus</li>}
          {Object.entries(report.kills).map(([id, n]) => (
            <li key={id}>
              ⚔️ {ENEMIES_BY_ID[id]?.name ?? id} vaincus : {fmt(n)}
            </li>
          ))}
          {report.loot >= 1 && <li>💰 Butin : +{fmt(report.loot)} écus</li>}
          {(Object.entries(report.xp) as [SkillId, number][]).map(([s, xp]) => (
            <li key={s}>
              <SkillIcon skill={s} /> {SKILLS[s].name} : +{fmt(xp)} XP
              {report.levelsGained[s] ? ` (+${report.levelsGained[s]} niveau${report.levelsGained[s]! > 1 ? 'x' : ''})` : ''}
            </li>
          ))}
          {(Object.entries(report.items) as [ItemId, number][]).map(([i, n]) => (
            <li key={i}>
              {n > 0 ? '+' : '−'}
              {fmt(Math.abs(n))} {ITEMS[i].name}
            </li>
          ))}
        </ul>
        {report.unlocks.length > 0 && (
          <>
            <h3 className="unlock-title">🎉 Débloqué pendant ton absence</h3>
            <UnlockList ids={report.unlocks} />
          </>
        )}
        {Object.keys(report.toolsBroken).length > 0 && (
          <p className="muted">
            Outils usés et cassés :{' '}
            {(Object.entries(report.toolsBroken) as [ItemId, number][]).map(([i, n]) => `${n} × ${ITEMS[i].name}`).join(', ')}.
          </p>
        )}
        {report.defeated && <p className="muted">Tu as fini par être mis hors de combat : le combat s'est arrêté.</p>}
        {report.stopped === 'missing_materials' && <p className="muted">L'action s'est arrêtée faute de matériaux.</p>}
        <button onClick={() => game.dismissOfflineReport()}>Continuer</button>
      </div>
    </div>
  )
}
