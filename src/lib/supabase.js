import { createClient } from '@supabase/supabase-js'

// Mode multijoueur réel via le projet Supabase du dépôt.
// La clé anon est publique par conception (elle est embarquée dans le bundle
// navigateur) ; la sécurité repose sur les politiques RLS de la base.
// Un fichier .env peut surcharger ces valeurs (voir .env.example).
const url = import.meta.env.VITE_SUPABASE_URL || 'https://mxokzkazeffhwfyubcgy.supabase.co'
const anonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14b2t6a2F6ZWZmaHdmeXViY2d5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyMTA1MjMsImV4cCI6MjA5Njc4NjUyM30.jBDqucsdVpX-70UNeDrCjGRc_22XLANW3zFHFzmEtvM'

export const supabase = url && anonKey ? createClient(url, anonKey) : null
export const isOnline = Boolean(supabase)
