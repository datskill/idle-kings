import type { View } from '../App'
import { ACTIONS_BY_ID, SKILL_IDS, SKILLS } from '../game/data'
import { skillLevel } from '../game/engine'
import type { GameState } from '../game/state'
import { MAX_LEVEL } from '../game/xp'
import { fmt } from './format'

interface Props {
  state: GameState
  view: View
  onSelect: (v: View) => void
}

export function Sidebar({ state, view, onSelect }: Props) {
  const activeSkill = state.active ? ACTIONS_BY_ID[state.active.actionId]?.skill : null
  return (
    <nav className="sidebar">
      <h1 className="logo">👑 Idle Kings</h1>
      <div className="gold">🪙 {fmt(state.gold)} écus</div>

      <div className="nav-section">Domaine</div>
      <button className={`nav-item ${view.kind === 'bank' ? 'selected' : ''}`} onClick={() => onSelect({ kind: 'bank' })}>
        <span>📦 Réserve</span>
      </button>

      <div className="nav-section">Métiers</div>
      {SKILL_IDS.map((id) => (
        <button
          key={id}
          className={`nav-item ${view.kind === 'skill' && view.skill === id ? 'selected' : ''}`}
          onClick={() => onSelect({ kind: 'skill', skill: id })}
        >
          <span>
            {SKILLS[id].icon} {SKILLS[id].name}
            {activeSkill === id && <span className="pulse" title="En cours" />}
          </span>
          <span className="nav-level">
            {skillLevel(state, id)}/{MAX_LEVEL}
          </span>
        </button>
      ))}

      <div className="nav-spacer" />
      <button className={`nav-item ${view.kind === 'settings' ? 'selected' : ''}`} onClick={() => onSelect({ kind: 'settings' })}>
        <span>⚙️ Sauvegarde</span>
      </button>
    </nav>
  )
}
