// State
const state = {
    baseFile: null,
    changesFile: null,
    baseData: null,
    changesData: null,
    conflicts: [], // Array of { id, type: 'new'|'mod', baseRecord, newRecord, selected: boolean, fieldSelections: { [key]: boolean } }
};

// DOM Elements
const dropBase = document.getElementById('dropBase');
const dropChanges = document.getElementById('dropChanges');
const comparisonArea = document.getElementById('comparisonArea');
const diffList = document.getElementById('diffList');
const mergeControls = document.getElementById('mergeControls');
const btnExport = document.getElementById('btnExport');
const statNew = document.getElementById('statNew');
const statMod = document.getElementById('statMod');
const selectionCount = document.getElementById('selectionCount');

// Setup Drag & Drop
function setupDropZone(element, fileType) {
    element.addEventListener('dragover', (e) => {
        e.preventDefault();
        element.classList.add('active');
    });

    element.addEventListener('dragleave', () => {
        element.classList.remove('active');
    });

    element.addEventListener('drop', (e) => {
        e.preventDefault();
        element.classList.remove('active');
        const file = e.dataTransfer.files[0];
        if (file) {
            handleFile(file, fileType, element);
        }
    });

    element.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) handleFile(file, fileType, element);
        };
        input.click();
    });
}

function handleFile(file, type, element) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const json = JSON.parse(e.target.result);
            state[type + 'Data'] = json;
            state[type + 'File'] = file.name;

            element.classList.add('loaded');
            element.querySelector('.status').textContent = `Loaded: ${file.name} (${json.length} records)`;
            element.querySelector('.status').style.color = 'var(--success)';

            checkReady();
        } catch (err) {
            console.error(err);
            element.querySelector('.status').textContent = 'Error parsing JSON';
            element.querySelector('.status').style.color = 'var(--danger)';
        }
    };
    reader.readAsText(file);
}

setupDropZone(dropBase, 'base');
setupDropZone(dropChanges, 'changes');

function checkReady() {
    if (state.baseData && state.changesData) {
        runComparison();
    }
}

function runComparison() {
    const baseMap = new Map(state.baseData.map(d => [d.DriverUID, d]));
    const changesMap = new Map(state.changesData.map(d => [d.DriverUID, d]));

    state.conflicts = [];

    // Identify New and Modified
    for (const [id, newRecord] of changesMap) {
        if (!baseMap.has(id)) {
            // New Record
            state.conflicts.push({
                id,
                type: 'new',
                baseRecord: null,
                newRecord,
                selected: true, // Default include new
                fieldSelections: {}
            });
        } else {
            // Check Modified
            const baseRecord = baseMap.get(id);
            if (JSON.stringify(baseRecord) !== JSON.stringify(newRecord)) {

                // Initialize field selections (all true by default for modified fields)
                const fieldSelections = {};
                const allKeys = new Set([...Object.keys(baseRecord), ...Object.keys(newRecord)]);
                allKeys.delete('DriverUID');

                for (const key of allKeys) {
                    if (baseRecord[key] !== newRecord[key]) {
                        fieldSelections[key] = true; // Default accept change
                    }
                }

                state.conflicts.push({
                    id,
                    type: 'mod',
                    baseRecord,
                    newRecord,
                    selected: true, // Default overwrite with new
                    fieldSelections
                });
            }
        }
    }

    renderDiffs();
    comparisonArea.classList.remove('hidden');
    mergeControls.classList.remove('hidden'); // Show controls
}

