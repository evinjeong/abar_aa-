import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const saveDir = './save';
const file = '2602.xlsx';
const filePath = path.join(saveDir, file);
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

console.log(`First 10 rows of ${file}:`);
console.log(JSON.stringify(json.slice(0, 10), null, 2));
