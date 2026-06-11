import { useEffect } from 'react'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { useStore } from '../store.jsx'
import { PLAYERS } from '../data.js'

const SLOTS = [
  { place: 2, medal: '🥈', barClass: 'silver', height: 120, delay: 0.25 },
  { place: 1, medal: '🥇', barClass: 'gold', height: 175, delay: 0.05 },
  { place: 3, medal: '🥉', barClass: 'bronze', height: 90, delay: 0.45 },
]

export default function Podium() {
  const { state } = useStore()
  const ranked = [...PLAYERS].sort((a, b) => state.scores[b.id] - state.scores[a.id])
  const hasPoints = ranked.some((p) => state.scores[p.id] > 0)

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
      <div className="podium">
        {SLOTS.map(({ place, medal, barClass, height, delay }) => {
          const player = ranked[place - 1]
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
              <span className="ppoints">{state.scores[player.id]} pts</span>
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
