import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const saveDir = './save';
const excelFiles = ['2601.xlsx', '2602.xlsx'];

let allRecords = [];
let allVendors = new Set();
let vendorsList = [];

const parseNum = (val) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const cleaned = String(val).replace(/,/g, '');
    return Number(cleaned) || 0;
};

// 1. Collect ALL unique vendors first
excelFiles.forEach(file => {
    const filePath = path.join(saveDir, file);
    if (!fs.existsSync(filePath)) return;

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    json.slice(1).forEach(row => {
        const v1 = row[1] ? String(row[1]).trim() : null;
        const v2 = row[5] ? String(row[5]).trim() : null;

        const isBlacklisted = (n) => !n || n.includes("합계") || n.includes("이월") || n.includes("누계") || n === "거래처";

        if (v1 && !isBlacklisted(v1)) allVendors.add(v1);
        if (v2 && !isBlacklisted(v2)) allVendors.add(v2);
    });
});

// Create vendors mapping
let nextNo = 1001;
const vendorsArray = Array.from(allVendors).map(name => {
    let category = "업체";
    if (name.includes("쇼핑") || name.includes("스토어") || name.includes("네이버") || name.includes("쿠팡") || name.includes("알리") || name.includes("지마켓") || name.includes("옥션") || name.includes("11번가") || name.includes("티몬") || name.includes("위메프")) {
        category = name.includes("TV") || name.includes("방송") || name.includes("쇼핑") && !name.includes("몰") ? "홈쇼핑" : "쇼핑몰";
    }
    return {
        no: nextNo++,
        name: name,
        code: String(nextNo + 500),
        category: category
    };
});

// 2. Process Records with the NEW vendor list
excelFiles.forEach(file => {
    const filePath = path.join(saveDir, file);
    if (!fs.existsSync(filePath)) return;

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    const fileNameMonthRaw = file.replace('.xlsx', '').match(/\d+/)[0];
    const monthNum = fileNameMonthRaw.slice(-2);
    const formattedMonth = `2026-${monthNum.padStart(2, '0')}`;

    json.slice(1).forEach((row) => {
        // Sales side (Cols 0-3)
        if (row[1] && row[3]) {
            const vName = String(row[1]).trim();
            const v = vendorsArray.find(v => v.name === vName);
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
            const vName = String(row[5]).trim();
            const v = vendorsArray.find(v => v.name === vName);
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

fs.writeFileSync('./src/data/vendors.json', JSON.stringify(vendorsArray, null, 2));
fs.writeFileSync('./src/data/records.json', JSON.stringify(allRecords, null, 2));

console.log(`Clean Upload: Added ${vendorsArray.length} vendors and ${allRecords.length} records.`);
