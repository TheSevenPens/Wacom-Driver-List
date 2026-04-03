<script>
  import { page } from '$app/stores';
  import { base } from '$app/paths';
  import driversData from '$lib/data/drivers.js';

  let version = $derived(decodeURIComponent($page.params.version));

  let drivers = $derived(
    driversData.filter(d => d.DriverVersion === version)
  );

  let downloads = $derived(
    drivers.flatMap(driver => {
      const rows = [];
      if (driver.DriverURLWacom) {
        rows.push({ os: driver.OSFamily, date: driver.ReleaseDate, label: 'Driver', source: 'wacom.com', url: driver.DriverURLWacom });
      }
      if (driver.DriverURLArchiveDotOrg) {
        rows.push({ os: driver.OSFamily, date: driver.ReleaseDate, label: 'Driver', source: 'archive.org', url: driver.DriverURLArchiveDotOrg });
      }
      if (driver.ReleaseNotesURL) {
        rows.push({ os: driver.OSFamily, date: driver.ReleaseDate, label: 'Release Notes', source: '', url: driver.ReleaseNotesURL });
      }
      return rows;
    })
  );
</script>

<a class="back-btn" href="{base}/drivers">&larr; Back to Driver List</a>

<section class="card">
  <h2>Driver {version}</h2>

  {#if downloads.length > 0}
    <table>
      <thead>
        <tr>
          <th>OS</th>
          <th>DATE</th>
          <th>DOWNLOAD</th>
          <th>URL</th>
        </tr>
      </thead>
      <tbody>
        {#each downloads as dl}
          <tr>
            <td>{dl.os}</td>
            <td>{dl.date || '-'}</td>
            <td><a href={dl.url} target="_blank" rel="noreferrer">{dl.label}</a>{#if dl.source}&nbsp;({dl.source}){/if}</td>
            <td class="url-cell"><a href={dl.url} target="_blank" rel="noreferrer">{dl.url}</a></td>
          </tr>
        {/each}
      </tbody>
    </table>
  {:else}
    <p>No downloads found for this version.</p>
  {/if}
</section>
