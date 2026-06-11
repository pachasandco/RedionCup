import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from './store.jsx'
import { useCountUp } from './hooks.js'
import { USER_ID } from './data.js'
import Matches from './components/Matches.jsx'
import Leaderboard from './components/Leaderboard.jsx'
import Podium from './components/Podium.jsx'
import History from './components/History.jsx'
import Connections from './components/Connections.jsx'

const TABS = [
  { id: 'matchs', label: '⚽ Matchs', component: Matches },
  { id: 'classement', label: '📊 Classement', component: Leaderboard },
  { id: 'podium', label: '🏆 Podium', component: Podium },
  { id: 'pronos', label: '✅ Mes pronos', component: History },
  { id: 'connexions', label: '⚙️ Connexions', component: Connections },
]

export default function App() {
  const { state, dispatch, bursts } = useStore()
  const [tab, setTab] = useState('matchs')
  const score = useCountUp(state.scores[USER_ID])
  const Active = TABS.find((t) => t.id === tab).component

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <motion.span
            className="brand-ball"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
          >
            ⚽
          </motion.span>
          <div>
            <h1>RedionCup</h1>
            <p>Pronostics · Coupe du Monde 2026 🇺🇸🇨🇦🇲🇽</p>
          </div>
        </div>
        <div className="score-chip">
          <span className="score-chip-label">🦁 Moi</span>
          <motion.span
            key={state.scores[USER_ID]}
            className="score-chip-value"
            initial={{ scale: 1.4, color: '#ffd700' }}
            animate={{ scale: 1, color: '#ffffff' }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          >
            {score} pts
          </motion.span>
          <AnimatePresence>
            {bursts.map((b) => (
              <motion.span
                key={b.id}
                className="fly-points"
                initial={{ opacity: 0, y: 10, scale: 0.6 }}
                animate={{ opacity: 1, y: -42, scale: 1.15 }}
                exit={{ opacity: 0, y: -60, scale: 0.8 }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              >
                +{b.amount} pts
              </motion.span>
            ))}
          </AnimatePresence>
        </div>
      </header>

      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            {tab === t.id && <motion.div layoutId="tab-underline" className="tab-underline" />}
          </button>
        ))}
      </nav>

      <main className="content">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
          >
            <Active />
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="footer">
        <button className="btn-reset" onClick={() => dispatch({ type: 'RESET' })}>
          ♻️ Réinitialiser la partie
        </button>
      </footer>
    </div>
  )
}
