import { ITEMS, SKILLS, type ItemId, type SkillId } from '../game/data'
import { OFFLINE_CAP_MS, type TickReport } from '../game/engine'
import { game } from '../game/store'
import { fmt, fmtDuration } from './format'

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
          {(Object.entries(report.xp) as [SkillId, number][]).map(([s, xp]) => (
            <li key={s}>
              {SKILLS[s].icon} {SKILLS[s].name} : +{fmt(xp)} XP
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
        {report.stopped === 'missing_materials' && <p className="muted">L'action s'est arrêtée faute de matériaux.</p>}
        <button onClick={() => game.dismissOfflineReport()}>Continuer</button>
      </div>
    </div>
  )
}
