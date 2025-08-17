<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { getScoreboardData } from '$lib/data';
  import FavoriteButton from '$lib/components/FavoriteButton.svelte';
  import type { Game, Team } from '$lib/types';
  import { favoritesStore } from '$lib/favorites';
  import { browser } from '$app/environment';

  export let data: { game: Game | null };

  let game: Game | null = data.game;
  let loading = false;
  let error: string | null = null;

  // Get game ID from URL
  $: gameId = $page.params.id;

  // Get back destination from query parameter, default to homepage
  $: backTo = $page.url.searchParams.get('backTo') || '/';

  onMount(() => {
    // If no game data, try to find it
    if (!game && gameId) {
      findGame();
    }
  });

  async function findGame() {
    loading = true;
    try {
      const scoreboardData = await getScoreboardData();
      // Find game by ID across all leagues
      for (const league of scoreboardData.leagues) {
        const foundGame = league.games.find(g => g.id === gameId);
        if (foundGame) {
          game = foundGame;
          break;
        }
      }
      error = null;
    } catch (err) {
      error = 'Failed to load game data';
      console.error('Error loading data:', err);
    } finally {
      loading = false;
    }
  }

  function toggleTeamFavorite(teamId: string) {
    favoritesStore.toggleTeam(teamId);
  }

  // Get team colors with fallbacks
  $: awayTeamColor = game?.awayTeam.primaryColor || '#6B7280';
  $: homeTeamColor = game?.homeTeam.primaryColor || '#3B82F6';

  // Function to determine if text should be white or black based on background color
  function getTextColor(backgroundColor: string): string {
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#111827' : '#FFFFFF';
  }

  $: awayTextColor = getTextColor(awayTeamColor);
  $: homeTextColor = getTextColor(homeTeamColor);

  // Game status and details
  $: isLive = game?.status === 'live';
  $: isFinal = game?.status === 'final';
  $: isScheduled = game?.status === 'scheduled';
  $: isPostponed = game?.status === 'postponed';
  $: isCancelled = game?.status === 'cancelled';

  $: statusText = isLive
    ? 'LIVE'
    : isFinal
      ? 'FINAL'
      : isScheduled
        ? 'SCHEDULED'
        : isPostponed
          ? 'POSTPONED'
          : isCancelled
            ? 'CANCELLED'
            : 'UNKNOWN';

  $: statusIcon = isLive
    ? '🔴'
    : isFinal
      ? '✅'
      : isScheduled
        ? '⏰'
        : isPostponed
          ? '⏸️'
          : isCancelled
            ? '❌'
            : 'ℹ️';

  // Game date and time
  $: gameDate = game?.date ? new Date(game.date) : null;
  $: displayDate = gameDate
    ? gameDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';
  $: displayTime = gameDate
    ? gameDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short',
      })
    : '';

  // Determine winner
  $: winningTeam =
    isFinal && game
      ? game.awayScore > game.homeScore
        ? game.awayTeam
        : game.homeScore > game.awayScore
          ? game.homeTeam
          : null
      : null;
  $: isTie = isFinal && game && game.awayScore === game.homeScore;
  // Get league info
  $: leagueId = game
    ? game.awayTeam.conference === 'NFC' || game.awayTeam.conference === 'AFC'
      ? 'nfl'
      : game.awayTeam.conference === 'American League' ||
          game.awayTeam.conference === 'National League'
        ? 'mlb'
        : 'soccer'
    : null;
</script>

<svelte:head>
  <title
    >{game
      ? `${game.awayTeam.city} ${game.awayTeam.name} @ ${game.homeTeam.city} ${game.homeTeam.name}`
      : 'Game'} - Sports Scoreboard</title
  >
</svelte:head>

