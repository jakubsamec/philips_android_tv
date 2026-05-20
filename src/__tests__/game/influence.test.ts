import { describe, it, expect } from 'vitest'
import { velocityFaktor, prepocitejInfluence, klesajiciVynosy } from '@/lib/game/influence'

// ── velocityFaktor ────────────────────────────────────────────────────────────

describe('velocityFaktor', () => {
  it('vrátí 1.0 pro prázdné pole', () => {
    expect(velocityFaktor([])).toBe(1.0)
  })

  it('vrátí 1.0 pokud nejsou žádné posty za 24h', () => {
    const old = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) // 8 dní zpět
    expect(velocityFaktor([old, old, old])).toBe(1.0)
  })

  it('vrátí hodnotu mezi 1.0 a 2.0', () => {
    const now = new Date()
    const week = Array(7).fill(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000))
    const todayPosts = [now, now, now]
    const result = velocityFaktor([...week, ...todayPosts])
    expect(result).toBeGreaterThanOrEqual(1.0)
    expect(result).toBeLessThanOrEqual(2.0)
  })

  it('maximum je 2.0', () => {
    const now = new Date()
    const manyRecent = Array(100).fill(now)
    expect(velocityFaktor(manyRecent)).toBeLessThanOrEqual(2.0)
  })
})

// ── prepocitejInfluence ───────────────────────────────────────────────────────

describe('prepocitejInfluence', () => {
  it('vrátí 0 bez reakcí a komentářů', () => {
    expect(prepocitejInfluence([], 0, [])).toBe(0)
  })

  it('počítá váhy reakcí správně', () => {
    const reakce = [
      { reaction_type: 'skull' as const },
      { reaction_type: 'fire' as const },
      { reaction_type: 'chart' as const },
      { reaction_type: 'clown' as const },
    ]
    // skull=3, fire=2, chart=2, clown=1 → součet=8, × velocity 1.0 = 8
    const result = prepocitejInfluence(reakce, 0, [])
    expect(result).toBe(8)
  })

  it('komentáře mají váhu 2 každý', () => {
    const result = prepocitejInfluence([], 5, [])
    expect(result).toBe(10) // 5 komentářů × 2
  })

  it('kombinuje reakce + komentáře', () => {
    const reakce = [{ reaction_type: 'skull' as const }] // 3
    const result = prepocitejInfluence(reakce, 3, []) // 3 + 6 = 9
    expect(result).toBe(9)
  })

  it('s velocity faktorem roste influence', () => {
    const now = new Date()
    const manyRecent = Array(50).fill(now)
    const reakce = Array(10).fill({ reaction_type: 'skull' as const }) // 30 base
    const withVelocity = prepocitejInfluence(reakce, 0, manyRecent)
    const without = prepocitejInfluence(reakce, 0, [])
    expect(withVelocity).toBeGreaterThanOrEqual(without)
  })
})

// ── klesajiciVynosy ───────────────────────────────────────────────────────────

describe('klesajiciVynosy', () => {
  it('při nízkém skóre vrátí plný increment', () => {
    // factor = 1 - (0/10000)*0.5 = 1.0
    expect(klesajiciVynosy(0, 100)).toBe(100)
  })

  it('při vysokém skóre je increment redukován', () => {
    // factor = 1 - (5000/10000)*0.5 = 0.75
    const result = klesajiciVynosy(5000, 100)
    expect(result).toBeLessThan(100)
    expect(result).toBeGreaterThan(0)
  })

  it('nikdy neklesne pod 10% incrementu', () => {
    // faktor má minimum 0.1
    const result = klesajiciVynosy(10000, 100)
    expect(result).toBeGreaterThanOrEqual(10)
  })

  it('maximum je plný increment při 0 skóre', () => {
    expect(klesajiciVynosy(0, 50)).toBe(50)
  })
})
