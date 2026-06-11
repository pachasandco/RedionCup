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
- 5 adversaires simulés (Sofia, Karim, Léa, Marco, Awa) qui pronostiquent et jouent les quiz.
- Progression sauvegardée dans le navigateur (localStorage) + bouton de réinitialisation.

## 🛠️ Stack technique

| Outil | Rôle |
|---|---|
| [React](https://react.dev) + [Vite](https://vitejs.dev) | Framework et build ultra-rapide |
| [Framer Motion](https://www.framer.com/motion/) | Toutes les animations (layout, springs, transitions) |
| [canvas-confetti](https://github.com/catdad/canvas-confetti) | Pluies de confettis |
| CSS custom (glassmorphism) | Thème sombre / or / vert pelouse |

## 🔌 Évolutions possibles

- **Multijoueur réel** : Supabase ou Firebase (auth + base temps réel) pour remplacer les adversaires simulés.
- **Vrais matchs et scores en direct** : connecteur vers [football-data.org](https://www.football-data.org/) ou [API-Football](https://www.api-football.com/).
- **Animations avancées** : Lottie (`lottie-react`) pour des trophées/coupes animés, GSAP pour des séquences complexes.
- **Notifications** : rappel avant chaque coup d'envoi.
