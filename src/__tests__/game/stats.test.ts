import { describe, it, expect } from 'vitest'
import { clampStaty, aplikujCheckin, aplikujVysledekDne } from '@/lib/game/stats'
import type { AvatarStats } from '@/types/avatar'
import type { BossEvent } from '@/types/game'

// ── Pomocné továrny ──────────────────────────────────────────────────────────

const defaultStats = (): AvatarStats => ({
  morale: 70, energy: 80, burnout: 10,
  flex: 0, overtimeMins: 0, loyalty: 50,
})

const mkEvent = (overrides: Partial<BossEvent> = {}): BossEvent => ({
  id: '1', seasonId: 's', title: 'T', description: 'D',
  category: 'realisticky', moraleDelta: 0, burnoutDelta: 0,
  energyDelta: 0, flexDelta: 0, overtimeDelta: 0,
  isActive: true, expiresAt: null, activatedAt: null,
  ...overrides,
})

// ── clampStaty ────────────────────────────────────────────────────────────────

describe('clampStaty', () => {
  it('nepřesáhne 100 pro omezené stavy', () => {
    const result = clampStaty({ morale: 150, energy: 200, burnout: 110, flex: 5, overtimeMins: 0, loyalty: 120 })
    expect(result.morale).toBe(100)
    expect(result.energy).toBe(100)
    expect(result.burnout).toBe(100)
    expect(result.loyalty).toBe(100)
  })

  it('neklesne pod 0 pro omezené stavy', () => {
    const result = clampStaty({ morale: -10, energy: -50, burnout: -5, flex: -1, overtimeMins: -30, loyalty: -20 })
    expect(result.morale).toBe(0)
    expect(result.energy).toBe(0)
    expect(result.burnout).toBe(0)
    expect(result.flex).toBe(0)
    expect(result.overtimeMins).toBe(0)
    expect(result.loyalty).toBe(0)
  })

  it('flex a overtimeMins mohou být libovolně velké (jen >= 0)', () => {
    const result = clampStaty({ ...defaultStats(), flex: 9999, overtimeMins: 5000 })
    expect(result.flex).toBe(9999)
    expect(result.overtimeMins).toBe(5000)
  })

  it('zachová hodnoty v platném rozsahu beze změny', () => {
    const stats = defaultStats()
    expect(clampStaty(stats)).toEqual(stats)
  })
})

// ── aplikujCheckin ────────────────────────────────────────────────────────────

