import { motion } from 'framer-motion'
import { useStore } from '../store.jsx'
import { MATCHES, USER_ID } from '../data.js'

export default function History() {
  const { state } = useStore()
  const playedMatches = MATCHES.filter((m) => state.played.includes(m.id))

  if (playedMatches.length === 0) {
    return (
      <div>
        <h2 className="section-title">✅ Mes pronostics</h2>
        <p className="empty-state">Aucun match joué pour l’instant. Lance un coup d’envoi dans l’onglet Matchs !</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="section-title">✅ Mes pronostics</h2>
      <p className="section-sub">Le détail de tes points, match par match.</p>
      {playedMatches.map((match, i) => {
        const entries = state.history.filter((h) => h.matchId === match.id && h.playerId === USER_ID)
        const pred = state.predictions[match.id]
        const total = entries.reduce((sum, e) => sum + e.points, 0)
        return (
          <motion.div
            key={match.id}
            className="hist-card"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
          >
            <div className="hist-head">
              <span className="hist-title">
                {match.home.flag} {match.home.name} {match.actual.h} – {match.actual.a} {match.away.name} {match.away.flag}
              </span>
              <span className={`points-badge ${total > 0 ? 'win' : 'lose'}`}>+{total} pts</span>
            </div>
            <div className="hist-line">
              <span>🎯 Mon prono : {pred ? `${pred.h} – ${pred.a}` : 'aucun'}</span>
            </div>
            {entries.map((e, j) => (
              <div className="hist-line" key={j}>
                <span>{e.type === 'match' ? '⚽' : '🧠'} {e.label}</span>
                <span className={`pts ${e.points > 0 ? 'gain' : 'zero'}`}>+{e.points} pts</span>
              </div>
            ))}
          </motion.div>
        )
      })}
    </div>
  )
}
