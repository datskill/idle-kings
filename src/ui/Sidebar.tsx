import type { View } from '../App'
import { ACTIONS_BY_ID, SKILL_IDS, SKILLS, type SkillCategory } from '../game/data'
import { TIERS, TITLES } from '../game/domain'
import { settlementTier, skillLevel } from '../game/engine'
import type { GameState } from '../game/state'
import { MAX_LEVEL } from '../game/xp'
import { fmt } from './format'

interface Props {
  state: GameState
  view: View
  onSelect: (v: View) => void
}

const CATEGORIES: { id: SkillCategory; label: string }[] = [
  { id: 'gathering', label: 'Récolte' },
  { id: 'crafting', label: 'Artisanat' },
]

export function Sidebar({ state, view, onSelect }: Props) {
  const activeSkill = state.active ? ACTIONS_BY_ID[state.active.actionId]?.skill : null
  const page = (kind: 'domain' | 'bank' | 'market' | 'settings', label: string) => (
    <button className={`nav-item ${view.kind === kind ? 'selected' : ''}`} onClick={() => onSelect({ kind })}>
      <span>{label}</span>
    </button>
  )
  return (
    <nav className="sidebar">
      <h1 className="logo">👑 Idle Kings</h1>
      <div className="gold">🪙 {fmt(state.gold)} écus</div>
      <div className="side-title">{TITLES[state.title].name} · {TIERS[settlementTier(state)].name}</div>

      <div className="nav-section">Domaine</div>
      {page('domain', '🏘️ Bâtiments')}
      {page('bank', '📦 Réserve')}
      {page('market', '🏪 Marché')}

      {CATEGORIES.map((cat) => (
        <div key={cat.id} className="nav-group">
          <div className="nav-section">{cat.label}</div>
          {SKILL_IDS.filter((id) => SKILLS[id].category === cat.id).map((id) => (
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
        </div>
      ))}

      <div className="nav-spacer" />
      {page('settings', '⚙️ Sauvegarde')}
    </nav>
  )
}
