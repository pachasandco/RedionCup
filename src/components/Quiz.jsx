import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { useStore } from '../store.jsx'
import { QUIZ_LEVELS, getQuizQuestions } from '../data.js'

export default function Quiz({ match, matchIndex, onClose }) {
  const { dispatch, flyPoints } = useStore()
  // Le niveau est verrouillé dès qu'il est choisi : pas de retour en arrière
  const [level, setLevel] = useState(null)
  const [questions, setQuestions] = useState([])
  const [qIndex, setQIndex] = useState(0)
  const [picked, setPicked] = useState(null)
  const [correct, setCorrect] = useState(0)
  const [finished, setFinished] = useState(false)

  const chooseLevel = (lvl) => {
    setLevel(lvl)
    setQuestions(getQuizQuestions(matchIndex, lvl))
  }

  const answer = (choiceIndex) => {
    if (picked !== null) return
    setPicked(choiceIndex)
    const isCorrect = choiceIndex === questions[qIndex].answer
    const nextCorrect = correct + (isCorrect ? 1 : 0)
    if (isCorrect) setCorrect(nextCorrect)

    setTimeout(() => {
      if (qIndex < 2) {
        setQIndex(qIndex + 1)
        setPicked(null)
      } else {
        const points = nextCorrect * QUIZ_LEVELS[level].perQuestion
        dispatch({ type: 'QUIZ_DONE', matchId: match.id, level, correct: nextCorrect, points })
        flyPoints(points)
        if (nextCorrect === 3) {
          confetti({ particleCount: 160, spread: 90, origin: { y: 0.5 }, colors: ['#ffd700', '#22c55e', '#ffffff'] })
        }
        setFinished(true)
      }
    }, 1000)
  }

  const finalPoints = correct * (level ? QUIZ_LEVELS[level].perQuestion : 0)

  return (
    <motion.div
      className="quiz-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => { if (e.target === e.currentTarget && (finished || !level)) onClose() }}
    >
      <motion.div
        className="quiz-modal"
        initial={{ scale: 0.8, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 40, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        {/* Étape 1 : choix du niveau (définitif) */}
        {!level && (
          <>
            <h2>🧠 Quiz du match</h2>
            <p className="sub">
              {match.home.flag} {match.home.name} – {match.away.name} {match.away.flag} · 3 questions
            </p>
            <div className="level-grid">
              {Object.entries(QUIZ_LEVELS).map(([key, lvl]) => (
                <motion.button
                  key={key}
                  className="level-card"
                  onClick={() => chooseLevel(key)}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                >
                  <div className="emoji">{lvl.emoji}</div>
                  <div className="lvl">{lvl.label}</div>
                  <div className="pts">+{lvl.perQuestion} pts / bonne réponse</div>
                </motion.button>
              ))}
            </div>
            <p className="level-warning">
              ⚠️ Le niveau choisi est définitif : impossible d’en changer une fois le quiz commencé.
              Plus c’est dur, plus ça rapporte !
            </p>
          </>
        )}

        {/* Étape 2 : les 3 questions */}
        {level && !finished && (
          <>
            <span className="level-chip">
              {QUIZ_LEVELS[level].emoji} Niveau {QUIZ_LEVELS[level].label} · +{QUIZ_LEVELS[level].perQuestion} pts / bonne réponse
            </span>
            <div className="quiz-progress">
              {[0, 1, 2].map((i) => (
                <div key={i} className={`dot ${i < qIndex ? 'done' : i === qIndex ? 'current' : ''}`} />
              ))}
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={qIndex}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.25 }}
              >
                <p className="quiz-q">Question {qIndex + 1}/3 — {questions[qIndex].q}</p>
                <div className="quiz-choices">
                  {questions[qIndex].choices.map((choice, i) => {
                    let cls = 'choice'
                    if (picked !== null) {
                      if (i === questions[qIndex].answer) cls += ' correct'
                      else if (i === picked) cls += ' wrong'
                    }
                    return (
                      <motion.button
                        key={i}
                        className={cls}
                        disabled={picked !== null}
                        onClick={() => answer(i)}
                        whileHover={picked === null ? { x: 4 } : {}}
                        animate={picked === i && i !== questions[qIndex].answer ? { x: [0, -8, 8, -5, 5, 0] } : {}}
                        transition={{ duration: 0.4 }}
                      >
                        {choice}
                      </motion.button>
                    )
                  })}
                </div>
              </motion.div>
            </AnimatePresence>
          </>
        )}

        {/* Étape 3 : résultat */}
        {finished && (
          <motion.div className="quiz-result" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="big">{correct === 3 ? '🏆' : correct >= 2 ? '🎉' : correct === 1 ? '👍' : '😅'}</div>
            <h3>{correct}/3 bonnes réponses</h3>
            <motion.p
              className="gained"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 12, delay: 0.2 }}
            >
              +{finalPoints} pts
            </motion.p>
            <button className="btn btn-primary" onClick={onClose}>Retour aux matchs</button>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  )
}
