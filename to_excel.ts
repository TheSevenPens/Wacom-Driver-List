import * as fs from 'fs';
import * as XLSX from 'xlsx';

// Define the interface for your JSON record schema (adjust as needed)
interface Record {
    [key: string]: string | number | boolean | null;
}

// Function to load JSON and convert to XLSX
function convertJsonToXlsx(jsonFilePath: string, outputFilePath: string): void {
    try {
        // Read and parse JSON file
        const rawData = fs.readFileSync(jsonFilePath, 'utf-8');
        const jsonData: Record[] = JSON.parse(rawData);

        // Convert JSON to worksheet
        const worksheet = XLSX.utils.json_to_sheet(jsonData);

        // Create a new workbook and append the worksheet
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

        // Write the workbook to an XLSX file
        XLSX.writeFile(workbook, outputFilePath);
        console.log(`Successfully converted ${jsonFilePath} to ${outputFilePath}`);
    } catch (error) {
        console.error('Error converting JSON to XLSX:', error);
    }
}

// Example usage
const jsonFilePath = 'wacom-drivers.json';
const outputFilePath = 'wacom-drivers.xlsx';
convertJsonToXlsx(jsonFilePath, outputFilePath);