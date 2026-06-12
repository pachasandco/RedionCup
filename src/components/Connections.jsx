import { useState } from 'react'
import { motion } from 'framer-motion'
import { isOnline } from '../lib/supabase.js'
import { hasLiveData } from '../lib/footballData.js'
import { useStore } from '../store.jsx'
import { logoutDevice } from '../lib/onlineSync.js'
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
  const { player } = useStore()
  const [notifOn, setNotifOn] = useState(notificationsEnabled())

  const toggleNotif = async () => {
    if (notifOn) {
      disableNotifications()
      setNotifOn(false)
    } else {
      setNotifOn(await enableNotifications())
    }
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
          Classement temps réel partagé entre tous les parieurs. Le schéma SQL
          (<code>supabase/migrations/</code>) est appliqué automatiquement par
          l’intégration GitHub de Supabase. Renseigner ensuite{' '}
          <code>VITE_SUPABASE_URL</code> et <code>VITE_SUPABASE_ANON_KEY</code>.
        </p>
        {player && (
          <>
            <p className="conn-identity">
              Inscrit·e en tant que <strong>{player.avatar} {player.name}</strong> 🔒
              — le prénom est définitif et ne peut pas être modifié.
              {player.pin && (
                <>
                  <br />🔑 Code de connexion : <strong className="conn-pin">{player.pin}</strong>
                  {' '}— utilise-le avec ton prénom pour te connecter sur un autre appareil.
                </>
              )}
            </p>
            <div className="conn-row">
              <button
                className="btn btn-ghost"
                onClick={() => {
                  if (window.confirm('Se déconnecter de cet appareil ? Tu pourras retrouver ton compte avec ton prénom + ton code de connexion.')) {
                    logoutDevice()
                  }
                }}
              >
                🚪 Se déconnecter de cet appareil
              </button>
            </div>
          </>
        )}
      </motion.div>

      <motion.div className="conn-card" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <div className="conn-head">
          <span className="conn-title">📡 Vrais matchs & scores — openfootball (GitHub)</span>
          <StatusPill on={hasLiveData} onLabel="Connecté" />
        </div>
        <p className="conn-desc">
          Calendrier officiel et scores de la Coupe du Monde 2026 depuis le jeu de
          données public <code>openfootball/worldcup.json</code> (mis à jour chaque
          jour, sans clé API). Pour revenir aux matchs de démo :{' '}
          <code>VITE_LIVE_SCORES=off</code>.
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
