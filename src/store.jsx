import { createContext, useContext, useEffect, useReducer, useState, useCallback } from 'react'
import { MATCHES, PLAYERS, USER_ID, matchPoints, botPrediction, botQuizResult } from './data'
import { isOnline } from './lib/supabase.js'
import { ensurePlayer, fetchBoard, subscribeBoard } from './lib/onlineSync.js'
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

      // Adversaires simulés (uniquement en mode local : en ligne,
      // les vrais joueurs arrivent via Supabase)
      if (!isOnline) {
        for (const p of PLAYERS) {
          if (p.id === USER_ID) continue
          const result = matchPoints(botPrediction(p.id, matchId), actual)
          scores[p.id] += result.points
          history.push({ matchId, playerId: p.id, type: 'match', ...result })
          const quiz = botQuizResult(p.id, matchId)
          scores[p.id] += quiz.points
          history.push({ matchId, playerId: p.id, type: 'quiz', points: quiz.points, label: `Quiz ${quiz.level} : ${quiz.correct}/3` })
        }
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
    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  // Vrais matchs de Coupe du Monde via football-data.org
  useEffect(() => {
    if (!hasLiveData) return
    fetchWorldCupMatches()
      .then((ms) => {
        if (ms?.length) setMatches(ms)
        else setLiveError('Aucun match retourné par football-data.org')
      })
      .catch((e) => setLiveError(e.message))
  }, [])

  const refreshBoard = useCallback(async () => {
    if (!isOnline) return
    try {
      setRemote(await fetchBoard())
    } catch (e) {
      console.error('Supabase :', e)
    }
  }, [])

  const flyPoints = useCallback((amount) => {
    if (amount <= 0) return
    const id = Date.now() + Math.random()
    setBursts((b) => [...b, { id, amount }])
    setTimeout(() => setBursts((b) => b.filter((x) => x.id !== id)), 1600)
  }, [])

  return (
    <StoreContext.Provider value={{ state, dispatch, bursts, flyPoints, matches, remote, refreshBoard, liveError }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  return useContext(StoreContext)
}

// Joueurs + scores du classement : vrais joueurs (Supabase) ou démo locale
export function usePlayers() {
  const { state, remote } = useStore()
  if (isOnline && remote) return remote
  return { players: PLAYERS, scores: state.scores }
}
