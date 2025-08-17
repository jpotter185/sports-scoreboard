<script lang="ts">
  import LeagueSection from '$lib/components/LeagueSection.svelte';
  import FavoriteButton from '$lib/components/FavoriteButton.svelte';
  import { onMount } from 'svelte';
  import type { ScoreboardData, League } from '$lib/types';
  import { browser } from '$app/environment';
  import { injectAnalytics } from '@vercel/analytics/sveltekit';
  import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';
  import {
    favoritesStore,
    favoriteTeams,
    favoriteLeagues,
    applyFavoriteStatus,
  } from '$lib/favorites';
  import { getGamesData } from '$lib/data';
  import type { PageData } from './$types';

  export let data: PageData;

  injectSpeedInsights();
  injectAnalytics();
  let scoreboardData: ScoreboardData = data.scoreboardData;
  let loading = false;
  let refreshing = false;
  let error: string | null = null;
  let leagueOrder: string[] = [];
  let draggingId: string | null = null;
  let orderedLeagues: League[] = [];
  let dragOverId: string | null = null;
  let dragOverPosition: 'before' | 'after' | null = null;
  let reorderMode = false;
  let liveOnly = false;
  let showFavoritesOnly = false;
  let showFavoriteTeams = true;

  // Create reactive data that updates when favorites change
  $: reactiveScoreboardData = (() => {
    try {
      if (!scoreboardData.leagues.length) {
        return scoreboardData;
      }

      // Since components now handle favorites directly, just return the original data
      // The reactive logic is now handled at the component level
      return scoreboardData;
    } catch (error) {
      console.error('❌ Error in reactive favorites logic:', error);
      return scoreboardData; // Fallback to original data
    }
  })();

  // Auto-refresh every 30 seconds
  onMount(() => {
    // Migrate favorites if needed
    if (scoreboardData.leagues.length > 0) {
      favoritesStore.migrateFavorites(scoreboardData.leagues);
    }

    const interval = setInterval(async () => {
      // Use getGamesData for frequent updates (teams are cached)
      try {
        const updatedData = await getGamesData();
        scoreboardData.leagues = updatedData.leagues;
        scoreboardData.lastUpdated = updatedData.lastUpdated;
      } catch (error) {
        console.error('Error refreshing games data:', error);
      }
    }, 30000);

    // restore liveOnly preference
    try {
      const savedLive = localStorage.getItem('liveOnly');
      if (savedLive != null) liveOnly = savedLive === '1';
    } catch {}

    // restore showFavoritesOnly preference
    try {
      const savedFavorites = localStorage.getItem('showFavoritesOnly');
      if (savedFavorites != null) showFavoritesOnly = savedFavorites === '1';
    } catch {}

    return () => {
      clearInterval(interval);
    };
  });

  // Derive and persist league order
  $: if (scoreboardData.leagues && scoreboardData.leagues.length > 0) {
    const incomingIds = scoreboardData.leagues.map(l => l.id);
    if (leagueOrder.length === 0) {
      if (browser) {
        try {
          const saved = localStorage.getItem('leagueOrder');
          if (saved) {
            const savedOrder = JSON.parse(saved) as string[];
            leagueOrder = [
              ...savedOrder.filter(id => incomingIds.includes(id)),
              ...incomingIds.filter(id => !savedOrder.includes(id)),
            ];
          } else {
            leagueOrder = incomingIds;
          }
        } catch {
          leagueOrder = incomingIds;
        }
      } else {
        leagueOrder = incomingIds;
      }
    } else {
      leagueOrder = [
        ...leagueOrder.filter(id => incomingIds.includes(id)),
        ...incomingIds.filter(id => !leagueOrder.includes(id)),
      ];
    }
  }

  $: if (browser && leagueOrder.length > 0) {
    try {
      localStorage.setItem('leagueOrder', JSON.stringify(leagueOrder));
    } catch {}
  }

  // persist liveOnly
  $: if (browser) {
    try {
      localStorage.setItem('liveOnly', liveOnly ? '1' : '0');
    } catch {}
  }

  // persist showFavoritesOnly
  $: if (browser) {
    try {
      localStorage.setItem('showFavoritesOnly', showFavoritesOnly ? '1' : '0');
    } catch {}
  }

  // Apply live-only filtering to leagues/games for display
  $: filteredLeagues = scoreboardData.leagues
    .map(l => ({
      ...l,
      games: liveOnly ? l.games.filter(g => g.status === 'live') : l.games,
    }))
    .filter(l => (liveOnly ? l.games.length > 0 : true));

  // Apply favorites-only filtering (now using internal team IDs)
  $: finalFilteredLeagues = showFavoritesOnly
    ? filteredLeagues.filter(
        l =>
          $favoritesStore.leagues.includes(l.id) ||
          l.games.some(g => {
            const homeTeamInternalId = `${l.id}-${g.homeTeam.id}`;
            const awayTeamInternalId = `${l.id}-${g.awayTeam.id}`;
            return (
              $favoritesStore.teams.includes(homeTeamInternalId) ||
              $favoritesStore.teams.includes(awayTeamInternalId)
            );
          })
      )
    : filteredLeagues;

  $: orderedLeagues = (() => {
    const result = leagueOrder
      .map(id => finalFilteredLeagues.find(l => l.id === id))
      .filter((l): l is League => !!l);
    return result;
  })();

  function onDragStart(event: DragEvent, id: string) {
    const target = event.target as HTMLElement | null;
    if (!target || !(target.classList.contains('drag-handle') || target.closest('.drag-handle'))) {
      return;
    }
    draggingId = id;
    try {
      event.dataTransfer?.setData('text/plain', id);
      event.dataTransfer?.setDragImage?.(document.createElement('div'), 0, 0);
    } catch {}
  }

  function onDragOver(event: DragEvent, overId: string) {
    event.preventDefault();
    if (!draggingId) return;
    const target = event.currentTarget as HTMLElement | null;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const offsetY = event.clientY - rect.top;
    dragOverPosition = offsetY < rect.height / 2 ? 'before' : 'after';
    dragOverId = overId;

    // Preview order while dragging
    const withoutDragging = leagueOrder.filter(id => id !== draggingId);
    let insertIndex = withoutDragging.indexOf(overId);
    if (insertIndex === -1) return;
    if (dragOverPosition === 'after') insertIndex += 1;
    const preview = [...withoutDragging];
    preview.splice(insertIndex, 0, draggingId);
    leagueOrder = preview;
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    draggingId = null;
    dragOverId = null;
    dragOverPosition = null;
  }

  function onDragEnd() {
    draggingId = null;
    dragOverId = null;
    dragOverPosition = null;
  }

  function moveLeague(id: string, direction: 'up' | 'down') {
    const idx = leagueOrder.indexOf(id);
    if (idx === -1) return;
    const target = direction === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= leagueOrder.length) return;
    const updated = [...leagueOrder];
    const [item] = updated.splice(idx, 1);
    updated.splice(target, 0, item);
    leagueOrder = updated;
  }

  async function refreshData() {
    loading = true;
    try {
      // Use getGamesData for manual refresh (teams are cached)
      const updatedData = await getGamesData();
      scoreboardData.leagues = updatedData.leagues;
      scoreboardData.lastUpdated = updatedData.lastUpdated;
      error = null;
    } catch (err) {
      error = 'Failed to refresh data';
      console.error('Error refreshing data:', err);
    } finally {
      loading = false;
    }
  }

  $: totalGames = scoreboardData.leagues.reduce((sum, league) => sum + league.games.length, 0);
  $: liveGames = scoreboardData.leagues.reduce(
    (sum, league) => sum + league.games.filter(g => g.status === 'live').length,
    0
  );
  $: finalGames = scoreboardData.leagues.reduce(
    (sum, league) => sum + league.games.filter(g => g.status === 'final').length,
    0
  );
  $: favoriteTeamsCount = $favoriteTeams.length;
  $: favoriteLeaguesCount = $favoriteLeagues.length;

  // Function to get team info from internal team ID
  function getTeamInfo(internalTeamId: string) {
    if (!internalTeamId.includes('-')) return null;

    const [leagueId, espnId] = internalTeamId.split('-');
    const league = scoreboardData.leagues.find(l => l.id === leagueId);
    if (!league) return null;

    const team = league.teams.find(t => t.id === espnId);
    if (!team) return null;

    return {
      leagueId,
      espnId,
      team,
      leagueName: league.name,
    };
  }
