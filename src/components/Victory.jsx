import { useEffect } from 'react'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import Lottie from 'lottie-react'
import { usePlayers } from '../store.jsx'
import { playVictory } from '../lib/sound.js'
import { stadiumFlash } from '../lib/fx.js'
import trophyAnim from '../assets/trophy.json'

// Célébration de fin de jeu : tous les matchs sont joués, on couronne
// le vainqueur — grande fanfare + feu d'artifice de confettis.
export default function Victory({ onClose }) {
  const { players, scores } = usePlayers()
  const ranked = [...players].sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0))
  const winner = ranked[0]
  const isMe = winner?.isUser

  useEffect(() => {
    playVictory()
    stadiumFlash()
    const end = Date.now() + 5000
    const id = setInterval(() => {
      if (Date.now() > end) {
        clearInterval(id)
        return
      }
      confetti({
        particleCount: 50,
        spread: 75,
        startVelocity: 35,
        origin: { x: Math.random(), y: Math.random() * 0.4 + 0.1 },
        colors: ['#ffd700', '#22c55e', '#ffffff', '#ef4444'],
      })
    }, 300)
    return () => clearInterval(id)
  }, [])

  if (!winner) return null

  return (
    <motion.div className="victory-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div
        className="victory-card"
        initial={{ scale: 0.4, y: 80 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 170, damping: 15 }}
      >
        <Lottie animationData={trophyAnim} loop style={{ width: 180, height: 180, margin: '0 auto' }} />
        <motion.div
          className="victory-avatar"
          animate={{ y: [0, -12, 0], rotate: [0, -6, 6, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
        >
          {winner.avatar}
        </motion.div>
        <motion.h2
          className="victory-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          🏆 {winner.name} remporte la RedionCup !
        </motion.h2>
        <motion.p
          className="victory-score"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 12, delay: 0.7 }}
        >
          {scores[winner.id] ?? 0} pts
        </motion.p>
        <p className="victory-sub">
          {isMe
            ? 'CHAMPION·NE DU MONDE 2026 ! 🎉'
            : `Bravo ${winner.name} — rendez-vous en 2030 pour la revanche ! 😤`}
        </p>
        <button className="btn btn-primary" onClick={onClose}>Voir le podium</button>
      </motion.div>
    </motion.div>
  )
}
