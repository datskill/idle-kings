import { ACTIONS_BY_ID, SKILLS } from '../game/data'

/** Lists newly unlocked actions, e.g. "🪓 Chêne (Bûcheronnage niv. 10)". */
export function UnlockList({ ids }: { ids: string[] }) {
  return (
    <ul className="unlock-list">
      {ids.map((id) => {
        const a = ACTIONS_BY_ID[id]
        if (!a) return null
        const skill = SKILLS[a.skill]
        return (
          <li key={id}>
            {skill.icon} <strong>{a.name}</strong> <span className="muted">({skill.name} niv. {a.levelRequired})</span>
          </li>
        )
      })}
    </ul>
  )
}
