import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

// Files to sync from
const vendorsCsv = 'd:/abar_aa/save/abar_vendors_2026-03-17.csv';
const recordsExcel = 'd:/abar_aa/save/abar_data_export_2026-03-17 (1).xlsx';

// Output files
const vendorsJsonPath = 'd:/abar_aa/src/data/vendors.json';
const recordsJsonPath = 'd:/abar_aa/src/data/records.json';

const parseNum = (val) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const cleaned = String(val).replace(/,/g, '');
    return Number(cleaned) || 0;
};

// 1. Process Vendors CSV
console.log('Reading vendors from:', vendorsCsv);
const csvContent = fs.readFileSync(vendorsCsv, 'utf8');
const vendorRows = csvContent.split('\n').filter(line => line.trim() !== '');
const vendorHeaders = vendorRows[0].split(','); // No,Code,Category,Name

const vendors = vendorRows.slice(1).map(row => {
    const cols = row.split(',');
    return {
        no: Number(cols[0]),
        code: cols[1],
        category: cols[2],
        name: cols[3],
        regDate: new Date().toISOString().slice(0, 10)
    };
}).filter(v => v.name);

fs.writeFileSync(vendorsJsonPath, JSON.stringify(vendors, null, 2));
console.log(`Saved ${vendors.length} vendors to ${vendorsJsonPath}`);

// 2. Process Records Excel
console.log('Reading records from:', recordsExcel);
const workbook = XLSX.readFile(recordsExcel);
const sheet = workbook.Sheets['Data'];
const recordsRaw = XLSX.utils.sheet_to_json(sheet);

const records = recordsRaw.map(r => {
    const dateVal = r['날짜/월'];
    let date = "";
    let month = "";

    if (typeof dateVal === 'string') {
        if (dateVal.length === 7) {
            month = dateVal;
            date = `${dateVal}-01`;
        } else {
            date = dateVal.slice(0, 10);
            month = dateVal.slice(0, 7);
        }
    } else {
        // Handle numeric date if any
        month = "2026-03";
        date = "2026-03-01";
    }

    const vName = r['거래처명'];
    const v = vendors.find(vend => vend.name === vName);

    return {
        id: Date.now() + Math.random(),
        date: date,
        month: month,
        vendorNo: v ? v.no : null,
        vendorName: vName,
        category: r['카테고리'] || (v ? v.category : '미분류'),
        sales: parseNum(r['매출']),
        purchases: parseNum(r['매입']),
        ads: parseNum(r['광고비']),
        commission: parseNum(r['수수료']),
        others: parseNum(r['기타비용'])
    };
});

fs.writeFileSync(recordsJsonPath, JSON.stringify(records, null, 2));
console.log(`Saved ${records.length} records to ${recordsJsonPath}`);
