import { createContext, useContext, useEffect, useReducer, useState, useCallback } from 'react'
import { MATCHES, PLAYERS, USER_ID, matchPoints, botPrediction, botQuizResult } from './data'

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
      const { matchId } = action
      if (state.played.includes(matchId)) return state
      const match = MATCHES.find((m) => m.id === matchId)
      const scores = { ...state.scores }
      const history = [...state.history]

      // Points de l'utilisateur
      const userResult = matchPoints(state.predictions[matchId], match.actual)
      scores[USER_ID] += userResult.points
      history.push({ matchId, playerId: USER_ID, type: 'match', ...userResult })

      // Points des adversaires (prono + quiz automatiques)
      for (const p of PLAYERS) {
        if (p.id === USER_ID) continue
        const result = matchPoints(botPrediction(p.id, matchId), match.actual)
        scores[p.id] += result.points
        history.push({ matchId, playerId: p.id, type: 'match', ...result })
        const quiz = botQuizResult(p.id, matchId)
        scores[p.id] += quiz.points
        history.push({ matchId, playerId: p.id, type: 'quiz', points: quiz.points, label: `Quiz ${quiz.level} : ${quiz.correct}/3` })
      }

      return { ...state, played: [...state.played, matchId], scores, history, lastUserGain: userResult.points }
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

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const flyPoints = useCallback((amount) => {
    if (amount <= 0) return
    const id = Date.now() + Math.random()
    setBursts((b) => [...b, { id, amount }])
    setTimeout(() => setBursts((b) => b.filter((x) => x.id !== id)), 1600)
  }, [])

  return (
    <StoreContext.Provider value={{ state, dispatch, bursts, flyPoints }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  return useContext(StoreContext)
}
