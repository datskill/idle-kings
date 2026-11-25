import { useState } from 'react'
import { game, useGame } from '../game/store'
import { fmtDuration } from './format'
import { PAGE_ICONS } from './icons'

export function SettingsPanel() {
  useGame()
  const [exported, setExported] = useState('')
  const [importText, setImportText] = useState('')
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  const savedAgo = game.lastSavedAt ? fmtDuration(Date.now() - game.lastSavedAt) : null

  return (
    <section>
      <header className="panel-header">
        <h2>
          <PAGE_ICONS.settings className="icon title-icon" /> Sauvegarde
        </h2>
        <div className="xp-line">
          Sauvegarde automatique toutes les 10 secondes dans ce navigateur.
          {savedAgo && <> Dernière sauvegarde il y a {savedAgo}.</>}
        </div>
      </header>

      <div className="settings-block">
        <h3>Sauvegarder maintenant</h3>
        <button
          onClick={() => {
            game.save()
            setMessage({ ok: true, text: 'Partie sauvegardée.' })
          }}
        >
          💾 Sauvegarder
        </button>
      </div>

      <div className="settings-block">
        <h3>Exporter</h3>
        <p className="muted">Copie ce texte pour garder ta partie ou la transférer sur un autre appareil.</p>
        <button
          onClick={async () => {
            const text = game.exportText()
            setExported(text)
            try {
              await navigator.clipboard.writeText(text)
              setMessage({ ok: true, text: 'Sauvegarde copiée dans le presse-papiers.' })
            } catch {
              setMessage({ ok: true, text: 'Sauvegarde générée ci-dessous.' })
            }
          }}
        >
          📤 Exporter
        </button>
        {exported && <textarea readOnly value={exported} rows={4} onFocus={(e) => e.currentTarget.select()} />}
      </div>

      <div className="settings-block">
        <h3>Importer</h3>
        <p className="muted">Colle une sauvegarde exportée. Elle remplace la partie en cours.</p>
        <textarea value={importText} onChange={(e) => setImportText(e.target.value)} rows={4} placeholder="Colle ta sauvegarde ici" />
        <button
          disabled={!importText.trim()}
          onClick={() => {
            if (!confirm('Remplacer la partie en cours par cette sauvegarde ?')) return
            try {
              game.importText(importText)
              setImportText('')
              setMessage({ ok: true, text: 'Sauvegarde importée.' })
            } catch (e) {
              setMessage({ ok: false, text: (e as Error).message })
            }
          }}
        >
          📥 Importer
        </button>
      </div>

      <div className="settings-block danger">
        <h3>Recommencer</h3>
        <p className="muted">Efface définitivement la partie de ce navigateur.</p>
        <button
          className="danger-btn"
          onClick={() => {
            if (!confirm('Effacer définitivement ta partie ? Exporte-la d’abord si tu veux la garder.')) return
            game.reset()
            setMessage({ ok: true, text: 'Nouvelle partie commencée.' })
          }}
        >
          🗑️ Effacer la partie
        </button>
      </div>

      {message && <p className={message.ok ? 'msg ok' : 'msg err'}>{message.text}</p>}
    </section>
  )
}
