<script lang="ts">
  import { getScoreboardData } from '$lib/data';
  import LeagueSection from '$lib/components/LeagueSection.svelte';
  import { onMount } from 'svelte';
  import type { ScoreboardData, League } from '$lib/types';
  import { browser } from '$app/environment';

  let scoreboardData: ScoreboardData = { leagues: [], lastUpdated: '' };
  let loading = true;
  let refreshing = false;
  let error: string | null = null;
  let leagueOrder: string[] = [];
  let draggingId: string | null = null;
  let orderedLeagues: League[] = [];
  let dragOverId: string | null = null;
  let dragOverPosition: 'before' | 'after' | null = null;

  // Auto-refresh every 30 seconds
  onMount(async () => {
    await loadData();

    const interval = setInterval(async () => {
      await loadData({ background: true });
    }, 30000);

    return () => clearInterval(interval);
  });

  async function loadData({ background = false }: { background?: boolean } = {}) {
    try {
      if (background) {
        refreshing = true;
      } else {
        loading = true;
      }
      error = null;
      scoreboardData = await getScoreboardData();
    } catch (err) {
      error = 'Failed to load scoreboard data';
      console.error('Error loading data:', err);
    } finally {
      if (background) {
        refreshing = false;
      } else {
        loading = false;
      }
    }
  }

  // Derive and persist league order
  $: if (scoreboardData.leagues && scoreboardData.leagues.length > 0) {
    const incomingIds = scoreboardData.leagues.map((l) => l.id);
    if (leagueOrder.length === 0) {
      if (browser) {
        try {
          const saved = localStorage.getItem('leagueOrder');
          if (saved) {
            const savedOrder = JSON.parse(saved) as string[];
            leagueOrder = [
              ...savedOrder.filter((id) => incomingIds.includes(id)),
              ...incomingIds.filter((id) => !savedOrder.includes(id))
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
        ...leagueOrder.filter((id) => incomingIds.includes(id)),
        ...incomingIds.filter((id) => !leagueOrder.includes(id))
      ];
    }
  }

  $: if (browser && leagueOrder.length > 0) {
    try {
      localStorage.setItem('leagueOrder', JSON.stringify(leagueOrder));
    } catch {}
  }

  $: orderedLeagues = leagueOrder
    .map((id) => scoreboardData.leagues.find((l) => l.id === id))
    .filter((l): l is League => !!l);

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
    const withoutDragging = leagueOrder.filter((id) => id !== draggingId);
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

  async function refreshData() {
    await loadData({ background: true });
  }

  $: totalGames = scoreboardData.leagues.reduce((sum, league) => sum + league.games.length, 0);
  $: liveGames = scoreboardData.leagues.reduce((sum, league) => sum + league.games.filter(g => g.status === 'live').length, 0);
  $: finalGames = scoreboardData.leagues.reduce((sum, league) => sum + league.games.filter(g => g.status === 'final').length, 0);
</script>

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

  .stats-bar {
    background: white;
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 32px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    border: 1px solid #f3f4f6;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 24px;
    align-items: center;
  }

  .stat-item {
    text-align: center;
    padding: 16px;
    border-radius: 12px;
    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
    border: 1px solid #e2e8f0;
  }

  .stat-number {
    font-size: 2rem;
    font-weight: bold;
    color: #1e293b;
    margin-bottom: 4px;
  }

  .stat-label {
    font-size: 0.875rem;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
  }

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
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
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

  /* Drag-and-drop visuals */
  .league-draggable {
    position: relative;
  }

  .league-draggable.dragging {
    opacity: 0.6;
    transform: scale(0.995);
  }

  .drop-indicator {
    height: 10px;
    margin: -6px 0 16px 0;
    display: none;
  }

  .drop-indicator.show {
    display: block;
  }

  .drop-line {
    height: 4px;
    background: #3b82f6;
    border-radius: 9999px;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
  }
</style>

<div class="container">
  <!-- Header -->
  <div class="header">
    <h1 class="title">NFL, MLS & EPL Live Scores</h1>
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
      <button class="retry-button" on:click={refreshData}>
        Try Again
      </button>
    </div>
  {:else}
    <!-- Stats Bar -->
    <div class="stats-bar">
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-number">{scoreboardData.leagues.length}</div>
          <div class="stat-label">Leagues</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{totalGames}</div>
          <div class="stat-label">Total Games</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{liveGames}</div>
          <div class="stat-label">Live Games</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{finalGames}</div>
          <div class="stat-label">Final Games</div>
        </div>
      </div>

    </div>

    <!-- Leagues -->
    {#if orderedLeagues.length > 0}
      {#each orderedLeagues as league (league.id)}
        <div class="league-draggable {draggingId === league.id ? 'dragging' : ''}" on:dragstart={(e) => onDragStart(e, league.id)} on:dragover={(e) => onDragOver(e, league.id)} on:drop={onDrop} on:dragend={onDragEnd}>
          {#if dragOverId === league.id && dragOverPosition === 'before'}
            <div class="drop-indicator show"><div class="drop-line" /></div>
          {/if}
          <LeagueSection {league} forceCollapse={draggingId !== null} />
          {#if dragOverId === league.id && dragOverPosition === 'after'}
            <div class="drop-indicator show"><div class="drop-line" /></div>
          {/if}
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
    <p>Powered by public ESPN APIs • Auto-refreshes every 30 seconds</p>
  </div>
</div>
