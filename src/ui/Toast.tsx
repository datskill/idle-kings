import { useEffect } from 'react'
import { game } from '../game/store'

/** Short message in the corner (e.g. an action stopped). Fades after a few seconds. */
export function Toast({ message }: { message: string }) {
  useEffect(() => {
    const t = window.setTimeout(() => game.dismissNotice(), 6000)
    return () => window.clearTimeout(t)
  }, [message])
  return (
    <div className="toast" role="status" onClick={() => game.dismissNotice()}>
      {message}
    </div>
  )
}
