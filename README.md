# QuizZap ⚡

Live multiplayer trivia — Next.js 14 + Turso + Vercel.

---

## 🚀 Deploy in 4 steps (no CLI needed — works from iPad)

### 1. Push to GitHub (browser)

1. Go to [github.com](https://github.com) → **New repository** → name it `quizzap` → Create
2. Click **"uploading an existing file"**
3. Unzip `quizzap.zip` and drag all files into the GitHub upload UI
4. Click **Commit changes**

### 2. Deploy on Vercel (browser)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import Git Repository** → select `quizzap`
3. Under **Environment Variables**, add:
   - `TURSO_DATABASE_URL` = `libsql://quizapp-pasadyaguy.aws-us-east-2.turso.io`
   - `TURSO_AUTH_TOKEN` = your token
4. Click **Deploy** ✅

> No database setup needed — the table is created automatically on first request.

---

## 🎮 How to play

**Host:**
1. Open the app → Host a Game
2. Add questions, options, and timers
3. Hit Launch Game — share the 5-letter room code
4. Hit Start Game when players are in
5. After each timer, review results + leaderboard, then advance

**Players (any device):**
1. Open the same URL → Join a Game
2. Enter room code + name
3. Tap your answer fast — faster = more points (up to 1000 per question)

---

## 🛠 Tech stack

- **Frontend**: Next.js 14 App Router, React
- **Database**: Turso (LibSQL / SQLite edge)
- **Hosting**: Vercel

---

## 📁 Project structure

```
quizzap/
├── app/
│   ├── api/game/route.ts   ← GET/POST game state API
│   ├── game.tsx            ← Main game client component
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   └── db.ts               ← Turso client + auto-init schema
├── .env.example
├── vercel.json
└── package.json
```
