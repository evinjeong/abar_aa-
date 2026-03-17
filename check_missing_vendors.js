import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const vendors = JSON.parse(fs.readFileSync('./src/data/vendors.json', 'utf8'));
const saveDir = './save';
const excelFiles = ['2601.xlsx', '2602.xlsx'];
let excelVendorNames = new Set();

excelFiles.forEach(file => {
    const filePath = path.join(saveDir, file);
    if (!fs.existsSync(filePath)) return;

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    json.slice(1).forEach(row => {
        if (row[1]) excelVendorNames.add(String(row[1]).trim());
    });
});

const existingNames = new Set(vendors.map(v => v.name));
const missingNames = [...excelVendorNames].filter(name => !existingNames.has(name));

console.log("Missing Vendors in vendors.json:");
console.log(JSON.stringify(missingNames, null, 2));
