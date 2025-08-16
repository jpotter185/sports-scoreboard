<script lang="ts">
  import type { Game } from '$lib/types';

  export let game: Game;

  $: isLive = game.status === 'live';
  $: isFinal = game.status === 'final';
  $: isScheduled = game.status === 'scheduled';
  $: isPostponed = game.status === 'postponed';
  $: isCancelled = game.status === 'cancelled';
  
  $: statusText = isLive ? 'LIVE' : 
                  isFinal ? 'FINAL' : 
                  isScheduled ? 'SCHEDULED' : 
                  isPostponed ? 'POSTPONED' : 
                  isCancelled ? 'CANCELLED' : 'UNKNOWN';
                  
  $: statusIcon = isLive ? '🔴' : 
                  isFinal ? '✅' : 
                  isScheduled ? '⏰' : 
                  isPostponed ? '⏸️' : 
                  isCancelled ? '❌' : 'ℹ️';

  // Get team colors with fallbacks
  $: awayTeamColor = game.awayTeam.primaryColor || '#6B7280';
  $: homeTeamColor = game.homeTeam.primaryColor || '#3B82F6';
  
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

  // Consistent bottom date/time formatting derived from game.date only
  $: gameDate = game.date ? new Date(game.date) : null;
  $: displayDate = gameDate ? gameDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '';
  $: displayTime = gameDate ? gameDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }) : '';
</script>