<div class="container">
  <!-- Header -->
  <div class="header">
    <a href={backTo} class="back-link"> ← Back </a>

    {#if game}
      <div class="game-info">
        <div class="game-header">
          <h1 class="game-title">
            {game.awayTeam.city}
            {game.awayTeam.name} @ {game.homeTeam.city}
            {game.homeTeam.name}
          </h1>
        </div>
        <div class="game-status">
          <span class="status-badge {game.status}">
            <span class="status-icon">{statusIcon}</span>
            {statusText}
          </span>
          {#if isLive && (game.quarter || game.period)}
            <span class="live-info">
              {game.quarter || game.period}
            </span>
          {/if}
        </div>
      </div>
    {:else}
      <h1 class="game-title">Game Not Found</h1>
    {/if}
  </div>

  {#if loading}
    <div class="loading-spinner">
      <div class="spinner"></div>
    </div>
  {:else if error}
    <div class="error-message">
      <div class="error-title">⚠️ {error}</div>
      <button class="retry-button" on:click={findGame}> Try Again </button>
    </div>
  {:else if game}
    <!-- Game Details -->
    <div class="game-details">
      <!-- Teams Section -->
      <div class="teams-section">
        <h3>🏈 Teams</h3>
        <div class="teams-container">
          <!-- Away Team -->
          <div
            class="team-card away-team"
            class:winner={winningTeam === game.awayTeam}
            class:tie={isTie}
          >
            <div class="team-header">
              <a href="/team/{game.league}/{game.awayTeam.id}">
                <div class="team-logo" style="background: {awayTeamColor}">
                  {#if game.awayTeam.logo}
                    <img src={game.awayTeam.logo} alt="{game.awayTeam.name} logo" loading="lazy" />
                  {:else}
                    <div class="team-logo-fallback" style="color: {awayTextColor}">
                      {game.awayTeam.abbreviation}
                    </div>
                  {/if}
                </div>
              </a>
              <div class="team-info">
                <div class="team-city">{game.awayTeam.city}</div>
                <div class="team-name">{game.awayTeam.name}</div>
                {#if game.awayTeam.record}
                  <div class="team-record">{game.awayTeam.record}</div>
                {/if}
                {#if game.awayTeam.conference}
                  <div class="team-conference">{game.awayTeam.conference}</div>
                {/if}
              </div>
              <FavoriteButton
                isFavorite={game?.awayTeam?.isFavorite || false}
                size="medium"
                on:toggle={() => game && toggleTeamFavorite(game.awayTeam.id)}
              />
            </div>
            {#if !isScheduled}
              <div
                class="team-score"
                class:winning={winningTeam === game.awayTeam}
                class:losing={winningTeam && winningTeam !== game.awayTeam}
              >
                {game.awayScore}
              </div>
            {/if}
          </div>

          <!-- VS Divider -->
          <div class="vs-divider">
            <div class="vs-badge">
              <span class="vs-text">@</span>
            </div>
          </div>

          <!-- Home Team -->
          <div
            class="team-card home-team"
            class:winner={winningTeam === game.homeTeam}
            class:tie={isTie}
          >
            <div class="team-header">
              <a href="/team/{game.league}/{game.homeTeam.id}">
                <div class="team-logo" style="background: {homeTeamColor}">
                  {#if game.homeTeam.logo}
                    <img src={game.homeTeam.logo} alt="{game.homeTeam.name} logo" loading="lazy" />
                  {:else}
                    <div class="team-logo-fallback" style="color: {homeTextColor}">
                      {game.homeTeam.abbreviation}
                    </div>
                  {/if}
                </div>
              </a>
              <div class="team-info">
                <div class="team-city">{game.homeTeam.city}</div>
                <div class="team-name">{game.homeTeam.name}</div>
                {#if game.homeTeam.record}
                  <div class="team-record">{game.homeTeam.record}</div>
                {/if}
                {#if game.homeTeam.conference}
                  <div class="team-conference">{game.homeTeam.conference}</div>
                {/if}
              </div>
              <FavoriteButton
                isFavorite={game?.homeTeam?.isFavorite || false}
                size="medium"
                on:toggle={() => game && toggleTeamFavorite(game.homeTeam.id)}
              />
            </div>
            {#if !isScheduled}
              <div
                class="team-score"
                class:winning={winningTeam === game.homeTeam}
                class:losing={winningTeam && winningTeam !== game.homeTeam}
              >
                {game.homeScore}
              </div>
            {/if}
          </div>
        </div>
      </div>

      <!-- Additional Info -->
      {#if game.odds}
        <div class="detail-section">
          <h3>🎲 Odds</h3>
          <div class="detail-content">
            <div class="detail-item">
              <span class="detail-value">{game.odds}</span>
            </div>
          </div>
        </div>
      {/if}
      <!-- Date and Time -->
      {#if gameDate}
        <div class="detail-section">
          <h3>📅 Date & Time</h3>
          <div class="detail-content">
            <div class="detail-item">
              <span class="detail-label">Date:</span>
              <span class="detail-value">{displayDate}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Time:</span>
              <span class="detail-value">{displayTime}</span>
            </div>
          </div>
        </div>
      {/if}
      <!-- Venue -->
      {#if game.venue}
        <div class="detail-section">
          <h3>🏟️ Venue</h3>
          <div class="detail-content">
            <div class="detail-item">
              <span class="detail-value">{game.venue}</span>
            </div>
          </div>
        </div>
      {/if}

      <!-- External Link -->
      {#if game.url}
        <div class="detail-section">
          <h3>🔗 More Details</h3>
          <div class="detail-content">
            <a href={game.url} target="_blank" rel="noopener noreferrer" class="external-link">
              View on ESPN →
            </a>
          </div>
        </div>
      {/if}
    </div>
  {:else}
    <div class="not-found">
      <div class="not-found-icon">❌</div>
      <div class="not-found-title">Game Not Found</div>
      <div class="not-found-subtitle">The game you're looking for doesn't exist</div>
      <a href="/" class="back-home">Go Back Home</a>
    </div>
  {/if}
</div>

<style>
  .container {
    max-width: 1000px;
    margin: 0 auto;
    padding: 20px;
  }

  .header {
    margin-bottom: 32px;
  }

  .back-link {
    display: inline-block;
    color: #6b7280;
    text-decoration: none;
    font-weight: 500;
    margin-bottom: 16px;
    transition: color 0.2s ease;
  }

  .back-link:hover {
    color: #374151;
  }

  .game-info {
    text-align: center;
  }

  .game-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    margin-bottom: 16px;
  }

  .league-emoji {
    font-size: 3rem;
  }

  .game-title {
    font-size: 2rem;
    font-weight: bold;
    color: #111827;
    margin: 0;
    line-height: 1.2;
  }

  .game-status {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 9999px;
    font-weight: 600;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .status-badge.live {
    background: #fef2f2;
    color: #dc2626;
    border: 1px solid #fecaca;
  }

  .status-badge.final {
    background: #f0f9ff;
    color: #2563eb;
    border: 1px solid #bfdbfe;
  }

  .status-badge.scheduled {
    background: #fef3c7;
    color: #d97706;
    border: 1px solid #fed7aa;
  }

  .status-badge.postponed {
    background: #fef3c7;
    color: #92400e;
    border: 1px solid #fde68a;
  }

  .status-badge.cancelled {
    background: #fef2f2;
    color: #991b1b;
    border: 1px solid #fecaca;
  }

  .live-info {
    background: #dc2626;
    color: white;
    padding: 4px 12px;
    border-radius: 9999px;
    font-size: 12px;
    font-weight: 600;
  }

  .game-details {
    display: flex;
    flex-direction: column;
    gap: 32px;
  }

  .detail-section {
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border: 1px solid #f3f4f6;
  }

  .detail-section h3 {
    margin: 0 0 16px 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #111827;
  }

  .detail-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .detail-item {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .detail-label {
    font-weight: 600;
    color: #6b7280;
    min-width: 80px;
  }

  .detail-value {
    color: #111827;
    font-weight: 500;
  }

  .teams-section h3 {
    margin: 0 0 20px 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #111827;
  }

  .teams-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 24px;
  }

  .team-card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border: 1px solid #f3f4f6;
    transition: all 0.2s ease;
  }

  .team-card.winner {
    background: linear-gradient(to right, #f0fdf4, #dcfce7);
    border-color: #22c55e;
    box-shadow: 0 4px 16px rgba(34, 197, 94, 0.15);
  }

  .team-card.tie {
    background: linear-gradient(to right, #fef3c7, #fde68a);
    border-color: #f59e0b;
  }

  .team-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 16px;
  }

  .team-logo {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    flex-shrink: 0;
  }

  .team-logo img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .team-logo-fallback {
    font-weight: bold;
    font-size: 24px;
  }

  .team-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .team-city {
    font-weight: bold;
    color: #111827;
    font-size: 18px;
  }

  .team-name {
    font-size: 16px;
    color: #4b5563;
    font-weight: 500;
  }

  .team-record {
    font-size: 14px;
    color: #9ca3af;
  }

  .team-conference {
    font-size: 12px;
    color: #6b7280;
    font-weight: 500;
  }

  .team-score {
    font-size: 48px;
    font-weight: bold;
    color: #111827;
    text-align: center;
  }

  .team-score.winning {
    color: #059669;
  }

  .team-score.losing {
    color: #6b7280;
    opacity: 0.7;
  }

  .vs-divider {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px 0;
  }

  .vs-badge {
    background: #e5e7eb;
    border-radius: 9999px;
    padding: 8px 16px;
  }

  .vs-text {
    font-size: 16px;
    font-weight: bold;
    color: #6b7280;
  }

  .game-result {
    text-align: center;
    padding: 20px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border: 1px solid #f3f4f6;
  }

  .result-tie {
    font-size: 1.25rem;
    font-weight: 600;
    color: #f59e0b;
  }

  .result-winner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
  }

  .winner-label {
    font-size: 1.25rem;
    font-weight: 600;
    color: #6b7280;
  }

  .winner-team {
    font-size: 1.5rem;
    font-weight: bold;
    color: #059669;
  }

  .external-link {
    display: inline-block;
    background: #3b82f6;
    color: white;
    text-decoration: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 600;
    transition: all 0.2s ease;
  }

  .external-link:hover {
    background: #2563eb;
    transform: translateY(-2px);
  }

  .loading-spinner {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 60px 20px;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #e5e7eb;
    border-top: 4px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .error-message {
    text-align: center;
    padding: 40px 20px;
    color: #dc2626;
  }

  .error-title {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 16px;
  }

  .retry-button {
    background: #dc2626;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .retry-button:hover {
    background: #b91c1c;
    transform: translateY(-2px);
  }

  .not-found {
    text-align: center;
    padding: 80px 20px;
    color: #6b7280;
  }

  .not-found-icon {
    font-size: 80px;
    margin-bottom: 24px;
    opacity: 0.5;
  }

  .not-found-title {
    font-size: 2rem;
    font-weight: 600;
    margin-bottom: 16px;
    color: #111827;
  }

  .not-found-subtitle {
    font-size: 1.2rem;
    margin-bottom: 32px;
  }

  .back-home {
    background: #3b82f6;
    color: white;
    text-decoration: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 600;
    transition: all 0.2s ease;
  }

  .back-home:hover {
    background: #2563eb;
    transform: translateY(-2px);
  }

  /* Mobile adjustments */
  @media (max-width: 480px) {
    .container {
      padding: 12px;
    }
    .game-title {
      font-size: 1.5rem;
    }
    .league-emoji {
      font-size: 2.5rem;
    }
    .team-header {
      flex-direction: column;
      text-align: center;
    }
    .team-logo {
      width: 48px;
      height: 48px;
    }
    .team-score {
      font-size: 36px;
    }
  }
</style>
