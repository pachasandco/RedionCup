import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { isOnline } from '../lib/supabase.js'
import { fetchAnnouncements, subscribeAnnouncements } from '../lib/onlineSync.js'
import { playChatPop } from '../lib/sound.js'

// Bulle d'annonce de l'organisateur : chaque message ne s'affiche qu'une
// seule fois par appareil ; la croix le ferme définitivement et le jeu
// continue derrière.
const SEEN_KEY = 'redioncup-annonces-vues'

function getSeen() {
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_KEY)) ?? [])
  } catch {
    return new Set()
  }
}

function markSeen(id) {
  const seen = getSeen()
  seen.add(id)
  localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]))
}

export default function Announcements() {
  const [queue, setQueue] = useState([])

  useEffect(() => {
    if (!isOnline) return
    let active = true
    const load = async (pop = false) => {
      try {
        const all = await fetchAnnouncements()
        if (!active) return
        const seen = getSeen()
        const unseen = all.filter((a) => !seen.has(a.id))
        setQueue(unseen)
        if (pop && unseen.length > 0) playChatPop()
      } catch { /* annonces indisponibles : on réessaiera au prochain événement */ }
    }
    load()
    const unsubscribe = subscribeAnnouncements(() => load(true))
    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const current = queue[0]
  const dismiss = () => {
    markSeen(current.id)
    setQueue((q) => q.slice(1))
  }

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          className="announce-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="announce-bubble"
            initial={{ scale: 0.7, y: 40 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.7, y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          >
            <button className="announce-close" onClick={dismiss} aria-label="Fermer">✕</button>
            <div className="announce-head">📣 Message de l’organisateur</div>
            <p className="announce-body">{current.body}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
