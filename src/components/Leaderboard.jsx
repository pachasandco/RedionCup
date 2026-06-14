import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { usePlayers, useStore } from '../store.jsx'
import { isOnline } from '../lib/supabase.js'
import { useCountUp } from '../hooks.js'
import Podium from './Podium.jsx'

function Row({ player, rank, points }) {
  const display = useCountUp(points)
  return (
    <motion.div
      layout
      layoutId={player.id}
      className={`board-row ${player.isUser ? 'me' : ''}`}
      transition={{ type: 'spring', stiffness: 350, damping: 28 }}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <span className={`rank ${rank <= 3 ? 'top' : ''}`}>
        {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
      </span>
      <span className="avatar">{player.avatar}</span>
      <span className="pname">{player.name}{player.isUser ? ' (toi)' : ''}</span>
      <span className="ppoints">{display} pts</span>
    </motion.div>
  )
}

export default function Leaderboard() {
  const { players, scores } = usePlayers()
  const { refreshBoard } = useStore()
  // Rafraîchit dès l'ouverture de l'onglet pour afficher les points les plus récents
  useEffect(() => { refreshBoard() }, [refreshBoard])
  const ranked = [...players].sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0))

  return (
    <div>
      <h2 className="section-title">Classement général</h2>
      <p className="section-sub">
        {isOnline
          ? '🟢 Multijoueur en ligne : le classement se synchronise en temps réel entre tous les parieurs.'
          : 'Le classement se réorganise en direct à chaque match et chaque quiz.'}
      </p>
      <Podium />
      <div className="board">
        {ranked.map((p, i) => (
          <Row key={p.id} player={p} rank={i + 1} points={scores[p.id] ?? 0} />
        ))}
      </div>
    </div>
  )
}
