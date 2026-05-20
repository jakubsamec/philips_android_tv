import { describe, it, expect } from 'vitest'
import { EVENT_KATALOG, vyberDenniEventy } from '@/lib/game/events'

// ── EVENT_KATALOG ─────────────────────────────────────────────────────────────

describe('EVENT_KATALOG', () => {
  it('obsahuje alespoň 10 eventů', () => {
    expect(EVENT_KATALOG.length).toBeGreaterThanOrEqual(10)
  })

  it('každý event má všechna povinná pole', () => {
    for (const e of EVENT_KATALOG) {
      expect(e.title).toBeTruthy()
      expect(e.description).toBeTruthy()
      expect(['realisticky', 'bizarni']).toContain(e.category)
      expect(typeof e.moraleDelta).toBe('number')
      expect(typeof e.burnoutDelta).toBe('number')
      expect(typeof e.energyDelta).toBe('number')
      expect(typeof e.flexDelta).toBe('number')
      expect(typeof e.overtimeDelta).toBe('number')
      expect(typeof e.minimumAggression).toBe('number')
    }
  })

  it('obsahuje jak realistické tak bizarní eventy', () => {
    const real = EVENT_KATALOG.filter(e => e.category === 'realisticky')
    const biz = EVENT_KATALOG.filter(e => e.category === 'bizarni')
    expect(real.length).toBeGreaterThan(0)
    expect(biz.length).toBeGreaterThan(0)
  })

  it('minimumAggression je 1–10', () => {
    for (const e of EVENT_KATALOG) {
      expect(e.minimumAggression).toBeGreaterThanOrEqual(1)
      expect(e.minimumAggression).toBeLessThanOrEqual(10)
    }
  })
})

// ── vyberDenniEventy ──────────────────────────────────────────────────────────

describe('vyberDenniEventy', () => {
  it('vrátí prázdné pole při aggression=0 (žádný event nemá minimumAggression <= 0)', () => {
    // Všechny eventy mají minimumAggression >= 1
    const result = vyberDenniEventy(0, 0)
    expect(result.length).toBe(0)
  })

  it('vrátí max 1 event při aggression 1-2', () => {
    for (let i = 0; i < 20; i++) {
      const result = vyberDenniEventy(1, 0)
      expect(result.length).toBeLessThanOrEqual(1)
    }
  })

  it('vrátí max 3 eventy i při vysoké agresi', () => {
    for (let i = 0; i < 20; i++) {
      const result = vyberDenniEventy(10, 100)
      expect(result.length).toBeLessThanOrEqual(3)
    }
  })

  it('filtruje eventy podle minimumAggression', () => {
    // Eventy s minimumAggression <= 1 jsou dostupné
    const dostupne = EVENT_KATALOG.filter(e => e.minimumAggression <= 1)
    const result = vyberDenniEventy(1, 0)
    for (const e of result) {
      expect(e.minimumAggression).toBeLessThanOrEqual(1)
    }
    expect(result.length).toBeLessThanOrEqual(dostupne.length)
  })

  it('nevybírá duplicitní eventy v jednom kole', () => {
    for (let i = 0; i < 20; i++) {
      const result = vyberDenniEventy(10, 50)
      const titles = result.map(e => e.title)
      const uniqueTitles = new Set(titles)
      expect(uniqueTitles.size).toBe(titles.length)
    }
  })

  it('vyšší adaptation zvyšuje šanci na bizarní eventy', () => {
    // Statistický test — při adaptation=100 by měly být bizarní eventy častěji
    let bizarniCount = 0
    const iterations = 200
    for (let i = 0; i < iterations; i++) {
      const result = vyberDenniEventy(5, 100)
      bizarniCount += result.filter(e => e.category === 'bizarni').length
    }
    // Při adaptation=100 je šance bizarního = 0.3 + 0.4 = 0.7
    // Očekáváme >40% bizarních eventů
    const total = iterations // každé kolo může mít 1+ eventů
    expect(bizarniCount).toBeGreaterThan(total * 0.4)
  })
})
