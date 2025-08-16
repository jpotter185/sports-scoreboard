# 🏈 Sports Scoreboard - NFL & MLS

A modern, responsive sports scoreboard application built with SvelteKit that displays live scores and game updates for NFL and MLS.

## ✨ Features

- **Live Score Updates** - Real-time game status and scores
- **Multiple Leagues** - NFL and MLS support
- **Responsive Design** - Works on all devices
- **Auto-refresh** - Updates every 30 seconds
- **Game Status Tracking** - Live, Final, Scheduled, Postponed, Cancelled
- **Team Colors** - Official team colors for visual appeal
- **Loading States** - Smooth user experience with loading indicators

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd sports-scoreboard
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## 🔌 API Integration

The app is currently using mock data for demonstration. To integrate with real sports APIs:

### Option 1: SportsData.io (Recommended)
1. Sign up for a free API key at [sportsdata.io](https://sportsdata.io/)
2. Update the `API_KEY` constant in `src/lib/api.ts`
3. Uncomment the real API functions in the same file

### Option 2: ESPN API
- ESPN provides some free sports data
- Update the API endpoints in `src/lib/api.ts`

### Option 3: Custom API
- Modify the API functions to match your data source
- Ensure the data structure matches the interfaces in `src/lib/types.ts`

## 🏗️ Project Structure

```
src/
├── lib/
│   ├── components/          # Reusable UI components
│   │   ├── GameCard.svelte # Individual game display
│   │   └── LeagueSection.svelte # League section display
│   ├── api.ts              # API integration layer
│   ├── data.ts             # Data management
│   ├── types.ts            # TypeScript interfaces
│   └── index.ts            # Main exports
├── routes/                  # SvelteKit routes
│   ├── +layout.svelte      # App layout
│   └── +page.svelte        # Main scoreboard page
└── app.css                 # Global styles with Tailwind
```

## 🎨 Customization

### Adding More Teams
Update the mock data arrays in `src/lib/api.ts`:
```typescript
const mockNFLTeams: APITeam[] = [
  // Add your teams here
];
```

### Team Colors
Modify the `getTeamColors` function in `src/lib/api.ts` to add custom team colors.

### Adding New Leagues
1. Create new team and game data
2. Add the league to the `getScoreboardData` function in `src/lib/data.ts`
3. Update the types if needed

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Deploy to Vercel/Netlify
The app is ready for deployment to any static hosting service that supports SvelteKit.

## 🛠️ Tech Stack

- **Frontend**: SvelteKit 5
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Build Tool**: Vite
- **Package Manager**: npm

## 📱 Responsive Design

The app is fully responsive and works on:
- Mobile devices (320px+)
- Tablets (768px+)
- Desktop (1024px+)
- Large screens (1280px+)

## 🔄 Auto-refresh

- Data refreshes automatically every 30 seconds
- Manual refresh button available
- Loading states for better UX

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support

If you encounter any issues or have questions:
1. Check the browser console for errors
2. Verify your API keys are correct
3. Ensure all dependencies are installed
4. Open an issue on GitHub

## 🎯 Roadmap

- [ ] Real-time WebSocket updates
- [ ] User preferences and favorite teams
- [ ] Push notifications for game updates
- [ ] Historical game data
- [ ] Player statistics
- [ ] More sports leagues
- [ ] Dark mode theme
- [ ] PWA support

---

Built with ❤️ using SvelteKit and Tailwind CSS
