import type { IconType } from 'react-icons'
import type { View } from '../App'
import { ACTIONS_BY_ID, SKILL_IDS, SKILLS, type SkillCategory } from '../game/data'
import { buildableCount, skillLevel } from '../game/engine'
import type { GameState } from '../game/state'
import { levelProgress } from '../game/xp'
import { PAGE_ICONS, SkillIcon } from './icons'

interface Props {
  state: GameState
  view: View
  onSelect: (v: View) => void
  open: boolean
}

const CATEGORIES: { id: SkillCategory; label: string }[] = [
  { id: 'gathering', label: 'Récolte' },
  { id: 'crafting', label: 'Artisanat' },
  { id: 'combat', label: 'Guerre' },
]

type PageKind = 'domain' | 'combat' | 'bank' | 'market' | 'settings'

export function Sidebar({ state, view, onSelect, open }: Props) {
  const activeSkill = state.active ? ACTIONS_BY_ID[state.active.actionId]?.skill : null
  const buildable = buildableCount(state)

  const page = (kind: PageKind, label: string, Icon: IconType, extra?: React.ReactNode) => (
    <button className={`nav-item ${view.kind === kind ? 'selected' : ''}`} onClick={() => onSelect({ kind })}>
      <Icon className="icon nav-icon" aria-hidden />
      <span className="nav-label">{label}</span>
      {extra}
    </button>
  )

  return (
    <nav className={`sidebar ${open ? 'open' : ''}`} aria-label="Navigation">
      <div className="nav-section">Domaine</div>
      {page(
        'domain',
        'Bâtiments',
        PAGE_ICONS.domain,
        buildable > 0 && (
          <span className="badge" title={`${buildable} bâtiment${buildable > 1 ? 's' : ''} à construire ou améliorer`}>
            {buildable}
          </span>
        ),
      )}
      {page('bank', 'Réserve', PAGE_ICONS.bank)}
      {page('market', 'Marché', PAGE_ICONS.market)}

      {CATEGORIES.map((cat) => (
        <div key={cat.id}>
          <div className="nav-section">{cat.label}</div>
          {cat.id === 'combat' && page('combat', 'Combat', PAGE_ICONS.combat, state.combat && <span className="pulse" title="En cours" />)}
          {SKILL_IDS.filter((id) => SKILLS[id].category === cat.id).map((id) => {
            const selected = view.kind === 'skill' && view.skill === id
            return (
              <button key={id} className={`nav-item skill ${selected ? 'selected' : ''}`} onClick={() => onSelect({ kind: 'skill', skill: id })}>
                <SkillIcon skill={id} className="nav-icon" />
                <span className="nav-label">
                  {SKILLS[id].name}
                  <span className="nav-xp">
                    <span style={{ width: `${levelProgress(state.skills[id].xp) * 100}%` }} />
                  </span>
                </span>
                {activeSkill === id && <span className="pulse" title="En cours" />}
                <span className="nav-level">{skillLevel(state, id)}</span>
              </button>
            )
          })}
        </div>
      ))}

      <div className="nav-spacer" />
      {page('settings', 'Sauvegarde', PAGE_ICONS.settings)}
    </nav>
  )
}
