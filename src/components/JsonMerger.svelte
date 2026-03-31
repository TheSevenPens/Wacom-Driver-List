<script>
  let baseData = $state(null);
  let changesData = $state(null);
  let baseFileName = $state('');
  let changesFileName = $state('');
  let baseStatus = $state('Waiting...');
  let changesStatus = $state('Waiting...');
  let baseLoaded = $state(false);
  let changesLoaded = $state(false);

  let conflicts = $state([]);

  let hiddenInputBase = $state(null);
  let hiddenInputChanges = $state(null);

  let countNew = $derived(conflicts.filter((c) => c.type === 'new').length);
  let countMod = $derived(conflicts.filter((c) => c.type === 'mod').length);
  let selectedCount = $derived(conflicts.filter((c) => c.selected).length);
  let isReady = $derived(!!(baseData && changesData));

  function onDragOver(event) {
    event.preventDefault();
  }

  function onDrop(event, type) {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      handleFile(file, type);
    }
  }

  function openFilePicker(type) {
    if (type === 'base') hiddenInputBase?.click();
    else hiddenInputChanges?.click();
  }

  async function handleFile(file, type) {
    try {
      const text = await file.text();
      const json = JSON.parse(text);

      if (!Array.isArray(json)) {
        throw new Error('JSON must be an array of records.');
      }

      if (type === 'base') {
        baseData = json;
        baseFileName = file.name;
        baseStatus = `Loaded: ${file.name} (${json.length} records)`;
        baseLoaded = true;
      } else {
        changesData = json;
        changesFileName = file.name;
        changesStatus = `Loaded: ${file.name} (${json.length} records)`;
        changesLoaded = true;
      }

      if (baseData && changesData) {
        runComparison();
      }
    } catch (error) {
      if (type === 'base') {
        baseStatus = 'Error parsing JSON';
        baseLoaded = false;
      } else {
        changesStatus = 'Error parsing JSON';
        changesLoaded = false;
      }
      console.error(error);
    }
  }

  function runComparison() {
    const baseMap = new Map(baseData.map((d) => [d.DriverUID, d]));
    const changesMap = new Map(changesData.map((d) => [d.DriverUID, d]));

    const result = [];

    for (const [id, newRecord] of changesMap.entries()) {
      if (!baseMap.has(id)) {
        result.push({
          id,
          type: 'new',
          baseRecord: null,
          newRecord,
          selected: true,
          fieldSelections: {},
        });
        continue;
      }

      const baseRecord = baseMap.get(id);
      if (JSON.stringify(baseRecord) !== JSON.stringify(newRecord)) {
        const allKeys = new Set([...Object.keys(baseRecord), ...Object.keys(newRecord)]);
        allKeys.delete('DriverUID');

        const fieldSelections = {};
        for (const key of allKeys) {
          if (baseRecord[key] !== newRecord[key]) {
            fieldSelections[key] = true;
          }
        }

        result.push({
          id,
          type: 'mod',
          baseRecord,
          newRecord,
          selected: true,
          fieldSelections,
        });
      }
    }

    conflicts = result;
  }

  function toggleRecord(index, checked) {
    conflicts[index].selected = checked;
  }

  function toggleField(conflictIndex, key, checked) {
    conflicts[conflictIndex].fieldSelections[key] = checked;
  }

  function exportMergedJSON() {
    const finalMap = new Map(baseData.map((d) => [d.DriverUID, d]));

    for (const item of conflicts) {
      if (!item.selected) continue;

      if (item.type === 'new') {
        finalMap.set(item.id, item.newRecord);
        continue;
      }

      const mixed = { ...item.baseRecord };
      const keys = Object.keys(item.fieldSelections);

      for (const key of keys) {
        if (!item.fieldSelections[key]) {
          continue;
        }

        if (item.newRecord[key] === undefined) {
          delete mixed[key];
        } else {
          mixed[key] = item.newRecord[key];
        }
      }

      finalMap.set(item.id, mixed);
    }

    const finalList = Array.from(finalMap.values()).sort((a, b) => {
      const dateA = a.ReleaseDate || '';
      const dateB = b.ReleaseDate || '';
      if (dateA === dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return dateA.localeCompare(dateB);
    });

    const blob = new Blob([JSON.stringify(finalList, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'wacom-drivers-merged.json';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function displayValue(value, missingText) {
    if (value === undefined || value === null || value === '') {
      return missingText;
    }
    return String(value);
  }
</script>

<section class="card merger-wrap">
  <div class="drop-zones">
    <input type="file" accept=".json" bind:this={hiddenInputBase} onchange={(e) => e.target.files[0] && handleFile(e.target.files[0], 'base')} hidden />
    <input
      type="file"
      accept=".json"
      bind:this={hiddenInputChanges}
      onchange={(e) => e.target.files[0] && handleFile(e.target.files[0], 'changes')}
      hidden
    />

    <button
      class="drop-zone"
      class:loaded={baseLoaded}
      ondragover={onDragOver}
      ondrop={(e) => onDrop(e, 'base')}
      onclick={() => openFilePicker('base')}
    >
      <h3>Base File</h3>
      <p>wacom-drivers.json</p>
      <div class="status">{baseStatus}</div>
      {#if baseFileName}<small>{baseFileName}</small>{/if}
    </button>

    <button
      class="drop-zone"
      class:loaded={changesLoaded}
      ondragover={onDragOver}
      ondrop={(e) => onDrop(e, 'changes')}
      onclick={() => openFilePicker('changes')}
    >
      <h3>Changes File</h3>
      <p>wacom_driver_additions.json</p>
      <div class="status">{changesStatus}</div>
      {#if changesFileName}<small>{changesFileName}</small>{/if}
    </button>
  </div>

  {#if isReady}
    <section class="comparison-area">
      <div class="diff-header">
        <h2>Merge Preview</h2>
        <div class="stats">
          <span>{countNew} New</span>
          <span>•</span>
          <span>{countMod} Modified</span>
        </div>
      </div>

      <div class="diff-list">
        {#each conflicts as item, index}
          <article class="diff-item" class:new-record={item.type === 'new'} class:modified-record={item.type === 'mod'} class:disabled={!item.selected}>
            <div class="diff-summary">
              <div>
                <span class="diff-tag" class:tag-new={item.type === 'new'} class:tag-mod={item.type === 'mod'}>
                  {item.type === 'new' ? 'New' : 'Modified'}
                </span>
                <span class="record-id">{item.id}</span>
              </div>
              <label>
                <input type="checkbox" bind:checked={item.selected} />
                include
              </label>
            </div>

            {#if item.type === 'new'}
              <div class="record-preview">{item.newRecord.DriverName || 'No Name'} ({item.newRecord.DriverVersion || 'Unknown version'})</div>
            {:else}
              <table class="field-diff-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>Field</th>
                    <th>Base Value</th>
                    <th>New Value</th>
                  </tr>
                </thead>
                <tbody>
                  {#each Object.keys(item.fieldSelections) as key}
                    <tr>
                      <td>
                        <input
                          type="checkbox"
                          bind:checked={item.fieldSelections[key]}
                        />
                      </td>
                      <td>{key}</td>
                      <td class="val-old">{displayValue(item.baseRecord[key], '(missing)')}</td>
                      <td class="val-new">{displayValue(item.newRecord[key], '(removed)')}</td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            {/if}
          </article>
        {/each}
      </div>
    </section>

    <div class="actions">
      <span>{selectedCount} records selected</span>
      <button class="primary" onclick={exportMergedJSON}>Export Merged JSON</button>
    </div>
  {/if}
</section>
