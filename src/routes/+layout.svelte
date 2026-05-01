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
        href="{base}/notes"
        class:active={$page.url.pathname.startsWith(`${base}/notes`)}
      >
        Notes
      </a>
    </nav>
  </aside>

  <main class="content">
    <div class="deprecation-banner" role="alert">
      <strong>⚠ This site is deprecated.</strong>
      The driver catalog has moved to
      <a href="https://thesevenpens.github.io/DrawTabDataExplorer/drivers" target="_blank" rel="noopener">DrawTabDataExplorer › Drivers</a>,
      which has the same data with richer filtering, sorting, and column controls.
      The per-tablet driver-version range will be ported there next; until then this site continues to work.
    </div>
    {@render children()}
  </main>
</div>

<style>
  .deprecation-banner {
    background: #fff3cd;
    border: 1px solid #d97706;
    border-left: 6px solid #d97706;
    color: #533f03;
    padding: 14px 18px;
    margin-bottom: 24px;
    border-radius: 4px;
    font-size: 15px;
    line-height: 1.5;
  }
  .deprecation-banner strong {
    color: #b45309;
  }
  .deprecation-banner a {
    color: #1d4ed8;
    font-weight: 600;
  }
</style>
