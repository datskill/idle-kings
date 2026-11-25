import { useEffect, useState } from 'react'
import { SKILL_IDS, SKILLS, type SkillId } from './game/data'
import { game, useGame } from './game/store'
import { BankPanel } from './ui/BankPanel'
import { CombatPanel } from './ui/CombatPanel'
import { DomainPanel } from './ui/DomainPanel'
import { GoalsPanel } from './ui/GoalsPanel'
import { MarketPanel } from './ui/MarketPanel'
import { OfflineModal } from './ui/OfflineModal'
import { SettingsPanel } from './ui/SettingsPanel'
import { Sidebar } from './ui/Sidebar'
import { SkillPanel } from './ui/SkillPanel'
import { StatsPanel } from './ui/StatsPanel'
import { Toast } from './ui/Toast'
import { Topbar } from './ui/Topbar'
import { UnlockModal } from './ui/UnlockModal'

export type View =
  | { kind: 'skill'; skill: SkillId }
  | { kind: 'domain' }
  | { kind: 'combat' }
  | { kind: 'bank' }
  | { kind: 'market' }
  | { kind: 'settings' }
  | { kind: 'goals' }
  | { kind: 'stats' }

export default function App() {
  const state = useGame()
  const [view, setView] = useState<View>({ kind: 'skill', skill: SKILL_IDS[0] })
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    game.start()
    return () => game.stop()
  }, [])

  const goTo = (v: View) => {
    setView(v)
    setMenuOpen(false)
    window.scrollTo({ top: 0 })
  }

  const isCombatView = view.kind === 'combat' || (view.kind === 'skill' && SKILLS[view.skill].category === 'combat')

  return (
    <div className="app">
      <Topbar state={state} onMenu={() => setMenuOpen((o) => !o)} onGoTo={goTo} />
      <div className="layout">
        <Sidebar state={state} view={view} onSelect={goTo} open={menuOpen} />
        {menuOpen && <div className="scrim" onClick={() => setMenuOpen(false)} />}
        <main className="main">
          <div className="main-inner">
            {view.kind === 'skill' && !isCombatView && <SkillPanel state={state} skill={view.skill} />}
            {isCombatView && <CombatPanel state={state} />}
            {view.kind === 'domain' && <DomainPanel state={state} />}
            {view.kind === 'bank' && <BankPanel state={state} />}
            {view.kind === 'market' && <MarketPanel state={state} />}
            {view.kind === 'goals' && <GoalsPanel state={state} onGoTo={goTo} />}
            {view.kind === 'stats' && <StatsPanel state={state} />}
            {view.kind === 'settings' && <SettingsPanel />}
          </div>
        </main>
      </div>
      {game.notice && <Toast message={game.notice} />}
      {game.offlineReport ? (
        <OfflineModal report={game.offlineReport} />
      ) : (
        game.pendingUnlocks.length > 0 && <UnlockModal ids={game.pendingUnlocks} />
      )}
    </div>
  )
}
