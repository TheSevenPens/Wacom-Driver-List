<script>
  import { page } from '$app/stores';
  import { base } from '$app/paths';
  import driversData from '$lib/data/wacom-drivers.json';

  let version = $derived(decodeURIComponent($page.params.version));

  let drivers = $derived(
    driversData.filter(d => d.DriverVersion === version)
  );
</script>

<a class="back-btn" href="{base}/drivers">&larr; Back to Driver List</a>

<section class="card">
  <h2>Driver {version}</h2>

  {#if drivers.length > 0}
    <table>
      <thead>
        <tr>
          <th class="table-header">OS</th>
          <th class="table-header">DATE</th>
          <th class="table-header">DOWNLOADS</th>
        </tr>
      </thead>
      <tbody>
        {#each drivers as driver}
          <tr>
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
  {:else}
    <p>No driver data found for this version.</p>
  {/if}
</section>
