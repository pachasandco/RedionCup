// Simulation de bout en bout : inscrit des joueurs dans la vraie base
// Supabase puis rejoue tous les matchs (pronos + quiz) jusqu'à la finale,
// avec exactement la même logique que l'app (data.js + mêmes events).
//
//   node scripts/simulate.mjs
//
// Nettoyage après test : `truncate players cascade;` dans l'éditeur SQL
// du dashboard Supabase (la clé anon n'a pas le droit DELETE).

import { createClient } from '@supabase/supabase-js'
import { MATCHES, matchPoints, botPrediction, botQuizResult } from '../src/data.js'

const supabase = createClient(
  'https://mxokzkazeffhwfyubcgy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14b2t6a2F6ZWZmaHdmeXViY2d5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyMTA1MjMsImV4cCI6MjA5Njc4NjUyM30.jBDqucsdVpX-70UNeDrCjGRc_22XLANW3zFHFzmEtvM'
)

const SIM_PLAYERS = [
  { name: 'Sofia', avatar: '🦊' },
  { name: 'Karim', avatar: '🐺' },
  { name: 'Léa', avatar: '🐯' },
  { name: 'Marco', avatar: '🦅' },
  { name: 'Awa', avatar: '🐝' },
]

const expected = {} // totaux calculés localement, pour vérifier l'agrégat DB

// — Inscription via la fonction sécurisée (seule porte d'entrée en écriture)
async function register({ name, avatar }) {
  const player = { id: crypto.randomUUID(), name, avatar, pin: '123456' }
  const { error } = await supabase.rpc('register_player', {
    p_id: player.id, p_name: name, p_avatar: avatar, p_pin: player.pin,
  })
  if (error) throw new Error(`inscription ${name} : ${error.message}`)
  return player
}

async function pushEvent(player, matchId, type, points, label) {
  const { error } = await supabase.from('events').insert({
    player_id: player.id, match_id: matchId, type, points, label,
  })
  if (error) throw new Error(`event ${player.name}/${matchId} : ${error.message}`)
  expected[player.name] = (expected[player.name] ?? 0) + points
}

async function fetchBoard() {
  const [p, e] = await Promise.all([
    supabase.from('players').select('id, name'),
    supabase.from('events').select('player_id, points'),
  ])
  if (p.error) throw p.error
  if (e.error) throw e.error
  const scores = {}
  for (const pl of p.data) scores[pl.id] = 0
  for (const ev of e.data) scores[ev.player_id] = (scores[ev.player_id] ?? 0) + ev.points
  return p.data
    .map((pl) => ({ name: pl.name, points: scores[pl.id] }))
    .sort((a, b) => b.points - a.points)
}

console.log('🏁 Simulation RedionCup — inscriptions\n')

const players = []
for (const sp of SIM_PLAYERS) {
  players.push(await register(sp))
  console.log(`  ✅ ${sp.avatar} ${sp.name} inscrit·e`)
}

// — Vérifie qu'on ne peut PAS s'inscrire deux fois (même prénom, casse différente)
try {
  await register({ name: 'sofia', avatar: '🤖' })
  console.log('  ❌ PROBLÈME : la double inscription de « sofia » a été acceptée !')
  process.exit(1)
} catch (e) {
  console.log(`  🔒 Double inscription refusée comme prévu (${e.message})`)
}

console.log('\n⚽ Matchs (pronos + quiz) jusqu’à la finale\n')

for (let i = 0; i < MATCHES.length; i++) {
  const match = MATCHES[i]
  const isFinale = i === MATCHES.length - 1
  console.log(`${isFinale ? '🏆 FINALE — ' : ''}${match.home.flag} ${match.home.name} ${match.actual.h}–${match.actual.a} ${match.away.name} ${match.away.flag}`)
  for (const player of players) {
    const pred = botPrediction(player.name, match.id)
    const res = matchPoints(pred, match.actual)
    await pushEvent(player, match.id, 'match', res.points, res.label)
    const quiz = botQuizResult(player.name, match.id)
    await pushEvent(player, match.id, 'quiz', quiz.points, `Quiz ${quiz.level} : ${quiz.correct}/3`)
    console.log(`    ${player.avatar} ${player.name} prono ${pred.h}–${pred.a} → ${res.points} pts (${res.label}) · quiz ${quiz.level} ${quiz.correct}/3 → +${quiz.points} pts`)
  }
}

console.log('\n📊 Classement final (agrégé depuis Supabase)\n')
const board = await fetchBoard()
const medals = ['🥇', '🥈', '🥉']
let ok = true
board.forEach((row, i) => {
  const exp = expected[row.name] ?? 0
  const match = row.points === exp
  if (!match) ok = false
  console.log(`  ${medals[i] ?? `#${i + 1}`} ${row.name} — ${row.points} pts ${match ? '✓' : `✗ (attendu ${exp})`}`)
})

console.log(ok
  ? `\n🎉 ${board[0].name} remporte la RedionCup ! Tous les totaux DB correspondent au calcul local.`
  : '\n❌ Incohérence entre les events en base et le calcul local !')
process.exit(ok ? 0 : 1)
