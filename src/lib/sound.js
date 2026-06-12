// Sons synthétisés via Web Audio API : aucun fichier audio à charger.
// Le contexte est créé paresseusement (les navigateurs exigent un geste
// utilisateur avant de jouer du son ; tous nos sons suivent un clic).

let ctx = null

function getCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function tone({ freq, at = 0, dur = 0.2, type = 'triangle', gain = 0.16, slideTo }) {
  const c = getCtx()
  if (!c) return
  const t = c.currentTime + at
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(gain, t + 0.02)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(g)
  g.connect(c.destination)
  osc.start(t)
  osc.stop(t + dur + 0.05)
}

// 🎯 Bon pronostic : double note montante (do → sol)
export function playPronoWin() {
  tone({ freq: 523.25, dur: 0.16 })
  tone({ freq: 783.99, at: 0.13, dur: 0.32, gain: 0.2 })
}

// 🧠 Bonne réponse au quiz : « pièce » brève et brillante
export function playQuizCorrect() {
  tone({ freq: 987.77, dur: 0.09, type: 'square', gain: 0.08 })
  tone({ freq: 1318.51, at: 0.08, dur: 0.22, type: 'square', gain: 0.08 })
}

// 💰 Accumulation de points : série de tics qui grimpent en fréquence,
// synchronisée avec le compteur animé (façon machine à sous)
export function playScoreTally(durationMs = 900) {
  const ticks = Math.min(14, Math.max(6, Math.round(durationMs / 70)))
  for (let i = 0; i < ticks; i++) {
    const p = i / (ticks - 1)
    tone({
      freq: 700 + p * 500,
      at: p * (durationMs / 1000) * 0.85,
      dur: 0.045,
      type: 'square',
      gain: 0.05,
    })
  }
}

// 🥉 Montée sur le podium : petite fanfare (do mi sol do)
export function playPodium() {
  const notes = [523.25, 659.25, 783.99, 1046.5]
  notes.forEach((f, i) =>
    tone({ freq: f, at: i * 0.12, dur: i === notes.length - 1 ? 0.5 : 0.14, gain: 0.18 })
  )
}

// 🏆 Victoire finale : grande fanfare « charge ! » sur deux octaves
export function playVictory() {
  const seq = [
    [392.0, 0, 0.12],
    [523.25, 0.12, 0.12],
    [659.25, 0.24, 0.12],
    [783.99, 0.36, 0.4],
    [659.25, 0.78, 0.14],
    [783.99, 0.92, 1.0],
  ]
  for (const [f, at, dur] of seq) {
    tone({ freq: f, at, dur, type: 'triangle', gain: 0.2 })
    tone({ freq: f / 2, at, dur, type: 'square', gain: 0.06 })
  }
}
