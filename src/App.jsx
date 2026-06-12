import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore, usePlayers } from './store.jsx'
import { useCountUp } from './hooks.js'
import { USER_ID } from './data.js'
import { playPodium } from './lib/sound.js'
import { notify } from './lib/notify.js'
import Matches from './components/Matches.jsx'
import Leaderboard from './components/Leaderboard.jsx'
import History from './components/History.jsx'
import Connections from './components/Connections.jsx'
import Chat from './components/Chat.jsx'
import Onboarding from './components/Onboarding.jsx'
import Victory from './components/Victory.jsx'

const TABS = [
  { id: 'matchs', label: '⚽ Matchs', component: Matches },
  { id: 'classement', label: '🏆 Classement', component: Leaderboard },
  { id: 'pronos', label: '✅ Mes pronos', component: History },
  { id: 'chat', label: '💬 Chambrage', component: Chat },
  { id: 'connexions', label: '⚙️ Connexions', component: Connections },
]

export default function App() {
  const { state, dispatch, bursts, player, matches } = useStore()
  const { players, scores } = usePlayers()
  const [tab, setTab] = useState('matchs')
  const [celebrated, setCelebrated] = useState(false)
  const score = useCountUp(state.scores[USER_ID], 900, true)
  const Active = TABS.find((t) => t.id === tab).component

  // Fanfare quand le joueur monte sur le podium (entre dans le top 3)
  const ranked = [...players].sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0))
  const myRank = ranked.findIndex((p) => p.isUser) + 1
  const myScore = scores[ranked[myRank - 1]?.id] ?? 0
  const onPodium = myRank > 0 && myRank <= 3 && myScore > 0
  const prevOnPodium = useRef(onPodium)
  useEffect(() => {
    if (onPodium && !prevOnPodium.current) {
      // Léger différé pour ne pas chevaucher le son du prono/quiz qui vient de tomber
      setTimeout(playPodium, 700)
      notify('🏆 RedionCup', 'Tu montes sur le podium !')
    }
    prevOnPodium.current = onPodium
  }, [onPodium])

  // Fin du jeu : tous les matchs sont joués → célébration du vainqueur
  const finished = matches.length > 0 && matches.every((m) => state.played.includes(m.id))

  // Pas encore inscrit·e : l'onboarding (prénom unique et définitif) bloque tout
  if (!player) return <Onboarding />

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
          <span className="score-chip-label">{player.avatar} {player.name}</span>
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

      {/* Réservé à l'admin (Moussa) : le prénom est unique en base et
          protégé par le code de connexion, personne d'autre ne peut le prendre */}
      {player.name.toLowerCase() === 'moussa' && (
        <footer className="footer">
          <button className="btn-reset" onClick={() => { setCelebrated(false); dispatch({ type: 'RESET' }) }}>
            ♻️ Réinitialiser la partie
          </button>
        </footer>
      )}

      <AnimatePresence>
        {finished && !celebrated && (
          <Victory onClose={() => { setCelebrated(true); setTab('classement') }} />
        )}
      </AnimatePresence>
    </div>
  )
}
