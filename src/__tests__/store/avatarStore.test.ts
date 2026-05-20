import { describe, it, expect, beforeEach } from 'vitest'
import { useAvatarStore } from '@/store/avatarStore'
import type { Avatar } from '@/types/avatar'

const defaultAvatar = (): Avatar => ({
  id: 'test-uuid',
  displayName: 'TestUser_404',
  level: 1,
  xp: 0,
  xpToNext: 100,
  stats: { morale: 70, energy: 80, burnout: 10, flex: 0, overtimeMins: 0, loyalty: 50 },
  influenceScore: 0,
  unlockedAbilities: [],
  hasDoneCheckinToday: false,
  lastCheckinDate: null,
  backupKey: 'ABCDEF12345678901234',
  createdAt: new Date().toISOString(),
})

describe('avatarStore', () => {
  beforeEach(() => {
    useAvatarStore.setState({ avatar: null, isLoading: false, error: null })
    localStorage.clear()
  })

  it('setAvatar uloží avatar do store', () => {
    const avatar = defaultAvatar()
    useAvatarStore.getState().setAvatar(avatar)
    expect(useAvatarStore.getState().avatar).toEqual(avatar)
  })

  it('updateStats aplikuje delta na stats', () => {
    useAvatarStore.getState().setAvatar(defaultAvatar())
    useAvatarStore.getState().updateStats({ morale: -15, burnout: 20, energy: -10 })
    const stats = useAvatarStore.getState().avatar!.stats
    expect(stats.morale).toBe(55)   // 70 - 15
    expect(stats.burnout).toBe(30)  // 10 + 20
    expect(stats.energy).toBe(70)   // 80 - 10
  })

  it('updateStats clampuje staty na 0–100', () => {
    useAvatarStore.getState().setAvatar(defaultAvatar())
    useAvatarStore.getState().updateStats({ morale: -200, burnout: 200, energy: -200 })
    const stats = useAvatarStore.getState().avatar!.stats
    expect(stats.morale).toBe(0)
    expect(stats.burnout).toBe(100)
    expect(stats.energy).toBe(0)
  })

  it('addXP správně přičítá XP a aktualizuje level', () => {
    useAvatarStore.getState().setAvatar(defaultAvatar())
    useAvatarStore.getState().addXP(100) // level 1→2 na 100 XP
    const avatar = useAvatarStore.getState().avatar!
    expect(avatar.xp).toBe(100)
    expect(avatar.level).toBe(2)
  })

  it('addXP kumuluje XP z více volání', () => {
    useAvatarStore.getState().setAvatar(defaultAvatar())
    useAvatarStore.getState().addXP(50)
    useAvatarStore.getState().addXP(50)
    expect(useAvatarStore.getState().avatar!.xp).toBe(100)
  })

  it('setCheckinDone nastaví hasDoneCheckinToday=true a uloží datum do localStorage', () => {
    useAvatarStore.getState().setAvatar(defaultAvatar())
    useAvatarStore.getState().setCheckinDone()
    expect(useAvatarStore.getState().avatar!.hasDoneCheckinToday).toBe(true)
    const today = new Date().toISOString().slice(0, 10)
    expect(localStorage.getItem('prm_checkin_datum')).toBe(today)
  })

  it('setInfluenceScore aktualizuje influence', () => {
    useAvatarStore.getState().setAvatar(defaultAvatar())
    useAvatarStore.getState().setInfluenceScore(500)
    expect(useAvatarStore.getState().avatar!.influenceScore).toBe(500)
  })

  it('setLoading přepne isLoading', () => {
    useAvatarStore.getState().setLoading(true)
    expect(useAvatarStore.getState().isLoading).toBe(true)
    useAvatarStore.getState().setLoading(false)
    expect(useAvatarStore.getState().isLoading).toBe(false)
  })

  it('setError uloží chybovou hlášku', () => {
    useAvatarStore.getState().setError('Test chyba')
    expect(useAvatarStore.getState().error).toBe('Test chyba')
  })

  it('loyalty není ovlivněna updateStats bez explicitní delta', () => {
    useAvatarStore.getState().setAvatar(defaultAvatar())
    useAvatarStore.getState().updateStats({ morale: -10 })
    expect(useAvatarStore.getState().avatar!.stats.loyalty).toBe(50)
  })
})
