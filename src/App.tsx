import { useEffect, useState } from 'react'
import { SKILL_IDS, SKILLS, type SkillId } from './game/data'
import { game, useGame } from './game/store'
import { BankPanel } from './ui/BankPanel'
import { CombatPanel } from './ui/CombatPanel'
import { DomainPanel } from './ui/DomainPanel'
import { MarketPanel } from './ui/MarketPanel'
import { OfflineModal } from './ui/OfflineModal'
import { UnlockModal } from './ui/UnlockModal'
import { SettingsPanel } from './ui/SettingsPanel'
import { Sidebar } from './ui/Sidebar'
import { SkillPanel } from './ui/SkillPanel'

export type View = { kind: 'skill'; skill: SkillId } | { kind: 'domain' } | { kind: 'combat' } | { kind: 'bank' } | { kind: 'market' } | { kind: 'settings' }

export default function App() {
  const state = useGame()
  const [view, setView] = useState<View>({ kind: 'skill', skill: SKILL_IDS[0] })

  useEffect(() => {
    game.start()
    return () => game.stop()
  }, [])

  return (
    <div className="layout">
      <Sidebar state={state} view={view} onSelect={setView} />
      <main className="main">
        {view.kind === 'skill' && SKILLS[view.skill].category !== 'combat' && <SkillPanel state={state} skill={view.skill} />}
        {(view.kind === 'combat' || (view.kind === 'skill' && SKILLS[view.skill].category === 'combat')) && <CombatPanel state={state} />}
        {view.kind === 'domain' && <DomainPanel state={state} />}
        {view.kind === 'bank' && <BankPanel state={state} />}
        {view.kind === 'market' && <MarketPanel state={state} />}
        {view.kind === 'settings' && <SettingsPanel />}
      </main>
      {game.offlineReport ? (
        <OfflineModal report={game.offlineReport} />
      ) : (
        game.pendingUnlocks.length > 0 && <UnlockModal ids={game.pendingUnlocks} />
      )}
    </div>
  )
}
