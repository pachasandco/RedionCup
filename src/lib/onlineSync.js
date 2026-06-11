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

export function setLocalPlayerName(name) {
  const player = getLocalPlayer()
  if (player) {
    player.name = name
    localStorage.setItem(PLAYER_KEY, JSON.stringify(player))
  }
}

const AVATARS = ['🦁', '🦊', '🐺', '🐯', '🦅', '🐝', '🐸', '🐙', '🦈', '🦄']

export async function ensurePlayer() {
  if (!isOnline) return null
  let player = getLocalPlayer()
  if (!player) {
    player = {
      id: crypto.randomUUID(),
      name: `Parieur·se ${Math.floor(Math.random() * 900 + 100)}`,
      avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
    }
    localStorage.setItem(PLAYER_KEY, JSON.stringify(player))
  }
  await supabase.from('players').upsert({ id: player.id, name: player.name, avatar: player.avatar })
  return player
}

export async function pushEvent({ matchId, type, points, label }) {
  if (!isOnline) return
  const player = getLocalPlayer()
  if (!player) return
  await supabase.from('events').insert({
    player_id: player.id,
    match_id: matchId,
    type,
    points,
    label,
  })
}

// Récupère joueurs + scores agrégés
export async function fetchBoard() {
  const [{ data: players }, { data: events }] = await Promise.all([
    supabase.from('players').select('id, name, avatar'),
    supabase.from('events').select('player_id, points'),
  ])
  const me = getLocalPlayer()
  const scores = {}
  for (const p of players ?? []) scores[p.id] = 0
  for (const e of events ?? []) scores[e.player_id] = (scores[e.player_id] ?? 0) + e.points
  return {
    players: (players ?? []).map((p) => ({ ...p, isUser: p.id === me?.id })),
    scores,
  }
}

// Écoute en temps réel : tout nouvel event ou joueur déclenche le callback
export function subscribeBoard(onChange) {
  if (!isOnline) return () => {}
  const channel = supabase
    .channel('redioncup-board')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, onChange)
    .subscribe()
  return () => supabase.removeChannel(channel)
}
