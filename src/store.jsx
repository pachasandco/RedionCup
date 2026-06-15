import { createContext, useContext, useEffect, useReducer, useState, useCallback } from 'react'
import { MATCHES, PLAYERS, USER_ID, matchPoints, botPrediction, botQuizResult } from './data'
import { isOnline } from './lib/supabase.js'
import { ensurePlayer, getLocalPlayer, fetchBoard, subscribeBoard, fetchMyPredictions, fetchMyQuizDone, pushEvent } from './lib/onlineSync.js'
import { hasLiveData, fetchWorldCupMatches } from './lib/footballData.js'

const STORAGE_KEY = 'redioncup-v1'

const initialState = {
  predictions: {}, // { matchId: { h, a } } — pronostics de l'utilisateur
  played: [], // ids des matchs joués
  quizDone: {}, // { matchId: { level, correct, points } } — quiz de l'utilisateur
  scores: Object.fromEntries(PLAYERS.map((p) => [p.id, 0])),
  history: [], // { matchId, playerId, type: 'match'|'quiz', points, label }
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_PREDICTION': {
      const { matchId, h, a } = action
      if (state.played.includes(matchId)) return state
      return { ...state, predictions: { ...state.predictions, [matchId]: { h, a } } }
    }
    case 'PLAY_MATCH': {
      const { matchId, actual } = action
      if (state.played.includes(matchId) || !actual) return state
      const scores = { ...state.scores }
      const history = [...state.history]

      // Points de l'utilisateur
      const userResult = matchPoints(state.predictions[matchId], actual)
      scores[USER_ID] += userResult.points
      history.push({ matchId, playerId: USER_ID, type: 'match', ...userResult })

      // Adversaires simulés : toujours calculés localement. En ligne, le
      // classement affiché vient de Supabase et les ignore ; ils servent de
      // repli automatique si la base est injoignable.
      for (const p of PLAYERS) {
        if (p.id === USER_ID) continue
        const result = matchPoints(botPrediction(p.id, matchId), actual)
        scores[p.id] += result.points
        history.push({ matchId, playerId: p.id, type: 'match', ...result })
        const quiz = botQuizResult(p.id, matchId)
        scores[p.id] += quiz.points
        history.push({ matchId, playerId: p.id, type: 'quiz', points: quiz.points, label: `Quiz ${quiz.level} : ${quiz.correct}/3` })
      }

      return { ...state, played: [...state.played, matchId], scores, history }
    }
    case 'QUIZ_DONE': {
      const { matchId, level, correct, points } = action
      if (state.quizDone[matchId]) return state
      const scores = { ...state.scores, [USER_ID]: state.scores[USER_ID] + points }
      const history = [
        ...state.history,
        { matchId, playerId: USER_ID, type: 'quiz', points, label: `Quiz ${level} : ${correct}/3` },
      ]
      return { ...state, quizDone: { ...state.quizDone, [matchId]: { level, correct, points } }, scores, history }
    }
    case 'LOAD_QUIZ_DONE': {
      // Marque comme faits les quiz déjà joués sur un autre appareil
      const quizDone = { ...state.quizDone }
      for (const matchId of action.matchIds) {
        if (!quizDone[matchId]) quizDone[matchId] = { remote: true }
      }
      return { ...state, quizDone }
    }
    case 'LOAD_PREDICTIONS': {
      // Pronos venus de la base (autres appareils du joueur). Ils priment
      // sur le local, sauf pour les matchs déjà joués ici : leur prono est
      // figé, les points sont déjà calculés.
      const predictions = { ...state.predictions }
      for (const [matchId, p] of Object.entries(action.predictions)) {
        if (!state.played.includes(matchId)) predictions[matchId] = p
      }
      return { ...state, predictions }
    }
    case 'RESET':
      return { ...initialState, scores: { ...initialState.scores } }
    default:
      return state
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...initialState, ...JSON.parse(raw) }
  } catch { /* état corrompu : on repart de zéro */ }
  return initialState
}

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)
  const [bursts, setBursts] = useState([]) // points volants "+X pts"
  const [remote, setRemote] = useState(null) // classement multijoueur (Supabase)
  const [player, setPlayer] = useState(getLocalPlayer) // identité du joueur (null = onboarding)
  const [matches, setMatches] = useState(MATCHES)
  const [liveError, setLiveError] = useState(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  // Multijoueur réel : enregistrement du joueur + classement temps réel
  useEffect(() => {
    if (!isOnline) return
    let active = true
    let unsubscribe = () => {}
    const refresh = async () => {
      try {
        const board = await fetchBoard()
        if (active) setRemote(board)
      } catch (e) {
        console.error('Supabase :', e)
      }
    }
    ;(async () => {
      try {
        await ensurePlayer()
        await refresh()
        unsubscribe = subscribeBoard(refresh)
      } catch (e) {
        console.error('Supabase :', e)
      }
    })()

    // Filet de sécurité : on ne dépend pas uniquement du temps réel Supabase
    // (souvent inactif ou échouant en silence). On rafraîchit périodiquement
    // et au retour sur l'onglet, pour que les points marqués par les autres
    // joueurs apparaissent toujours, même sans temps réel.
    const interval = setInterval(refresh, 12000)
    const onFocus = () => refresh()
    const onVisible = () => { if (document.visibilityState === 'visible') refresh() }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      active = false
      unsubscribe()
      clearInterval(interval)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  // Récupère les pronos + quiz faits depuis n'importe quel appareil
  useEffect(() => {
    if (!isOnline || !player) return
    fetchMyPredictions()
      .then((preds) => dispatch({ type: 'LOAD_PREDICTIONS', predictions: preds }))
      .catch((e) => console.error('Supabase :', e))
    fetchMyQuizDone()
      .then((matchIds) => dispatch({ type: 'LOAD_QUIZ_DONE', matchIds }))
      .catch((e) => console.error('Supabase :', e))
  }, [player])

  // Vrais matchs de Coupe du Monde — et validation automatique des
  // matchs terminés : dès qu'un score est publié, les points sont
  // calculés et poussés en base sans que le joueur ait à cliquer.
  useEffect(() => {
    if (!hasLiveData) return
    fetchWorldCupMatches()
      .then((ms) => {
        if (!ms?.length) { setLiveError('Aucun match retourné'); return }
        setMatches(ms)
        // Validation auto : matchs avec un score officiel, pas encore joués
        // localement — on recalcule avec le prono local actuel.
        const toAutoPlay = ms.filter((m) => m.actual && !state.played.includes(m.id))
        if (toAutoPlay.length === 0) return
        // On utilise un snapshot des pronos locaux actuels (state est figé ici)
        const localPreds = JSON.parse(localStorage.getItem('redioncup-v1') || '{}').predictions ?? {}
        for (const m of toAutoPlay) {
          const pred = localPreds[m.id]
          const result = matchPoints(pred, m.actual)
          dispatch({ type: 'PLAY_MATCH', matchId: m.id, actual: m.actual })
          if (isOnline && player) {
            pushEvent({ matchId: m.id, type: 'match', points: result.points, label: result.label })
          }
        }
        if (isOnline) refreshBoard()
      })
      .catch((e) => setLiveError(e.message))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player]) // se relance quand l'identité du joueur est connue

  const refreshBoard = useCallback(async () => {
    if (!isOnline) return
    try {
      setRemote(await fetchBoard())
    } catch (e) {
      console.error('Supabase :', e)
    }
  }, [])

  // Rafraîchissement périodique toutes les 15 s + au retour sur l'onglet.
  // Le temps réel Supabase reste actif mais échoue parfois en silence :
  // ce polling garantit que le classement est toujours à jour.
  useEffect(() => {
    if (!isOnline) return
    const id = setInterval(refreshBoard, 15_000)
    const onVisible = () => { if (document.visibilityState === 'visible') refreshBoard() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [refreshBoard])

  // Adopte l'identité créée/récupérée par l'onboarding (inscription ou
  // connexion multi-appareils) et entre dans l'app.
  const adoptPlayer = useCallback((p) => {
    setPlayer(p)
    refreshBoard()
  }, [refreshBoard])

  const flyPoints = useCallback((amount) => {
    if (amount <= 0) return
    const id = Date.now() + Math.random()
    setBursts((b) => [...b, { id, amount }])
    setTimeout(() => setBursts((b) => b.filter((x) => x.id !== id)), 1600)
  }, [])

  return (
    <StoreContext.Provider value={{ state, dispatch, bursts, flyPoints, matches, remote, refreshBoard, liveError, player, adoptPlayer }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  return useContext(StoreContext)
}

// Joueurs + scores du classement : vrais joueurs (Supabase) ou démo locale
export function usePlayers() {
  const { state, remote, player } = useStore()
  if (isOnline && remote?.players?.length) return remote
  return {
    players: PLAYERS.map((p) =>
      p.isUser && player ? { ...p, name: player.name, avatar: player.avatar } : p
    ),
    scores: state.scores,
  }
}
