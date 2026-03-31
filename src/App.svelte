<script>
  import DriversTab from './components/DriversTab.svelte';
  import ProductsTab from './components/ProductsTab.svelte';

  let activeTab = $state('drivers');
</script>

<div class="layout">
  <aside class="sidebar">
    <h1 class="sidebar-title">SevenPens Wacom Driver List</h1>
    <nav class="sidebar-nav" aria-label="Main sections">
      <button
        class:active={activeTab === 'drivers'}
        onclick={() => (activeTab = 'drivers')}
      >
        Drivers
      </button>
      <button
        class:active={activeTab === 'products'}
        onclick={() => (activeTab = 'products')}
      >
        Products
      </button>
    </nav>
  </aside>

  <main class="content">
    {#if activeTab === 'drivers'}
      <DriversTab />
    {:else if activeTab === 'products'}
      <ProductsTab />
    {/if}
  </main>
</div>
