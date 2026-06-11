# ⚽ RedionCup — Pronostics Coupe du Monde 2026

Application de pronostics entre amis pour la Coupe du Monde 2026 (🇺🇸 🇨🇦 🇲🇽), avec un front entièrement animé.

## 🚀 Lancer l'application

```bash
npm install
npm run dev
```

Puis ouvrir http://localhost:5173

## 🎮 Fonctionnalités

### Pronostics
- Pronostique le score exact de chaque match de la phase de groupes.
- Lance le **coup d'envoi** pour révéler le score réel et déclencher le calcul des points.
- **Barème** : score exact **+10 pts** · bonne différence de buts **+7 pts** · bon résultat (1/N/2) **+5 pts**.

### 🧠 Quiz d'après-match
Après chaque match joué, un quiz de **3 questions** permet de se rattraper… ou de creuser l'écart :
- **3 niveaux au choix** : 🟢 Facile (+2 pts/bonne réponse) · 🟠 Moyen (+4 pts) · 🔴 Expert (+8 pts).
- Le niveau se choisit **au début du quiz et est définitif** — impossible d'en changer ensuite.
- Plus le niveau est difficile, plus ça rapporte.

### ✨ Animations
- **Points volants** "+X pts" qui s'envolent vers ton compteur de score.
- **Compteur de score animé** (count-up) dans le header.
- **Classement en direct** : les lignes se réorganisent avec une animation fluide à chaque gain de points.
- **Podium animé** : les marches montent une à une, médailles en ressort, pluie de confettis.
- **Confettis** pour les scores exacts et les quiz parfaits (3/3).
- Révélation du score finale en ressort, feedback vert/rouge animé sur les réponses du quiz.

### Autres
- 5 adversaires simulés (Sofia, Karim, Léa, Marco, Awa) qui pronostiquent et jouent les quiz (mode démo).
- Progression sauvegardée dans le navigateur (localStorage) + bouton de réinitialisation.

## 🔌 Connecteurs (onglet ⚙️ Connexions)

L'app fonctionne **sans configuration** en mode démo. Chaque service s'active en
copiant `.env.example` vers `.env` et en renseignant sa clé :

### 👥 Multijoueur réel — Supabase
Classement temps réel partagé entre tous les parieurs (les adversaires simulés sont
alors remplacés par les vrais joueurs) :
1. Créer un projet gratuit sur [supabase.com](https://supabase.com)
2. Appliquer le schéma : automatique si l'**intégration GitHub de Supabase** est
   connectée au dépôt (elle exécute `supabase/migrations/` à chaque push sur la
   branche de production) ; sinon, copier le contenu de
   `supabase/migrations/20260611000000_init.sql` dans l'éditeur SQL du dashboard
3. Renseigner `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` dans `.env`
   (valeurs dans Settings → API du projet Supabase)

Chaque joueur reçoit un pseudo modifiable dans l'onglet Connexions ; les points
(pronos + quiz) sont poussés dans la table `events` et le classement se
synchronise en direct via Supabase Realtime.

### 📡 Vrais matchs & scores — football-data.org
Remplace les matchs de démo par le vrai calendrier de la Coupe du Monde
(compétition `WC`, API v4) :
1. Clé gratuite sur [football-data.org](https://www.football-data.org/client/register)
2. Renseigner `VITE_FOOTBALL_DATA_TOKEN` dans `.env`

En dev, les requêtes passent par le proxy Vite (`/football-api`) pour contourner
CORS ; en production, prévoir un petit proxy équivalent.
Les matchs non terminés affichent « en attente du résultat officiel » ; dès que
l'API renvoie `FINISHED`, le bouton « Valider le résultat officiel » déclenche
le calcul des points.

### 🔔 Notifications navigateur
Activables dans l'onglet Connexions : notification à chaque gain de points
(match ou quiz), avec bouton de test.

## 🛠️ Stack technique

| Outil | Rôle |
|---|---|
| [React](https://react.dev) + [Vite](https://vitejs.dev) | Framework et build ultra-rapide |
| [Framer Motion](https://www.framer.com/motion/) | Animations (layout, springs, transitions) |
| [GSAP](https://gsap.com) | Effets cinématiques : flash de stade, punch/secousse des cartes |
| [Lottie](https://github.com/Gamote/lottie-react) (`lottie-react`) | Trophée animé (podium, quiz parfait) |
| [canvas-confetti](https://github.com/catdad/canvas-confetti) | Pluies de confettis |
| [@supabase/supabase-js](https://supabase.com/docs/reference/javascript) | Multijoueur temps réel |
| CSS custom (glassmorphism) | Thème sombre / or / vert pelouse |
