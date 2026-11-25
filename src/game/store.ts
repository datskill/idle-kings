import { useSyncExternalStore } from 'react'
import { advance, catchUp, emptyReport, type TickReport } from './engine'
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
  lastSavedAt: number | null = null
  private listeners = new Set<Listener>()
  private timer: number | null = null
  private lastSaveAttempt = 0

  constructor() {
    const store = safeStorage()
    const loaded = store ? loadFromStorage(store) : null
    this.state = loaded ?? newGame()
    if (loaded) this.applyCatchUp(Date.now())
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
    if (gap >= OFFLINE_REPORT_MIN_MS && report.completions > 0) {
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
      advance(this.state, gap, emptyReport())
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
    this.save()
    this.emit()
  }

  reset() {
    safeStorage()?.removeItem(STORAGE_KEY)
    this.state = newGame()
    this.offlineReport = null
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
