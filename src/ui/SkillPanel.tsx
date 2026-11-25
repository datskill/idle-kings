import { ACTION_GROUPS, ACTIONS, ITEMS, SKILLS, type ActionDef, type ActionGroup, type SkillId, type Stack } from '../game/data'
import { actionDuration, affordable, bestTool, nextUnlockLevel, owned, skillLevel, toggleAction } from '../game/engine'
import type { GameState } from '../game/state'
import { game } from '../game/store'
import { levelProgress, xpForLevel } from '../game/xp'
import { fmt } from './format'
import { SkillIcon } from './icons'

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
  // Actions above the player's level stay hidden until they unlock.
  const actions = ACTIONS.filter((a) => a.skill === skill && a.levelRequired <= level)
  const nextUnlock = nextUnlockLevel(state, skill)
  const tool = bestTool(state, skill)

  // Split into sub-sections when the skill defines groups, keeping data order.
  const sections: [ActionGroup | undefined, ActionDef[]][] = []
  for (const a of actions) {
    const last = sections.find(([g]) => g === a.group)
    if (last) last[1].push(a)
    else sections.push([a.group, [a]])
  }

  const renderCard = (a: ActionDef) => {
    const running = state.active?.actionId === a.id
    const missing = a.consumes.length > 0 && affordable(state, a) < 1
    const duration = actionDuration(state, a)
    const progress = running ? state.active!.progressMs / duration : 0
    return (
      <button
        key={a.id}
        className={`card ${running ? 'running' : ''} ${missing && !running ? 'missing' : ''}`}
        disabled={missing && !running}
        onClick={() => {
          game.notice = null
          game.update((s) => toggleAction(s, a.id))
        }}
      >
        <div className="card-title">{a.name}</div>
        <div className="card-meta">
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
        </div>
        <div className="bar small">
          <div className="bar-fill" style={{ width: `${Math.min(1, progress) * 100}%` }} />
        </div>
        <div className="card-action">{running ? 'Arrêter' : missing ? 'Matériaux manquants' : def.verb}</div>
      </button>
    )
  }

  return (
    <section>
      <header className="panel-header">
        <h2>
          <SkillIcon skill={skill} className="title-icon" /> {def.name}
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
        {nextUnlock && <div className="next-unlock">Prochain déblocage au niveau {nextUnlock}</div>}
      </header>


      {sections.map(([group, list]) => (
        <div key={group ?? 'all'} className="action-group">
          {group && <h3 className="group-title">{ACTION_GROUPS[group]}</h3>}
          <div className="cards">{list.map(renderCard)}</div>
        </div>
      ))}
    </section>
  )
}
