// Herní logika Tamagotchi — zaměstnanec v Moneta

export interface PetState {
  jmeno: string
  titul: string
  energie: number    // 0–100, klesá časem
  moralka: number   // 0–100, ovlivněna eventy
  stres: number     // 0–100, roste časem
  kafe: number      // 0–100, klesá rychle
  hodina: number    // 8.0 – 17.0 (pracovní den)
  prezivaNasel: boolean
  gameOver: boolean
  priceOfLastEvent: string | null
  kafeCooldown: number   // sekundy zbývající do dalšího kafe
  obedCooldown: number   // sekundy do dalšího oběda
  pauzaCooldown: number  // sekundy do další pauzy
  dayCount: number       // kolikátý den přežil
}

export type PetNalada = 'skvely' | 'pohoda' | 'unava' | 'stres' | 'burnout' | 'mrtvy' | 'kafe' | 'spani'

export function getNalada(pet: PetState): PetNalada {
  if (!pet.prezivaNasel || pet.gameOver) return 'mrtvy'
  if (pet.stres >= 95) return 'burnout'
  if (pet.stres >= 70) return 'stres'
  if (pet.energie < 15) return 'spani'
  if (pet.kafeCooldown > 27) return 'kafe'  // právě pil kafe
  if (pet.moralka > 80 && pet.stres < 30) return 'skvely'
  if (pet.energie > 60 && pet.stres < 50 && pet.moralka > 50) return 'pohoda'
  return 'unava'
}

export function getPetEmoji(nalada: PetNalada): string {
  const mapa: Record<PetNalada, string> = {
    skvely: '🤩', pohoda: '😊', unava: '😐',
    stres: '😰', burnout: '😵', mrtvy: '💀',
    kafe: '☕', spani: '😴',
  }
  return mapa[nalada]
}

export function getPetText(nalada: PetNalada): string {
  const mapa: Record<PetNalada, string> = {
    skvely: 'V pohodě, šéf ještě nic neví.',
    pohoda: 'Dá se to zvládnout.',
    unava: 'Kdy je konečně oběd...',
    stres: 'To nestíhám, to nestíhám!',
    burnout: 'SYSTEM OVERLOAD. Volám HR.',
    mrtvy: 'Kariéra ukončena z důvodu vyčerpání.',
    kafe: '☕ Aaaah, to je lepší...',
    spani: 'Zzzzz... ještě minutku...',
  }
  return mapa[nalada]
}

export interface KorporatniEvent {
  id: string
  text: string
  ikona: string
  efekt: Partial<Pick<PetState, 'energie' | 'moralka' | 'stres' | 'kafe'>>
  volby?: { text: string; efekt: Partial<Pick<PetState, 'energie' | 'moralka' | 'stres' | 'kafe'>> }[]
  minHodina?: number
  maxHodina?: number
}

export const EVENTY: KorporatniEvent[] = [
  {
    id: 'meeting_neplanovany',
    text: 'Šéf svolal neplánovaný meeting. Hned.',
    ikona: '📅',
    efekt: { stres: 20, energie: -10 },
    volby: [
      { text: 'Jdu tam', efekt: { stres: 5 } },
      { text: 'Nemohu, mám deadline', efekt: { moralka: -15, stres: -5 } },
    ],
  },
  {
    id: 'deadline_presunut',
    text: 'Deadline přesunut o týden! Teamleader to oznámil emailem.',
    ikona: '🎉',
    efekt: { stres: -25, moralka: 15 },
  },
  {
    id: 'system_nefunguje',
    text: 'SAP přestal fungovat. IT helpdesk nezvedá.',
    ikona: '💻',
    efekt: { stres: 25, energie: -5 },
    volby: [
      { text: 'Čekám na IT', efekt: { stres: 10 } },
      { text: 'Řeším to po svém', efekt: { stres: -10, energie: -15 } },
    ],
  },
  {
    id: 'kolega_dort',
    text: 'Kolega přinesl dort k narozeninám!',
    ikona: '🎂',
    efekt: { moralka: 20, energie: 10, stres: -10 },
  },
  {
    id: 'audit_zprava',
    text: 'Příchozí email: audit zpráva do konce dne.',
    ikona: '📊',
    efekt: { stres: 30, energie: -10 },
  },
  {
    id: 'ho_zruseno',
    text: 'HR oznamuje: home office zrušen. Povinná přítomnost 5 dní.',
    ikona: '🏢',
    efekt: { moralka: -20, stres: 15 },
  },
  {
    id: 'pochvala_sef',
    text: 'Šéf tě pochválil před celým týmem!',
    ikona: '⭐',
    efekt: { moralka: 25, stres: -10 },
  },
  {
    id: 'mandatory_fun',
    text: 'Pozvánka: Mandatory Fun Friday za 30 minut. Povinné.',
    ikona: '🎉',
    efekt: { stres: 20, moralka: -10, energie: -15 },
    volby: [
      { text: 'Jdu (povinné je povinné)', efekt: { moralka: 5, stres: 10 } },
      { text: 'Náhodně onemocním', efekt: { moralka: -5, stres: -15 } },
    ],
  },
  {
    id: 'call_cisco',
    text: '"Jste ztlumeni." "Slyšíte mě?" — 20. minuta Cisco Webex callu.',
    ikona: '📞',
    efekt: { stres: 15, energie: -10, moralka: -5 },
  },
  {
    id: 'obed_catering',
    text: 'Cateringová firma přivezla pizzu. Zadarmo!',
    ikona: '🍕',
    efekt: { energie: 20, moralka: 15, stres: -15 },
    minHodina: 11,
    maxHodina: 14,
  },
  {
    id: 'excel_zhavaroval',
    text: 'Excel přestal odpovídat. Neuložená práce za 3 hodiny.',
    ikona: '📉',
    efekt: { stres: 35, moralka: -20 },
  },
  {
    id: 'synergy_email',
    text: 'Email od CEO: "Musíme zvýšit synergy. Deck do zítřka."',
    ikona: '🤝',
    efekt: { stres: 20, moralka: -10, energie: -5 },
  },
  {
    id: 'pracak_vyhral',
    text: 'Kolega vedle tě zachránil — vzal tvůj úkol na sebe.',
    ikona: '🦸',
    efekt: { moralka: 20, stres: -20, energie: 10 },
  },
  {
    id: 'friday_klid',
    text: 'Páteční klid. Šéf odjel na golf, nic se neřeší.',
    ikona: '⛳',
    efekt: { stres: -30, moralka: 20 },
    minHodina: 14,
  },
  {
    id: 'performance_review',
    text: 'Performance review formulář — 47 otázek. Do pátku.',
    ikona: '📋',
    efekt: { stres: 25, energie: -20 },
  },
]

