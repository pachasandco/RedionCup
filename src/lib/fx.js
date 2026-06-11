import gsap from 'gsap'

// Effets "cinématiques" GSAP, en complément des animations Framer Motion.

// Flash de stade : éclair doré plein écran (score exact, quiz parfait)
export function stadiumFlash() {
  const el = document.createElement('div')
  el.style.cssText =
    'position:fixed;inset:0;pointer-events:none;z-index:200;' +
    'background:radial-gradient(circle at 50% 40%, rgba(255,215,0,0.55), transparent 65%);opacity:0'
  document.body.appendChild(el)
  gsap
    .timeline({ onComplete: () => el.remove() })
    .to(el, { opacity: 1, duration: 0.12, ease: 'power2.out' })
    .to(el, { opacity: 0, duration: 0.7, ease: 'power2.in' })
}

// Coup de poing sur un élément (révélation de score)
export function punch(el) {
  if (!el) return
  gsap
    .timeline()
    .fromTo(el, { scale: 1 }, { scale: 1.06, duration: 0.12, ease: 'power2.out' })
    .to(el, { scale: 1, duration: 0.35, ease: 'elastic.out(1, 0.4)' })
}

// Secousse de stade (pronostic raté)
export function shake(el) {
  if (!el) return
  gsap.fromTo(
    el,
    { x: 0 },
    { x: 6, duration: 0.06, repeat: 5, yoyo: true, ease: 'power1.inOut', clearProps: 'x' }
  )
}
