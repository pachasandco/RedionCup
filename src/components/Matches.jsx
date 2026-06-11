import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { useStore } from '../store.jsx'
import { MATCHES, matchPoints } from '../data.js'
import Quiz from './Quiz.jsx'

function Stepper({ value, onChange, disabled }) {
  return (
    <div className="stepper">
      <button disabled={disabled} onClick={() => onChange(Math.min(9, value + 1))}>+</button>
      <motion.span key={value} className="val" initial={{ scale: 1.3 }} animate={{ scale: 1 }}>
        {value}
      </motion.span>
      <button disabled={disabled} onClick={() => onChange(Math.max(0, value - 1))}>−</button>
    </div>
  )
}

function MatchCard({ match, index }) {
  const { state, dispatch, flyPoints } = useStore()
  const played = state.played.includes(match.id)
  const pred = state.predictions[match.id]
  const quiz = state.quizDone[match.id]
  const [showQuiz, setShowQuiz] = useState(false)

  const setPred = (h, a) => dispatch({ type: 'SET_PREDICTION', matchId: match.id, h, a })

  const play = () => {
    const result = matchPoints(pred, match.actual)
    dispatch({ type: 'PLAY_MATCH', matchId: match.id })
    if (result.points > 0) {
      flyPoints(result.points)
      if (result.points >= 10) {
        confetti({ particleCount: 120, spread: 75, origin: { y: 0.6 }, colors: ['#ffd700', '#22c55e', '#ffffff'] })
      }
    }
  }

  const result = played ? matchPoints(pred, match.actual) : null
  const badgeClass = result
    ? result.points >= 10 ? 'exact' : result.points > 0 ? 'win' : 'lose'
    : ''

  return (
    <motion.div
      className="match-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
    >
      <div className="match-meta">
        <span className="group-pill">Groupe {match.group}</span>
        <span>{match.date} · {match.stadium}</span>
      </div>

      <div className="match-row">
        <div className="team">
          <span className="flag">{match.home.flag}</span>
          <span className="name">{match.home.name}</span>
        </div>

        {played ? (
          <motion.div
            className="final-score"
            initial={{ scale: 0, rotate: -8 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 14 }}
          >
            {match.actual.h} – {match.actual.a}
          </motion.div>
        ) : (
          <div className="score-box">
            <Stepper value={pred?.h ?? 0} onChange={(h) => setPred(h, pred?.a ?? 0)} />
            <span className="vs">VS</span>
            <Stepper value={pred?.a ?? 0} onChange={(a) => setPred(pred?.h ?? 0, a)} />
          </div>
        )}

        <div className="team">
          <span className="flag">{match.away.flag}</span>
          <span className="name">{match.away.name}</span>
        </div>
      </div>

      {played && pred && (
        <p className="my-pred">Mon prono : {pred.h} – {pred.a}</p>
      )}

      <div className="match-actions">
        {!played && (
          <button className="btn btn-primary" onClick={play} disabled={!pred}>
            {pred ? '🟢 Coup d’envoi !' : 'Choisis un score d’abord'}
          </button>
        )}

        {played && result && (
          <motion.span
            className={`points-badge ${badgeClass}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 12, delay: 0.3 }}
          >
            {result.points > 0 ? `🎯 ${result.label} +${result.points} pts` : `❌ ${result.label} (0 pt)`}
          </motion.span>
        )}

        {played && !quiz && (
          <motion.button
            className="btn btn-gold"
            onClick={() => setShowQuiz(true)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            🧠 Quiz du match — rattrape-toi ou creuse l’écart !
          </motion.button>
        )}

        {quiz && (
          <span className="points-badge win">
            🧠 Quiz {quiz.level} : {quiz.correct}/3 → +{quiz.points} pts
          </span>
        )}
      </div>

      <AnimatePresence>
        {showQuiz && (
          <Quiz match={match} matchIndex={index} onClose={() => setShowQuiz(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function Matches() {
  return (
    <div>
      <h2 className="section-title">Phase de groupes</h2>
      <p className="section-sub">
        Pronostique le score, lance le coup d’envoi, puis joue le quiz pour gagner des points bonus.
        Barème : score exact +10 · bonne différence +7 · bon résultat +5.
      </p>
      {MATCHES.map((m, i) => (
        <MatchCard key={m.id} match={m} index={i} />
      ))}
    </div>
  )
}
