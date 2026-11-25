import { ACTIONS, ITEMS, SKILLS, type SkillId, type Stack } from '../game/data'
import { actionDuration, affordable, bestTool, owned, skillLevel, toggleAction } from '../game/engine'
import type { GameState } from '../game/state'
import { game } from '../game/store'
import { levelProgress, xpForLevel } from '../game/xp'
import { fmt } from './format'

function StackList({ stacks, state, check }: { stacks: Stack[]; state: GameState; check?: boolean }) {
  return (
    <>
      {stacks.map(({ item, qty }) => {
        const have = owned(state, item)
        const short = check && have < qty
        return (
          <div key={item} className={short ? 'short' : undefined}>
            {qty} × {ITEMS[item].name}
            {check && <span className="have"> ({fmt(have)})</span>}
          </div>
        )
      })}
    </>
  )
}

export function SkillPanel({ state, skill }: { state: GameState; skill: SkillId }) {
  const def = SKILLS[skill]
  const level = skillLevel(state, skill)
  const xp = state.skills[skill].xp
  const actions = ACTIONS.filter((a) => a.skill === skill)
  const tool = bestTool(state, skill)

  return (
    <section>
      <header className="panel-header">
        <h2>
          {def.icon} {def.name}
        </h2>
        <div className="xp-line">
          Niveau <strong>{level}</strong> · {fmt(xp)} / {fmt(xpForLevel(level + 1))} XP
          {tool && (
            <span className="tool-badge">
              {ITEMS[tool.item].name} : {Math.round((1 - tool.speed) * 100)} % plus rapide
            </span>
          )}
        </div>
        <div className="bar">
          <div className="bar-fill xp" style={{ width: `${levelProgress(xp) * 100}%` }} />
        </div>
      </header>

      {game.notice && (
        <div className="notice" onClick={() => game.dismissNotice()}>
          {game.notice} <span className="muted">(cliquer pour fermer)</span>
        </div>
      )}

      <div className="cards">
        {actions.map((a) => {
          const locked = level < a.levelRequired
          const running = state.active?.actionId === a.id
          const missing = !locked && a.consumes.length > 0 && affordable(state, a) < 1
          const duration = actionDuration(state, a)
          const progress = running ? state.active!.progressMs / duration : 0
          return (
            <button
              key={a.id}
              className={`card ${running ? 'running' : ''} ${locked ? 'locked' : ''} ${missing && !running ? 'missing' : ''}`}
              disabled={locked || (missing && !running)}
              onClick={() => {
                game.notice = null
                game.update((s) => toggleAction(s, a.id))
              }}
            >
              <div className="card-title">{locked ? '🔒 ' : ''}{a.name}</div>
              <div className="card-meta">
                {locked ? (
                  <>Niveau {a.levelRequired} requis</>
                ) : (
                  <>
                    {a.consumes.length > 0 && (
                      <div className="recipe">
                        <div className="recipe-label">Consomme</div>
                        <StackList stacks={a.consumes} state={state} check />
                      </div>
                    )}
                    <div className="recipe">
                      {a.consumes.length > 0 && <div className="recipe-label">Produit</div>}
                      <StackList stacks={a.produces} state={state} />
                    </div>
                    {a.xp} XP · {(duration / 1000).toFixed(1)} s
                  </>
                )}
              </div>
              <div className="bar small">
                <div className="bar-fill" style={{ width: `${Math.min(1, progress) * 100}%` }} />
              </div>
              {!locked && <div className="card-action">{running ? 'Arrêter' : missing ? 'Matériaux manquants' : def.verb}</div>}
            </button>
          )
        })}
      </div>
    </section>
  )
}
