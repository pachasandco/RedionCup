import { motion } from 'framer-motion'
import { useStore } from '../store.jsx'
import { PLAYERS } from '../data.js'
import { useCountUp } from '../hooks.js'

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
  const { state } = useStore()
  const ranked = [...PLAYERS].sort((a, b) => state.scores[b.id] - state.scores[a.id])

  return (
    <div>
      <h2 className="section-title">Classement général</h2>
      <p className="section-sub">Le classement se réorganise en direct à chaque match et chaque quiz.</p>
      <div className="board">
        {ranked.map((p, i) => (
          <Row key={p.id} player={p} rank={i + 1} points={state.scores[p.id]} />
        ))}
      </div>
    </div>
  )
}
