import { useEffect } from 'react'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import Lottie from 'lottie-react'
import { usePlayers } from '../store.jsx'
import trophyAnim from '../assets/trophy.json'

const SLOTS = [
  { place: 2, medal: '🥈', barClass: 'silver', height: 120, delay: 0.25 },
  { place: 1, medal: '🥇', barClass: 'gold', height: 175, delay: 0.05 },
  { place: 3, medal: '🥉', barClass: 'bronze', height: 90, delay: 0.45 },
]

export default function Podium() {
  const { players, scores } = usePlayers()
  const ranked = [...players].sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0))
  const hasPoints = ranked.some((p) => (scores[p.id] ?? 0) > 0)

  useEffect(() => {
    if (!hasPoints) return
    const t = setTimeout(() => {
      confetti({ particleCount: 90, spread: 100, origin: { y: 0.4 }, colors: ['#ffd700', '#d1d5db', '#d97706'] })
    }, 700)
    return () => clearTimeout(t)
  }, [hasPoints])

  if (!hasPoints) {
    return (
      <div className="podium-wrap">
        <h2 className="section-title">🏆 Podium</h2>
        <p className="podium-empty">Joue d’abord quelques matchs pour voir apparaître le podium !</p>
      </div>
    )
  }

  return (
    <div className="podium-wrap">
      <h2 className="section-title">🏆 Podium</h2>
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, type: 'spring', stiffness: 200, damping: 14 }}
      >
        <Lottie animationData={trophyAnim} loop style={{ width: 110, height: 110, margin: '0 auto' }} />
      </motion.div>
      <div className="podium">
        {SLOTS.map(({ place, medal, barClass, height, delay }) => {
          const player = ranked[place - 1]
          if (!player) return <div className="podium-col" key={place} />
          return (
            <div className="podium-col" key={place}>
              <motion.span
                className="medal"
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 250, damping: 12, delay: delay + 0.5 }}
              >
                {medal}
              </motion.span>
              <span className="avatar">{player.avatar}</span>
              <span className="pname">{player.name}{player.isUser ? ' (toi)' : ''}</span>
              <span className="ppoints">{scores[player.id] ?? 0} pts</span>
              <motion.div
                className={`podium-bar ${barClass}`}
                initial={{ height: 0 }}
                animate={{ height }}
                transition={{ type: 'spring', stiffness: 120, damping: 16, delay }}
              >
                {place}
              </motion.div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
