import React, { useState, useRef } from 'react';
import {
    Save, Calendar, Trash2, Upload, FileSpreadsheet,
    CheckCircle, AlertCircle, ChevronRight, Search, Download
} from 'lucide-react';
import * as XLSX from 'xlsx';

const DataEntry = ({ vendors, records, onSave, onVendorSave, mappings, onMappingSave }) => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10)); // Default to full date
    const [selectedVendorNo, setSelectedVendorNo] = useState('');
    const [formData, setFormData] = useState({
        sales: 0,
        purchases: 0,
        ads: 0,
        commission: 0,
        others: 0
    });

    const [editingId, setEditingId] = useState(null); // For editing existing records
    const [editForm, setEditForm] = useState(null); // Form state for editing
    const [filterDateStart, setFilterDateStart] = useState("");
    const [filterDateEnd, setFilterDateEnd] = useState("");
    const [filterVendor, setFilterVendor] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const recordsPerPage = 20;
    const [selectedIds, setSelectedIds] = useState([]);

    const [uploadPreview, setUploadPreview] = useState([]);
    const [activePicker, setActivePicker] = useState(null); // Track which row is being edited
    const [entryMode, setEntryMode] = useState('daily'); // 'daily' or 'monthly'
    const fileInputRef = useRef(null);

    const parseNum = (val) => {
        if (typeof val === 'number') return val;
        if (!val) return 0;
        const cleaned = String(val).replace(/,/g, '');
        return Number(cleaned) || 0;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: parseNum(value) }));
    };

    const handleSaveManual = (e) => {
        e.preventDefault();
        if (!selectedVendorNo) {
            alert("거래처를 선택하세요.");
            return;
        }

        const vendor = vendors.find(v => v.no === Number(selectedVendorNo));

        let finalDate = selectedDate;
        let finalMonth = selectedDate.slice(0, 7);

        // If monthly mode, format the date correctly
        if (entryMode === 'monthly' && selectedDate.length === 7) {
            finalDate = `${selectedDate}-01`;
            finalMonth = selectedDate;
        }

        const newRecord = {
            id: Date.now(),
            date: finalDate,
            month: finalMonth,
            vendorNo: vendor.no,
            vendorName: vendor.name,
            category: vendor.category,
            ...formData
        };

        onSave([...records, newRecord]);
        setFormData({ sales: 0, purchases: 0, ads: 0, commission: 0, others: 0 });
        alert("데이터가 저장되었습니다.");
    };

    const handleExcelUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            if (json.length < 2) {
                alert("데이터가 부족하거나 올바른 엑셀 형식이 아닙니다.");
                return;
            }

            // --- Smart Column Detection ---
            const firstRow = json[0] || [];
            let colMap = { date: -1, vendor: -1, sales: -1, purchases: -1, ads: -1, commission: -1, others: -1 };

            firstRow.forEach((cell, idx) => {
                const header = String(cell || "").trim();
                if (header.includes("날짜") || header.includes("일자") || header.includes("Date")) colMap.date = idx;
                if (header.includes("거래처") || header.includes("업체") || header.includes("Vendor")) colMap.vendor = idx;
                if (header.includes("매출") || header.includes("판매") || header.includes("Sales")) colMap.sales = idx;
                if (header.includes("매입") || header.includes("구매") || header.includes("Purchase")) colMap.purchases = idx;
                if (header.includes("광고") || header.includes("Ads")) colMap.ads = idx;
                if (header.includes("수수료") || header.includes("Fee")) colMap.commission = idx;
                if (header.includes("기타") || header.includes("운영") || header.includes("Other")) colMap.others = idx;
            });

            // Fallback to defaults if headers not found (0: Date, 1: Vendor, 2: Sales, 3: Purchases, 4: Ads, 5: Commission, 6: Others)
            if (colMap.date === -1) colMap.date = 0;
            if (colMap.vendor === -1) colMap.vendor = 1;
            if (colMap.sales === -1) colMap.sales = 2;
            if (colMap.purchases === -1) colMap.purchases = 3;
            if (colMap.ads === -1) colMap.ads = 4;
            if (colMap.commission === -1) colMap.commission = 5;
            if (colMap.others === -1) colMap.others = 6;

            const parsed = json.slice(1).map((row, idx) => {
                const vendorName = String(row[colMap.vendor] || "").trim();
                if (!vendorName) return null;

                // Matching logic: 1. Direct name match, 2. History (mappings) match
                let matchedVendor = vendors.find(v => v.name === vendorName);
                if (!matchedVendor && mappings[vendorName]) {
                    matchedVendor = vendors.find(v => v.no === mappings[vendorName]);
                }

                let rawDate = String(row[colMap.date] || "");
                let month = "";
                let date = "";

                if (rawDate.length === 7) {
                    month = rawDate;
                    date = `${rawDate}-01`;
                } else if (rawDate.length >= 10) {
                    date = rawDate.slice(0, 10);
                    month = rawDate.slice(0, 7);
                } else {
                    month = new Date().toISOString().slice(0, 7);
                    date = new Date().toISOString().slice(0, 10);
                }

                return {
                    tempId: idx,
                    date,
                    month,
                    vendorName,
                    vendorNo: matchedVendor ? matchedVendor.no : null,
                    category: matchedVendor ? matchedVendor.category : '미분류',
                    sales: parseNum(row[colMap.sales]),
                    purchases: parseNum(row[colMap.purchases]),
                    ads: parseNum(row[colMap.ads]),
                    commission: parseNum(row[colMap.commission]),
                    others: parseNum(row[colMap.others]),
                    isMatched: !!matchedVendor
                };
            }).filter(item => item !== null);

            setUploadPreview(parsed);
        };
        reader.readAsArrayBuffer(file);
    };

    const handlePreviewVendorChange = (tempId, vendorNo) => {
        if (vendorNo === "DIRECT_OTHER") {
            setUploadPreview(prev => prev.map(item => {
                if (item.tempId === tempId) {
                    return {
                        ...item,
                        vendorNo: null,
                        category: '기타', // Set category to '기타'
                        isMatched: true // Manual "Other" is always considered valid
                    };
                }
                return item;
            }));
            return;
        }

        const vendor = vendors.find(v => v.no === Number(vendorNo));
        if (vendor) {
            // Find the preview item to get its original name
            const previewItem = uploadPreview.find(p => p.tempId === tempId);
            if (previewItem && previewItem.vendorName) {
                // Learn this mapping for future
                onMappingSave({ ...mappings, [previewItem.vendorName]: vendor.no });
            }
        }

        setUploadPreview(prev => prev.map(item => {
            if (item.tempId === tempId) {
                return {
                    ...item,
                    vendorNo: vendor ? vendor.no : null,
                    vendorName: vendor ? vendor.name : item.vendorName,
                    category: vendor ? vendor.category : (item.category === '기타' ? '기타' : '미분류'),
                    isMatched: !!vendor || item.category === '기타'
                };
            }
            return item;
        }));
    };

    const deletePreviewRow = (tempId) => {
        setUploadPreview(prev => prev.filter(item => item.tempId !== tempId));
    };

    const handleExcelRowUpdate = (tempId, field, value) => {
        setUploadPreview(prev => prev.map(item =>
            item.tempId === tempId ? { ...item, [field]: parseNum(value) } : item
        ));
    };

    const handleQuickVendorAdd = (tempId, vendorName) => {
        if (!vendorName) return;
        const category = window.prompt(`'${vendorName}' 업체의 카테고리를 입력하세요 (쇼핑몰, 홈쇼핑, 업체, 기타)`, "업체");
        if (!category) return;

        const newVendor = {
            no: vendors.length > 0 ? Math.max(...vendors.map(v => v.no)) + 1 : 1,
            name: vendorName,
            category: category,
            regDate: new Date().toISOString().slice(0, 10)
        };

        const updatedVendors = [...vendors, newVendor];
        onVendorSave(updatedVendors);

        // Also learn this mapping immediately
        onMappingSave({ ...mappings, [vendorName]: newVendor.no });

        // After saving vendor, immediately match it in the preview
        handlePreviewVendorChange(tempId, newVendor.no);
    };

    // custom picker component
    // custom picker component with inline editing
    const VendorPicker = ({ item }) => {
        const [search, setSearch] = useState("");
        const [isEditingSales, setIsEditingSales] = useState(false);
        const [isEditingPurchases, setIsEditingPurchases] = useState(false);
        const isOpen = activePicker === item.tempId;
        const filtered = vendors.filter(v => v.name.toLowerCase().includes(search.toLowerCase()));

        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ position: 'relative', width: '220px' }}>
                    <div
                        onClick={() => setActivePicker(isOpen ? null : item.tempId)}
                        style={{
                            padding: '8px 12px',
                            border: item.isMatched || item.category === '기타' ? '1px solid rgba(255,255,255,0.1)' : '1px solid var(--danger)',
                            borderRadius: '6px',
                            background: 'rgba(0,0,0,0.2)',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}
                    >
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.category === '기타' && !item.vendorNo ? "직접입력(기타)" : (vendors.find(v => v.no === item.vendorNo)?.name || "거래처 선택...")}
                        </span>
                        <ChevronRight size={14} style={{ transform: isOpen ? 'rotate(90deg)' : 'none', transition: '0.2s' }} />
                    </div>

                    {isOpen && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            background: '#1e293b',
                            border: '1px solid var(--primary)',
                            borderRadius: '8px',
                            zIndex: 100,
                            marginTop: '4px',
                            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)',
                            overflow: 'hidden'
                        }}>
                            <div style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '8px', background: '#0f172a' }}>
                                <Search size={14} color="var(--text-muted)" />
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="거래처 키워드 검색..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    style={{ width: '100%', padding: '4px 0', fontSize: '0.8rem', background: 'transparent', border: 'none', color: '#fff', outline: 'none' }}
                                />
                            </div>
                            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                <div
                                    onClick={() => { handlePreviewVendorChange(item.tempId, "DIRECT_OTHER"); setActivePicker(null); }}
                                    style={{ padding: '10px 12px', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                                >
                                    + 기타 비용으로 처리 (원본 명칭 저장)
                                </div>
                                {filtered.map(v => (
                                    <div
                                        key={v.no}
                                        onClick={() => { handlePreviewVendorChange(item.tempId, v.no); setActivePicker(null); }}
                                        style={{ padding: '10px 12px', cursor: 'pointer', fontSize: '0.8rem', borderBottom: '1px dotted rgba(255,255,255,0.05)' }}
                                        className="hover-bg"
                                    >
                                        {v.name} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>({v.category})</span>
                                    </div>
                                ))}
                                {filtered.length === 0 && search && (
                                    <div
                                        onClick={() => { handleQuickVendorAdd(item.tempId, search); setActivePicker(null); }}
                                        style={{ padding: '15px 12px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(16, 185, 129, 0.05)' }}
                                    >
                                        + '{search}' 새 업체로 즉시 등록
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <div className="input-group" style={{ margin: 0 }}>
                        <input
                            type="text"
                            value={item.sales}
                            onChange={(e) => handleExcelRowUpdate(item.tempId, 'sales', e.target.value)}
                            style={{ width: '90px', padding: '6px', fontSize: '0.8rem', textAlign: 'right', color: 'var(--primary)' }}
                            placeholder="매출"
                            title="매출액"
                        />
                    </div>
                    <div className="input-group" style={{ margin: 0 }}>
                        <input
                            type="text"
                            value={item.purchases}
                            onChange={(e) => handleExcelRowUpdate(item.tempId, 'purchases', e.target.value)}
                            style={{ width: '90px', padding: '6px', fontSize: '0.8rem', textAlign: 'right', color: 'var(--danger)' }}
                            placeholder="매입"
                            title="매입액"
                        />
                    </div>
                    <div className="input-group" style={{ margin: 0 }}>
                        <input
                            type="text"
                            value={item.ads}
                            onChange={(e) => handleExcelRowUpdate(item.tempId, 'ads', e.target.value)}
                            style={{ width: '80px', padding: '6px', fontSize: '0.8rem', textAlign: 'right', color: '#fbbf24' }}
                            placeholder="광고비"
                            title="광고비"
                        />
                    </div>
                    <div className="input-group" style={{ margin: 0 }}>
                        <input
                            type="text"
                            value={item.commission}
                            onChange={(e) => handleExcelRowUpdate(item.tempId, 'commission', e.target.value)}
                            style={{ width: '80px', padding: '6px', fontSize: '0.8rem', textAlign: 'right', color: '#94a3b8' }}
                            placeholder="수수료"
                            title="수수료"
                        />
                    </div>
                    <div className="input-group" style={{ margin: 0 }}>
                        <input
                            type="text"
                            value={item.others}
                            onChange={(e) => handleExcelRowUpdate(item.tempId, 'others', e.target.value)}
                            style={{ width: '80px', padding: '6px', fontSize: '0.8rem', textAlign: 'right', color: '#94a3b8' }}
                            placeholder="기타"
                            title="운영비/기타"
                        />
                    </div>
                </div>
            </div>
        );
    };

    // Sub-component for Manual Entry Searchable Dropdown
    const ManualVendorPicker = () => {
        const [search, setSearch] = useState("");
        const isOpen = activePicker === 'manual_entry';
        const filtered = vendors.filter(v => v.name.toLowerCase().includes(search.toLowerCase()));
        const selectedVendor = vendors.find(v => v.no === Number(selectedVendorNo));

        return (
            <div style={{ position: 'relative', width: '100%' }}>
                <div
                    onClick={() => setActivePicker(isOpen ? null : 'manual_entry')}
                    style={{
                        padding: '10px 12px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        background: '#1e293b',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        color: selectedVendor ? '#fff' : 'var(--text-muted)'
                    }}
                >
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {selectedVendor ? `${selectedVendor.name} (${selectedVendor.category})` : "거래처를 선택하세요"}
                    </span>
                    <ChevronRight size={16} style={{ transform: isOpen ? 'rotate(90deg)' : 'none', transition: '0.2s', color: 'var(--primary)' }} />
                </div>

                {isOpen && (
                    <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: '#1e293b',
                        border: '1px solid var(--primary)',
                        borderRadius: '8px',
                        zIndex: 100,
                        marginTop: '4px',
                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.6)',
                        overflow: 'hidden'
                    }}>
                        <div style={{ padding: '10px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '8px', background: '#0f172a' }}>
                            <Search size={16} color="var(--primary)" />
                            <input
                                autoFocus
                                type="text"
                                placeholder="거래처 이름 검색..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{ width: '100%', padding: '4px 0', fontSize: '0.85rem', background: 'transparent', border: 'none', color: '#fff', outline: 'none' }}
                            />
                        </div>
                        <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                            {filtered.map(v => (
                                <div
                                    key={v.no}
                                    onClick={() => { setSelectedVendorNo(v.no.toString()); setActivePicker(null); }}
                                    style={{ padding: '12px 15px', cursor: 'pointer', fontSize: '0.85rem', borderBottom: '1px solid rgba(255,255,255,0.03)', background: selectedVendorNo === v.no.toString() ? 'rgba(99, 102, 241, 0.15)' : 'transparent' }}
                                    className="hover-bg"
                                >
                                    <div style={{ fontWeight: '500' }}>{v.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{v.category}</div>
                                </div>
                            ))}
                            {filtered.length === 0 && (
                                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>검색 결과가 없습니다.</div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const confirmUpload = () => {
        const unmatched = uploadPreview.filter(p => !p.isMatched && p.category !== '기타');
        if (unmatched.length > 0) {
            alert(`${unmatched.length}개의 내역에 매칭된 거래처가 없습니다. 거래처를 선택하거나 '기타'로 지정해 주세요.`);
            return;
        }

        const newRecords = uploadPreview.map(p => ({
            id: Date.now() + Math.random(),
            date: p.date,
            month: p.month,
            vendorNo: p.vendorNo,
            vendorName: p.vendorName, // This will be the original name if category is 기타 and no vendorNo
            category: p.category,
            sales: p.sales,
            purchases: p.purchases,
            ads: p.ads,
            commission: p.commission,
            others: p.others
        }));

        onSave([...records, ...newRecords]);
        setUploadPreview([]);
        alert(`${newRecords.length}개의 데이터가 추가되었습니다.`);
    };

    const deleteRecord = (id) => {
        if (window.confirm("삭제하시겠습니까?")) {
            onSave(records.filter(r => r.id !== id));
            setSelectedIds(prev => prev.filter(itemId => itemId !== id));
        }
    };

    const handleBulkDelete = () => {
        if (window.confirm(`선택한 ${selectedIds.length}개의 데이터를 정말 삭제하시겠습니까?`)) {
            onSave(records.filter(r => !selectedIds.includes(r.id)));
            setSelectedIds([]);
        }
    };

    const handleStartEdit = (record) => {
        setEditingId(record.id);
        setEditForm({ ...record });
    };

    const handleSaveEdit = () => {
        const updatedRecords = records.map(r => r.id === editingId ? editForm : r);
        onSave(updatedRecords);
        setEditingId(null);
        setEditForm(null);
        alert("수정되었습니다.");
    };

    const handleExportData = () => {
        if (records.length === 0) {
            alert("다운로드할 데이터가 없습니다.");
            return;
        }

        // Prepare data for export
        const exportData = records.map(r => ({
            "날짜/월": r.date || r.month,
            "거래처명": r.vendorName,
            "카테고리": r.category,
            "매출": r.sales,
            "매입": r.purchases,
            "광고비": r.ads,
            "수수료": r.commission,
            "기타비용": r.others,
            "수익": r.sales - r.purchases - r.ads - r.commission - r.others
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const csvContent = XLSX.utils.sheet_to_csv(ws);

        // Add UTF-8 BOM to fix Korean character encoding in Excel
        const bom = "\uFEFF";
        const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `abar_data_export_${new Date().toISOString().slice(0, 10)}.csv`;

        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
            <div className="tab-header">
                <h2>데이터 수집 및 입력</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.5rem', marginBottom: '2rem' }}>
                {/* Manual Entry */}
                <div className="card" style={{ height: 'fit-content' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Calendar size={20} color="var(--primary)" /> 수동 직접 입력
                        </h3>
                        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', padding: '2px' }}>
                            <button
                                onClick={() => { setEntryMode('daily'); setSelectedDate(new Date().toISOString().slice(0, 10)); }}
                                style={{
                                    padding: '4px 10px', fontSize: '0.75rem', borderRadius: '4px',
                                    background: entryMode === 'daily' ? 'var(--primary)' : 'transparent',
                                    color: entryMode === 'daily' ? '#fff' : 'var(--text-muted)'
                                }}
                            >일별</button>
                            <button
                                onClick={() => { setEntryMode('monthly'); setSelectedDate(new Date().toISOString().slice(0, 7)); }}
                                style={{
                                    padding: '4px 10px', fontSize: '0.75rem', borderRadius: '4px',
                                    background: entryMode === 'monthly' ? 'var(--primary)' : 'transparent',
                                    color: entryMode === 'monthly' ? '#fff' : 'var(--text-muted)'
                                }}
                            >월별</button>
                        </div>
                    </div>
                    <form onSubmit={handleSaveManual} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                        <div className="input-group">
                            <label>{entryMode === 'daily' ? '날짜 선택' : '연월 선택'}</label>
                            <input
                                type={entryMode === 'daily' ? "date" : "month"}
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label>거래처명</label>
                            <ManualVendorPicker />
                        </div>
                        <div className="input-group">
                            <label>매입액</label>
                            <input type="number" name="purchases" value={formData.purchases} onChange={handleInputChange} />
                        </div>
                        <div className="input-group">
                            <label>매출액</label>
                            <input type="number" name="sales" value={formData.sales} onChange={handleInputChange} />
                        </div>
                        <div className="input-group" style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                            <div>
                                <label style={{ fontSize: '0.8rem' }}>광고비</label>
                                <input type="number" name="ads" value={formData.ads} onChange={handleInputChange} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.8rem' }}>수수료</label>
                                <input type="number" name="commission" value={formData.commission} onChange={handleInputChange} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.8rem' }}>운영비/기타</label>
                                <input type="number" name="others" value={formData.others} onChange={handleInputChange} />
                            </div>
                        </div>
                        <button type="submit" className="btn-primary" style={{ gridColumn: 'span 2', marginTop: '1rem' }}>
                            <Save size={18} style={{ marginRight: '8px' }} /> 단일 데이터 저장
                        </button>
                    </form>
                </div>

                {/* Excel Upload */}
                <div className="card" style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px dashed var(--primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0 }}><FileSpreadsheet size={20} /> 엑셀 파일 일괄 업로드</h3>
                        <button
                            className="btn-outline"
                            style={{ fontSize: '0.75rem', padding: '4px 10px', height: 'auto' }}
                            onClick={(e) => {
                                e.stopPropagation();
                                const headers = [["날짜", "거래처명", "매출", "매입", "광고비", "수수료", "기타비용"]];
                                const sampleData = [["2024-03-01", "샘플거래처", 1000000, 500000, 100000, 50000, 0]];
                                const ws = XLSX.utils.aoa_to_sheet([...headers, ...sampleData]);
                                const wb = XLSX.utils.book_new();
                                XLSX.utils.book_append_sheet(wb, ws, "양식");
                                XLSX.writeFile(wb, "abar_data_template.xlsx");
                            }}
                        >
                            <Upload size={14} style={{ marginRight: '4px' }} /> 양식 다운로드
                        </button>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                        엑셀의 [날짜, 거래처명, 매출, 매입...] 형식의 데이터를 일괄로 가져올 수 있습니다. 업로드 후 거래처 자동 매칭 결과를 확인하세요.
                    </p>
                    <div
                        onClick={() => fileInputRef.current.click()}
                        style={{
                            border: '2px dashed rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                            padding: '2.5rem 1rem',
                            textAlign: 'center',
                            cursor: 'pointer',
                            background: 'rgba(0,0,0,0.2)'
                        }}
                    >
                        <Upload size={32} style={{ marginBottom: '12px', color: 'var(--primary)' }} />
                        <p>파일 선택 또는 드래그</p>
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            accept=".xlsx, .xls, .csv"
                            onChange={handleExcelUpload}
                        />
                    </div>
                </div>
            </div>

            {/* Preview Section */}
            {uploadPreview.length > 0 && (
                <div className="card animate-fade-in" style={{ marginBottom: '2rem', border: '1px solid var(--accent)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div>
                            <h3 style={{ marginBottom: '4px' }}>📂 업로드 데이터 매칭 및 최종 확인 ({uploadPreview.length}건)</h3>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                필요 없는 행은 삭제하고, 매칭에 실패한 경우 검색하여 거래처를 선택하세요. (기타 항목은 원본명칭 그대로 저장됩니다)
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.8rem' }}>
                            <button className="btn-outline" onClick={() => setUploadPreview([])}>전체 취소</button>
                            <button className="btn-primary" onClick={confirmUpload}>최종 저장 완료</button>
                        </div>
                    </div>
                    <div className="table-container">
                        <table style={{ minWidth: '1000px' }}>
                            <thead>
                                <tr>
                                    <th>상태</th>
                                    <th>날짜</th>
                                    <th>원본 거래처명</th>
                                    <th>매칭 및 금액 수정</th>
                                    <th>작업</th>
                                </tr>
                            </thead>
                            <tbody>
                                {uploadPreview.map((item, i) => (
                                    <tr key={i} style={{ background: !item.isMatched && item.category !== '기타' ? 'rgba(239, 68, 68, 0.05)' : 'transparent' }}>
                                        <td>
                                            {item.isMatched || item.category === '기타' ?
                                                <CheckCircle size={14} color="#10b981" /> :
                                                <AlertCircle size={14} color="#ef4444" />
                                            }
                                        </td>
                                        <td style={{ fontSize: '0.85rem' }}>{item.date}</td>
                                        <td style={{ fontWeight: '500' }}>
                                            <div
                                                onClick={() => !item.isMatched && handleQuickVendorAdd(item.tempId, item.vendorName)}
                                                style={{
                                                    cursor: !item.isMatched ? 'pointer' : 'default',
                                                    textDecoration: !item.isMatched ? 'underline' : 'none',
                                                    textDecorationStyle: 'dotted'
                                                }}
                                                title={!item.isMatched ? "매칭되지 않은 업체입니다. 클릭하여 즉시 등록" : ""}
                                            >
                                                {item.vendorName}
                                            </div>
                                            {item.category === '기타' && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>(기타 처리)</span>}
                                        </td>
                                        <td>
                                            <VendorPicker item={item} />
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => deletePreviewRow(item.tempId)}
                                                style={{ background: 'transparent', color: 'var(--danger)', padding: '5px' }}
                                                title="이 행 삭제"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* List */}
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <h3 style={{ margin: 0 }}>데이터 관리 및 검색 (전체 {records.length}건)</h3>
                        {selectedIds.length > 0 && (
                            <button
                                onClick={handleBulkDelete}
                                className="btn-outline"
                                style={{ fontSize: '0.75rem', padding: '4px 10px', borderColor: 'var(--danger)', color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.1)' }}
                            >
                                <Trash2 size={14} style={{ marginRight: '4px' }} /> {selectedIds.length}개 선택 삭제
                            </button>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <button
                            onClick={handleExportData}
                            className="btn-outline"
                            style={{ fontSize: '0.75rem', padding: '6px 12px', borderColor: 'var(--accent)', color: 'var(--accent)' }}
                        >
                            <Download size={14} style={{ marginRight: '6px' }} /> Excel 다운로드
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                                type="date"
                                value={filterDateStart}
                                onChange={(e) => { setFilterDateStart(e.target.value); setCurrentPage(1); }}
                                style={{ padding: '6px', fontSize: '0.8rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                            />
                            <span style={{ color: 'var(--text-muted)' }}>~</span>
                            <input
                                type="date"
                                value={filterDateEnd}
                                onChange={(e) => { setFilterDateEnd(e.target.value); setCurrentPage(1); }}
                                style={{ padding: '6px', fontSize: '0.8rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                            />
                        </div>
                        <div style={{ position: 'relative' }}>
                            <Search size={14} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder="거래처명 검색..."
                                value={filterVendor}
                                onChange={(e) => { setFilterVendor(e.target.value); setCurrentPage(1); }}
                                style={{ padding: '6px 6px 6px 28px', fontSize: '0.8rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: '150px' }}
                            />
                        </div>
                        {(filterDateStart || filterDateEnd || filterVendor) && (
                            <button
                                onClick={() => { setFilterDateStart(""); setFilterDateEnd(""); setFilterVendor(""); setCurrentPage(1); }}
                                style={{ background: 'transparent', color: 'var(--text-muted)', fontSize: '0.75rem', textDecoration: 'underline' }}
                            >
                                필터 초기화
                            </button>
                        )}
                    </div>
                </div>

                {(() => {
                    const filteredRecords = records.filter(r => {
                        const rDate = r.date || r.month;
                        const matchStart = !filterDateStart || rDate >= filterDateStart;
                        const matchEnd = !filterDateEnd || rDate <= filterDateEnd;
                        const matchVendor = !filterVendor || r.vendorName.toLowerCase().includes(filterVendor.toLowerCase());
                        return matchStart && matchEnd && matchVendor;
                    }).reverse();

                    const totalFiltered = filteredRecords.length;
                    const lastIdx = currentPage * recordsPerPage;
                    const firstIdx = lastIdx - recordsPerPage;
                    const currentRecords = filteredRecords.slice(firstIdx, lastIdx);

                    const isAllSelected = currentRecords.length > 0 && currentRecords.every(r => selectedIds.includes(r.id));

                    return (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th style={{ width: '40px', textAlign: 'center' }}>
                                            <input
                                                type="checkbox"
                                                checked={isAllSelected}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        const newIds = currentRecords.map(r => r.id);
                                                        setSelectedIds(prev => [...new Set([...prev, ...newIds])]);
                                                    } else {
                                                        const currentIds = currentRecords.map(r => r.id);
                                                        setSelectedIds(prev => prev.filter(id => !currentIds.includes(id)));
                                                    }
                                                }}
                                            />
                                        </th>
                                        <th style={{ width: '120px' }}>날짜/월</th>
                                        <th>거래처</th>
                                        <th style={{ width: '80px' }}>구분</th>
                                        <th style={{ textAlign: 'right' }}>매출</th>
                                        <th style={{ textAlign: 'right' }}>매입</th>
                                        <th style={{ textAlign: 'right', color: '#fbbf24' }}>광고</th>
                                        <th style={{ textAlign: 'right', color: '#94a3b8' }}>수수료</th>
                                        <th style={{ textAlign: 'right', color: '#94a3b8' }}>기타</th>
                                        <th style={{ textAlign: 'right' }}>수익</th>
                                        <th style={{ width: '100px', textAlign: 'center' }}>관리</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentRecords.length === 0 ? (
                                        <tr><td colSpan="11" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>조건에 맞는 데이터가 없습니다.</td></tr>
                                    ) : (
                                        <>
                                            {currentRecords.map(record => {
                                                const isEditing = editingId === record.id;
                                                const profit = isEditing
                                                    ? (editForm.sales - editForm.purchases - editForm.ads - editForm.commission - editForm.others)
                                                    : (record.sales - record.purchases - record.ads - record.commission - record.others);
                                                const isSelected = selectedIds.includes(record.id);

                                                return (
                                                    <tr key={record.id} style={{ background: isEditing ? 'rgba(99, 102, 241, 0.05)' : (isSelected ? 'rgba(239, 68, 68, 0.05)' : 'transparent') }}>
                                                        <td style={{ textAlign: 'center' }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={() => {
                                                                    setSelectedIds(prev => prev.includes(record.id) ? prev.filter(id => id !== record.id) : [...prev, record.id]);
                                                                }}
                                                            />
                                                        </td>
                                                        <td>
                                                            {isEditing ? (
                                                                <input
                                                                    type="text"
                                                                    value={editForm.date || editForm.month}
                                                                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                                                                    style={{ width: '100%', fontSize: '0.8rem', padding: '4px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--primary)', color: '#fff' }}
                                                                />
                                                            ) : (record.date || record.month)}
                                                        </td>
                                                        <td style={{ fontWeight: '500' }}>
                                                            {isEditing ? (
                                                                <select
                                                                    value={editForm.vendorNo || ""}
                                                                    onChange={(e) => {
                                                                        const vId = Number(e.target.value);
                                                                        const v = vendors.find(v => v.no === vId);
                                                                        if (v) {
                                                                            setEditForm({ ...editForm, vendorNo: v.no, vendorName: v.name, category: v.category });
                                                                        } else {
                                                                            setEditForm({ ...editForm, vendorNo: null });
                                                                        }
                                                                    }}
                                                                    style={{ width: '100%', fontSize: '0.8rem', padding: '4px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--primary)', color: '#fff', outline: 'none' }}
                                                                >
                                                                    <option value="">거래처 선택</option>
                                                                    {vendors.map(v => (
                                                                        <option key={v.no} value={v.no}>{v.name}</option>
                                                                    ))}
                                                                </select>
                                                            ) : (
                                                                record.vendorName
                                                            )}
                                                        </td>
                                                        <td>
                                                            {isEditing ? (
                                                                <select
                                                                    value={editForm.category || '미분류'}
                                                                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                                                    style={{ width: '100%', fontSize: '0.8rem', padding: '4px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--primary)', color: '#fff', outline: 'none' }}
                                                                >
                                                                    {['업체', '쇼핑몰', '홈쇼핑', '기타', '미분류'].map(cat => (
                                                                        <option key={cat} value={cat}>{cat}</option>
                                                                    ))}
                                                                </select>
                                                            ) : (
                                                                <span className="category-tag" style={{ fontSize: '0.7rem' }}>{record.category}</span>
                                                            )}
                                                        </td>
                                                        <td style={{ textAlign: 'right' }}>
                                                            {isEditing ? (
                                                                <input
                                                                    type="text"
                                                                    value={editForm.sales}
                                                                    onChange={(e) => setEditForm({ ...editForm, sales: parseNum(e.target.value) })}
                                                                    style={{ width: '90%', fontSize: '0.8rem', textAlign: 'right', padding: '4px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--primary)', color: '#fff' }}
                                                                />
                                                            ) : record.sales.toLocaleString()}
                                                        </td>
                                                        <td style={{ textAlign: 'right' }}>
                                                            {isEditing ? (
                                                                <input
                                                                    type="text"
                                                                    value={editForm.purchases}
                                                                    onChange={(e) => setEditForm({ ...editForm, purchases: parseNum(e.target.value) })}
                                                                    style={{ width: '90%', fontSize: '0.8rem', textAlign: 'right', padding: '4px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--primary)', color: '#fff' }}
                                                                />
                                                            ) : record.purchases.toLocaleString()}
                                                        </td>
                                                        <td style={{ textAlign: 'right' }}>
                                                            {isEditing ? (
                                                                <input
                                                                    type="text"
                                                                    value={editForm.ads}
                                                                    onChange={(e) => setEditForm({ ...editForm, ads: parseNum(e.target.value) })}
                                                                    style={{ width: '90%', fontSize: '0.8rem', textAlign: 'right', padding: '4px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--primary)', color: '#fff' }}
                                                                />
                                                            ) : record.ads.toLocaleString()}
                                                        </td>
                                                        <td style={{ textAlign: 'right' }}>
                                                            {isEditing ? (
                                                                <input
                                                                    type="text"
                                                                    value={editForm.commission}
                                                                    onChange={(e) => setEditForm({ ...editForm, commission: parseNum(e.target.value) })}
                                                                    style={{ width: '90%', fontSize: '0.8rem', textAlign: 'right', padding: '4px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--primary)', color: '#fff' }}
                                                                />
                                                            ) : record.commission.toLocaleString()}
                                                        </td>
                                                        <td style={{ textAlign: 'right' }}>
                                                            {isEditing ? (
                                                                <input
                                                                    type="text"
                                                                    value={editForm.others}
                                                                    onChange={(e) => setEditForm({ ...editForm, others: parseNum(e.target.value) })}
                                                                    style={{ width: '90%', fontSize: '0.8rem', textAlign: 'right', padding: '4px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--primary)', color: '#fff' }}
                                                                />
                                                            ) : record.others.toLocaleString()}
                                                        </td>
                                                        <td style={{ textAlign: 'right', color: profit >= 0 ? 'var(--accent)' : 'var(--danger)', fontWeight: '600' }}>
                                                            {profit.toLocaleString()}
                                                        </td>
                                                        <td>
                                                            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                                                {isEditing ? (
                                                                    <>
                                                                        <button onClick={handleSaveEdit} className="btn-primary" style={{ padding: '4px 8px', fontSize: '0.7rem' }}>저장</button>
                                                                        <button onClick={() => setEditingId(null)} className="btn-outline" style={{ padding: '4px 8px', fontSize: '0.7rem' }}>취소</button>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <button style={{ background: 'transparent', color: 'var(--primary)', padding: '4px' }} onClick={() => handleStartEdit(record)} title="수정">
                                                                            <Save size={16} />
                                                                        </button>
                                                                        <button style={{ background: 'transparent', color: 'var(--danger)', padding: '4px' }} onClick={() => deleteRecord(record.id)} title="삭제">
                                                                            <Trash2 size={16} />
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}

                                            {/* Pagination UI inside the tbody as a single row */}
                                            {totalFiltered > recordsPerPage && (
                                                <tr>
                                                    <td colSpan="11" style={{ padding: '1rem' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
                                                            <button
                                                                disabled={currentPage === 1}
                                                                onClick={() => setCurrentPage(p => p - 1)}
                                                                className="btn-outline"
                                                                style={{ padding: '4px 12px', opacity: currentPage === 1 ? 0.3 : 1 }}
                                                            >이전</button>
                                                            <span style={{ fontSize: '0.85rem' }}>{currentPage} / {Math.ceil(totalFiltered / recordsPerPage)}</span>
                                                            <button
                                                                disabled={currentPage >= Math.ceil(totalFiltered / recordsPerPage)}
                                                                onClick={() => setCurrentPage(p => p + 1)}
                                                                className="btn-outline"
                                                                style={{ padding: '4px 12px', opacity: currentPage >= Math.ceil(totalFiltered / recordsPerPage) ? 0.3 : 1 }}
                                                            >다음</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    );
                })()}
            </div>
        </div>
    );
};

export default DataEntry;
