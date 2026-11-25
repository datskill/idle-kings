export const MAX_LEVEL = 99

/**
 * Total XP required to reach `level` (level 1 = 0 XP).
 * A polynomial base keeps early levels quick; the exponential factor
 * stretches the late game (level 99 is around 27 M XP).
 */
export function xpForLevel(level: number): number {
  const n = Math.max(0, Math.min(level, MAX_LEVEL) - 1)
  return Math.floor((30 * n + 6 * Math.pow(n, 2.6)) * Math.pow(1.035, n))
}

const XP_TABLE: number[] = Array.from({ length: MAX_LEVEL + 1 }, (_, l) => xpForLevel(l))

export function levelForXp(xp: number): number {
  let level = 1
  while (level < MAX_LEVEL && xp >= XP_TABLE[level + 1]) level++
  return level
}

/** Progress (0..1) from the current level to the next. */
export function levelProgress(xp: number): number {
  const level = levelForXp(xp)
  if (level >= MAX_LEVEL) return 1
  const start = XP_TABLE[level]
  const end = XP_TABLE[level + 1]
  return (xp - start) / (end - start)
}
