import { describe, it, expect } from 'vitest'
import { xpZaCheckin, xpZaReakci, levelZXP } from '@/lib/game/xp'
import { XP_TABLE } from '@/lib/constants'

// ── xpZaCheckin ───────────────────────────────────────────────────────────────

describe('xpZaCheckin', () => {
  it('základní XP bez přesčasu: skull=25, fire=22, clown=22, chart=18', () => {
    // základ 10 + rating bonus
    expect(xpZaCheckin({ officeDays: 2, homeOfficeDays: 1, overtimeMins: 0, dayRating: 'skull' })).toBe(25)
    expect(xpZaCheckin({ officeDays: 2, homeOfficeDays: 1, overtimeMins: 0, dayRating: 'fire' })).toBe(22)
    expect(xpZaCheckin({ officeDays: 2, homeOfficeDays: 1, overtimeMins: 0, dayRating: 'clown' })).toBe(22)
    expect(xpZaCheckin({ officeDays: 2, homeOfficeDays: 1, overtimeMins: 0, dayRating: 'chart' })).toBe(18)
  })

  it('přesčas +2 XP za každých 30 minut, max +20', () => {
    const base = xpZaCheckin({ officeDays: 2, homeOfficeDays: 0, overtimeMins: 0, dayRating: 'chart' })
    expect(xpZaCheckin({ officeDays: 2, homeOfficeDays: 0, overtimeMins: 30, dayRating: 'chart' })).toBe(base + 2)
    expect(xpZaCheckin({ officeDays: 2, homeOfficeDays: 0, overtimeMins: 60, dayRating: 'chart' })).toBe(base + 4)
    expect(xpZaCheckin({ officeDays: 2, homeOfficeDays: 0, overtimeMins: 300, dayRating: 'chart' })).toBe(base + 20)
    expect(xpZaCheckin({ officeDays: 2, homeOfficeDays: 0, overtimeMins: 9999, dayRating: 'chart' })).toBe(base + 20)
  })

  it('29 minut přesčasu = 0 bonus XP', () => {
    const noOvertime = xpZaCheckin({ officeDays: 2, homeOfficeDays: 0, overtimeMins: 0, dayRating: 'skull' })
    const justBelow = xpZaCheckin({ officeDays: 2, homeOfficeDays: 0, overtimeMins: 29, dayRating: 'skull' })
    expect(justBelow).toBe(noOvertime)
  })
})

// ── xpZaReakci ────────────────────────────────────────────────────────────────

describe('xpZaReakci', () => {
  it('váhy reakcí: skull=3, fire=2, chart=2, clown=1', () => {
    expect(xpZaReakci('skull')).toBe(3)
    expect(xpZaReakci('fire')).toBe(2)
    expect(xpZaReakci('chart')).toBe(2)
    expect(xpZaReakci('clown')).toBe(1)
  })
})

// ── levelZXP ──────────────────────────────────────────────────────────────────

describe('levelZXP', () => {
  it('0 XP = level 1, progress 0%', () => {
    const r = levelZXP(0)
    expect(r.level).toBe(1)
    expect(r.xpToNext).toBe(100)
    expect(r.progress).toBe(0)
  })

  it('přesně na hranici levelu', () => {
    // XP_TABLE[1] = 100 → level 2
    expect(levelZXP(100).level).toBe(2)
    // XP_TABLE[2] = 250 → level 3
    expect(levelZXP(250).level).toBe(3)
    // XP_TABLE[4] = 900 → level 5
    expect(levelZXP(900).level).toBe(5)
  })

  it('těsně pod hranicí zůstane na nižším levelu', () => {
    expect(levelZXP(99).level).toBe(1)
    expect(levelZXP(249).level).toBe(2)
  })

  it('progress je správně vypočten', () => {
    // Level 1: 0–100 XP → při 50 XP = 50%
    const r = levelZXP(50)
    expect(r.level).toBe(1)
    expect(r.progress).toBe(50)
    expect(r.xpToNext).toBe(50)
  })

  it('maximální level: progress=100, xpToNext=0', () => {
    const maxXP = XP_TABLE[XP_TABLE.length - 1]
    const r = levelZXP(maxXP)
    expect(r.level).toBe(XP_TABLE.length)
    expect(r.xpToNext).toBe(0)
    expect(r.progress).toBe(100)
  })

  it('XP nad maximem nepadá', () => {
    const r = levelZXP(9_999_999)
    expect(r.level).toBe(XP_TABLE.length)
    expect(r.xpToNext).toBe(0)
  })

  it('level 7 odemyká viral_spike (ověření XP prahu)', () => {
    // Level 7 = XP_TABLE[6] = 2000
    expect(levelZXP(XP_TABLE[6]).level).toBe(7)
    expect(levelZXP(XP_TABLE[6] - 1).level).toBe(6)
  })
})
