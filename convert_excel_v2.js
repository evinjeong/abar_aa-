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

const getVendor = (name) => {
    if (!name) return null;
    const cleanName = String(name).trim();
    if (cleanName.includes("합계") || cleanName.includes("이월") || cleanName.includes("누계") || cleanName === "거래처") return null;
    return vendors.find(v => v.name === cleanName) || { name: cleanName, category: '기타', no: null };
};

excelFiles.forEach(file => {
    const filePath = path.join(saveDir, file);
    if (!fs.existsSync(filePath)) return;

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    const fileNameMonth = file.replace('.xlsx', '').match(/\d+/)[0];
    const formattedMonth = `2026-${fileNameMonth.padStart(2, '0')}`;

    json.slice(1).forEach((row) => {
        // Sales side (Cols 0-3)
        if (row[1] && row[3]) {
            const v = getVendor(row[1]);
            if (v) {
                allRecords.push({
                    id: Date.now() + Math.random(),
                    date: row[0] ? String(row[0]).slice(0, 10) : `${formattedMonth}-01`,
                    month: formattedMonth,
                    vendorNo: v.no,
                    vendorName: v.name,
                    category: v.category,
                    sales: parseNum(row[3]),
                    purchases: 0, ads: 0, commission: 0, others: 0
                });
            }
        }
        // Purchase side (Cols 4-7)
        if (row[5] && row[7]) {
            const v = getVendor(row[5]);
            if (v) {
                allRecords.push({
                    id: Date.now() + Math.random(),
                    date: row[4] ? String(row[4]).slice(0, 10) : `${formattedMonth}-01`,
                    month: formattedMonth,
                    vendorNo: v.no,
                    vendorName: v.name,
                    category: v.category,
                    sales: 0,
                    purchases: parseNum(row[7]),
                    ads: 0, commission: 0, others: 0
                });
            }
        }
    });
});

fs.writeFileSync('./src/data/records.json', JSON.stringify(allRecords, null, 2));
console.log(`Converted ${allRecords.length} records to src/data/records.json`);
