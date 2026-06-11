// Connecteur de vrais matchs et scores : football-data.org (API v4).
// Activé dès que VITE_FOOTBALL_DATA_TOKEN est renseigné dans .env.
// En dev, les requêtes passent par le proxy Vite (/football-api) pour
// contourner les restrictions CORS de l'API.

const token = import.meta.env.VITE_FOOTBALL_DATA_TOKEN
export const hasLiveData = Boolean(token)

const API_BASE = import.meta.env.DEV ? '/football-api' : 'https://api.football-data.org'

// Drapeaux des principales nations (fallback : ballon)
const FLAGS = {
  France: '🇫🇷', Brazil: '🇧🇷', Argentina: '🇦🇷', Germany: '🇩🇪', England: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  Spain: '🇪🇸', Portugal: '🇵🇹', Netherlands: '🇳🇱', Belgium: '🇧🇪', Italy: '🇮🇹',
  Mexico: '🇲🇽', USA: '🇺🇸', Canada: '🇨🇦', Japan: '🇯🇵', Morocco: '🇲🇦',
  Senegal: '🇸🇳', Croatia: '🇭🇷', Uruguay: '🇺🇾', Colombia: '🇨🇴', Ecuador: '🇪🇨',
  'South Korea': '🇰🇷', 'Korea Republic': '🇰🇷', Australia: '🇦🇺', Switzerland: '🇨🇭',
  Poland: '🇵🇱', Denmark: '🇩🇰', Norway: '🇳🇴', Scotland: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', Uzbekistan: '🇺🇿',
  'South Africa': '🇿🇦', Ghana: '🇬🇭', Nigeria: '🇳🇬', Iran: '🇮🇷', 'Saudi Arabia': '🇸🇦',
}

function flag(team) {
  return FLAGS[team.name] ?? '⚽'
}

// Coupe du Monde = compétition "WC" sur football-data.org
export async function fetchWorldCupMatches() {
  if (!hasLiveData) return null
  const res = await fetch(`${API_BASE}/v4/competitions/WC/matches`, {
    headers: { 'X-Auth-Token': token },
  })
  if (!res.ok) throw new Error(`football-data.org : HTTP ${res.status}`)
  const data = await res.json()

  return (data.matches ?? []).map((m) => ({
    id: `fd-${m.id}`,
    group: m.group?.replace('GROUP_', '') ?? m.stage,
    date: new Date(m.utcDate).toLocaleString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }),
    stadium: m.venue ?? '',
    home: { name: m.homeTeam.name, flag: flag(m.homeTeam) },
    away: { name: m.awayTeam.name, flag: flag(m.awayTeam) },
    // Le score réel n'existe que pour les matchs terminés :
    // tant qu'il est null, le match ne peut pas être "joué" dans l'app.
    actual:
      m.status === 'FINISHED'
        ? { h: m.score.fullTime.home, a: m.score.fullTime.away }
        : null,
    live: true,
  }))
}
