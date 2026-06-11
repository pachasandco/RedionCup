// ---------- Joueurs ----------
export const USER_ID = 'moi'

export const PLAYERS = [
  { id: USER_ID, name: 'Moi', avatar: '🦁', isUser: true },
  { id: 'sofia', name: 'Sofia', avatar: '🦊' },
  { id: 'karim', name: 'Karim', avatar: '🐺' },
  { id: 'lea', name: 'Léa', avatar: '🐯' },
  { id: 'marco', name: 'Marco', avatar: '🦅' },
  { id: 'awa', name: 'Awa', avatar: '🐝' },
]

// ---------- Matchs (phase de groupes, CdM 2026) ----------
// "actual" est le score réel révélé lors de la simulation du match.
export const MATCHES = [
  { id: 'm1', group: 'A', date: '11 juin · Mexico',       stadium: 'Estadio Azteca',     home: { name: 'Mexique', flag: '🇲🇽' },        away: { name: 'Afrique du Sud', flag: '🇿🇦' }, actual: { h: 2, a: 1 } },
  { id: 'm2', group: 'B', date: '12 juin · Los Angeles',  stadium: 'SoFi Stadium',       home: { name: 'États-Unis', flag: '🇺🇸' },     away: { name: 'Japon', flag: '🇯🇵' },          actual: { h: 1, a: 1 } },
  { id: 'm3', group: 'C', date: '13 juin · Toronto',      stadium: 'BMO Field',          home: { name: 'Canada', flag: '🇨🇦' },         away: { name: 'Maroc', flag: '🇲🇦' },          actual: { h: 0, a: 2 } },
  { id: 'm4', group: 'D', date: '14 juin · Dallas',       stadium: 'AT&T Stadium',       home: { name: 'Argentine', flag: '🇦🇷' },      away: { name: 'Norvège', flag: '🇳🇴' },        actual: { h: 3, a: 1 } },
  { id: 'm5', group: 'E', date: '15 juin · New York',     stadium: 'MetLife Stadium',    home: { name: 'France', flag: '🇫🇷' },         away: { name: 'Ouzbékistan', flag: '🇺🇿' },    actual: { h: 2, a: 0 } },
  { id: 'm6', group: 'F', date: '16 juin · Miami',        stadium: 'Hard Rock Stadium',  home: { name: 'Brésil', flag: '🇧🇷' },         away: { name: 'Écosse', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },     actual: { h: 2, a: 2 } },
  { id: 'm7', group: 'G', date: '17 juin · Houston',      stadium: 'NRG Stadium',        home: { name: 'Angleterre', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' }, away: { name: 'Équateur', flag: '🇪🇨' },       actual: { h: 1, a: 0 } },
  { id: 'm8', group: 'H', date: '18 juin · Vancouver',    stadium: 'BC Place',           home: { name: 'Allemagne', flag: '🇩🇪' },      away: { name: 'Corée du Sud', flag: '🇰🇷' },   actual: { h: 1, a: 2 } },
]

// ---------- Barème ----------
export const MATCH_POINTS = { exact: 10, diff: 7, outcome: 5 }
export const QUIZ_LEVELS = {
  facile: { label: 'Facile', emoji: '🟢', perQuestion: 2 },
  moyen: { label: 'Moyen', emoji: '🟠', perQuestion: 4 },
  expert: { label: 'Expert', emoji: '🔴', perQuestion: 8 },
}

export function matchPoints(pred, actual) {
  if (!pred) return { points: 0, label: 'Pas de pronostic' }
  if (pred.h === actual.h && pred.a === actual.a)
    return { points: MATCH_POINTS.exact, label: 'Score exact !' }
  const predSign = Math.sign(pred.h - pred.a)
  const actualSign = Math.sign(actual.h - actual.a)
  if (predSign === actualSign && pred.h - pred.a === actual.h - actual.a)
    return { points: MATCH_POINTS.diff, label: 'Bonne différence de buts' }
  if (predSign === actualSign)
    return { points: MATCH_POINTS.outcome, label: 'Bon résultat' }
  return { points: 0, label: 'Pronostic raté' }
}

// ---------- Aléatoire déterministe (pour les adversaires simulés) ----------
function seededRandom(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
}

export function botPrediction(botId, matchId) {
  const rnd = seededRandom(botId + matchId)
  return { h: Math.floor(rnd() * 4), a: Math.floor(rnd() * 4) }
}

export function botQuizResult(botId, matchId) {
  const rnd = seededRandom('quiz' + botId + matchId)
  const levels = Object.keys(QUIZ_LEVELS)
  const level = levels[Math.floor(rnd() * levels.length)]
  // Plus le niveau est dur, moins le bot a de chances de bien répondre
  const successRate = { facile: 0.8, moyen: 0.55, expert: 0.35 }[level]
  let correct = 0
  for (let i = 0; i < 3; i++) if (rnd() < successRate) correct++
  return { level, correct, points: correct * QUIZ_LEVELS[level].perQuestion }
}

// ---------- Banque de questions ----------
const BANK = {
  facile: [
    { q: "Combien d'équipes participent à la Coupe du Monde 2026 ?", choices: ['32', '40', '48', '64'], answer: 2 },
    { q: 'Dans combien de pays se joue la Coupe du Monde 2026 ?', choices: ['1', '2', '3', '4'], answer: 2 },
    { q: 'Quel pays a remporté la Coupe du Monde 2022 ?', choices: ['France', 'Argentine', 'Brésil', 'Croatie'], answer: 1 },
    { q: "Combien de joueurs d'une équipe sont sur le terrain ?", choices: ['9', '10', '11', '12'], answer: 2 },
    { q: "Quelle est la durée réglementaire d'un match ?", choices: ['80 min', '90 min', '100 min', '120 min'], answer: 1 },
    { q: 'Combien de fois le Brésil a-t-il gagné la Coupe du Monde ?', choices: ['3', '4', '5', '6'], answer: 2 },
    { q: 'Quelle couleur de carton signifie une expulsion ?', choices: ['Jaune', 'Rouge', 'Bleu', 'Noir'], answer: 1 },
    { q: 'Qui a remporté la Coupe du Monde 2018 ?', choices: ['Allemagne', 'Croatie', 'France', 'Belgique'], answer: 2 },
    { q: 'Quels pays organisent la Coupe du Monde 2026 ?', choices: ['USA, Canada, Mexique', 'USA, Brésil, Mexique', 'Canada, Mexique, Cuba', 'USA seulement'], answer: 0 },
  ],
  moyen: [
    { q: 'Qui a marqué le but vainqueur de la finale 2014 ?', choices: ['Thomas Müller', 'Mario Götze', 'Mesut Özil', 'André Schürrle'], answer: 1 },
    { q: 'Combien de stades accueillent la Coupe du Monde 2026 ?', choices: ['12', '14', '16', '20'], answer: 2 },
    { q: "Qui est le meilleur buteur de l'histoire de la Coupe du Monde ?", choices: ['Ronaldo', 'Pelé', 'Miroslav Klose', 'Gerd Müller'], answer: 2 },
    { q: 'Quel pays a organisé la première Coupe du Monde en 1930 ?', choices: ['Brésil', 'Italie', 'Uruguay', 'France'], answer: 2 },
    { q: 'Combien de buts Mbappé a-t-il marqués en finale 2022 ?', choices: ['1', '2', '3', '4'], answer: 2 },
    { q: 'Quel pays a perdu 3 finales sans jamais gagner ?', choices: ['Hongrie', 'Pays-Bas', 'Tchécoslovaquie', 'Suède'], answer: 1 },
    { q: 'Où se joue la finale de la Coupe du Monde 2026 ?', choices: ['Los Angeles', 'Mexico', 'New York / New Jersey', 'Dallas'], answer: 2 },
    { q: 'Combien de groupes compte la phase de groupes 2026 ?', choices: ['8', '10', '12', '16'], answer: 2 },
    { q: 'Qui a été meilleur buteur de la Coupe du Monde 2022 ?', choices: ['Messi', 'Giroud', 'Mbappé', 'Álvarez'], answer: 2 },
  ],
  expert: [
    { q: 'Quel fut le score de la finale 1958 ?', choices: ['Brésil 5-2 Suède', 'Brésil 3-1 Suède', 'Brésil 4-2 Suède', 'Brésil 2-0 Suède'], answer: 0 },
    { q: "Qui a marqué le but le plus rapide de l'histoire de la CdM (11 s) ?", choices: ['Bryan Robson', 'Hakan Şükür', 'Clint Dempsey', 'Václav Mašek'], answer: 1 },
    { q: 'Quel est le seul joueur à avoir gagné 3 Coupes du Monde ?', choices: ['Cafu', 'Maradona', 'Pelé', 'Beckenbauer'], answer: 2 },
    { q: 'Quelle est la plus large victoire en Coupe du Monde ?', choices: ['Hongrie 10-1 Salvador', 'Allemagne 8-0 Arabie S.', 'Hongrie 9-0 Corée', 'Yougoslavie 9-0 Zaïre'], answer: 0 },
    { q: 'Qui a gagné le tout premier match de la CdM 1930 ?', choices: ['Uruguay', 'Argentine', 'France', 'USA'], answer: 2 },
    { q: 'Quel joueur a marqué dans 5 Coupes du Monde différentes ?', choices: ['Messi', 'Cristiano Ronaldo', 'Klose', 'Pelé'], answer: 1 },
    { q: 'En quelle année les cartons ont-ils été introduits en CdM ?', choices: ['1962', '1966', '1970', '1974'], answer: 2 },
    { q: 'Combien de spectateurs (record) pour Brésil-Uruguay 1950 ?', choices: ['~150 000', '~174 000', '~199 000', '~210 000'], answer: 2 },
    { q: 'Quel gardien a remporté le Ballon d\'Or de la CdM 2002 ?', choices: ['Gianluigi Buffon', 'Oliver Kahn', 'Marcos', 'Rüştü Reçber'], answer: 1 },
  ],
}

export function getQuizQuestions(matchIndex, level) {
  const pool = BANK[level]
  const out = []
  for (let i = 0; i < 3; i++) out.push(pool[(matchIndex * 3 + i) % pool.length])
  return out
}
