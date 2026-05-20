'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  PetState, KorporatniEvent,
  initialPetState, tickPet, getNalada, getPetEmoji, getPetText,
  vyberNahodnyEvent, aplikujEfekt,
} from '@/lib/game/tamagotchi'

const LS_KEY = 'przm_pet_v2'
const EVENT_INTERVAL = 30 // sekund mezi eventy

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  const w = Math.max(0, Math.min(100, value))
  const danger = color === 'stres' ? w > 70 : w < 25
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace', fontSize: 11, color: '#6b7280', marginBottom: 3 }}>
        <span>{label}</span>
        <span style={{ color: danger ? '#ef4444' : '#9ca3af' }}>{Math.round(w)}%</span>
      </div>
      <div style={{ height: 6, background: '#1f2937', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${w}%`,
          borderRadius: 2,
          transition: 'width 0.4s ease',
          background: danger
            ? '#ef4444'
            : color === 'stres'
              ? `hsl(${120 - w}, 70%, 45%)`
              : `hsl(${w * 1.2}, 70%, 45%)`,
        }} />
      </div>
    </div>
  )
}

function ActionBtn({
  emoji, label, onClick, disabled, cooldownSec,
}: {
  emoji: string; label: string; onClick: () => void; disabled: boolean; cooldownSec?: number
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={disabled && cooldownSec ? `Cooldown: ${Math.ceil(cooldownSec)}s` : undefined}
      style={{
        flex: 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        padding: '10px 6px',
        background: disabled ? '#0a0a14' : '#0f0f1e',
        border: `1px solid ${disabled ? '#1f2937' : '#2a2a4a'}`,
        borderRadius: 4,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'all 0.15s',
        fontFamily: 'monospace',
        minWidth: 0,
      }}
      onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLElement).style.borderColor = '#4a4a7a' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = disabled ? '#1f2937' : '#2a2a4a' }}
    >
      <span style={{ fontSize: 22 }}>{emoji}</span>
      <span style={{ fontSize: 9, color: '#6b7280', textAlign: 'center', lineHeight: 1.2 }}>{label}</span>
      {disabled && cooldownSec && cooldownSec > 0 && (
        <span style={{ fontSize: 8, color: '#4b5563' }}>{Math.ceil(cooldownSec)}s</span>
      )}
    </button>
  )
}

export function TamagotchiGame() {
  const [pet, setPet] = useState<PetState | null>(null)
  const [activeEvent, setActiveEvent] = useState<KorporatniEvent | null>(null)
  const [usedEvents, setUsedEvents] = useState<Set<string>>(new Set())
  const [, setEventTimer] = useState(EVENT_INTERVAL)
  const [toast, setToast] = useState<string | null>(null)
  const [blink, setBlink] = useState(false)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const eventRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Načti nebo vytvoř pet
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as PetState
        if (!parsed.gameOver) {
          setPet(parsed)
          return
        }
      }
    } catch {}
    setPet(initialPetState())
  }, [])

  // Ulož pet při každé změně
  useEffect(() => {
    if (pet) localStorage.setItem(LS_KEY, JSON.stringify(pet))
  }, [pet])

  // Herní tick — každou sekundu
  useEffect(() => {
    if (!pet || pet.gameOver) return
    tickRef.current = setInterval(() => {
      setPet(prev => prev ? tickPet(prev, 1) : prev)
      setBlink(b => !b)
    }, 1000)
    return () => { if (tickRef.current) clearInterval(tickRef.current) }
  }, [pet?.gameOver, pet?.prezivaNasel]) // eslint-disable-line

  // Event timer
  useEffect(() => {
    if (!pet || pet.gameOver || activeEvent) return
    eventRef.current = setInterval(() => {
      setEventTimer(t => {
        if (t <= 1) {
          // Spusť event
          const event = vyberNahodnyEvent(pet.hodina, usedEvents)
          if (event) {
            setActiveEvent(event)
            setUsedEvents(prev => new Set([...Array.from(prev), event.id]))
            // Bez voleb — aplikuj okamžitě po 3s
            if (!event.volby) {
              setTimeout(() => {
                setPet(prev => prev ? aplikujEfekt(prev, event.efekt) : prev)
                setActiveEvent(null)
                showToast(`${event.ikona} ${event.text}`)
              }, 3000)
            }
          }
          return EVENT_INTERVAL + Math.floor(Math.random() * 15)
        }
        return t - 1
      })
    }, 1000)
    return () => { if (eventRef.current) clearInterval(eventRef.current) }
  }, [pet?.gameOver, pet?.hodina, activeEvent, usedEvents]) // eslint-disable-line

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }, [])

  const piKafe = useCallback(() => {
    setPet(prev => {
      if (!prev || prev.kafeCooldown > 0) return prev
      showToast('☕ Kafe nasáto. Na 30 sekund na vrcholu.')
      return aplikujEfekt(
        { ...prev, kafeCooldown: 30 },
        { kafe: 40, energie: 15, stres: -10 }
      )
    })
  }, [showToast])

  const jitNaObed = useCallback(() => {
    setPet(prev => {
      if (!prev || prev.obedCooldown > 0) return prev
      if (prev.hodina < 11 || prev.hodina > 14) {
        showToast('🍕 Ještě není čas na oběd (11:00–14:00)')
        return prev
      }
      showToast('🍕 Oběd dává sílu. +30 energie, +20 morálka.')
      return aplikujEfekt(
        { ...prev, obedCooldown: 180 },
        { energie: 30, moralka: 20, stres: -15 }
      )
    })
  }, [showToast])

  const jitNaPauzu = useCallback(() => {
    setPet(prev => {
      if (!prev || prev.pauzaCooldown > 0) return prev
      showToast('🚬 Pauza venku. Vzduch funguje.')
      return aplikujEfekt(
        { ...prev, pauzaCooldown: 60 },
        { stres: -25, moralka: 10, energie: 5 }
      )
    })
  }, [showToast])

  const scrollovatTikTok = useCallback(() => {
    setPet(prev => {
      if (!prev) return prev
      const risk = Math.random()
      if (risk > 0.7) {
        showToast('📱 Šéf tě přistihl na TikToku! -25 morálka.')
        return aplikujEfekt(prev, { moralka: -25, stres: 20 })
      }
      showToast('📱 10 minut scrollování. Klidnější, ale čas letí.')
      return aplikujEfekt(prev, { stres: -15, energie: -5 })
    })
  }, [showToast])

  const vyriditEmaily = useCallback(() => {
    setPet(prev => {
      if (!prev) return prev
      showToast('📧 Emaily vyřízeny. Šéf spokojený, ty vyčerpaný.')
      return aplikujEfekt(prev, { moralka: 10, stres: 15, energie: -15 })
    })
  }, [showToast])

  type Volba = NonNullable<KorporatniEvent['volby']>[0]
  const volbaEvent = useCallback((volba: Volba) => {
    if (!activeEvent) return
    setPet(prev => {
      if (!prev) return prev
      const po = aplikujEfekt(prev, activeEvent.efekt)
      return aplikujEfekt(po, volba.efekt)
    })
    showToast(`${activeEvent.ikona} ${volba.text}`)
    setActiveEvent(null)
  }, [activeEvent, showToast])

  const novyDen = useCallback(() => {
    const base = initialPetState()
    setPet({
      ...base,
      dayCount: (pet?.dayCount ?? 1) + (pet?.prezivaNasel ? 1 : 0),
      // Přenés část statů
      moralka: pet?.prezivaNasel ? Math.min(100, (pet?.moralka ?? 65) + 10) : 65,
    })
    setUsedEvents(new Set())
    setActiveEvent(null)
    setEventTimer(EVENT_INTERVAL)
  }, [pet])

  if (!pet) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <span style={{ fontFamily: 'monospace', color: '#374151', fontSize: 13 }}>Inicializuji zaměstnance...</span>
      </div>
    )
  }

  const nalada = getNalada(pet)
  const emoji = getPetEmoji(nalada)
  const petText = getPetText(nalada)
  const hodinyFormatovane = `${Math.floor(pet.hodina).toString().padStart(2, '0')}:${Math.round((pet.hodina % 1) * 60).toString().padStart(2, '0')}`
  const progressDen = Math.min(100, ((pet.hodina - 8) / 9) * 100)

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh', padding: '16px',
      background: '#05050f',
    }}>
      {/* Toast notifikace */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
          background: '#0f0f1e', border: '1px solid #2a2a4a',
          padding: '8px 16px', borderRadius: 4, zIndex: 100,
          fontFamily: 'monospace', fontSize: 11, color: '#9ca3af',
          maxWidth: 340, textAlign: 'center',
          animation: 'fadeIn 0.2s ease',
        }}>
          {toast}
        </div>
      )}

      {/* Hlavní karta */}
      <div style={{
        width: '100%', maxWidth: 400,
        background: '#0a0a14',
        border: '1px solid #1a1a2e',
        borderRadius: 8,
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          borderBottom: '1px solid #111827', padding: '10px 16px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Přežij Monetu™
          </span>
          <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#4b5563' }}>
            Den {pet.dayCount} · {hodinyFormatovane}
          </span>
        </div>

        {/* Progress bar dne */}
        <div style={{ height: 2, background: '#111827' }}>
          <div style={{
            height: '100%', width: `${progressDen}%`,
            background: pet.stres > 70 ? '#ef4444' : '#22d3ee',
            transition: 'width 1s linear',
          }} />
        </div>

        {/* Pet display */}
        <div style={{ padding: '24px 20px 16px', textAlign: 'center' }}>
          {/* Jméno a titul */}
          <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#d1d5db', fontWeight: 'bold', marginBottom: 2 }}>
            {pet.jmeno}
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#374151', marginBottom: 20 }}>
            {pet.titul} · Moneta Money Bank
          </div>

          {/* Pet emoji */}
          <div style={{
            fontSize: 80, lineHeight: 1, marginBottom: 12,
            filter: pet.gameOver ? 'grayscale(100%)' : 'none',
            transition: 'font-size 0.3s ease',
            transform: blink && nalada === 'stres' ? 'scale(1.05)' : 'scale(1)',
          }}>
            {emoji}
          </div>

          {/* Hlášení */}
          <div style={{
            fontFamily: 'monospace', fontSize: 11, color: '#6b7280',
            minHeight: 32, lineHeight: 1.5, padding: '0 8px',
            borderTop: '1px solid #111827', paddingTop: 10, marginTop: 4,
          }}>
            {petText}
          </div>
        </div>

        {/* Statistiky */}
        {!pet.gameOver && (
          <div style={{ padding: '0 20px 16px' }}>
            <StatBar label="⚡ Energie" value={pet.energie} color="energie" />
            <StatBar label="💜 Morálka" value={pet.moralka} color="moralka" />
            <StatBar label="😤 Stres" value={pet.stres} color="stres" />
            <StatBar label="☕ Kafe v krvi" value={pet.kafe} color="kafe" />
          </div>
        )}

        {/* Aktivní event s volbami */}
        {activeEvent && activeEvent.volby && !pet.gameOver && (
          <div style={{
            margin: '0 16px 16px',
            border: '1px solid #dc2626',
            borderRadius: 4, padding: 12,
            background: '#1a0000',
          }}>
            <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#fca5a5', marginBottom: 10 }}>
              {activeEvent.ikona} {activeEvent.text}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {activeEvent.volby.map((v, i) => (
                <button
                  key={i}
                  onClick={() => volbaEvent(v)}
                  style={{
                    flex: 1, padding: '6px 4px',
                    fontFamily: 'monospace', fontSize: 10, color: '#d1d5db',
                    background: '#0f0f1e', border: '1px solid #374151',
                    borderRadius: 3, cursor: 'pointer',
                  }}
                >
                  {v.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Akční tlačítka */}
        {!pet.gameOver && (
          <div style={{ padding: '0 16px 16px', display: 'flex', gap: 8 }}>
            <ActionBtn
              emoji="☕" label="Kafe"
              onClick={piKafe}
              disabled={pet.kafeCooldown > 0}
              cooldownSec={pet.kafeCooldown}
            />
            <ActionBtn
              emoji="🍕" label="Oběd"
              onClick={jitNaObed}
              disabled={pet.obedCooldown > 0 || pet.hodina < 11 || pet.hodina > 14}
              cooldownSec={pet.obedCooldown}
            />
            <ActionBtn
              emoji="🚬" label="Pauza"
              onClick={jitNaPauzu}
              disabled={pet.pauzaCooldown > 0}
              cooldownSec={pet.pauzaCooldown}
            />
            <ActionBtn
              emoji="📱" label="TikTok"
              onClick={scrollovatTikTok}
              disabled={false}
            />
            <ActionBtn
              emoji="📧" label="Emaily"
              onClick={vyriditEmaily}
              disabled={false}
            />
          </div>
        )}

        {/* Game Over / Výhra */}
        {pet.gameOver && (
          <div style={{ padding: '16px 20px 20px', textAlign: 'center' }}>
            {pet.prezivaNasel ? (
              <>
                <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#22d3ee', marginBottom: 6 }}>
                  ✓ Pracovní den přežit!
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#374151', marginBottom: 16 }}>
                  {pet.jmeno} vydrží ještě jeden den v Monetě.
                </div>
              </>
            ) : (
              <>
                <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#ef4444', marginBottom: 6 }}>
                  💀 BURNOUT — kariéra ukončena
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#374151', marginBottom: 16 }}>
                  {pet.stres >= 100 ? 'Stres dosáhl maxima. HR zavolalo sanitku.' : 'Energie vyčerpána. Padl/a ke stolu.'}
                </div>
              </>
            )}
            <button
              onClick={novyDen}
              style={{
                fontFamily: 'monospace', fontSize: 12, color: '#22d3ee',
                background: 'none', border: '1px solid #22d3ee',
                borderRadius: 3, padding: '8px 24px', cursor: 'pointer',
              }}
            >
              {pet.prezivaNasel ? `→ Den ${(pet.dayCount ?? 1) + 1}` : '↺ Nový zaměstnanec'}
            </button>
          </div>
        )}

        {/* Footer */}
        <div style={{ borderTop: '1px solid #0f0f1a', padding: '8px 16px', textAlign: 'center' }}>
          <span style={{ fontFamily: 'monospace', fontSize: 9, color: '#1f2937' }}>
            anonymní · lokální data · Moneta Money Bank™ (satira)
          </span>
        </div>
      </div>
    </div>
  )
}
