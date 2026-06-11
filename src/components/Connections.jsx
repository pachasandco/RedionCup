import { useState } from 'react'
import { motion } from 'framer-motion'
import { isOnline } from '../lib/supabase.js'
import { hasLiveData } from '../lib/footballData.js'
import { getLocalPlayer, setLocalPlayerName, ensurePlayer } from '../lib/onlineSync.js'
import {
  notificationsSupported,
  notificationsEnabled,
  enableNotifications,
  disableNotifications,
  notify,
} from '../lib/notify.js'

function StatusPill({ on, onLabel = 'Activé', offLabel = 'Non configuré' }) {
  return <span className={`status-pill ${on ? 'on' : 'off'}`}>{on ? `🟢 ${onLabel}` : `⚪ ${offLabel}`}</span>
}

export default function Connections() {
  const [notifOn, setNotifOn] = useState(notificationsEnabled())
  const [name, setName] = useState(getLocalPlayer()?.name ?? '')
  const [saved, setSaved] = useState(false)

  const toggleNotif = async () => {
    if (notifOn) {
      disableNotifications()
      setNotifOn(false)
    } else {
      setNotifOn(await enableNotifications())
    }
  }

  const saveName = async () => {
    setLocalPlayerName(name.trim())
    await ensurePlayer() // pousse le nouveau nom vers Supabase
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <h2 className="section-title">⚙️ Connexions</h2>
      <p className="section-sub">
        L’app fonctionne sans configuration (mode démo). Chaque service s’active en renseignant
        sa clé dans un fichier <code>.env</code> — voir <code>.env.example</code>.
      </p>

      <motion.div className="conn-card" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        <div className="conn-head">
          <span className="conn-title">👥 Multijoueur réel — Supabase</span>
          <StatusPill on={isOnline} onLabel="Connecté" />
        </div>
        <p className="conn-desc">
          Classement temps réel partagé entre tous les parieurs. Configuration :
          créer un projet sur supabase.com, exécuter <code>supabase/schema.sql</code>,
          puis renseigner <code>VITE_SUPABASE_URL</code> et <code>VITE_SUPABASE_ANON_KEY</code>.
        </p>
        {isOnline && (
          <div className="conn-row">
            <input
              className="input"
              value={name}
              maxLength={20}
              placeholder="Ton pseudo"
              onChange={(e) => setName(e.target.value)}
            />
            <button className="btn btn-primary" onClick={saveName} disabled={!name.trim()}>
              {saved ? '✅ Enregistré' : 'Changer de pseudo'}
            </button>
          </div>
        )}
      </motion.div>

      <motion.div className="conn-card" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <div className="conn-head">
          <span className="conn-title">📡 Vrais matchs & scores — football-data.org</span>
          <StatusPill on={hasLiveData} onLabel="Connecté" />
        </div>
        <p className="conn-desc">
          Remplace les matchs de démo par le vrai calendrier de la Coupe du Monde et
          les scores officiels. Clé gratuite sur football-data.org, à renseigner dans{' '}
          <code>VITE_FOOTBALL_DATA_TOKEN</code>.
        </p>
      </motion.div>

      <motion.div className="conn-card" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
        <div className="conn-head">
          <span className="conn-title">🔔 Notifications navigateur</span>
          <StatusPill on={notifOn} onLabel="Activées" offLabel="Désactivées" />
        </div>
        <p className="conn-desc">
          Sois prévenu·e dès que tes points tombent après un match ou un quiz.
        </p>
        <div className="conn-row">
          <button className="btn btn-ghost" onClick={toggleNotif} disabled={!notificationsSupported()}>
            {notificationsSupported()
              ? notifOn ? 'Désactiver' : 'Activer les notifications'
              : 'Non supporté par ce navigateur'}
          </button>
          {notifOn && (
            <button className="btn btn-ghost" onClick={() => notify('⚽ RedionCup', 'Les notifications fonctionnent !')}>
              Tester
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}
