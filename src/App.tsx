import { useEffect, useState } from 'react'
import { SKILL_IDS, type SkillId } from './game/data'
import { game, useGame } from './game/store'
import { BankPanel } from './ui/BankPanel'
import { MarketPanel } from './ui/MarketPanel'
import { OfflineModal } from './ui/OfflineModal'
import { SettingsPanel } from './ui/SettingsPanel'
import { Sidebar } from './ui/Sidebar'
import { SkillPanel } from './ui/SkillPanel'

export type View = { kind: 'skill'; skill: SkillId } | { kind: 'bank' } | { kind: 'market' } | { kind: 'settings' }

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
        {view.kind === 'skill' && <SkillPanel state={state} skill={view.skill} />}
        {view.kind === 'bank' && <BankPanel state={state} />}
        {view.kind === 'market' && <MarketPanel state={state} />}
        {view.kind === 'settings' && <SettingsPanel />}
      </main>
      {game.offlineReport && <OfflineModal report={game.offlineReport} />}
    </div>
  )
}
