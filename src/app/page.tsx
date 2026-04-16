'use client'

import { useEffect } from 'react'
import { useAvatar } from '@/hooks/useAvatar'
import { useBossRealtime } from '@/hooks/useBossRealtime'
import { useFeedRealtime } from '@/hooks/useFeedRealtime'
import { useGameStore } from '@/store/gameStore'

import { BossPanel } from '@/components/boss/BossPanel'
import { BossInterrupt } from '@/components/boss/BossInterrupt'
import { AvatarPanel } from '@/components/avatar/AvatarPanel'
import { DailyInput } from '@/components/daily/DailyInput'
import { DailyReport } from '@/components/daily/DailyReport'
import { Feed } from '@/components/feed/Feed'
import { Leaderboard } from '@/components/leaderboard/Leaderboard'
import { GlitchText } from '@/components/ui/GlitchText'

function GameContent() {
  const { setBoss, setActiveEvents, setCurrentSeason } = useGameStore()
  const season = useGameStore(s => s.currentSeason)

  useAvatar()

  useEffect(() => {
    fetch('/api/boss')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return
        if (data.boss) {
          setBoss({
            id: data.boss.id,
            seasonId: data.boss.season_id,
            name: data.boss.name,
            controlLevel: data.boss.control_level,
            aggression: data.boss.aggression,
            adaptation: data.boss.adaptation,
            flavorText: data.boss.flavor_text,
            updatedAt: data.boss.updated_at,
          })
        }
        if (data.activeEvents) {
          setActiveEvents(data.activeEvents.map((e: Record<string, unknown>) => ({
            id: String(e.id),
            seasonId: String(e.season_id),
            title: String(e.title),
            description: String(e.description),
            category: String(e.category) as 'realisticky' | 'bizarni',
            moraleDelta: Number(e.morale_delta),
            burnoutDelta: Number(e.burnout_delta),
            energyDelta: Number(e.energy_delta),
            flexDelta: Number(e.flex_delta),
            overtimeDelta: Number(e.overtime_delta),
            isActive: Boolean(e.is_active),
            expiresAt: e.expires_at as string | null,
            activatedAt: e.activated_at as string | null,
          })))
        }
        if (data.season) {
          setCurrentSeason({
            id: data.season.id,
            name: data.season.name,
            startsAt: data.season.starts_at,
            endsAt: data.season.ends_at,
            isActive: data.season.is_active,
          })
        }
      })
      .catch(() => {})
  }, [setBoss, setActiveEvents, setCurrentSeason])

  useBossRealtime(season?.id)
  useFeedRealtime(season?.id)

  return (
    <div className="min-h-screen" style={{ background: '#05050f' }}>
      <BossInterrupt />

      {/* Header */}
      <header style={{
        borderBottom: '1px solid #1a1a2e',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        background: 'rgba(5,5,15,0.97)',
        backdropFilter: 'blur(8px)',
        zIndex: 40,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <GlitchText
            as="h1"
            intensity="low"
            className="text-red-400 font-bold text-lg font-mono uppercase tracking-widest"
          >
            Přežij Monetu
          </GlitchText>
          <span style={{ fontSize: 10, color: '#374151', fontFamily: 'monospace' }}>
            corporate survival game · sezóna I
          </span>
        </div>
        <div style={{ fontSize: 10, color: '#1f2937', fontFamily: 'monospace' }}>
          anonymous · no tracking · no data
        </div>
      </header>

      {/* Grid */}
      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '16px 12px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(1, 1fr)',
          gap: 16,
        }}
          className="lg:grid-cols-[300px_1fr_340px]"
        >
          {/* LEVÝ: Boss + Leaderboard */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
            className="order-2 lg:order-1">
            <BossPanel />
            <Leaderboard />
          </div>

          {/* STŘED: Avatar + Check-in */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
            className="order-1 lg:order-2">
            <AvatarPanel />
            <DailyReport />
            <DailyInput />
          </div>

          {/* PRAVÝ: Feed */}
          <div className="order-3">
            <Feed />
          </div>
        </div>
      </main>

      <footer style={{
        borderTop: '1px solid #0f0f1a',
        padding: '12px 16px',
        marginTop: 32,
        textAlign: 'center',
      }}>
        <p style={{ fontSize: 10, color: '#111827', fontFamily: 'monospace' }}>
          Přežij Monetu · anonymní · žádná data · žádné cookies · {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  )
}

export default function HomePage() {
  return <GameContent />
}
