import { useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store.jsx'
import { registerPlayer, claimPlayer } from '../lib/onlineSync.js'

// Inscription (prénom unique et définitif) ou connexion depuis un autre
// appareil (prénom + code à 6 chiffres reçu à l'inscription).
export default function Onboarding() {
  const { adoptPlayer } = useStore()
  const [mode, setMode] = useState('new') // 'new' | 'claim'
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [created, setCreated] = useState(null) // joueur inscrit : on montre son code

  const submit = async (e) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      if (mode === 'new') {
        setCreated(await registerPlayer(name))
      } else {
        adoptPlayer(await claimPlayer(name, pin))
      }
    } catch (err) {
      setError(err.message)
    }
    setBusy(false)
  }

  // Étape 2 (inscription) : montre le code de connexion avant d'entrer dans l'app
  if (created) {
    return (
      <div className="onboarding">
        <motion.div
          className="onboarding-card"
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
        >
          <div className="onboarding-ball">{created.avatar}</div>
          <h1>Bienvenue {created.name} !</h1>
          <p className="onboarding-sub">📱 Ton code pour te connecter sur un autre appareil :</p>
          <div className="onboarding-pin">{created.pin}</div>
          <p className="onboarding-explain">
            Sur <strong>cet appareil</strong>, tu restes connecté·e automatiquement,
            rien à faire. Ce code sert <strong>uniquement</strong> si tu ouvres
            l’app sur un <strong>autre appareil</strong> (téléphone, tablette,
            PC…) : choisis « 🔑 J’ai déjà un code » et entre ton prénom + ce code
            pour retrouver ton compte et tous tes points.
          </p>
          <p className="onboarding-warning">
            ✍️ Note-le ou prends une capture d’écran ! Tu le retrouveras aussi
            dans l’onglet ⚙️ Connexions.
          </p>
          <button className="btn btn-primary onboarding-btn" onClick={() => adoptPlayer(created)}>
            J’ai noté mon code, c’est parti ! 🚀
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="onboarding">
      <motion.form
        className="onboarding-card"
        onSubmit={submit}
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 20 }}
      >
        <motion.div
          className="onboarding-ball"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
        >
          ⚽
        </motion.div>
        <h1>Bienvenue dans la RedionCup !</h1>
        <p className="onboarding-sub">
          Pronostics entre amis pour la Coupe du Monde 2026 🇺🇸🇨🇦🇲🇽
        </p>

        <div className="onboarding-modes">
          <button
            type="button"
            className={`onboarding-mode ${mode === 'new' ? 'active' : ''}`}
            onClick={() => { setMode('new'); setError(null) }}
          >
            ✨ Nouveau joueur
          </button>
          <button
            type="button"
            className={`onboarding-mode ${mode === 'claim' ? 'active' : ''}`}
            onClick={() => { setMode('claim'); setError(null) }}
          >
            🔑 J’ai déjà un code
          </button>
        </div>

        <input
          className="input onboarding-input"
          value={name}
          maxLength={15}
          placeholder="Ton prénom"
          autoFocus
          onChange={(e) => { setName(e.target.value); setError(null) }}
        />
        {mode === 'claim' && (
          <input
            className="input onboarding-input"
            value={pin}
            inputMode="numeric"
            maxLength={6}
            placeholder="Code à 6 chiffres"
            onChange={(e) => { setPin(e.target.value.replace(/\D/g, '')); setError(null) }}
          />
        )}
        {error && <p className="onboarding-error">⚠️ {error}</p>}
        <button
          className="btn btn-primary onboarding-btn"
          type="submit"
          disabled={busy || name.trim().length < 2 || (mode === 'claim' && pin.length !== 6)}
        >
          {busy ? 'Un instant…' : mode === 'new' ? 'C’est parti ! 🚀' : 'Me connecter'}
        </button>
        {mode === 'new' && (
          <p className="onboarding-warning">
            ⚠️ Ton prénom est <strong>définitif</strong> : une seule inscription,
            impossible d’en changer. Tu recevras ensuite un code à 6 chiffres
            qui te servira à te connecter depuis un autre appareil.
          </p>
        )}
        {mode === 'claim' && (
          <p className="onboarding-warning">
            🔑 Ton code à 6 chiffres t’a été montré lors de ton inscription
            (il est aussi dans l’onglet ⚙️ Connexions de ton premier appareil).
          </p>
        )}
      </motion.form>
    </div>
  )
}