const JMENA = ['Karel', 'Jana', 'Tomáš', 'Petra', 'Martin', 'Eva', 'Lukáš', 'Markéta', 'Jiří', 'Monika', 'Pavel', 'Hana', 'Ondřej', 'Lucie']
const PRIJMENI = ['Novák', 'Dvořák', 'Horáček', 'Procházka', 'Kratochvíl', 'Blahout', 'Čermák', 'Veselý', 'Kučera', 'Pokorný']
const TITULY = ['Senior Analyst', 'Business Manager', 'Product Owner', 'Risk Specialist', 'Compliance Officer', 'Junior Developer', 'Team Lead', 'Portfolio Manager', 'Data Analyst', 'Project Manager']

export function generujZamestnance(): Pick<PetState, 'jmeno' | 'titul'> {
  const jmeno = JMENA[Math.floor(Math.random() * JMENA.length)]
  const prijmeni = PRIJMENI[Math.floor(Math.random() * PRIJMENI.length)]
  const titul = TITULY[Math.floor(Math.random() * TITULY.length)]
  return { jmeno: `${jmeno} ${prijmeni}`, titul }
}

export function initialPetState(): PetState {
  const zam = generujZamestnance()
  return {
    ...zam,
    energie: 75,
    moralka: 65,
    stres: 15,
    kafe: 80,
    hodina: 8,
    prezivaNasel: true,
    gameOver: false,
    priceOfLastEvent: null,
    kafeCooldown: 0,
    obedCooldown: 0,
    pauzaCooldown: 0,
    dayCount: 1,
  }
}

export function tickPet(pet: PetState, dt: number): PetState {
  if (!pet.prezivaNasel || pet.gameOver) return pet

  const novePet = {
    ...pet,
    energie: Math.max(0, pet.energie - 0.8 * dt),
    kafe: Math.max(0, pet.kafe - 1.5 * dt),
    stres: Math.min(100, pet.stres + 0.4 * dt),
    hodina: pet.hodina + (dt / 60) * 0.8, // 75 sekund real = 1 hodina hry
    kafeCooldown: Math.max(0, pet.kafeCooldown - dt),
    obedCooldown: Math.max(0, pet.obedCooldown - dt),
    pauzaCooldown: Math.max(0, pet.pauzaCooldown - dt),
  }

  // Nízký kafe → vyšší únava
  if (novePet.kafe < 20) {
    novePet.energie = Math.max(0, novePet.energie - 0.5 * dt)
    novePet.stres = Math.min(100, novePet.stres + 0.3 * dt)
  }

  // Konec dne v 17:00
  if (novePet.hodina >= 17) {
    novePet.prezivaNasel = true
    novePet.gameOver = true
    novePet.hodina = 17
  }

  // Burnout = game over
  if (novePet.stres >= 100 || novePet.energie <= 0) {
    novePet.prezivaNasel = false
    novePet.gameOver = true
  }

  return novePet
}

export function vyberNahodnyEvent(hodina: number, pouziteEventy: Set<string>): KorporatniEvent | null {
  const dostupne = EVENTY.filter(e => {
    if (pouziteEventy.has(e.id)) return false
    if (e.minHodina !== undefined && hodina < e.minHodina) return false
    if (e.maxHodina !== undefined && hodina > e.maxHodina) return false
    return true
  })
  if (dostupne.length === 0) return null
  return dostupne[Math.floor(Math.random() * dostupne.length)]
}

export function aplikujEfekt(pet: PetState, efekt: Partial<Pick<PetState, 'energie' | 'moralka' | 'stres' | 'kafe'>>): PetState {
  return {
    ...pet,
    energie: Math.max(0, Math.min(100, pet.energie + (efekt.energie ?? 0))),
    moralka: Math.max(0, Math.min(100, pet.moralka + (efekt.moralka ?? 0))),
    stres: Math.max(0, Math.min(100, pet.stres + (efekt.stres ?? 0))),
    kafe: Math.max(0, Math.min(100, pet.kafe + (efekt.kafe ?? 0))),
  }
}
