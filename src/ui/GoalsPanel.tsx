import type { View } from '../App'
import {
  CHAPTERS, claimableGoals, claimGoal, currentChapter, FEATS, goalProgress, isClaimed, isGoalDone, QUESTS, type GoalDef,
  type GoalLink,
} from '../game/goals'
import type { GameState } from '../game/state'
import { game } from '../game/store'
import { fmt, fmtDuration } from './format'
import { PAGE_ICONS } from './icons'

const HOUR = 3_600_000

function linkToView(link: GoalLink): View {
  return link === 'domain' || link === 'combat' || link === 'bank' || link === 'market' ? { kind: link } : { kind: 'skill', skill: link }
}

/** Playtime goals read better as hours. */
function progressText(goal: GoalDef, value: number): string {
  if (goal.target >= HOUR && goal.target % HOUR === 0) return `${fmtDuration(value)} / ${fmt(goal.target / HOUR)} h`
  return `${fmt(value)} / ${fmt(goal.target)}`
}

function GoalRow({ state, goal, onGoTo }: { state: GameState; goal: GoalDef; onGoTo: (v: View) => void }) {
  const claimed = isClaimed(state, goal.id)
  const done = isGoalDone(state, goal)
  const value = goalProgress(state, goal)
  return (
    <li className={`goal ${claimed ? 'claimed' : done ? 'done' : ''}`}>
      <span className="goal-check" aria-hidden>
        {claimed ? <PAGE_ICONS.check /> : null}
      </span>
      <div className="goal-body">
        <div className="goal-name">{goal.name}</div>
        {!claimed && (
          <>
            <div className="bar small goal-bar">
              <div className="bar-fill xp" style={{ width: `${(value / goal.target) * 100}%` }} />
            </div>
            <div className="goal-meta">
              {progressText(goal, value)}
              {goal.reward > 0 && (
                <span className="goal-reward">
                  <PAGE_ICONS.gold className="icon" aria-hidden /> {fmt(goal.reward)}
                </span>
              )}
            </div>
          </>
        )}
      </div>
      {!claimed &&
        (done ? (
          <button className="primary" onClick={() => game.update((s) => void claimGoal(s, goal.id))}>
            Réclamer
          </button>
        ) : (
          goal.link && <button onClick={() => onGoTo(linkToView(goal.link!))}>Y aller</button>
        ))}
    </li>
  )
}

export function GoalsPanel({ state, onGoTo }: { state: GameState; onGoTo: (v: View) => void }) {
  const chapter = currentChapter(state)
  const finished = chapter >= CHAPTERS.length
  const quests = QUESTS.filter((q) => q.chapter === chapter)
  const pastChapters = CHAPTERS.slice(0, chapter)
  const featsDone = FEATS.filter((f) => isClaimed(state, f.id)).length
  const claimable = claimableGoals(state).length

  return (
    <section>
      <header className="panel-header">
        <h2>
          <PAGE_ICONS.goals className="icon title-icon" /> Objectifs
        </h2>
        <div className="xp-line">
          {finished ? 'Toutes les quêtes sont accomplies. Longue vie au roi !' : `Chapitre ${chapter + 1} sur ${CHAPTERS.length}`}
          {claimable > 0 && <> · {claimable} récompense{claimable > 1 ? 's' : ''} à réclamer</>}
        </div>
      </header>

      {!finished && (
        <div className="action-group">
          <h3 className="group-title">
            <PAGE_ICONS.quest className="icon" aria-hidden /> {CHAPTERS[chapter].name}
          </h3>
          <p className="chapter-intro">{CHAPTERS[chapter].intro}</p>
          <ul className="goal-list">
            {quests.map((g) => (
              <GoalRow key={g.id} state={state} goal={g} onGoTo={onGoTo} />
            ))}
          </ul>
          <p className="muted small-note">Réclame toutes les récompenses du chapitre pour passer au suivant.</p>
        </div>
      )}

      <div className="action-group">
        <h3 className="group-title">
          <PAGE_ICONS.feat className="icon" aria-hidden /> Hauts faits
          <span className="group-count">
            {featsDone}/{FEATS.length}
          </span>
        </h3>
        <ul className="goal-list">
          {FEATS.map((g) => (
            <GoalRow key={g.id} state={state} goal={g} onGoTo={onGoTo} />
          ))}
        </ul>
      </div>

      {pastChapters.length > 0 && (
        <div className="action-group">
          <h3 className="group-title">
            <PAGE_ICONS.check className="icon" aria-hidden /> Chapitres accomplis
          </h3>
          <div className="domain-stats">
            {pastChapters.map((c) => (
              <span key={c.name} className="chip">
                {c.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
