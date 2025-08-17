<script context="module">
  // Function to determine if text should be white or black based on background color
  function getTextColor(backgroundColor: string): string {
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#111827' : '#FFFFFF';
  }
</script>

<script lang="ts">
  import type { Team } from '$lib/types';
  import FavoriteButton from './FavoriteButton.svelte';
  import { favoritesStore } from '$lib/favorites';

  export let team: Team;
  export let showRecord: boolean = true;
  export let compact: boolean = false;

  // Direct subscription to favorites store for real-time updates
  $: teamIsFavorite = $favoritesStore.teams.includes(team.id);

  function toggleTeamFavorite() {
    favoritesStore.toggleTeam(team.id);
  }
</script>

<div class="team-card {compact ? 'compact' : ''}">
  <div class="team-logo" style="background: {team.primaryColor || '#6B7280'}">
    {#if team.logo}
      <img
        src={team.logo}
        alt="{team.name} logo"
        loading="lazy"
        decoding="async"
        width="40"
        height="40"
      />
    {:else}
      <div class="team-logo-fallback" style="color: {getTextColor(team.primaryColor || '#6B7280')}">
        {team.abbreviation}
      </div>
    {/if}
  </div>

  <div class="team-info">
    <div class="team-city">{team.city}</div>
    <div class="team-name">{team.name}</div>
    {#if showRecord && team.record}
      <div class="team-record">{team.record}</div>
    {/if}
  </div>

  <div class="team-actions">
    <FavoriteButton isFavorite={teamIsFavorite} size="small" on:toggle={toggleTeamFavorite} />
  </div>
</div>

<style>
  .team-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: white;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    transition: all 0.2s ease;
  }

  .team-card:hover {
    border-color: #d1d5db;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .team-card.compact {
    padding: 8px;
    gap: 8px;
  }

  .team-logo {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .team-card.compact .team-logo {
    width: 32px;
    height: 32px;
  }

  .team-logo img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: 50%;
  }

  .team-logo-fallback {
    font-size: 14px;
    font-weight: bold;
    text-align: center;
    line-height: 1;
  }

  .team-card.compact .team-logo-fallback {
    font-size: 12px;
  }

  .team-info {
    flex: 1;
    min-width: 0;
  }

  .team-city {
    font-size: 12px;
    color: #6b7280;
    font-weight: 500;
    margin-bottom: 2px;
  }

  .team-card.compact .team-city {
    font-size: 11px;
  }

  .team-name {
    font-size: 14px;
    font-weight: 600;
    color: #111827;
    margin-bottom: 2px;
  }

  .team-card.compact .team-name {
    font-size: 13px;
  }

  .team-record {
    font-size: 11px;
    color: #6b7280;
  }

  .team-card.compact .team-record {
    font-size: 10px;
  }

  .team-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }
</style>
