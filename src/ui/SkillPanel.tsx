import { ACTIONS, ITEMS, SKILLS, type SkillId } from '../game/data'
import { skillLevel, toggleAction } from '../game/engine'
import type { GameState } from '../game/state'
import { game } from '../game/store'
import { levelProgress, xpForLevel } from '../game/xp'
import { fmt } from './format'

export function SkillPanel({ state, skill }: { state: GameState; skill: SkillId }) {
  const def = SKILLS[skill]
  const level = skillLevel(state, skill)
  const xp = state.skills[skill].xp
  const actions = ACTIONS.filter((a) => a.skill === skill)

  return (
    <section>
      <header className="panel-header">
        <h2>
          {def.icon} {def.name}
        </h2>
        <div className="xp-line">
          Niveau <strong>{level}</strong> · {fmt(xp)} / {fmt(xpForLevel(level + 1))} XP
        </div>
        <div className="bar">
          <div className="bar-fill xp" style={{ width: `${levelProgress(xp) * 100}%` }} />
        </div>
      </header>

      <div className="cards">
        {actions.map((a) => {
          const locked = level < a.levelRequired
          const running = state.active?.actionId === a.id
          const progress = running ? state.active!.progressMs / a.durationMs : 0
          return (
            <button
              key={a.id}
              className={`card ${running ? 'running' : ''} ${locked ? 'locked' : ''}`}
              disabled={locked}
              onClick={() => game.update((s) => toggleAction(s, a.id))}
            >
              <div className="card-title">{locked ? '🔒 ' : ''}{a.name}</div>
              <div className="card-meta">
                {locked ? (
                  <>Niveau {a.levelRequired} requis</>
                ) : (
                  <>
                    {a.produces.map((p) => `${p.qty} × ${ITEMS[p.item].name}`).join(', ')}
                    <br />
                    {a.xp} XP · {(a.durationMs / 1000).toFixed(1)} s
                  </>
                )}
              </div>
              <div className="bar small">
                <div className="bar-fill" style={{ width: `${progress * 100}%` }} />
              </div>
              {!locked && <div className="card-action">{running ? 'Arrêter' : def.verb}</div>}
            </button>
          )
        })}
      </div>
    </section>
  )
}
