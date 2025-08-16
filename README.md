# Sports Scoreboard

A clean, fast scoreboard you can open on any device to see what matters now: live professional sports scores and game status for the NFL, MLS, MLB, and EPL.

### What it does
- Shows today’s games by league, with clear, compact tiles that are easy to read on phone or desktop
- Highlights what’s live right now and refreshes automatically every 30 seconds
- Lets you collapse leagues, jump directly to a league, and reorder leagues to match your preferences
- Uses team branding (logos and colors) for quick visual recognition
- Links each game tile to its official ESPN game page for deeper details

### Who it’s for
- Fans who want a single place to check live scores across multiple leagues
- People who follow multiple sports and want quick navigation and personalization
- Anyone who wants a fast, mobile-friendly scoreboard they can share or deploy quickly

### Why teams love it
- Clear status at a glance: Scheduled, Live, Final
- League-level rollups where it matters (e.g., live counts, final counts); no clutter at the top
- Consistent, readable formatting for dates and live periods (quarters, halves, innings with outs)
- Mobile-first refinements: smaller tiles, single-column grid, tap targets for reordering

---

## Key Capabilities

- Live scores and status
  - NFL (🏈), MLS/EPL (⚽), MLB (⚾)
  - Auto-refresh every 30 seconds
  - Live context per sport: quarters (NFL), halves (soccer), “Top/Bottom” inning with outs (MLB)

- Personalized viewing
  - Collapse/expand leagues; preferences persisted automatically
  - Drag-and-drop to reorder leagues on desktop; one-tap Up/Down controls for mobile
  - “Jump to league” chips that expand the target league, collapse the rest, and scroll to the top
  - “Live only” filter to hide leagues without live games and show only in-progress games

- Clear, compact game tiles
  - Team logos and colors for fast visual scanning
  - Winner/loser styling once games go final; ties shown in a neutral style
  - Scores hidden for scheduled games; date/time shown in one consistent line
  - Entire tile is a link to the ESPN game page (opens in a new tab)

---

## Reliability & Data

- Data source: public ESPN scoreboard endpoints
- No accounts, no API keys, and no personal data collection
- HTTPS by default; designed to be safe to share publicly

---

## Access & Deployment

- One‑click deploy to Vercel (recommended)
  - Connect your repository and deploy; no configuration or secrets required
  - The app auto-refreshes on a schedule client-side

- Shareable by link
  - Send the deployed URL to friends, teammates, or put it on a tablet on your coffee table

---

## Roadmap (optional future)
- Favorite teams view
- Alerts for close games or final results
- Theme options (dark mode, compact mode)
- Day/week navigation and historical results

---

Questions or ideas? Open an issue or share feedback so we can make the live experience even better.
