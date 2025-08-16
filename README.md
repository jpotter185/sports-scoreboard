# ⚽🏈⚾ Sports Scoreboard (SvelteKit)

Live scoreboard for NFL, MLS, EPL, and MLB using ESPN’s public scoreboard endpoints. Responsive, auto-refreshing, and fast to deploy.

## ✨ Features

- **Leagues**: NFL (🏈), MLS/EPL (⚽), MLB (⚾)
- **Real-time-ish**: Auto-refresh every 30s with in-place updates (no layout jump)
- **Clickable games**: Each card links to the ESPN game page
- **Status-aware UI**: Scheduled, Live, Final styling; soccer halves vs. football quarters; MLB Top/Bottom inning
- **Logos & colors**: Pulled dynamically from ESPN; neutral fallback if missing
- **Cleaner cards**: Away @ Home format, scores hidden when scheduled, unified date/time at bottom
- **Winner/loser states**: Winner highlighted; loser/tie grayed
- **League UX**: Collapsible sections with persistence; drag-and-drop reorder with a grab handle (order persists)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+

### Install & Run
```bash
git clone <your-repo-url>
cd sports-scoreboard
npm install
npm run dev
# open http://localhost:5173
```

## 🔌 Data Sources

Uses ESPN’s public scoreboard endpoints (no API key):
- NFL: `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard`
- MLS: `https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/scoreboard`
- EPL: `https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard`
- MLB: `https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard`

Parsing happens in `src/lib/api.ts`, then it’s aggregated in `src/lib/data.ts`.

## 🏗️ Project Structure

```
src/
├── lib/
│   ├── components/
│   │   ├── GameCard.svelte         # Game tile
│   │   └── LeagueSection.svelte    # Collapsible league section
│   ├── api.ts                      # ESPN fetch + conversion
│   ├── data.ts                     # Aggregate leagues & build page model
│   ├── types.ts                    # Shared types
│   └── index.ts
├── routes/
│   ├── +layout.svelte
│   └── +page.svelte                # Main page, refresh-in-place, drag reorder
└── app.css                         # Global styles
```

## 🧭 Usage Tips

- Collapse a league via its header; state persists per league.
- Drag with the handle (dotted grip) to reorder leagues; persisted in localStorage.
- Click a game card to view it on ESPN.

## ☁️ Deploy (Vercel)

1) Push this repo to GitHub
2) In Vercel → New Project → Import GitHub repo
3) Framework: SvelteKit (auto), Build: default (npm run build)
4) Deploy

No env vars required. ESPN calls are HTTPS and public.

CLI alternative (no GitHub):
```bash
npm i -g vercel
vercel
vercel --prod
```

## 🛡️ Security & Notes

- No secrets are used; no user data is collected
- Calls are client-side; if CORS ever blocks, add a small read-only proxy
- ESPN rate limits may apply; optional backoff can be added later

## 🛠️ Tech Stack

- SvelteKit 5, TypeScript, Vite
- CSS in components (no dependency on Tailwind for cards)

## 📄 License

MIT

---

Built with ❤️ using SvelteKit
