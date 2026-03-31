<script>
  import { page } from '$app/stores';
  import { base } from '$app/paths';
  import driversData from '$lib/data/wacom-drivers.json';
  import productsData from '$lib/data/wacom-products.json';
  import { isVersionInRange } from '$lib/versionUtils.js';

  let productName = $derived(decodeURIComponent($page.params.name));

  let product = $derived(productsData.find(p => p.name === productName));

  let compatibleDrivers = $derived(
    product
      ? driversData
          .filter(d => isVersionInRange(d.DriverVersion, product.drivermin, product.drivermax))
          .sort((a, b) => {
            if (!a.ReleaseDate && !b.ReleaseDate) return 0;
            if (!a.ReleaseDate) return 1;
            if (!b.ReleaseDate) return -1;
            return new Date(b.ReleaseDate) - new Date(a.ReleaseDate);
          })
      : []
  );
</script>

<a class="back-btn" href="{base}/products">&larr; Back to Products</a>

<section class="card">
  <h2>{productName}</h2>

  {#if product}
    <table>
      <tbody>
        <tr><td class="version-value">Model</td><td>{product.model || '-'}</td></tr>
        <tr><td class="version-value">Platforms</td><td>{product.platforms.join(', ')}</td></tr>
        <tr><td class="version-value">Min Driver</td><td>{product.drivermin || '-'}</td></tr>
        <tr><td class="version-value">Max Driver</td><td>{product.drivermax || 'Current'}</td></tr>
      </tbody>
    </table>
  {:else}
    <p>Product not found.</p>
  {/if}
</section>

<section class="card">
  <h3>Compatible Drivers ({compatibleDrivers.length})</h3>

  {#if compatibleDrivers.length === 0}
    <p>No compatible drivers found for this product.</p>
  {:else}
    <table>
      <thead>
        <tr>
          <th class="table-header">#</th>
          <th class="table-header">VERSION</th>
          <th class="table-header">OS</th>
          <th class="table-header">DATE</th>
          <th class="table-header">DOWNLOADS</th>
        </tr>
      </thead>
      <tbody>
        {#each compatibleDrivers as driver, index}
          <tr>
            <td>{index + 1}</td>
            <td class="version-value"><a href="{base}/drivers/{encodeURIComponent(driver.DriverVersion)}">{driver.DriverVersion}</a></td>
            <td>{driver.OSFamily}</td>
            <td>{driver.ReleaseDate || '-'}</td>
            <td>
              {#if driver.DriverURLWacom}
                <a href={driver.DriverURLWacom} target="_blank" rel="noreferrer">Driver</a>
              {/if}
              {#if driver.DriverURLWacom && driver.DriverURLArchiveDotOrg},{/if}
              {#if driver.DriverURLArchiveDotOrg}
                <a href={driver.DriverURLArchiveDotOrg} target="_blank" rel="noreferrer">Driver (Archive)</a>
              {/if}
              {#if (driver.DriverURLWacom || driver.DriverURLArchiveDotOrg) && driver.ReleaseNotesURL},{/if}
              {#if driver.ReleaseNotesURL}
                <a href={driver.ReleaseNotesURL} target="_blank" rel="noreferrer">Notes</a>
              {/if}
              {#if !driver.DriverURLWacom && !driver.DriverURLArchiveDotOrg && !driver.ReleaseNotesURL}-{/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</section>