function renderDiffs() {
    diffList.innerHTML = '';

    let countNew = 0;
    let countMod = 0;

    state.conflicts.forEach((item) => {
        if (item.type === 'new') countNew++;
        if (item.type === 'mod') countMod++;

        const el = document.createElement('div');
        el.className = `diff-item ${item.type === 'new' ? 'new-record' : 'modified-record'}`;

        // Header
        const summary = document.createElement('div');
        summary.className = 'diff-summary';

        const info = document.createElement('div');
        info.innerHTML = `
            <span class="diff-tag ${item.type === 'new' ? 'tag-new' : 'tag-mod'}">${item.type === 'new' ? 'New' : 'Modified'}</span>
            <span class="record-id">${item.id}</span>
        `;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = item.selected;
        checkbox.title = "Include this record in output";
        checkbox.onchange = (e) => {
            item.selected = e.target.checked;
            // Visual feedback for disabled record
            if (!item.selected) {
                el.style.opacity = '0.5';
            } else {
                el.style.opacity = '1';
            }
            updateStats();
        };

        summary.appendChild(info);
        summary.appendChild(checkbox);
        el.appendChild(summary);

        // Content
        if (item.type === 'mod') {
            const table = document.createElement('table');
            table.className = 'field-diff-table';
            let hasVisibleDiffs = false;

            // Header
            const thead = document.createElement('thead');
            thead.innerHTML = `<tr><th style="width: 30px;"></th><th>Field</th><th>Base Value</th><th>New Value</th></tr>`;
            table.appendChild(thead);

            const tbody = document.createElement('tbody');

            // Compare all keys
            const allKeys = new Set([...Object.keys(item.baseRecord), ...Object.keys(item.newRecord)]);
            allKeys.delete('DriverUID'); // Don't show ID diff (it's the key)

            for (const key of allKeys) {
                const valBase = item.baseRecord[key];
                const valNew = item.newRecord[key];

                if (valBase !== valNew) {
                    hasVisibleDiffs = true;
                    const row = document.createElement('tr');

                    // Checkbox cell
                    const checkCell = document.createElement('td');
                    const fieldCheck = document.createElement('input');
                    fieldCheck.type = 'checkbox';
                    fieldCheck.checked = item.fieldSelections[key];
                    fieldCheck.title = "Accept change for this field";
                    fieldCheck.onchange = (e) => {
                        item.fieldSelections[key] = e.target.checked;
                    };
                    checkCell.appendChild(fieldCheck);
                    row.appendChild(checkCell);

                    // Field name
                    const fieldNameCell = document.createElement('td');
                    fieldNameCell.textContent = key;
                    row.appendChild(fieldNameCell);

                    // Base Value
                    const baseValCell = document.createElement('td');
                    baseValCell.className = 'val-old';
                    baseValCell.innerHTML = valBase !== undefined ? valBase : '<em>(missing)</em>';
                    row.appendChild(baseValCell);

                    // New Value
                    const newValCell = document.createElement('td');
                    newValCell.className = 'val-new';
                    newValCell.innerHTML = valNew !== undefined ? valNew : '<em>(removed)</em>';
                    row.appendChild(newValCell);

                    tbody.appendChild(row);
                }
            }
            table.appendChild(tbody);

            if (hasVisibleDiffs) {
                el.appendChild(table);
            } else {
                el.innerHTML += `<div style="padding:0.5rem; color: var(--text-secondary); font-style: italic;">No changes detected (or ignored fields only).</div>`;
            }

        } else {
            // New Record Preview (Simple)
            const details = document.createElement('div');
            details.style.fontSize = '0.85rem';
            details.style.color = 'var(--text-secondary)';
            details.textContent = `${item.newRecord.DriverName || 'No Name'} (${item.newRecord.DriverVersion})`;
            el.appendChild(details);
        }

        diffList.appendChild(el);
    });

    statNew.textContent = `${countNew} New`;
    statMod.textContent = `${countMod} Modified`;
    updateStats();
}

function updateStats() {
    const count = state.conflicts.filter(c => c.selected).length;
    selectionCount.textContent = `${count} records selected`;
}

btnExport.addEventListener('click', () => {
    // Start with base data
    const finalMap = new Map(state.baseData.map(d => [d.DriverUID, d]));

    // Apply selected changes
    state.conflicts.forEach(item => {
        if (item.selected) {
            if (item.type === 'new') {
                finalMap.set(item.id, item.newRecord);
            } else if (item.type === 'mod') {
                // Determine the mixed record
                const base = item.baseRecord;
                const newer = item.newRecord;

                // Start with base
                const mixed = { ...base };

                // Apply ONLY selected fields
                const keys = Object.keys(item.fieldSelections);
                keys.forEach(key => {
                    if (item.fieldSelections[key] === true) {
                        // Apply the new value (or removal if undefined)
                        if (newer[key] === undefined) {
                            delete mixed[key];
                        } else {
                            mixed[key] = newer[key];
                        }
                    }
                    // If false, we do nothing, effectively keeping 'base' value
                });

                finalMap.set(item.id, mixed);
            }
        }
    });

    // Convert to array
    const finalList = Array.from(finalMap.values());

    // Sort by Date (Same logic as main app)
    finalList.sort((a, b) => {
        const dateA = a.ReleaseDate || '';
        const dateB = b.ReleaseDate || '';
        if (dateA === dateB) return 0;
        if (dateA === '') return 1;
        if (dateB === '') return -1;
        return dateA.localeCompare(dateB);
    });

    // Download
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(finalList, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "wacom-drivers-merged.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
});
