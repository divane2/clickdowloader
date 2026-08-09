# ClipDrop — Prototype local

Site de téléchargement de vidéos (YouTube, Facebook, Pinterest) via lien.

## Structure

```
project/
├── frontend/       → HTML/CSS/JS (à héberger sur Vercel plus tard)
│   ├── index.html
│   ├── style.css
│   └── script.js
└── backend/        → API Node.js + yt-dlp (à héberger sur Railway/Render plus tard)
    ├── server.js
    └── package.json
```

## 1. Installer les prérequis (une seule fois)

Il te faut trois choses sur ton ordinateur :

**Node.js** (si pas déjà fait) : https://nodejs.org (version LTS)

**Python + yt-dlp** — c'est l'outil qui fait le vrai travail d'extraction :
```bash
pip install -U yt-dlp
```
Vérifie que ça fonctionne :
```bash
yt-dlp --version
```

**ffmpeg** — nécessaire pour fusionner vidéo+audio et convertir en MP3 :
- Windows : télécharge sur https://www.gyan.dev/ffmpeg/builds/ et ajoute-le au PATH
- Mac : `brew install ffmpeg`
- Linux : `sudo apt install ffmpeg`

Vérifie :
```bash
ffmpeg -version
```

## 2. Lancer le backend

```bash
cd backend
npm install
npm start
```

Tu dois voir : `ClipDrop backend démarré sur http://localhost:3000`

## 3. Lancer le frontend

Le plus simple : ouvre `frontend/index.html` directement dans ton navigateur.

Ou, pour un rendu plus proche de la prod (recommandé), sers-le avec un petit serveur local :
```bash
cd frontend
npx serve .
```
Puis ouvre l'URL affichée (souvent http://localhost:3000 ou 5000 — si ça entre en conflit avec le backend, `npx serve` te proposera un autre port automatiquement).

## 4. Tester

1. Colle un lien YouTube, Facebook ou Pinterest dans le champ.
2. Le badge doit détecter automatiquement la plateforme.
3. Choisis MP4 ou MP3, puis la qualité.
4. Clique sur Télécharger — le fichier doit se télécharger dans ton dossier Téléchargements.

## Points d'attention avant d'aller plus loin

- **Facebook et Pinterest** sont plus fragiles que YouTube avec yt-dlp : certains liens (contenus privés, Reels, formats spécifiques) peuvent échouer. C'est normal à ce stade — on affinera une fois le prototype validé.
- **Temps de traitement** : les vidéos en 1080p peuvent prendre 10-30 secondes selon la longueur. On ajoutera une meilleure barre de progression plus tard si besoin.
- **Légal** : yt-dlp ne contourne aucune protection, il utilise les mêmes flux que le lecteur vidéo classique — mais le téléchargement de contenu protégé par des droits d'auteur reste encadré selon les plateformes et les pays. À garder en tête si le site devient public.

## Prochaine étape

Une fois que tu as testé en local et que ça te convient, on passe au déploiement :
- Frontend → Vercel
- Backend → Railway ou Render (je te guiderai)

Et on mettra à jour `API_BASE_URL` dans `script.js` avec la vraie URL du backend déployé.
