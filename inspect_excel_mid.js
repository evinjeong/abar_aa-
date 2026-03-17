import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const saveDir = './save';
const file = '2601.xlsx';
const filePath = path.join(saveDir, file);
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

console.log(`Rows 10 to 30 of ${file}:`);
console.log(JSON.stringify(json.slice(10, 30), null, 2));
