import { describe, it, expect } from 'vitest'
import {
  vypocitejPoškozeni,
  vypocitejKontrolu,
  vypocitejCheckinDamage,
  type DenniCheckinZaznam,
  type ReakceZaznam,
} from '@/lib/game/damage'
import type { BossEvent } from '@/types/game'

// ── Pomocné továrny ──────────────────────────────────────────────────────────

const mkEvent = (moraleDelta: number, burnoutDelta: number): BossEvent => ({
  id: '1', seasonId: 's', title: 'T', description: 'D',
  category: 'realisticky', moraleDelta, burnoutDelta,
  energyDelta: 0, flexDelta: 0, overtimeDelta: 0,
  isActive: true, expiresAt: null, activatedAt: null,
})

// ── vypocitejPoškozeni ────────────────────────────────────────────────────────

describe('vypocitejPoškozeni', () => {
  it('vrátí 0 bez checkinů a reakcí', () => {
    expect(vypocitejPoškozeni([], [])).toBe(0)
  })

  it('sčítá damage_contrib z checkinů', () => {
    const checkins: DenniCheckinZaznam[] = [{ damage_contrib: 10 }, { damage_contrib: 25 }]
    expect(vypocitejPoškozeni(checkins, [])).toBe(35)
  })

  it('přidává váhy reakcí: skull=3, fire=2, chart=2, clown=1', () => {
    const reakce: ReakceZaznam[] = [
      { reaction_type: 'skull' },
      { reaction_type: 'fire' },
      { reaction_type: 'chart' },
      { reaction_type: 'clown' },
    ]
    expect(vypocitejPoškozeni([], reakce)).toBe(3 + 2 + 2 + 1)
  })

  it('kombinuje checkin damage + reakce', () => {
    const checkins: DenniCheckinZaznam[] = [{ damage_contrib: 20 }]
    const reakce: ReakceZaznam[] = [{ reaction_type: 'skull' }, { reaction_type: 'skull' }]
    expect(vypocitejPoškozeni(checkins, reakce)).toBe(20 + 6)
  })

  it('více checkinů sečte správně', () => {
    const checkins: DenniCheckinZaznam[] = Array(10).fill({ damage_contrib: 5 })
    expect(vypocitejPoškozeni(checkins, [])).toBe(50)
  })
})

// ── vypocitejKontrolu ─────────────────────────────────────────────────────────

describe('vypocitejKontrolu', () => {
  it('bez eventů a plný checkin = základní kontrola 10', () => {
    expect(vypocitejKontrolu([], 5)).toBe(10)
  })

  it('přidává penaltu za inaktivitu: 5 checkinů min, 3 body za každý chybějící', () => {
    // 0 checkinů → (5-0)*3 = 15 penalty
    expect(vypocitejKontrolu([], 0)).toBe(10 + 15)
    // 3 checkins → (5-3)*3 = 6 penalty
    expect(vypocitejKontrolu([], 3)).toBe(10 + 6)
    // 5+ checkins → 0 penalty
    expect(vypocitejKontrolu([], 5)).toBe(10)
    expect(vypocitejKontrolu([], 10)).toBe(10)
  })

  it('přidává |moraleDelta| + |burnoutDelta| z aktivních eventů', () => {
    const event = mkEvent(-15, 10)  // impact = 15 + 10 = 25
    expect(vypocitejKontrolu([event], 5)).toBe(10 + 25)
  })

  it('správně sčítá více eventů', () => {
    const e1 = mkEvent(-10, 5)   // 15
    const e2 = mkEvent(-20, 15)  // 35
    expect(vypocitejKontrolu([e1, e2], 5)).toBe(10 + 15 + 35)
  })

  it('kombinuje eventy + inaktivitu', () => {
    const event = mkEvent(-10, 10) // 20 impact
    // 2 checkins → (5-2)*3 = 9 penalty
    expect(vypocitejKontrolu([event], 2)).toBe(10 + 20 + 9)
  })
})

// ── vypocitejCheckinDamage ────────────────────────────────────────────────────

describe('vypocitejCheckinDamage', () => {
  it('základní damage bez přesčasu: skull=20, fire=15, clown=12, chart=10', () => {
    expect(vypocitejCheckinDamage(0, 'skull')).toBe(5 + 15)  // 20
    expect(vypocitejCheckinDamage(0, 'fire')).toBe(5 + 10)   // 15
    expect(vypocitejCheckinDamage(0, 'clown')).toBe(5 + 7)   // 12
    expect(vypocitejCheckinDamage(0, 'chart')).toBe(5 + 5)   // 10
  })

  it('přesčas přidává +1 za každých 30 minut (max +10)', () => {
    expect(vypocitejCheckinDamage(30, 'skull')).toBe(20 + 1)
    expect(vypocitejCheckinDamage(60, 'skull')).toBe(20 + 2)
    expect(vypocitejCheckinDamage(120, 'skull')).toBe(20 + 4)
    expect(vypocitejCheckinDamage(300, 'skull')).toBe(20 + 10) // max cap
    expect(vypocitejCheckinDamage(600, 'skull')).toBe(20 + 10) // stále max
  })

  it('29 minut přesčasu = 0 bonus (floor zaokrouhlení)', () => {
    expect(vypocitejCheckinDamage(29, 'fire')).toBe(15)
  })

  it('300+ minut přesčasu je stropováno na +10', () => {
    expect(vypocitejCheckinDamage(9999, 'chart')).toBe(10 + 10)
  })
})
