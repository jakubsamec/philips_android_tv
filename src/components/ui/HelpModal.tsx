'use client'

import { useUIStore } from '@/store/uiStore'

const SEKCE = [
  {
    emoji: '👾',
    nazev: 'Kdo jsi',
    obsah: `Při prvním otevření se vygeneruje anonymní identita — náhodné jméno (např. HOBojovník_Alpha) a UUID uložené v localStorage. Žádný login, žádná registrace, žádné cookies. Zálohovací klíč (🔑 v avataru) ti umožní obnovit postavu na jiném zařízení.`,
  },
  {
    emoji: '🦹',
    nazev: 'Boss — Vzpurný',
    obsah: `Vzpurný je společný nepřítel všech hráčů. Má HP bar (Control Level) od 0 do 100. Každý den hráči dohromady útočí a snaží se ho dostat na 0. Jednou denně ve 22:59 UTC proběhne rozuzlení — spočítá se celkový damage vs. obrana bosse a HP se upraví. Výsledek (win/lose/draw) ovlivní statistiky všech avatarů.`,
  },
  {
    emoji: '📋',
    nazev: 'Denní výkaz práce™',
    obsah: `Jednou za den vyplníš: počet dní v kanceláři (max 5 celkem s HO), home office dny, přesčas (0–120 min) a hodnocení dne:\n\n💀 Pohřební — horor dne → nejvíc XP, -15 morálka\n🔥 Hořelo to — intenzivní → +5 energie\n🤡 Cirkus — chaos → -5 energie\n📉 Klesající — šlo to dolů → -10 morálka\n\nPo odeslání se aktualizují tvé statistiky a přispěješ poškozením do denního boje.`,
  },
  {
    emoji: '📊',
    nazev: 'Statistiky avatara',
    obsah: `💜 Morálka (0–100) — životní síla, klesá skoro vždy\n⚡ Energie (0–100) — ovlivňuje výkon, stoupá jen s fire dnem\n🔥 Vyhoření (0–100) — čím vyšší, tím hůř\n🏠 Flex — akumulované HO dny = pracovní volnost\n⏰ Přesčas — celkový čas navíc v minutách\n🎯 Influence — jak moc tě ostatní čtou na feedu`,
  },
  {
    emoji: '📢',
    nazev: 'Feed — komunita',
    obsah: `Anonymní zeď kde hráči ventilují co se děje. Piš příspěvky (max 280 znaků, max 3 denně). Reaguj emoji: 💀🔥🤡📉 — každá reakce přidává damage bossovi. Komentáře jsou dostupné pod každým příspěvkem (max 1 úroveň odpovědí). Čím více reakcí sbírají tvé příspěvky, tím vyšší máš Influence Score.`,
  },
  {
    emoji: '🏆',
    nazev: 'Žebříček odporu',
    obsah: `Top 20 hráčů sezóny podle Influence Score. Sezóna trvá 28 dní, pak se boss resetuje. Tvůj level a schopnosti zůstávají.`,
  },
  {
    emoji: '⚡',
    nazev: 'Schopnosti',
    obsah: `Odemykají se levelováním:\n\nLvl 3 — Reality Amplifier: příspěvek na feedu má 1.5× efekt (24h cooldown)\nLvl 5 — Silent Resistance: ten den ignoruješ nejhorší aktivní event (24h cooldown)\nLvl 7 — Viral Spike: příspěvek dostane boost viditelnosti (48h cooldown)`,
  },
  {
    emoji: '⚠️',
    nazev: 'Boss direktivy',
    obsah: `Vzpurný čas od času aktivuje direktivy — třeba "Mandatory Fun Friday" nebo "Snížení HO limitu". Zobrazí se jako červená hláška v levém panelu. Aktivní direktiva zhoršuje statistiky při každém check-inu dokud nevyprší. Silent Resistance schopnost ti umožní jednu direktivu ignorovat.`,
  },
]

export function HelpModal() {
  const isOpen = useUIStore(s => s.isHelpOpen)
  const close = useUIStore(s => s.closeHelp)

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
      onClick={close}
    >
      <div
        style={{
          background: '#0a0a14',
          border: '1px solid #2a2a4a',
          borderRadius: 4,
          maxWidth: 640,
          width: '100%',
          maxHeight: '85vh',
          overflowY: 'auto',
          padding: '20px 24px',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Hlavička */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontFamily: 'monospace', fontSize: 14, color: '#f87171', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
              {'// NÁPOVĚDA'}
            </h2>
            <p style={{ fontFamily: 'monospace', fontSize: 10, color: '#374151', margin: '4px 0 0' }}>
              jak přežít Vzpurného a korporátní realitu
            </p>
          </div>
          <button
            onClick={close}
            style={{ fontFamily: 'monospace', fontSize: 18, color: '#4b5563', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {/* Sekce */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {SEKCE.map(s => (
            <div key={s.nazev} style={{ borderBottom: '1px solid #111827', paddingBottom: 16 }}>
              <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#22d3ee', fontWeight: 'bold', marginBottom: 6 }}>
                {s.emoji} {s.nazev.toUpperCase()}
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#6b7280', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                {s.obsah}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <p style={{ fontFamily: 'monospace', fontSize: 10, color: '#1f2937' }}>
            Anonymní · žádná data · žádné cookies · žádné stopy
          </p>
          <button
            onClick={close}
            style={{
              marginTop: 8, fontFamily: 'monospace', fontSize: 11,
              color: '#374151', background: 'none',
              border: '1px solid #1f2937', borderRadius: 2,
              padding: '4px 16px', cursor: 'pointer',
            }}
          >
            zavřít
          </button>
        </div>
      </div>
    </div>
  )
}
