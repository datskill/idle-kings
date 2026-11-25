import { useSyncExternalStore } from 'react'
import { advance, catchUp, emptyReport, type TickReport } from './engine'
import { claimableGoals } from './goals'
import { exportSave, importSave, loadFromStorage, saveToStorage, STORAGE_KEY } from './save'
import { newGame, type GameState } from './state'

const TICK_MS = 100
const AUTOSAVE_MS = 10_000
/** Gaps longer than this (tab asleep, laptop closed) are reported as offline progress. */
const OFFLINE_REPORT_MIN_MS = 60_000

type Listener = () => void

function safeStorage(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

class GameStore {
  state: GameState
  /** Bumped on every change so React re-renders. */
  revision = 0
  offlineReport: TickReport | null = null
  /** Short message shown to the player, e.g. when an action stops for lack of materials. */
  notice: string | null = null
  /** Actions unlocked during live play, waiting to be shown in a popup. */
  pendingUnlocks: string[] = []
  lastSavedAt: number | null = null
  /** Goals already announced, so each one gets a single notice. */
  private announcedGoals = new Set<string>()
  private listeners = new Set<Listener>()
  private timer: number | null = null
  private lastSaveAttempt = 0

  constructor() {
    const store = safeStorage()
    const loaded = store ? loadFromStorage(store) : null
    this.state = loaded ?? newGame()
    if (loaded) this.applyCatchUp(Date.now())
    this.resetAnnouncedGoals()
  }

  private resetAnnouncedGoals() {
    this.announcedGoals = new Set(claimableGoals(this.state).map((g) => g.id))
  }

  /** Tell the player about goals that just became claimable. */
  private announceGoals() {
    const fresh = claimableGoals(this.state).filter((g) => !this.announcedGoals.has(g.id))
    if (!fresh.length) return
    for (const g of fresh) this.announcedGoals.add(g.id)
    this.notice =
      fresh.length === 1 ? `Objectif atteint : ${fresh[0].name}. Réclame ta récompense dans Objectifs.` : `${fresh.length} objectifs atteints ! Réclame tes récompenses dans Objectifs.`
  }

  subscribe = (fn: Listener) => {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  getRevision = () => this.revision

  private emit() {
    this.revision++
    for (const fn of this.listeners) fn()
  }

  /** Run a mutation and notify the UI. */
  update(mutator: (s: GameState) => void) {
    mutator(this.state)
    this.emit()
  }

  private applyCatchUp(now: number) {
    const gap = now - this.state.lastTick
    const report = catchUp(this.state, now)
    if (gap >= OFFLINE_REPORT_MIN_MS && (report.completions > 0 || report.taxes >= 1)) {
      this.offlineReport = report
    }
  }

  start() {
    if (this.timer !== null) return
    this.timer = window.setInterval(() => this.tick(), TICK_MS)
    document.addEventListener('visibilitychange', this.onVisibility)
    window.addEventListener('beforeunload', this.save)
  }

  stop() {
    if (this.timer !== null) window.clearInterval(this.timer)
    this.timer = null
    document.removeEventListener('visibilitychange', this.onVisibility)
    window.removeEventListener('beforeunload', this.save)
  }

  private onVisibility = () => {
    if (document.hidden) this.save()
    else this.tick()
  }

  private tick() {
    const now = Date.now()
    const gap = now - this.state.lastTick
    if (gap >= OFFLINE_REPORT_MIN_MS) {
      this.applyCatchUp(now)
    } else {
      this.state.lastTick = now
      const report = advance(this.state, gap, emptyReport())
      if (report.stopped === 'missing_materials') this.notice = 'Action arrêtée : il manque des matériaux.'
      if (report.defeated) this.notice = 'Tu as été mis hors de combat. Tes gens te ramènent au domaine pour te soigner.'
      if (report.unlocks.length) this.pendingUnlocks.push(...report.unlocks)
      this.announceGoals()
    }
    if (now - this.lastSaveAttempt >= AUTOSAVE_MS) this.save()
    this.emit()
  }

  save = () => {
    this.lastSaveAttempt = Date.now()
    const store = safeStorage()
    if (!store) return
    try {
      saveToStorage(this.state, store)
      this.lastSavedAt = Date.now()
    } catch {
      // Storage full or blocked: keep playing, the next attempt may succeed.
    }
  }

  dismissUnlocks() {
    this.pendingUnlocks = []
    this.emit()
  }

  dismissNotice() {
    this.notice = null
    this.emit()
  }

  dismissOfflineReport() {
    this.offlineReport = null
    this.emit()
  }

  exportText(): string {
    return exportSave(this.state)
  }

  /** Throws with a readable message if the text is not a valid save. */
  importText(text: string) {
    const loaded = importSave(text)
    this.state = loaded
    this.offlineReport = null
    this.applyCatchUp(Date.now())
    this.resetAnnouncedGoals()
    this.save()
    this.emit()
  }

  reset() {
    safeStorage()?.removeItem(STORAGE_KEY)
    this.state = newGame()
    this.offlineReport = null
    this.resetAnnouncedGoals()
    this.save()
    this.emit()
  }
}

export const game = new GameStore()

/** Re-render the calling component whenever the game state changes. */
export function useGame(): GameState {
  useSyncExternalStore(game.subscribe, game.getRevision)
  return game.state
}
