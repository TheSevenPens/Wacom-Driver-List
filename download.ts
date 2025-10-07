import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as os from 'os';

// Interface for driver data structure
interface Driver {
    DriverVersion: string;
    DriverName: string;
    OSFamily: string;
    ReleaseDate: string;
    DriverURLWacom: string;
    DriverURLArchiveDotOrg: string;
    ReleaseNotesURL: string;
    DriverUID: string;
}

// Function to pause execution
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Function to download a file
async function downloadFile(url: string, dest: string): Promise<void> {
    if (!url) return;

    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download ${url}: Status ${response.statusCode}`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => reject(err));
        });
    });
}

async function do_download(url:string,dest:string)
{
    const fileName = path.basename(url);
    console.log(`Downloading ${url} to ${dest}`);
    if (fs.existsSync(dest)) {
        console.log(`File ${fileName} already exists. Skipping download.`);
    }
    else
    {
        await downloadFile(url, dest);
        //console.log(`Finished downloading ${driverFileName}`);
        await sleep(3000); // Pause for 3 seconds
    }

}
// Main function to process the JSON and download files
async function processDrivers() {
    try {
        // Read JSON file
        const jsonData = fs.readFileSync('wacom-drivers.json', 'utf8');
        const drivers: Driver[] = JSON.parse(jsonData);

        // Base directory for downloads
        //const baseDir = path.join(os.homedir(), 'Documents', 'WacomDownloads');
        const baseDir = "/Volumes/username/Resources/Driver_Archive/Wacom_Drivers";
        // Create base directory if it doesn't exist
        if (!fs.existsSync(baseDir)) {
            fs.mkdirSync(baseDir, { recursive: true });
        }

        // Process each driver
        for (const driver of drivers) {
            try {
                // Create folder for DriverUID
                const driverDir = path.join(baseDir, driver.DriverUID);
                if (!fs.existsSync(driverDir)) {
                    fs.mkdirSync(driverDir, { recursive: true });
                }

                // Download DriverURLWacom
                if (driver.DriverURLWacom) {
                    const driverFileName = path.basename(driver.DriverURLWacom);
                    const driverDest = path.join(driverDir, driverFileName);
                    do_download(driver.DriverURLWacom, driverDest);
                }

                // Download ReleaseNotesURL
                if (driver.ReleaseNotesURL) {
                    const notesFileName = path.basename(driver.ReleaseNotesURL);
                    const notesDest = path.join(driverDir, notesFileName);
                    do_download(driver.ReleaseNotesURL, notesDest);
                }
            } catch (err) {
                console.error(`Error processing driver ${driver.DriverUID}:`, err);
            }
        }

        console.log('All downloads completed');
    } catch (err) {
        console.error('Error reading or processing JSON file:', err);
    }
}

// Execute the main function
processDrivers().catch(console.error);