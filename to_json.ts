import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

const excelFilePath = path.join(__dirname, 'wacom-drivers.xlsx');
const jsonOutputPath = path.join(__dirname, 'wacom-drivers-temp2.json');

function main() {
    try {
        // Read the Excel file from disk
        const fileBuffer = fs.readFileSync(excelFilePath);

        // Parse the workbook
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

        // Get the first sheet (WacomDrivers)
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert sheet to JSON array of objects
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { "defval": "" });

        // Write JSON to file
        fs.writeFileSync(jsonOutputPath, JSON.stringify(jsonData, null, 2));

        console.log(`Successfully converted ${excelFilePath} to ${jsonOutputPath}`);
        console.log(`Generated JSON with ${jsonData.length} rows.`);
    } catch (error) {
        console.error('Error processing Excel file:', error);
    }
}

main();


