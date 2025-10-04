import * as fs from 'fs';

// Define the interface for the driver data
interface WacomDriver {
    DriverVersion: string;
    DriverName: string;
    OSFamily: string;
    ReleaseDate: string;
    DriverURLWacom: string;
    DriverURLArchiveDotOrg: string;
    ReleaseNotesURL: string;
    DriverUID?: string; // Optional since we're adding it
}

// Read the JSON file
const data: WacomDriver[] = JSON.parse(fs.readFileSync('wacom-drivers.json', 'utf8'));

// Add DriverUID to each row
data.forEach(item => {
    item.DriverUID = `${item.DriverVersion}_${item.OSFamily}`;
});

// Write the modified data to a new JSON file
fs.writeFileSync('wacom-drivers-new.json', JSON.stringify(data, null, 2), 'utf8');