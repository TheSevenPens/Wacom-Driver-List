<script>
  import DriverList from './components/DriverList.svelte';
  import JsonMerger from './components/JsonMerger.svelte';

  let activeView = 'list';
</script>

<main class="shell">
  <header class="topbar">
    <h1>SevenPens Wacom Driver List</h1>
    <nav class="tabs" aria-label="Main views">
      <button
        class:active={activeView === 'list'}
        on:click={() => (activeView = 'list')}
      >
        Driver List
      </button>
      <button
        class:active={activeView === 'merge'}
        on:click={() => (activeView = 'merge')}
      >
        JSON Merger
      </button>
    </nav>
  </header>

  {#if activeView === 'list'}
    <DriverList />
  {:else}
    <JsonMerger />
  {/if}
</main>
