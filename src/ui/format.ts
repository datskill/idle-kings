const nf = new Intl.NumberFormat('fr-FR')

export const fmt = (n: number) => nf.format(Math.floor(n))

const nf2 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 })
/** Keeps up to two decimals, for prices. */
export const fmt2 = (n: number) => nf2.format(n)

export function fmtDuration(ms: number): string {
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return `${h} h ${String(m).padStart(2, '0')} min`
  if (m > 0) return `${m} min`
  return `${s} s`
}
