import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const saveDir = './save';
const files = fs.readdirSync(saveDir).filter(f => f.endsWith('.xlsx') && !f.startsWith('~$'));

files.forEach(file => {
    const filePath = path.join(saveDir, file);
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    console.log(`File: ${file}, Rows: ${json.length}`);
});
