import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store.jsx'
import { isOnline } from '../lib/supabase.js'
import { fetchMessages, sendMessage, subscribeMessages } from '../lib/onlineSync.js'
import { playChatPop } from '../lib/sound.js'

// Réactions rapides pour chambrer sans taper
const QUICK = ['😂', '🔥', '💀', '🤡', '🐐', '😭', '⚽', '🏆']

function timeLabel(iso) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export default function Chat() {
  const { player } = useStore()
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [error, setError] = useState(null)
  const endRef = useRef(null)

  // Chargement + temps réel : tout nouveau message recharge la liste
  useEffect(() => {
    if (!isOnline) return
    let active = true
    const load = async (pop = false) => {
      try {
        const msgs = await fetchMessages()
        if (!active) return
        setMessages((prev) => {
          // Pop sonore seulement quand un message des autres arrive
          if (pop && msgs.length > prev.length && msgs[msgs.length - 1]?.player?.id !== player?.id) {
            playChatPop()
          }
          return msgs
        })
      } catch (e) {
        if (active) setError(e.message)
      }
    }
    load()
    const unsubscribe = subscribeMessages(() => load(true))
    return () => {
      active = false
      unsubscribe()
    }
  }, [player?.id])

  // Défile vers le dernier message
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length])

  const send = async (text) => {
    const body = (text ?? draft).trim()
    if (!body) return
    setDraft('')
    try {
      await sendMessage(body)
    } catch {
      setError('Message non envoyé, réessaie.')
    }
  }

  if (!isOnline) {
    return (
      <div>
        <h2 className="section-title">💬 Chambrage</h2>
        <p className="empty-state">Le chat nécessite le mode multijoueur (Supabase).</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="section-title">💬 Chambrage</h2>
      <p className="section-sub">
        Vannes, mauvaise foi et provocations : tout est permis (ou presque). En direct entre tous les parieurs.
      </p>

      <div className="chat-box">
        {messages.length === 0 && (
          <p className="empty-state">Personne n’a encore osé ouvrir les hostilités… 👀</p>
        )}
        {messages.map((m) => {
          const mine = m.player?.id === player?.id
          return (
            <motion.div
              key={m.id}
              className={`chat-msg ${mine ? 'mine' : ''}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {!mine && <span className="chat-avatar">{m.player?.avatar ?? '⚽'}</span>}
              <div className="chat-bubble">
                {!mine && <span className="chat-name">{m.player?.name ?? '???'}</span>}
                <span className="chat-body">{m.body}</span>
                <span className="chat-time">{timeLabel(m.created_at)}</span>
              </div>
            </motion.div>
          )
        })}
        <div ref={endRef} />
      </div>

      <div className="chat-quick">
        {QUICK.map((e) => (
          <button key={e} className="chat-quick-btn" onClick={() => send(e)}>{e}</button>
        ))}
      </div>

      {error && <p className="onboarding-error">⚠️ {error}</p>}

      <form
        className="chat-form"
        onSubmit={(e) => { e.preventDefault(); send() }}
      >
        <input
          className="input chat-input"
          value={draft}
          maxLength={280}
          placeholder="Balance ta vanne…"
          onChange={(e) => setDraft(e.target.value)}
        />
        <button className="btn btn-primary" type="submit" disabled={!draft.trim()}>
          Envoyer
        </button>
      </form>
    </div>
  )
}