<style>
  .game-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border: 1px solid #f3f4f6;
    padding: 16px;
    transition: all 0.3s ease;
    min-height: 200px;
  }

  /* Status-based tile accents */
  .game-card.live {
    background: linear-gradient(to bottom right, #fffbeb, #ffffff);
    border-color: #fde68a;
    box-shadow: 0 6px 16px rgba(245, 158, 11, 0.15);
  }

  .game-card.final {
    background: linear-gradient(to bottom right, #f8fafc, #eef2ff);
    border-color: #e5e7eb;
    box-shadow: 0 6px 16px rgba(99, 102, 241, 0.12);
  }
  
  .game-card:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }
  
  .status-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }
  
  .status-info {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .status-icon {
    font-size: 18px;
  }
  
  .status-text {
    display: flex;
    flex-direction: column;
  }
  
  .status-main {
    font-size: 12px;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .status-sub {
    font-size: 11px;
    color: #9ca3af;
  }
  
  .venue-info {
    text-align: right;
  }
  
  .venue-label {
    font-size: 10px;
    color: #9ca3af;
  }
  
  .venue-name {
    font-size: 11px;
    font-weight: 500;
    color: #4b5563;
  }
  
  .teams-container {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .team-card {
    padding: 12px;
    border-radius: 8px;
    border-left: 3px solid;
    transition: all 0.2s ease;
  }
  
  .team-card:hover {
    transform: none;
  }
  
  .away-team {
    background: linear-gradient(to right, #f9fafb, #f3f4f6);
  }
  
  .home-team {
    background: linear-gradient(to right, #f9fafb, #f3f4f6);
  }
  
  .winning-team {
    background: linear-gradient(to right, #f0fdf4, #dcfce7);
    border-left-width: 4px;
    box-shadow: 0 4px 12px rgba(34, 197, 94, 0.15);
  }
  
  .losing-team {
    background: linear-gradient(to right, #f9fafb, #f3f4f6);
    opacity: 0.6;
    filter: grayscale(30%);
  }
  
  .team-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  .team-content.scheduled {
    justify-content: center;
  }

  .team-content.scheduled .team-info {
    justify-content: center;
  }

  .team-content.scheduled .team-details {
    align-items: center;
    text-align: center;
  }
  
  .team-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .team-logo {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 14px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    overflow: hidden;
  }
  
  .team-logo img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  
  .team-logo-fallback {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .team-details {
    display: flex;
    flex-direction: column;
  }
  
  .team-city {
    font-weight: bold;
    color: #111827;
    font-size: 14px;
  }
  
  .team-name {
    font-size: 12px;
    color: #4b5563;
    font-weight: 500;
  }

  .team-record {
    font-size: 11px;
    color: #9ca3af;
  }
  
  .team-type {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
  }
  
  .away-type {
    color: #6b7280;
  }
  
  .home-type {
    color: #6b7280;
  }
  
  .team-score {
    font-size: 24px;
    font-weight: bold;
    color: #111827;
  }
  
  .winning-score {
    color: #059669;
    font-size: 28px;
  }
  
  .losing-score {
    color: #6b7280;
    opacity: 0.7;
  }
  
  .vs-divider {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px 0;
  }
  
  .vs-badge {
    background: #e5e7eb;
    border-radius: 9999px;
    padding: 4px 12px;
  }
  
  .vs-text {
    font-size: 14px;
    font-weight: bold;
    color: #6b7280;
  }
  
  .game-date {
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid #e5e7eb;
    text-align: center;
  }
  
  .date-text {
    font-size: 11px;
    color: #6b7280;
  }
  
  .status-message {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 12px;
  }
  
  .postponed-badge {
    background: linear-gradient(to right, #fef3c7, #fde68a);
    color: #92400e;
  }
  
  .cancelled-badge {
    background: linear-gradient(to right, #fee2e2, #fecaca);
    color: #991b1b;
  }

  .card-link {
    text-decoration: none;
    color: inherit;
    display: block;
  }

  .card-link.no-link {
    pointer-events: none;
    cursor: default;
  }
</style>

<div class="game-card" class:live={isLive} class:final={isFinal} class:scheduled={isScheduled}>
  <a href={game.url || '#'} target={game.url ? '_blank' : undefined} rel={game.url ? 'noopener noreferrer' : undefined} class="card-link" class:no-link={!game.url}>
  <!-- Game Status Header -->
  <div class="status-header">
    <div class="status-info">
      <span class="status-icon">{statusIcon}</span>
      <div class="status-text">
        <div class="status-main">{statusText}</div>
        <div class="status-sub">
          {#if isLive}
            {#if game.quarter}
              {game.quarter}{game.period ? ` - ${game.period}` : ''}
            {:else if game.period}
              {game.period}
            {:else}
              Live
            {/if}
          {/if}
        </div>
      </div>
    </div>
    
    {#if game.venue}
      <div class="venue-info">
        <div class="venue-label">Venue</div>
        <div class="venue-name">{game.venue}</div>
      </div>
    {/if}
  </div>

  <!-- Teams and Scores -->
  <div class="teams-container">
    <!-- Away Team Card -->
    <div class="team-card away-team" 
         class:winning-team={isFinal && game.awayScore > game.homeScore}
         class:losing-team={isFinal && (game.awayScore < game.homeScore || game.awayScore === game.homeScore)}
         style="border-left-color: {awayTeamColor}">
      <div class="team-content" class:scheduled={isScheduled}>
        <div class="team-info">
          <div class="team-logo" style="background: {awayTeamColor}">
            {#if game.awayTeam.logo}
              <img src={game.awayTeam.logo} alt="{game.awayTeam.name} logo" />
            {:else}
              <div class="team-logo-fallback" style="color: {awayTextColor}">
                {game.awayTeam.abbreviation}
              </div>
            {/if}
          </div>
          <div class="team-details">
            <div class="team-city">{game.awayTeam.city}</div>
            <div class="team-name">{game.awayTeam.name}</div>
            {#if game.awayTeam.record}
              <div class="team-record">{game.awayTeam.record}</div>
            {/if}
          </div>
        </div>
        {#if !isScheduled}
        <div class="team-score" 
             class:winning-score={isFinal && game.awayScore > game.homeScore}
             class:losing-score={isFinal && (game.awayScore < game.homeScore || game.awayScore === game.homeScore)}>
          {game.awayScore}
        </div>
        {/if}
      </div>
    </div>

    <!-- VS Divider -->
    <div class="vs-divider">
      <div class="vs-badge">
        <span class="vs-text">@</span>
      </div>
    </div>

    <!-- Home Team Card -->
    <div class="team-card home-team" 
         class:winning-team={isFinal && game.homeScore > game.awayScore}
         class:losing-team={isFinal && (game.homeScore < game.awayScore || game.homeScore === game.awayScore)}
         style="border-left-color: {homeTeamColor}">
      <div class="team-content" class:scheduled={isScheduled}>
        <div class="team-info">
          <div class="team-logo" style="background: {homeTeamColor}">
            {#if game.homeTeam.logo}
              <img src={game.homeTeam.logo} alt="{game.homeTeam.name} logo" />
            {:else}
              <div class="team-logo-fallback" style="color: {homeTextColor}">
                {game.homeTeam.abbreviation}
              </div>
            {/if}
          </div>
          <div class="team-details">
            <div class="team-city">{game.homeTeam.city}</div>
            <div class="team-name">{game.homeTeam.name}</div>
            {#if game.homeTeam.record}
              <div class="team-record">{game.homeTeam.record}</div>
            {/if}
          </div>
        </div>
        {#if !isScheduled}
        <div class="team-score" 
             class:winning-score={isFinal && game.homeScore > game.awayScore}
             class:losing-score={isFinal && (game.homeScore < game.awayScore || game.homeScore === game.awayScore)}>
          {game.homeScore}
        </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- Game Date and Time -->
  {#if gameDate}
    <div class="game-date">
      <div class="date-text">
        {displayDate}{#if displayTime} - {displayTime}{/if}
      </div>
    </div>
  {/if}

  <!-- Postponed/Cancelled Message -->
  {#if isPostponed || isCancelled}
    <div class="game-date">
      <div class="status-message {isPostponed ? 'postponed-badge' : 'cancelled-badge'}">
        <span>
          {#if isPostponed}
            Postponed
          {:else}
            Cancelled
          {/if}
        </span>
      </div>
    </div>
  {/if}
  </a>
</div>
