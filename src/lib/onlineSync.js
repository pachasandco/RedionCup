import { supabase, isOnline } from './supabase.js'

// Synchronisation multijoueur via Supabase.
// Tables attendues (voir supabase/migrations/) :
//   players(id uuid, name text, avatar text)
//   events(id, player_id, match_id, type, points, label, created_at)
// Le classement est la somme des points des events de chaque joueur,
// rafraîchi en temps réel via Supabase Realtime.

const PLAYER_KEY = 'redioncup-player'

export function getLocalPlayer() {
  try {
    return JSON.parse(localStorage.getItem(PLAYER_KEY))
  } catch {
    return null
  }
}

const AVATARS = ['🦁', '🦊', '🐺', '🐯', '🦅', '🐝', '🐸', '🐙', '🦈', '🦄']

// Code de connexion à 6 chiffres : permet de retrouver son compte
// sur un autre appareil (prénom + code).
function makePin() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

// Inscription unique et définitive : un prénom, pas de changement possible.
// L'identité (avec son code) est conservée en localStorage et l'unicité
// du prénom est garantie côté base.
export async function registerPlayer(rawName) {
  const existing = getLocalPlayer()
  if (existing) return existing

  const name = rawName.trim().replace(/\s+/g, ' ')
  if (name.length < 2) throw new Error('Ton prénom doit faire au moins 2 lettres.')

  const player = {
    id: crypto.randomUUID(),
    name,
    avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
    pin: makePin(),
  }

  // Unicité vérifiée en ligne ; si la base est injoignable, on inscrit
  // quand même en local (même repli que le reste de l'app) et ensurePlayer
  // resynchronisera le joueur plus tard.
  if (isOnline) {
    const { error } = await supabase.rpc('register_player', {
      p_id: player.id,
      p_name: player.name,
      p_avatar: player.avatar,
      p_pin: player.pin,
    })
    if (error?.code === '23505') {
      throw new Error(`« ${name} » est déjà pris. Chaque prénom est unique !`)
    }
    if (error) console.warn('Supabase injoignable, inscription locale :', error.message)
  }

  localStorage.setItem(PLAYER_KEY, JSON.stringify(player))
  return player
}

// Connexion depuis un autre appareil : prénom + code de connexion.
export async function claimPlayer(rawName, rawPin) {
  if (!isOnline) throw new Error('Connexion impossible hors ligne, réessaie plus tard.')
  const name = rawName.trim()
  const pin = rawPin.trim()
  if (!name || !pin) throw new Error('Prénom et code requis.')
  const { data, error } = await supabase.rpc('claim_player', { p_name: name, p_pin: pin })
  if (error) throw new Error('Connexion impossible, réessaie dans un instant.')
  const row = data?.[0]
  if (!row) throw new Error('Prénom ou code incorrect.')
  const player = { id: row.id, name: row.name, avatar: row.avatar, pin }
  localStorage.setItem(PLAYER_KEY, JSON.stringify(player))
  return player
}

// Déconnecte cet appareil : efface l'identité et la partie locales.
// Le compte reste en base — on le retrouve avec prénom + code.
export function logoutDevice() {
  localStorage.removeItem(PLAYER_KEY)
  localStorage.removeItem('redioncup-v1')
  window.location.reload()
}

// Resynchronise le joueur déjà inscrit vers Supabase (au cas où la ligne
// aurait disparu, ex. inscription faite hors ligne). Idempotent — passe
// par register_player, seule porte d'entrée en écriture sur players.
export async function ensurePlayer() {
  if (!isOnline) return null
  const player = getLocalPlayer()
  if (!player?.pin) return player ?? null
  await supabase.rpc('register_player', {
    p_id: player.id,
    p_name: player.name,
    p_avatar: player.avatar,
    p_pin: player.pin,
  })
  return player
}

export async function pushEvent({ matchId, type, points, label }) {
  if (!isOnline) return
  const player = getLocalPlayer()
  if (!player) return
  const { error } = await supabase.from('events').insert({
    player_id: player.id,
    match_id: matchId,
    type,
    points,
    label,
  })
  // 23505 = déjà validé depuis un autre appareil : pas un problème.
  // Tout autre échec doit être visible, sinon des points se perdent
  // en silence (réseau, identité périmée…).
  if (error && error.code !== '23505') {
    console.error('Envoi des points échoué :', error.message)
    alert(`⚠️ Tes points (${label}) n'ont pas pu être envoyés au classement. Recharge la page et revalide le match.`)
  }
}

// Récupère joueurs + scores agrégés.
// Lève une erreur si la base est injoignable, pour que l'app retombe
// proprement sur le mode démo local.
export async function fetchBoard() {
  const [playersRes, eventsRes] = await Promise.all([
    supabase.from('players').select('id, name, avatar'),
    supabase.from('events').select('player_id, points'),
  ])
  if (playersRes.error) throw playersRes.error
  if (eventsRes.error) throw eventsRes.error
  const me = getLocalPlayer()
  const scores = {}
  for (const p of playersRes.data) scores[p.id] = 0
  for (const e of eventsRes.data) scores[e.player_id] = (scores[e.player_id] ?? 0) + e.points
  return {
    players: playersRes.data.map((p) => ({ ...p, isUser: p.id === me?.id })),
    scores,
  }
}

// --- Synchronisation des pronostics entre appareils ---

export async function fetchMyPredictions() {
  if (!isOnline) return {}
  const player = getLocalPlayer()
  if (!player) return {}
  const { data, error } = await supabase
    .from('predictions')
    .select('match_id, h, a')
    .eq('player_id', player.id)
  if (error) throw error
  return Object.fromEntries(data.map((p) => [p.match_id, { h: p.h, a: p.a }]))
}

// Fire-and-forget : la version locale fait foi sur cet appareil, la base
// sert aux autres appareils du joueur.
export async function savePrediction(matchId, h, a) {
  if (!isOnline) return
  const player = getLocalPlayer()
  if (!player) return
  await supabase.from('predictions').upsert(
    { player_id: player.id, match_id: matchId, h, a, updated_at: new Date().toISOString() },
    { onConflict: 'player_id,match_id' }
  )
}

// --- Chat de chambrage ---

export async function fetchMessages() {
  if (!isOnline) return []
  const { data, error } = await supabase
    .from('messages')
    .select('id, body, created_at, player:players(id, name, avatar)')
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw error
  return data.reverse() // affichage du plus ancien au plus récent
}

export async function sendMessage(body) {
  if (!isOnline) return
  const player = getLocalPlayer()
  const text = body.trim().slice(0, 280)
  if (!player || !text) return
  const { error } = await supabase.from('messages').insert({ player_id: player.id, body: text })
  if (error) throw error
}

export function subscribeMessages(onChange) {
  if (!isOnline) return () => {}
  const channel = supabase
    .channel(`redioncup-chat-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, onChange)
    .subscribe()
  return () => supabase.removeChannel(channel)
}

// Écoute en temps réel : tout nouvel event ou joueur déclenche le callback.
// Nom de canal unique : un même nom ne peut pas être réabonné (StrictMode
// monte les effets deux fois en dev).
export function subscribeBoard(onChange) {
  if (!isOnline) return () => {}
  const channel = supabase
    .channel(`redioncup-board-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, onChange)
    .subscribe()
  return () => supabase.removeChannel(channel)
}
