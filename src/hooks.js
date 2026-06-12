import { useEffect, useRef, useState } from 'react'
import { playScoreTally } from './lib/sound.js'

// Compteur animé : fait défiler la valeur affichée vers la nouvelle valeur.
// withSound : tics sonores pendant l'accumulation (réservé au score du joueur,
// sinon chaque ligne du classement déclencherait sa propre salve).
export function useCountUp(value, duration = 900, withSound = false) {
  const [display, setDisplay] = useState(value)
  const prev = useRef(value)

  useEffect(() => {
    const from = prev.current
    const to = value
    prev.current = value
    if (from === to) return
    if (withSound && to > from) playScoreTally(duration)
    const start = performance.now()
    let raf
    const tick = (t) => {
      const p = Math.min(1, (t - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(Math.round(from + (to - from) * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])

  return display
}
