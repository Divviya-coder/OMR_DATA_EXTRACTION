const fs = require('fs');
const path = require('path');
const csvParser = require('csv-parser');

async function convertCsvToJson(folderPath) {
    // Function to find a CSV file in the folder
    const findCsvFile = (folderPath) => {
        const files = fs.readdirSync(folderPath);
        const csvFile = files.find((file) => file.endsWith('.csv'));
        return csvFile ? path.join(folderPath, csvFile) : null;
    };

    const filePath = findCsvFile(folderPath);

    if (!filePath) {
        throw new Error(`No CSV file found in folder: ${folderPath}`);
    }

    const results = [];

    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csvParser())
            .on('data', (row) => {
                // Process the `q100` field if it exists
                if (row.q100) {
                    row.q100 = row.q100.replace(/[\r\n]/g, '').trim(); // Remove \r, \n, and extra spaces
                    row.q100 = row.q100.replace(/^['"]|['"]$/g, '');  // Remove surrounding quotes
                }
                results.push(row);
            })
            .on('end', () => resolve(results)) // Return the cleaned JSON data
            .on('error', (error) => reject(error));
    });
}

module.exports = { convertCsvToJson };
