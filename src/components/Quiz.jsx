import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import Lottie from 'lottie-react'
import { useStore } from '../store.jsx'
import { QUIZ_LEVELS, QUIZ_QUESTIONS_PER_MATCH, getQuizQuestions } from '../data.js'
import { isOnline } from '../lib/supabase.js'
import { pushEvent } from '../lib/onlineSync.js'
import { notify } from '../lib/notify.js'
import { stadiumFlash } from '../lib/fx.js'
import { playQuizCorrect } from '../lib/sound.js'
import trophyAnim from '../assets/trophy.json'

// 10 secondes par question : le temps de lire, pas d'aller chercher la réponse
const QUESTION_TIME = 10
const LEVEL = QUIZ_LEVELS.quiz

export default function Quiz({ match, matchIndex, onClose }) {
  const { dispatch, flyPoints, refreshBoard } = useStore()
  const [started, setStarted] = useState(false)
  const [questions] = useState(() => getQuizQuestions(matchIndex))
  const [qIndex, setQIndex] = useState(0)
  const [picked, setPicked] = useState(null)
  const [correct, setCorrect] = useState(0)
  const [finished, setFinished] = useState(false)
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME)

  useEffect(() => {
    if (!started || finished || picked !== null) return
    setTimeLeft(QUESTION_TIME)
    const startedAt = Date.now()
    const id = setInterval(() => {
      const remaining = QUESTION_TIME - (Date.now() - startedAt) / 1000
      if (remaining <= 0) {
        clearInterval(id)
        setTimeLeft(0)
        answer(-1)
      } else {
        setTimeLeft(remaining)
      }
    }, 100)
    return () => clearInterval(id)
  }, [started, finished, picked, qIndex])

  const answer = (choiceIndex) => {
    if (picked !== null) return
    setPicked(choiceIndex)
    const isCorrect = choiceIndex === questions[qIndex].answer
    const nextCorrect = correct + (isCorrect ? 1 : 0)
    if (isCorrect) {
      setCorrect(nextCorrect)
      playQuizCorrect()
    }

    setTimeout(() => {
      if (qIndex < QUIZ_QUESTIONS_PER_MATCH - 1) {
        setQIndex(qIndex + 1)
        setPicked(null)
      } else {
        const points = nextCorrect * LEVEL.perQuestion
        dispatch({ type: 'QUIZ_DONE', matchId: match.id, level: 'quiz', correct: nextCorrect, points })
        flyPoints(points)
        notify('🧠 Quiz RedionCup', `${nextCorrect}/${QUIZ_QUESTIONS_PER_MATCH} bonnes réponses : +${points} pts !`)
        if (isOnline) {
          pushEvent({ matchId: match.id, type: 'quiz', points, label: `Quiz : ${nextCorrect}/${QUIZ_QUESTIONS_PER_MATCH}` }).then(refreshBoard)
        }
        if (nextCorrect === QUIZ_QUESTIONS_PER_MATCH) {
          stadiumFlash()
          confetti({ particleCount: 160, spread: 90, origin: { y: 0.5 }, colors: ['#ffd700', '#22c55e', '#ffffff'] })
        }
        setFinished(true)
      }
    }, 1000)
  }

  const finalPoints = correct * LEVEL.perQuestion

  return (
    <motion.div
      className="quiz-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => { if (e.target === e.currentTarget && (finished || !started)) onClose() }}
    >
      <motion.div
        className="quiz-modal"
        initial={{ scale: 0.8, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 40, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        {/* Étape 1 : écran de lancement */}
        {!started && (
          <>
            <h2>🧠 Quiz du match</h2>
            <p className="sub">
              {match.home.flag} {match.home.name} – {match.away.name} {match.away.flag}
            </p>
            <div className="quiz-intro-card">
              <div className="quiz-intro-line">📝 {QUIZ_QUESTIONS_PER_MATCH} questions de culture foot</div>
              <div className="quiz-intro-line">⏱ {QUESTION_TIME} secondes par question</div>
              <div className="quiz-intro-line">🎯 +{LEVEL.perQuestion} pt par bonne réponse</div>
              <div className="quiz-intro-line">🏆 {QUIZ_QUESTIONS_PER_MATCH * LEVEL.perQuestion} pts maximum</div>
            </div>
            <p className="level-warning">
              ⚠️ Pas le temps d'aller chercher les réponses — fais confiance à ta culture foot !
            </p>
            <motion.button
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 8, padding: 14 }}
              onClick={() => setStarted(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              C'est parti ! 🚀
            </motion.button>
          </>
        )}

        {/* Étape 2 : les questions */}
        {started && !finished && (
          <>
            <div className="quiz-progress">
              {Array.from({ length: QUIZ_QUESTIONS_PER_MATCH }, (_, i) => (
                <div key={i} className={`dot ${i < qIndex ? 'done' : i === qIndex ? 'current' : ''}`} />
              ))}
            </div>
            <div className={`quiz-timer ${timeLeft <= 2 && picked === null ? 'danger' : ''}`}>
              <div className="quiz-timer-track">
                <div className="quiz-timer-bar" style={{ width: `${(timeLeft / QUESTION_TIME) * 100}%` }} />
              </div>
              <span className="quiz-timer-label">⏱ {Math.ceil(timeLeft)}s</span>
            </div>
            {picked === -1 && <p className="quiz-timeout">⏱ Temps écoulé !</p>}
            <AnimatePresence mode="wait">
              <motion.div
                key={qIndex}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.25 }}
              >
                <p className="quiz-q">Question {qIndex + 1}/{QUIZ_QUESTIONS_PER_MATCH} — {questions[qIndex].q}</p>
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
            {correct === QUIZ_QUESTIONS_PER_MATCH ? (
              <Lottie animationData={trophyAnim} loop style={{ width: 120, height: 120, margin: '0 auto' }} />
            ) : (
              <div className="big">{correct >= 3 ? '🎉' : correct >= 2 ? '👍' : correct === 1 ? '😅' : '😬'}</div>
            )}
            <h3>{correct}/{QUIZ_QUESTIONS_PER_MATCH} bonnes réponses</h3>
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
