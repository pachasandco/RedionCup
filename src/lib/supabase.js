import { createClient } from '@supabase/supabase-js'

// Mode multijoueur réel : activé dès que les variables d'environnement sont
// renseignées dans un fichier .env (voir .env.example et supabase/migrations/).
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = url && anonKey ? createClient(url, anonKey) : null
export const isOnline = Boolean(supabase)
