import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  preview: {
    // En production (Railway), l'app est servie via `vite preview`
    // derrière le domaine *.up.railway.app : on accepte tous les hôtes.
    allowedHosts: true,
  },
})