describe('aplikujCheckin', () => {
  it('💀 skull: -15 morálka, +20 vyhoření, -10 energie', () => {
    const { novéStaty, delta } = aplikujCheckin(defaultStats(), {
      officeDays: 3, homeOfficeDays: 2, overtimeMins: 0, dayRating: 'skull',
    }, [])
    expect(delta.morale).toBe(-15)
    expect(delta.burnout).toBe(20)
    expect(delta.energy).toBe(-10)
    expect(novéStaty.morale).toBe(55)
    expect(novéStaty.burnout).toBe(30)
    expect(novéStaty.energy).toBe(70)
  })

  it('🔥 fire: -5 morálka, +10 vyhoření, +5 energie', () => {
    const { delta } = aplikujCheckin(defaultStats(), {
      officeDays: 2, homeOfficeDays: 1, overtimeMins: 0, dayRating: 'fire',
    }, [])
    expect(delta.morale).toBe(-5)
    expect(delta.burnout).toBe(10)
    expect(delta.energy).toBe(5)
  })

  it('🤡 clown: 0 morálka, +5 vyhoření, -5 energie', () => {
    const { delta } = aplikujCheckin(defaultStats(), {
      officeDays: 2, homeOfficeDays: 1, overtimeMins: 0, dayRating: 'clown',
    }, [])
    expect(delta.morale).toBe(0)
    expect(delta.burnout).toBe(5)
    expect(delta.energy).toBe(-5)
  })

  it('📉 chart: -10 morálka, +15 vyhoření, -10 energie', () => {
    const { delta } = aplikujCheckin(defaultStats(), {
      officeDays: 2, homeOfficeDays: 1, overtimeMins: 0, dayRating: 'chart',
    }, [])
    expect(delta.morale).toBe(-10)
    expect(delta.burnout).toBe(15)
    expect(delta.energy).toBe(-10)
  })

  it('přesčas 60 minut = +5 vyhoření navíc', () => {
    const { delta } = aplikujCheckin(defaultStats(), {
      officeDays: 2, homeOfficeDays: 0, overtimeMins: 60, dayRating: 'clown',
    }, [])
    // clown burnout 5 + overtime 5 = 10
    expect(delta.burnout).toBe(10)
  })

  it('přesčas 120 minut = +10 vyhoření navíc', () => {
    const { delta } = aplikujCheckin(defaultStats(), {
      officeDays: 2, homeOfficeDays: 0, overtimeMins: 120, dayRating: 'clown',
    }, [])
    expect(delta.burnout).toBe(15) // 5 + 10
  })

  it('home office dny přidávají flex (10 za den)', () => {
    const { delta } = aplikujCheckin(defaultStats(), {
      officeDays: 0, homeOfficeDays: 3, overtimeMins: 0, dayRating: 'chart',
    }, [])
    expect(delta.flex).toBe(30)
  })

  it('aktivní event se přičítá ke statům', () => {
    const event = mkEvent({ moraleDelta: -20, burnoutDelta: 15, energyDelta: -5 })
    const { delta } = aplikujCheckin(defaultStats(), {
      officeDays: 2, homeOfficeDays: 0, overtimeMins: 0, dayRating: 'clown',
    }, [event])
    expect(delta.morale).toBe(0 + -20)   // clown morale (0) + event (-20)
    expect(delta.burnout).toBe(5 + 15)   // clown burnout (5) + event (15)
    expect(delta.energy).toBe(-5 + -5)   // clown energy (-5) + event (-5)
  })

  it('staty jsou stropovány po aplikaci', () => {
    // Burnout blízko maxima
    const highBurnout: AvatarStats = { ...defaultStats(), burnout: 95 }
    const { novéStaty } = aplikujCheckin(highBurnout, {
      officeDays: 2, homeOfficeDays: 0, overtimeMins: 120, dayRating: 'skull',
    }, [])
    expect(novéStaty.burnout).toBe(100) // 95 + 20(skull) + 10(overtime) → strop 100
    expect(novéStaty.morale).toBeGreaterThanOrEqual(0)
  })
})

// ── aplikujVysledekDne ────────────────────────────────────────────────────────

describe('aplikujVysledekDne', () => {
  it('win: +5 morálka, -2 vyhoření, +3 energie', () => {
    const { delta, novéStaty } = aplikujVysledekDne(defaultStats(), 'win')
    expect(delta.morale).toBe(5)
    expect(delta.burnout).toBe(-2)
    expect(delta.energy).toBe(3)
    expect(novéStaty.morale).toBe(75)
    expect(novéStaty.burnout).toBe(8)
    expect(novéStaty.energy).toBe(83)
  })

  it('lose: -5 morálka, +8 vyhoření, -3 energie', () => {
    const { delta } = aplikujVysledekDne(defaultStats(), 'lose')
    expect(delta.morale).toBe(-5)
    expect(delta.burnout).toBe(8)
    expect(delta.energy).toBe(-3)
  })

  it('draw: 0 morálka, +2 vyhoření, 0 energie', () => {
    const { delta } = aplikujVysledekDne(defaultStats(), 'draw')
    expect(delta.morale).toBe(0)
    expect(delta.burnout).toBe(2)
    expect(delta.energy).toBe(0)
  })

  it('výsledek je stropován', () => {
    const lowStats: AvatarStats = { ...defaultStats(), morale: 2, energy: 1 }
    const { novéStaty } = aplikujVysledekDne(lowStats, 'lose')
    expect(novéStaty.morale).toBe(0) // 2 - 5 → 0 (strop)
    expect(novéStaty.energy).toBe(0) // 1 - 3 → 0 (strop)
  })

  it('loyalty není ovlivněna výsledkem dne', () => {
    const { novéStaty } = aplikujVysledekDne(defaultStats(), 'lose')
    expect(novéStaty.loyalty).toBe(50)
  })
})
