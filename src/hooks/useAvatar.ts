'use client'

import { useEffect } from 'react'
import { useAvatarStore } from '@/store/avatarStore'
import { generujUUID, generujJmeno, generujBackupKey } from '@/lib/game/avatar'
import { levelZXP } from '@/lib/game/xp'
import { LS_AVATAR_ID, LS_AVATAR_NAME, LS_BACKUP_KEY, LS_CHECKIN_DATUM } from '@/lib/constants'
import { Avatar } from '@/types/avatar'

// PRIVACY: nikdy neukládáme IP, device info ani žádná osobní data
// UUID je generováno čistě náhodně pomocí crypto.randomUUID()
export function useAvatar() {
  const { avatar, setAvatar, setLoading, setError } = useAvatarStore()

  useEffect(() => {
    async function inicializujAvatara() {
      try {
        setLoading(true)

        let avatarId = localStorage.getItem(LS_AVATAR_ID)
        let displayName = localStorage.getItem(LS_AVATAR_NAME)
        let backupKey = localStorage.getItem(LS_BACKUP_KEY)

        if (!avatarId) {
          avatarId = generujUUID()
          displayName = generujJmeno()
          backupKey = await generujBackupKey(avatarId)
          localStorage.setItem(LS_AVATAR_ID, avatarId)
          localStorage.setItem(LS_AVATAR_NAME, displayName)
          localStorage.setItem(LS_BACKUP_KEY, backupKey)
        }

        const dnesni = new Date().toISOString().slice(0, 10)
        const posledniCheckin = localStorage.getItem(LS_CHECKIN_DATUM)

        // Zkus načíst z DB (s timeoutem 5s)
        let avatarData: Avatar | null = null

        try {
          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), 5000)
          const response = await fetch(`/api/avatar/${avatarId}`, { signal: controller.signal })
          clearTimeout(timeout)

          if (response.ok) {
            const dbData = await response.json()
            const { level, xpToNext } = levelZXP(dbData.xp || 0)
            avatarData = {
              id: avatarId,
              displayName: displayName || dbData.display_name,
              level,
              xp: dbData.xp || 0,
              xpToNext,
              stats: {
                morale:      dbData.morale      ?? 70,
                energy:      dbData.energy      ?? 80,
                burnout:     dbData.burnout     ?? 10,
                flex:        dbData.flex        ?? 0,
                overtimeMins: dbData.overtime_mins ?? 0,
                loyalty:     dbData.loyalty     ?? 50,
              },
              influenceScore: dbData.influence_score || 0,
              unlockedAbilities: dbData.unlocked_abilities || [],
              hasDoneCheckinToday: posledniCheckin === dnesni,
              lastCheckinDate: posledniCheckin,
              backupKey: backupKey || '',
              createdAt: dbData.created_at || new Date().toISOString(),
            }
          }
        } catch {
          // DB nedostupná — pokračuj bez ní
        }

        // Pokud DB selhal, vytvoř lokální avatar
        if (!avatarData) {
          const { level, xpToNext } = levelZXP(0)
          avatarData = {
            id: avatarId,
            displayName: displayName!,
            level,
            xp: 0,
            xpToNext,
            stats: { morale: 70, energy: 80, burnout: 10, flex: 0, overtimeMins: 0, loyalty: 50 },
            influenceScore: 0,
            unlockedAbilities: [],
            hasDoneCheckinToday: posledniCheckin === dnesni,
            lastCheckinDate: posledniCheckin,
            backupKey: backupKey!,
            createdAt: new Date().toISOString(),
          }

          // Pokus o uložení do DB (async, neblokuj UI)
          // Vždy zkusíme — endpoint řeší duplicity přes ON CONFLICT
          fetch('/api/avatar/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Avatar-Id': avatarId },
            body: JSON.stringify({ id: avatarId, display_name: displayName, backup_key: backupKey }),
          }).catch(() => {}) // Tiché selhání
        }

        setAvatar(avatarData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Chyba načítání')
        // I při chybě vytvoř fallback avatar
        setAvatar({
          id: 'local-' + Math.random().toString(36).slice(2),
          displayName: generujJmeno(),
          level: 1, xp: 0, xpToNext: 100,
          stats: { morale: 70, energy: 80, burnout: 10, flex: 0, overtimeMins: 0, loyalty: 50 },
          influenceScore: 0, unlockedAbilities: [],
          hasDoneCheckinToday: false, lastCheckinDate: null,
          backupKey: 'LOKALNI-REZIM',
          createdAt: new Date().toISOString(),
        })
      } finally {
        setLoading(false)
      }
    }

    inicializujAvatara()
  }, [setAvatar, setLoading, setError])

  return avatar
}
