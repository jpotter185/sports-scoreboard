<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let isFavorite: boolean = false;
  export let size: 'small' | 'medium' | 'large' = 'medium';
  export let disabled: boolean = false;
  
  const dispatch = createEventDispatcher();
  
  function handleClick(event: MouseEvent) {
    if (!disabled) {
      event.stopPropagation();
      dispatch('toggle');
    }
  }
  
  $: sizeClass = `size-${size}`;
</script>

<button
  class="favorite-button {sizeClass} {isFavorite ? 'favorited' : ''}"
  class:disabled={disabled}
  on:click={handleClick}
  aria-label="{isFavorite ? 'Remove from favorites' : 'Add to favorites'}"
  title="{isFavorite ? 'Remove from favorites' : 'Add to favorites'}"
>
  {#if isFavorite}
    <span class="star filled">★</span>
  {:else}
    <span class="star">☆</span>
  {/if}
</button>

<style>
  .favorite-button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    border-radius: 50%;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #6b7280;
  }
  
  .favorite-button:hover:not(.disabled) {
    background-color: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
    transform: scale(1.1);
  }
  
  .favorite-button.favorited {
    color: #f59e0b;
  }
  
  .favorite-button.favorited:hover:not(.disabled) {
    background-color: rgba(245, 158, 11, 0.1);
    transform: scale(1.1);
  }
  
  .favorite-button.disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
  
  .star {
    font-size: 1.2em;
    line-height: 1;
  }
  
  /* Size variants */
  .size-small .star {
    font-size: 1em;
  }
  
  .size-medium .star {
    font-size: 1.2em;
  }
  
  .size-large .star {
    font-size: 1.5em;
  }
  
  /* Animation for new favorites */
  .favorite-button.favorited .star {
    animation: favoritePop 0.3s ease-out;
  }
  
  @keyframes favoritePop {
    0% { transform: scale(1); }
    50% { transform: scale(1.3); }
    100% { transform: scale(1); }
  }
</style>
