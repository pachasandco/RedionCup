// Vrais matchs et scores de la Coupe du Monde 2026 via openfootball
// (github.com/openfootball/worldcup.json) : données du domaine public,
// mises à jour quotidiennement, sans clé API. Servies par
// raw.githubusercontent.com qui autorise le CORS → aucun proxy nécessaire.
// Pour revenir aux matchs de démo : VITE_LIVE_SCORES=off dans .env.

export const hasLiveData = import.meta.env.VITE_LIVE_SCORES !== 'off'

const DATA_URL = 'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json'

// Les 48 qualifiés : nom openfootball (anglais) → nom français + drapeau
const TEAMS = {
  Algeria: { fr: 'Algérie', flag: '🇩🇿' },
  Argentina: { fr: 'Argentine', flag: '🇦🇷' },
  Australia: { fr: 'Australie', flag: '🇦🇺' },
  Austria: { fr: 'Autriche', flag: '🇦🇹' },
  Belgium: { fr: 'Belgique', flag: '🇧🇪' },
  'Bosnia & Herzegovina': { fr: 'Bosnie-Herzégovine', flag: '🇧🇦' },
  Brazil: { fr: 'Brésil', flag: '🇧🇷' },
  Canada: { fr: 'Canada', flag: '🇨🇦' },
  'Cape Verde': { fr: 'Cap-Vert', flag: '🇨🇻' },
  Colombia: { fr: 'Colombie', flag: '🇨🇴' },
  Croatia: { fr: 'Croatie', flag: '🇭🇷' },
  Curaçao: { fr: 'Curaçao', flag: '🇨🇼' },
  'Czech Republic': { fr: 'Tchéquie', flag: '🇨🇿' },
  'DR Congo': { fr: 'RD Congo', flag: '🇨🇩' },
  Ecuador: { fr: 'Équateur', flag: '🇪🇨' },
  Egypt: { fr: 'Égypte', flag: '🇪🇬' },
  England: { fr: 'Angleterre', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  France: { fr: 'France', flag: '🇫🇷' },
  Germany: { fr: 'Allemagne', flag: '🇩🇪' },
  Ghana: { fr: 'Ghana', flag: '🇬🇭' },
  Haiti: { fr: 'Haïti', flag: '🇭🇹' },
  Iran: { fr: 'Iran', flag: '🇮🇷' },
  Iraq: { fr: 'Irak', flag: '🇮🇶' },
  'Ivory Coast': { fr: "Côte d'Ivoire", flag: '🇨🇮' },
  Japan: { fr: 'Japon', flag: '🇯🇵' },
  Jordan: { fr: 'Jordanie', flag: '🇯🇴' },
  Mexico: { fr: 'Mexique', flag: '🇲🇽' },
  Morocco: { fr: 'Maroc', flag: '🇲🇦' },
  Netherlands: { fr: 'Pays-Bas', flag: '🇳🇱' },
  'New Zealand': { fr: 'Nouvelle-Zélande', flag: '🇳🇿' },
  Norway: { fr: 'Norvège', flag: '🇳🇴' },
  Panama: { fr: 'Panama', flag: '🇵🇦' },
  Paraguay: { fr: 'Paraguay', flag: '🇵🇾' },
  Portugal: { fr: 'Portugal', flag: '🇵🇹' },
  Qatar: { fr: 'Qatar', flag: '🇶🇦' },
  'Saudi Arabia': { fr: 'Arabie saoudite', flag: '🇸🇦' },
  Scotland: { fr: 'Écosse', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  Senegal: { fr: 'Sénégal', flag: '🇸🇳' },
  'South Africa': { fr: 'Afrique du Sud', flag: '🇿🇦' },
  'South Korea': { fr: 'Corée du Sud', flag: '🇰🇷' },
  Spain: { fr: 'Espagne', flag: '🇪🇸' },
  Sweden: { fr: 'Suède', flag: '🇸🇪' },
  Switzerland: { fr: 'Suisse', flag: '🇨🇭' },
  Tunisia: { fr: 'Tunisie', flag: '🇹🇳' },
  Turkey: { fr: 'Turquie', flag: '🇹🇷' },
  USA: { fr: 'États-Unis', flag: '🇺🇸' },
  Uruguay: { fr: 'Uruguay', flag: '🇺🇾' },
  Uzbekistan: { fr: 'Ouzbékistan', flag: '🇺🇿' },
}

const ROUNDS = {
  'Round of 32': '16es de finale',
  'Round of 16': '8es de finale',
  'Quarter-final': 'Quart de finale',
  'Semi-final': 'Demi-finale',
  'Match for third place': 'Petite finale',
  Final: '🏆 Finale',
}

// Équipe réelle ou place qualificative ("1A", "2B", "3A/B/C/D/F", "W74", "L101")
function team(name) {
  const known = TEAMS[name]
  if (known) return { name: known.fr, flag: known.flag }
  const m = name.match(/^([123])([A-L].*)$/)
  if (m) return { name: `${m[1] === '1' ? '1er' : `${m[1]}e`} gr. ${m[2]}`, flag: '⚽' }
  const w = name.match(/^([WL])(\d+)$/)
  if (w) return { name: `${w[1] === 'W' ? 'Vainq.' : 'Perdant'} m.${w[2]}`, flag: '⚽' }
  return { name, flag: '⚽' }
}

// Date du coup d'envoi (objet Date), ou null si l'heure est inconnue
function kickoff(m) {
  const t = m.time?.match(/^(\d{1,2}:\d{2}) UTC([+-]\d+)/)
  if (!t) return null
  const off = `${t[2][0]}${String(Math.abs(Number(t[2]))).padStart(2, '0')}:00`
  const d = new Date(`${m.date}T${t[1].padStart(5, '0')}:00${off}`)
  return Number.isNaN(d.getTime()) ? null : d
}

function matchDate(m, ko) {
  try {
    if (ko) return ko.toLocaleString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
    return new Date(`${m.date}T12:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
  } catch {
    return m.date
  }
}

// Scores finaux en quasi temps réel via l'API publique ESPN (sans clé,
// CORS ouvert) : openfootball ne pousse ses résultats qu'une fois par jour,
// ESPN les a quelques minutes après le coup de sifflet final.
const ESPN_URL =
  'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260611-20260719&limit=200'

// Équipes nommées différemment chez ESPN (sinon identiques à openfootball)
const ESPN_ALIASES = {
  'Bosnia-Herzegovina': 'Bosnia & Herzegovina',
  'Congo DR': 'DR Congo',
  Czechia: 'Czech Republic',
  'Türkiye': 'Turkey',
  'United States': 'USA',
}

// Map "équipe1|équipe2" (noms openfootball, dans les deux sens) → score final
async function fetchEspnScores() {
  try {
    const res = await fetch(ESPN_URL)
    if (!res.ok) return new Map()
    const data = await res.json()
    const scores = new Map()
    for (const e of data.events ?? []) {
      const c = e.competitions?.[0]
      if (!c?.status?.type?.completed) continue
      const home = c.competitors?.find((t) => t.homeAway === 'home')
      const away = c.competitors?.find((t) => t.homeAway === 'away')
      if (!home || !away) continue
      const h = ESPN_ALIASES[home.team.displayName] ?? home.team.displayName
      const a = ESPN_ALIASES[away.team.displayName] ?? away.team.displayName
      scores.set(`${h}|${a}`, { h: Number(home.score), a: Number(away.score) })
      scores.set(`${a}|${h}`, { h: Number(away.score), a: Number(home.score) })
    }
    return scores
  } catch {
    return new Map() // ESPN indisponible : openfootball reste la référence
  }
}

export async function fetchWorldCupMatches() {
  if (!hasLiveData) return null
  const [res, espnScores] = await Promise.all([fetch(DATA_URL), fetchEspnScores()])
  if (!res.ok) throw new Error(`openfootball : HTTP ${res.status}`)
  const data = await res.json()

  return (data.matches ?? []).map((m, i) => {
    const ko = kickoff(m)
    return {
    id: `wc26-${i + 1}`,
    group: m.group ? m.group.replace('Group ', 'Groupe ') : ROUNDS[m.round] ?? m.round,
    date: matchDate(m, ko),
    // Heure du coup d'envoi (ms epoch) : les pronos se verrouillent à cet instant
    kickoff: ko ? ko.getTime() : null,
    stadium: m.ground ?? '',
    home: team(m.team1),
    away: team(m.team2),
    // Score final : openfootball (quotidien) ou ESPN (quasi direct).
    // Tant qu'il est absent, le match ne peut pas être "joué" dans l'app.
    actual: m.score?.ft
      ? { h: m.score.ft[0], a: m.score.ft[1] }
      : espnScores.get(`${m.team1}|${m.team2}`) ?? null,
    live: true,
    }
  })
    // Ordre chronologique (le fichier openfootball est rangé par groupe).
    // Les ids restent liés à la position dans le fichier : stables d'un
    // chargement à l'autre, le tri ne casse pas les pronos enregistrés.
    .sort((a, b) => (a.kickoff ?? Infinity) - (b.kickoff ?? Infinity))
}
