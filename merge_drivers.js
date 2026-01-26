const fs = require('fs');
const path = require('path');

const mainFile = 'wacom-drivers.json';
const additionsFile = 'wacom_driver_additions.json';

try {
    const mainData = JSON.parse(fs.readFileSync(mainFile, 'utf8'));
    const additionsData = JSON.parse(fs.readFileSync(additionsFile, 'utf8'));

    // Create a map for quick lookup by DriverUID
    const driverMap = new Map();

    // Load existing drivers
    mainData.forEach(driver => {
        if (driver.DriverUID) {
            driverMap.set(driver.DriverUID, driver);
        }
    });

    let addedCount = 0;
    let updatedCount = 0;

    // Merge additions
    additionsData.forEach(driver => {
        if (!driver.DriverUID) {
            console.warn('Skipping driver without DriverUID:', driver);
            return;
        }

        if (driverMap.has(driver.DriverUID)) {
            // Update existing (optional: could do partial updates, but full replace is safer for consistency)
            // Checking if anything actually changed could be done here, but let's just update.
            driverMap.set(driver.DriverUID, driver);
            updatedCount++;
        } else {
            // Add new
            driverMap.set(driver.DriverUID, driver);
            addedCount++;
        }
    });

    // Convert back to array
    const mergedList = Array.from(driverMap.values());

    // Sort by ReleaseDate (descending or ascending? The sample showed mix, but usually newer is better to see. 
    // The existing file seems vaguely chronological but not strictly sorted in the view I saw.
    // Let's sort descending (newest first) as that's usually most useful, 
    // OR try to respect existing order? 
    // Looking at the file content in Step 8:
    // 4.78-2 (2003) -> 4.78-6 (2005) ...
    // It seems to be Ascending (oldest first).
    // Let's stick to Ascending.

    mergedList.sort((a, b) => {
        const dateA = a.ReleaseDate || '';
        const dateB = b.ReleaseDate || '';

        // Handle empty dates (put them at the end? or beginning?)
        // In the file, empty dates were mixed in.
        // Let's just do standard string compare, empty string comes first usually.
        // If we want chronological, empty dates usually mean "unknown" or "very old" or "bundled".

        if (dateA === dateB) return 0;
        if (dateA === '') return 1; // Put empty dates at the end
        if (dateB === '') return -1;

        return dateA.localeCompare(dateB);
    });

    // Write back
    fs.writeFileSync(mainFile, JSON.stringify(mergedList, null, 2));

    console.log(`Merge complete. Added: ${addedCount}, Updated: ${updatedCount}, Total: ${mergedList.length}`);

} catch (err) {
    console.error('Error merging files:', err);
}
