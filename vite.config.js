import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  preview: {
    // En production (Railway), l'app est servie via `vite preview`
    // derrière le domaine *.up.railway.app : on accepte tous les hôtes.
    allowedHosts: true,
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      // Seules origines autorisées : Supabase (REST + WebSocket temps réel),
      // openfootball (calendrier/scores) et ESPN (scores quasi direct).
      // 'unsafe-inline' (styles) : requis par framer-motion/GSAP ;
      // blob: (workers) : requis par canvas-confetti.
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self' https://mxokzkazeffhwfyubcgy.supabase.co wss://mxokzkazeffhwfyubcgy.supabase.co https://raw.githubusercontent.com https://site.api.espn.com",
        "worker-src 'self' blob:",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; '),
    },
  },
})
