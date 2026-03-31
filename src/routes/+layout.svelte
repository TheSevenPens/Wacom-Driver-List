<script>
  import { page } from '$app/stores';
  import { base } from '$app/paths';
  import '../app.css';

  let { children } = $props();
</script>

<div class="layout">
  <aside class="sidebar">
    <h1 class="sidebar-title">SevenPens Wacom Driver List</h1>
    <nav class="sidebar-nav" aria-label="Main sections">
      <a
        href="{base}/drivers"
        class:active={$page.url.pathname.startsWith(`${base}/drivers`)}
      >
        Drivers
      </a>
      <a
        href="{base}/products"
        class:active={$page.url.pathname.startsWith(`${base}/products`)}
      >
        Products
      </a>
    </nav>
  </aside>

  <main class="content">
    {@render children()}
  </main>
</div>
