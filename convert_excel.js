import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const vendors = JSON.parse(fs.readFileSync('./src/data/vendors.json', 'utf8'));
const saveDir = './save';
const excelFiles = ['2601.xlsx', '2602.xlsx'];
let allRecords = [];

const parseNum = (val) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const cleaned = String(val).replace(/,/g, '');
    return Number(cleaned) || 0;
};

excelFiles.forEach(file => {
    const filePath = path.join(saveDir, file);
    if (!fs.existsSync(filePath)) return;

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    const month = file.replace('.xlsx', '').match(/\d+/)[0];
    const formattedMonth = `2026-${month.padStart(2, '0')}`;

    json.slice(1).forEach((row, idx) => {
        if (!row[1]) return;
        const vendorName = String(row[1]).trim();
        const matchedVendor = vendors.find(v => v.name === vendorName);

        allRecords.push({
            id: Date.now() + Math.random(),
            date: row[0] ? String(row[0]).slice(0, 10) : `${formattedMonth}-01`,
            month: formattedMonth,
            vendorNo: matchedVendor ? matchedVendor.no : null,
            vendorName: matchedVendor ? matchedVendor.name : vendorName,
            category: matchedVendor ? matchedVendor.category : '기타',
            sales: parseNum(row[2]),
            purchases: parseNum(row[3]),
            ads: parseNum(row[4]),
            commission: parseNum(row[5]),
            others: parseNum(row[6])
        });
    });
});

fs.writeFileSync('./src/data/records.json', JSON.stringify(allRecords, null, 2));
console.log(`Converted ${allRecords.length} records to src/data/records.json`);
