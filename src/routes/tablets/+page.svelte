<script>
  import { base } from '$app/paths';
  import tabletsData from '$lib/data/wacom-products.json';

  let nameFilter = $state('');

  let filteredProducts = $derived(
    tabletsData.filter((product) => {
      return product.name.toLowerCase().includes(nameFilter.toLowerCase());
    })
  );
</script>

<section class="card">
  <div class="container-flex">
    <div class="column-item">
      <p class="section-header">FILTERS</p>
      <hr />
      <div class="control">
        <label for="nameFilter">Tablet name</label>
        <input type="text" id="nameFilter" bind:value={nameFilter} placeholder="e.g., Intuos Pro" />
      </div>
    </div>

    <div class="column-item">
      <p class="section-header">NOTES</p>
      <hr />
      <ul>
        <li>Data sourced from Wacom's <code>update.xml</code>.</li>
        <li>{tabletsData.length} tablets total.</li>
      </ul>
    </div>
  </div>
</section>

<section class="card table-wrap">
  <table>
    <thead>
      <tr>
        <th class="table-header">#</th>
        <th class="table-header">TABLET</th>
        <th class="table-header">MODEL</th>
        <th class="table-header">PLATFORMS</th>
        <th class="table-header">MIN DRIVER</th>
        <th class="table-header">MAX DRIVER</th>
      </tr>
    </thead>
    <tbody>
      {#if filteredProducts.length === 0}
        <tr>
          <td colspan="6">No matching tablets</td>
        </tr>
      {:else}
        {#each filteredProducts as product, index}
          <tr>
            <td>{index + 1}</td>
            <td class="version-value"><a href="{base}/tablets/{encodeURIComponent(product.name)}">{product.name}</a></td>
            <td>{product.model || '-'}</td>
            <td>{product.platforms.join(', ')}</td>
            <td>{product.drivermin || '-'}</td>
            <td>{product.drivermax || 'Current'}</td>
          </tr>
        {/each}
      {/if}
    </tbody>
  </table>
</section>
