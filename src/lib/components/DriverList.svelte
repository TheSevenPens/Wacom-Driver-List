<script>
  import { base } from '$app/paths';
  import driversData from '$lib/data/wacom-drivers.json';

  let osFilter = $state('all');
  let versionFilter = $state('');
  let urlFilter = $state('all');
  let hasReleaseDate = $state(true);
  let sortField = $state('releaseDate');
  let sortOrder = $state('desc');

  const osFamilies = ['all', ...new Set(driversData.map((driver) => driver.OSFamily))];

  let filteredData = $derived(
    driversData
      .filter((driver) => {
        const matchesOS = osFilter === 'all' || driver.OSFamily === osFilter;
        const matchesVersion = driver.DriverVersion.toLowerCase().includes(versionFilter.toLowerCase());
        const matchesURL =
          urlFilter === 'all' ||
          (urlFilter === 'wacom' && driver.DriverURLWacom) ||
          (urlFilter === 'archive' && driver.DriverURLArchiveDotOrg);
        const matchesHasReleaseDate = (hasReleaseDate && driver.ReleaseDate) || !hasReleaseDate;
        return matchesOS && matchesVersion && matchesURL && matchesHasReleaseDate;
      })
      .sort((a, b) => {
        const multiplier = sortOrder === 'asc' ? 1 : -1;
        if (sortField === 'version') {
          return multiplier * a.DriverVersion.localeCompare(b.DriverVersion, undefined, { numeric: true });
        }
        if (!a.ReleaseDate && !b.ReleaseDate) return 0;
        if (!a.ReleaseDate) return multiplier * 1;
        if (!b.ReleaseDate) return multiplier * -1;
        return multiplier * (new Date(a.ReleaseDate) - new Date(b.ReleaseDate));
      })
  );

  function exportJSON() {
    const jsonStr = JSON.stringify(driversData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wacom-drivers.json';
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

<section class="card">
  <div class="container-flex">
    <div class="column-item">
      <p class="section-header">FILTERS</p>
      <hr />
      <div class="control">
        <label for="osFilter">OS</label>
        <select id="osFilter" bind:value={osFilter}>
          {#each osFamilies as os}
            <option value={os}>{os === 'all' ? 'All' : os}</option>
          {/each}
        </select>
      </div>
      <div class="control">
        <label for="versionFilter">Version</label>
        <input type="text" id="versionFilter" bind:value={versionFilter} placeholder="e.g., 6.3.46.2" />
      </div>
      <div class="control">
        <label for="urlFilter">Download source</label>
        <select id="urlFilter" bind:value={urlFilter}>
          <option value="all">Any</option>
          <option value="wacom">wacom.com</option>
          <option value="archive">archive.org</option>
        </select>
      </div>
      <div class="control check-row">
        <input type="checkbox" id="hasReleaseDate" bind:checked={hasReleaseDate} />
        <label for="hasReleaseDate">Has release date</label>
      </div>
    </div>

    <div class="column-item">
      <p class="section-header">SORTING</p>
      <hr />
      <div class="control">
        <label for="sortField">Sort by</label>
        <select id="sortField" bind:value={sortField}>
          <option value="releaseDate">Release Date</option>
          <option value="version">Driver Version</option>
        </select>
      </div>
      <div class="control">
        <label for="sortOrder">Sort order</label>
        <select id="sortOrder" bind:value={sortOrder}>
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
      </div>
    </div>

    <div class="column-item">
      <button onclick={exportJSON}>Export JSON</button>
    </div>
  </div>
</section>

<section class="card table-wrap">
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
      {#if filteredData.length === 0}
        <tr>
          <td colspan="5">No matching drivers</td>
        </tr>
      {:else}
        {#each filteredData as driver, index}
          <tr>
            <td class="version-value">{index + 1}</td>
            <td class="version-value"><a href="{base}/drivers/{encodeURIComponent(driver.DriverVersion)}">{driver.DriverVersion}</a></td>
            <td>{driver.OSFamily}</td>
            <td>{driver.ReleaseDate || '-'}</td>
            <td>
              {#if driver.DriverURLArchiveDotOrg || driver.DriverURLWacom || driver.ReleaseNotesURL}
                {#if driver.DriverURLWacom}
                  <a href={driver.DriverURLWacom} target="_blank" rel="noreferrer">Driver</a>
                {/if}
                {#if driver.DriverURLWacom && driver.DriverURLArchiveDotOrg}
                  ,
                {/if}
                {#if driver.DriverURLArchiveDotOrg}
                  <a href={driver.DriverURLArchiveDotOrg} target="_blank" rel="noreferrer">Driver (Archive)</a>
                {/if}
                {#if (driver.DriverURLWacom || driver.DriverURLArchiveDotOrg) && driver.ReleaseNotesURL}
                  ,
                {/if}
                {#if driver.ReleaseNotesURL}
                  <a href={driver.ReleaseNotesURL} target="_blank" rel="noreferrer">Notes</a>
                {/if}
              {:else}
                -
              {/if}
            </td>
          </tr>
        {/each}
      {/if}
    </tbody>
  </table>
</section>
