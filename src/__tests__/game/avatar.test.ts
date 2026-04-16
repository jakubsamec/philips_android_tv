import { describe, it, expect } from 'vitest'
import { generujJmeno, generujUUID, generujBackupKey } from '@/lib/game/avatar'

// ── generujJmeno ──────────────────────────────────────────────────────────────

describe('generujJmeno', () => {
  it('vrátí neprázdný řetězec', () => {
    expect(generujJmeno()).toBeTruthy()
  })

  it('obsahuje podtržítko oddělující prefix a suffix', () => {
    for (let i = 0; i < 20; i++) {
      const name = generujJmeno()
      expect(name).toMatch(/^.+_.+$/)
    }
  })

  it('suffix je číslo nebo alfanumerický kód', () => {
    for (let i = 0; i < 20; i++) {
      const name = generujJmeno()
      const suffix = name.split('_').slice(-1)[0]
      expect(suffix).toMatch(/^[a-zA-Z0-9]+$/)
    }
  })

  it('generuje různá jména (není deterministické)', () => {
    const names = new Set(Array.from({ length: 50 }, () => generujJmeno()))
    // S 50 pokusy by mělo být alespoň 5 unikátních jmen
    expect(names.size).toBeGreaterThan(5)
  })
})

// ── generujUUID ───────────────────────────────────────────────────────────────

describe('generujUUID', () => {
  it('vrátí string ve formátu UUID v4', () => {
    const uuid = generujUUID()
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
  })

  it('každé volání vrátí stejné UUID (mock crypto.randomUUID)', () => {
    // V testech je crypto.randomUUID mockováno deterministicky
    const uuid = generujUUID()
    expect(uuid).toBe('00000000-0000-4000-8000-000000000001')
  })
})

// ── generujBackupKey ──────────────────────────────────────────────────────────

describe('generujBackupKey', () => {
  it('vrátí string délky 20 znaků', async () => {
    const key = await generujBackupKey('00000000-0000-4000-8000-000000000001')
    expect(key.length).toBe(20)
  })

  it('obsahuje jen velká písmena a číslice (hex uppercase)', async () => {
    const key = await generujBackupKey('00000000-0000-4000-8000-000000000001')
    expect(key).toMatch(/^[0-9A-F]+$/)
  })

  it('stejný vstup → stejný klíč (deterministický)', async () => {
    const id = '11111111-1111-4111-8111-111111111111'
    const k1 = await generujBackupKey(id)
    const k2 = await generujBackupKey(id)
    expect(k1).toBe(k2)
  })
})
