import { ENEMIES_BY_ID } from '../game/combat'
import { ACTIONS_BY_ID, SKILLS } from '../game/data'
import { SkillIcon } from './icons'

/** Lists newly unlocked actions and enemies, e.g. "🪓 Chêne (Bûcheronnage niv. 10)". */
export function UnlockList({ ids }: { ids: string[] }) {
  return (
    <ul className="unlock-list">
      {ids.map((id) => {
        if (id.startsWith('enemy:')) {
          const e = ENEMIES_BY_ID[id.slice(6)]
          return e ? (
            <li key={id}>
              ⚔️ <strong>{e.name}</strong> <span className="muted">(nouvel adversaire, {e.area})</span>
            </li>
          ) : null
        }
        const a = ACTIONS_BY_ID[id]
        if (!a) return null
        const skill = SKILLS[a.skill]
        return (
          <li key={id}>
            <SkillIcon skill={a.skill} /> <strong>{a.name}</strong> <span className="muted">({skill.name} niv. {a.levelRequired})</span>
          </li>
        )
      })}
    </ul>
  )
}
