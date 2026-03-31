<script>
  import DriverList from './DriverList.svelte';
  import JsonMerger from './JsonMerger.svelte';

  let activeSubView = $state('list');
</script>

<nav class="subtabs" aria-label="Driver views">
  <button
    class:active={activeSubView === 'list'}
    onclick={() => (activeSubView = 'list')}
  >
    Driver List
  </button>
  <button
    class:active={activeSubView === 'merge'}
    onclick={() => (activeSubView = 'merge')}
  >
    JSON Merger
  </button>
</nav>

{#if activeSubView === 'list'}
  <DriverList />
{:else}
  <JsonMerger />
{/if}
