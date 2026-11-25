import { GiHamburgerMenu } from 'react-icons/gi'
import type { View } from '../App'
import { ENEMIES_BY_ID, maxHp } from '../game/combat'
import { ACTIONS_BY_ID } from '../game/data'
import { TIERS, TITLES } from '../game/domain'
import { actionDuration, settlementTier } from '../game/engine'
import type { GameState } from '../game/state'
import { fmt } from './format'
import { PAGE_ICONS, SkillIcon } from './icons'

interface Props {
  state: GameState
  onMenu: () => void
  onGoTo: (v: View) => void
}

/** Always-visible header: title, current activity with its progress, and gold. */
export function Topbar({ state, onMenu, onGoTo }: Props) {
  const action = state.active ? ACTIONS_BY_ID[state.active.actionId] : null
  const enemy = state.combat ? ENEMIES_BY_ID[state.combat.enemyId] : null
  const Crown = PAGE_ICONS.crown
  const Coins = PAGE_ICONS.gold
  const Swords = PAGE_ICONS.combat

  let activity: React.ReactNode = <span className="muted">Tes gens se reposent. Choisis une activité.</span>
  if (action && state.active) {
    const progress = state.active.progressMs / actionDuration(state, action)
    activity = (
      <button className="activity" onClick={() => onGoTo({ kind: 'skill', skill: action.skill })}>
        <SkillIcon skill={action.skill} />
        <span className="activity-text">
          <span className="activity-name">{action.name}</span>
          <span className="activity-bar">
            <span style={{ width: `${Math.min(1, progress) * 100}%` }} />
          </span>
        </span>
      </button>
    )
  } else if (enemy && state.combat) {
    activity = (
      <button className="activity" onClick={() => onGoTo({ kind: 'combat' })}>
        <Swords className="icon" aria-hidden />
        <span className="activity-text">
          <span className="activity-name">
            Combat : {enemy.name} <span className="muted">· {Math.ceil(state.hp)}/{maxHp(state)} PV</span>
          </span>
          <span className="activity-bar hp">
            <span style={{ width: `${(Math.max(0, state.combat.enemyHp) / enemy.hp) * 100}%` }} />
          </span>
        </span>
      </button>
    )
  }

  return (
    <header className="topbar">
      <button className="menu-btn" onClick={onMenu} aria-label="Ouvrir le menu">
        <GiHamburgerMenu />
      </button>
      <div className="brand">
        <Crown className="icon brand-icon" aria-hidden />
        <div>
          <div className="brand-name">Idle Kings</div>
          <div className="brand-sub">
            {TITLES[state.title].name} · {TIERS[settlementTier(state)].name}
          </div>
        </div>
      </div>
      <div className="topbar-activity">{activity}</div>
      <div className="gold-pill" title="Écus">
        <Coins className="icon" aria-hidden />
        {fmt(state.gold)}
      </div>
    </header>
  )
}