</script>

<div class="container">
  <!-- Header -->
  <div class="header">
    <h1 class="title">NFL, MLS, MLB & EPL Live Scores</h1>
    <p class="subtitle">Real-time updates from ESPN</p>
    <button class="refresh-button" on:click={refreshData}>
      {refreshing ? 'Refreshing…' : 'Refresh Now'}
    </button>

    <div class="last-updated">
      <div class="last-updated-text">
        <span>🕒</span>
        <span>Last updated: {scoreboardData.lastUpdated}</span>
      </div>
    </div>
  </div>

  {#if loading}
    <div class="loading-spinner">
      <div class="spinner"></div>
    </div>
  {:else if error}
    <div class="error-message">
      <div class="error-title">⚠️ {error}</div>
      <button class="retry-button" on:click={refreshData}> Try Again </button>
    </div>
  {:else}
    <!-- League Jump Nav & Controls -->
    <div class="stats-bar">
      <div class="leagues-nav">
        {#each orderedLeagues as l (l.id)}
          <a class="nav-chip" href="/league/{l.id}">
            {l.id === 'nfl'
              ? '🏈 NFL'
              : l.id === 'mls'
                ? '⚽ MLS'
                : l.id === 'mlb'
                  ? '⚾ MLB'
                  : '⚽ EPL'}
          </a>
        {/each}
      </div>

      <div
        style="display:flex; justify-content:center; gap:12px; margin-top: 8px; flex-wrap: wrap;"
      >
        <button class="reorder-toggle" on:click={() => (reorderMode = !reorderMode)}>
          {reorderMode ? 'Done Reordering' : 'Reorder Leagues'}
        </button>
        <button
          class="reorder-toggle"
          on:click={() => (liveOnly = !liveOnly)}
          aria-pressed={liveOnly}
        >
          {liveOnly ? 'Show All Games' : 'Show Live Only'}
        </button>
        <button
          class="reorder-toggle"
          on:click={() => (showFavoritesOnly = !showFavoritesOnly)}
          aria-pressed={showFavoritesOnly}
        >
          {showFavoritesOnly ? 'Show All Teams' : 'Show Favorites Only'}
        </button>
      </div>

      <!-- My Favorite Teams Section -->
      {#if favoriteTeamsCount > 0}
        <div class="favorite-teams-section">
          <div class="favorite-teams-header">
            <h2 class="section-title">⭐ My Favorite Teams</h2>
            <button
              class="collapse-button"
              on:click={() => (showFavoriteTeams = !showFavoriteTeams)}
              aria-expanded={showFavoriteTeams}
            >
              <svg
                class="chevron"
                class:rotate={!showFavoriteTeams}
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                  clip-rule="evenodd"
                />
              </svg>
              {showFavoriteTeams ? 'Collapse' : 'Expand'}
            </button>
          </div>

          {#if showFavoriteTeams}
            <div class="favorite-teams-grid">
              {#each $favoritesStore.teams as internalTeamId}
                {@const teamInfo = getTeamInfo(internalTeamId)}
                {#if teamInfo}
                  <div class="favorite-team-card">
                    <a
                      href="/team/{teamInfo.leagueId}/{teamInfo.espnId}?backTo=/"
                      class="team-link"
                    >
                      <div class="team-logo">
                        {#if teamInfo.team.logo}
                          <img
                            src={teamInfo.team.logo}
                            alt="{teamInfo.team.name} logo"
                            loading="lazy"
                          />
                        {:else}
                          <div class="team-logo-fallback">
                            {teamInfo.team.abbreviation}
                          </div>
                        {/if}
                      </div>
                      <div class="team-info">
                        <div class="team-name">{teamInfo.team.name}</div>
                        <div class="team-league">{teamInfo.leagueName}</div>
                        {#if teamInfo.team.record}
                          <div class="team-record">{teamInfo.team.record}</div>
                        {/if}
                      </div>
                    </a>
                    <FavoriteButton
                      isFavorite={true}
                      size="small"
                      on:toggle={() => favoritesStore.toggleTeam(internalTeamId)}
                    />
                  </div>
                {/if}
              {/each}
            </div>
          {/if}
        </div>
      {/if}
    </div>

    <!-- Leagues -->
    {#if orderedLeagues.length > 0}
      {#each orderedLeagues as league (league.id)}
        <div
          class="league-draggable {draggingId === league.id ? 'dragging' : ''}"
          role="listitem"
          aria-grabbed={draggingId === league.id}
          on:dragstart={e => onDragStart(e, league.id)}
          on:dragover={e => onDragOver(e, league.id)}
          on:drop={onDrop}
          on:dragend={onDragEnd}
        >
          <LeagueSection
            {league}
            {reorderMode}
            forceCollapse={draggingId !== null || reorderMode}
            showTeams={false}
            {showFavoritesOnly}
            on:moveUp={() => moveLeague(league.id, 'up')}
            on:moveDown={() => moveLeague(league.id, 'down')}
            on:exitReorder={() => (reorderMode = false)}
          />
        </div>
      {/each}
    {:else}
      <div class="no-games">
        <div class="no-games-icon">🏟️</div>
        <div class="no-games-title">No games available</div>
        <div class="no-games-subtitle">Check back later for upcoming games</div>
      </div>
    {/if}
  {/if}

  <!-- Footer -->
  <div class="footer">
    <p>
      Powered by Public ESPN APIs • Games refresh every 30 seconds • Teams update every 5 minutes
    </p>
  </div>
</div>

<style>
  .container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 20px;
  }

  .header {
    text-align: center;
    margin-bottom: 20px;
  }

  .title {
    font-size: 1.75rem;
    font-weight: bold;
    color: #111827;
    margin-bottom: 4px;
  }

  .subtitle {
    font-size: 0.9rem;
    color: #6b7280;
    margin-bottom: 16px;
  }

  .refresh-button {
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.875rem;
  }

  .refresh-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
  }

  .refresh-button:active {
    transform: translateY(0);
  }

  .reorder-toggle {
    margin-left: 8px;
    background: #f1f5f9;
    color: #334155;
    border: 1px solid #e2e8f0;
    padding: 8px 12px;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
  }

  .stats-bar {
    background: white;
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 32px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    border: 1px solid #f3f4f6;
  }

  /* removed old stats grid styles */

  .last-updated {
    text-align: center;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #e2e8f0;
  }

  .last-updated-text {
    font-size: 0.875rem;
    color: #64748b;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
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

  .no-games {
    text-align: center;
    padding: 60px 20px;
    color: #6b7280;
  }

  .no-games-icon {
    font-size: 64px;
    margin-bottom: 16px;
    opacity: 0.5;
  }

  .no-games-title {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 8px;
  }

  .no-games-subtitle {
    font-size: 1.1rem;
  }

  .footer {
    text-align: center;
    margin-top: 60px;
    padding-top: 40px;
    border-top: 1px solid #e5e7eb;
    color: #9ca3af;
  }

  /* Mobile adjustments */
  @media (max-width: 768px) {
    .container {
      padding: 16px;
    }

    .header {
      margin-bottom: 16px;
    }

    .title {
      font-size: 1.5rem;
    }

    .subtitle {
      font-size: 0.85rem;
      margin-bottom: 12px;
    }

    .refresh-button {
      padding: 12px 20px;
      font-size: 0.9rem;
      min-height: 48px;
    }

    .reorder-toggle {
      padding: 10px 16px;
      min-height: 44px;
      font-size: 0.85rem;
    }

    .stats-bar {
      padding: 20px;
      margin-bottom: 20px;
    }

    /* Favorite teams mobile optimization */
    .favorite-teams-section {
      margin-top: 16px;
    }

    .favorite-teams-header {
      padding: 16px;
      flex-direction: column;
      gap: 12px;
      align-items: stretch;
    }

    .section-title {
      font-size: 16px;
      text-align: center;
    }

    .collapse-button {
      padding: 12px 20px;
      min-height: 44px;
      font-size: 0.9rem;
      justify-content: center;
    }

    .favorite-teams-grid {
      grid-template-columns: 1fr;
      gap: 12px;
      padding: 16px;
    }

    .favorite-team-card {
      padding: 16px;
      min-height: 60px;
    }

    .favorite-team-card .team-logo {
      width: 40px;
      height: 40px;
      min-width: 40px;
      min-height: 40px;
    }

    .favorite-team-card .team-name {
      font-size: 16px;
    }

    .favorite-team-card .team-league {
      font-size: 14px;
    }

    .favorite-team-card .team-record {
      font-size: 12px;
    }

    /* League navigation mobile */
    .leagues-nav {
      gap: 6px;
      margin: 12px 0 20px 0;
    }

    .nav-chip {
      padding: 10px 16px;
      font-size: 0.85rem;
      min-height: 44px;
    }
  }

  @media (max-width: 480px) {
    .container {
      padding: 12px;
    }

    .header {
      margin-bottom: 12px;
    }

    .title {
      font-size: 1.25rem;
    }

    .subtitle {
      font-size: 0.8rem;
      margin-bottom: 10px;
    }

    .refresh-button {
      padding: 10px 16px;
      font-size: 0.85rem;
      min-height: 44px;
    }

    .reorder-toggle {
      padding: 8px 12px;
      min-height: 40px;
      font-size: 0.8rem;
    }

    .stats-bar {
      padding: 16px;
      margin-bottom: 16px;
    }

    /* Favorite teams small mobile */
    .favorite-teams-header {
      padding: 12px;
    }

    .section-title {
      font-size: 15px;
    }

    .collapse-button {
      padding: 10px 16px;
      min-height: 40px;
      font-size: 0.85rem;
    }

    .favorite-teams-grid {
      padding: 12px;
      gap: 10px;
    }

    .favorite-team-card {
      padding: 12px;
      min-height: 56px;
    }

    .favorite-team-card .team-logo {
      width: 36px;
      height: 36px;
      min-width: 36px;
      min-height: 36px;
    }

    .favorite-team-card .team-name {
      font-size: 15px;
    }

    .favorite-team-card .team-league {
      font-size: 13px;
    }

    .favorite-team-card .team-record {
      font-size: 11px;
    }

    /* League navigation small mobile */
    .leagues-nav {
      gap: 4px;
      margin: 10px 0 16px 0;
    }

    .nav-chip {
      padding: 8px 12px;
      font-size: 0.8rem;
      min-height: 40px;
    }
  }

  /* League jump nav */
  :global(html) {
    scroll-behavior: smooth;
  }

  .leagues-nav {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: center;
    margin: 8px 0 16px 0;
  }

  .nav-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 9999px;
    background: #f8fafc;
    color: #334155;
    text-decoration: none;
    font-weight: 600;
    font-size: 0.9rem;
  }

  /* Drag-and-drop visuals */
  .league-draggable {
    position: relative;
  }

  .league-draggable.dragging {
    opacity: 0.6;
    transform: scale(0.995);
  }

  /* New styles for favorite teams section */
  .favorite-teams-section {
    margin-top: 20px;
    background: white;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    overflow: hidden;
  }

  .favorite-teams-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
  }

  .favorite-teams-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px;
    padding: 16px;
  }

  .favorite-team-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    transition: all 0.2s ease;
  }

  .favorite-team-card:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .favorite-team-card .team-link {
    display: flex;
    align-items: center;
    gap: 12px;
    text-decoration: none;
    color: inherit;
    flex: 1;
  }

  .favorite-team-card .team-link:hover {
    color: inherit;
    text-decoration: none;
  }

  .favorite-team-card .team-logo {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
  }

  .favorite-team-card .team-logo img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .favorite-team-card .team-logo-fallback {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #e5e7eb;
    font-size: 14px;
    font-weight: bold;
    color: #6b7280;
  }

  .favorite-team-card .team-info {
    flex: 1;
    min-width: 0;
  }

  .favorite-team-card .team-name {
    font-weight: 600;
    color: #111827;
    font-size: 14px;
    margin-bottom: 2px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .favorite-team-card .team-league {
    font-size: 12px;
    color: #6b7280;
    margin-bottom: 2px;
  }

  .favorite-team-card .team-record {
    font-size: 11px;
    color: #9ca3af;
  }

  .collapse-button {
    background: #f1f5f9;
    color: #334155;
    border: 1px solid #e2e8f0;
    padding: 6px 10px;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.875rem;
    transition: all 0.2s ease;
  }

  .collapse-button:hover {
    background: #e2e8f0;
    border-color: #cbd5e1;
    transform: translateY(-1px);
  }

  .collapse-button:active {
    transform: translateY(0);
  }

  .chevron {
    transition: transform 0.3s ease;
  }

  .chevron.rotate {
    transform: rotate(-90deg);
  }

  .section-title {
    font-size: 18px;
    font-weight: 600;
    color: #111827;
    margin: 0;
  }
</style>
