import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Download, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

const VendorList = ({ vendors, onSave }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all');
    const [editingNo, setEditingNo] = useState(null);
    const [editData, setEditData] = useState({ name: '', category: '' });
    const fileInputRef = React.useRef(null);

    const filteredVendors = vendors.filter(v => {
        const vName = v.name || "";
        const vCode = v.code ? String(v.code) : "";
        const matchesSearch = vName.toLowerCase().includes(searchTerm.toLowerCase()) || vCode.includes(searchTerm);
        const matchesFilter = filter === 'all' || v.category === filter;
        return matchesSearch && matchesFilter;
    });

    const getTagClass = (category) => {
        switch (category) {
            case '업체': return 'tag-vendor';
            case '쇼핑몰': return 'tag-shopping';
            case '홈쇼핑': return 'tag-home';
            default: return 'tag-etc';
        }
    };

    const handleAdd = () => {
        const name = prompt("거래처명을 입력하세요:");
        if (!name) return;
        const category = prompt("구분 (업체, 쇼핑몰, 홈쇼핑, 기타):", "업체");

        const newVendor = {
            no: vendors.length > 0 ? Math.max(...vendors.map(v => v.no)) + 1 : 1,
            name,
            code: String(Date.now()).slice(-4),
            category: category || "기타"
        };
        onSave([newVendor, ...vendors]);
    };

    const startEdit = (vendor) => {
        setEditingNo(vendor.no);
        setEditData({ name: vendor.name, category: vendor.category });
    };

    const cancelEdit = () => {
        setEditingNo(null);
        setEditData({ name: '', category: '' });
    };

    const saveEdit = (no) => {
        const updatedVendors = vendors.map(v =>
            v.no === no ? { ...v, name: editData.name, category: editData.category } : v
        );
        onSave(updatedVendors);
        setEditingNo(null);
    };

    const handleDelete = (no) => {
        if (window.confirm("정말 삭제하시겠습니까? 관련 데이터는 유지되지만 리스트에서 사라집니다.")) {
            onSave(vendors.filter(v => v.no !== no));
        }
    };

    const handleExport = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(vendors, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "abar_vendors_" + new Date().toISOString().slice(0, 10) + ".json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleExportCSV = () => {
        const headers = ["No", "Code", "Category", "Name"];
        const rows = vendors.map(v => [v.no, v.code, v.category, v.name]);
        const csvContent = "data:text/csv;charset=utf-8,\uFEFF"
            + headers.join(",") + "\n"
            + rows.map(r => r.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "abar_vendors_" + new Date().toISOString().slice(0, 10) + ".csv");
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        const isCSV = file.name.toLowerCase().endsWith('.csv');

        reader.onload = (event) => {
            try {
                let importedData = [];
                if (isCSV) {
                    const bstr = event.target.result;
                    const wb = XLSX.read(bstr, { type: 'binary' });
                    const wsname = wb.SheetNames[0];
                    const ws = wb.Sheets[wsname];
                    const rawJson = XLSX.utils.sheet_to_json(ws);

                    // Map CSV fields (No, Code, Category, Name) to vendor object
                    importedData = rawJson.map((row, idx) => ({
                        no: Number(row.No || row.no || (vendors.length + idx + 1)),
                        code: String(row.Code || row.code || "AUTO"),
                        category: row.Category || row.category || "업체",
                        name: row.Name || row.name || row['거래처명'] || "이름없음"
                    }));
                } else {
                    importedData = JSON.parse(event.target.result);
                }

                if (Array.isArray(importedData)) {
                    if (window.confirm(`${importedData.length}개의 거래처 데이터를 불러오시겠습니까? 기존 데이터가 덮어씌워집니다.`)) {
                        onSave(importedData);
                    }
                } else {
                    alert("올바른 형식이 아닙니다.");
                }
            } catch (error) {
                console.error(error);
                alert("파일을 읽는 중 오류가 발생했습니다. CSV 형식을 확인해주세요.");
            }
        };

        if (isCSV) {
            reader.readAsBinaryString(file);
        } else {
            reader.readAsText(file);
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="tab-header">
                <h2>거래처 관리</h2>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept=".json,.csv"
                        style={{ display: 'none' }}
                    />
                    <button className="btn-outline" onClick={() => {
                        const headers = "No,Code,Category,Name\n1,V001,업체,테스트거래처";
                        const blob = new Blob(["\uFEFF" + headers], { type: 'text/csv;charset=utf-8;' });
                        const link = document.createElement("a");
                        link.href = URL.createObjectURL(blob);
                        link.setAttribute("download", "vendor_template.csv");
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    }}>
                        <FileSpreadsheet size={18} style={{ marginRight: '8px' }} /> 템플릿 받기
                    </button>
                    <button className="btn-outline" onClick={() => fileInputRef.current.click()}>
                        <Plus size={18} style={{ marginRight: '8px' }} /> CSV/JSON 업로드
                    </button>
                    <button className="btn-outline" onClick={handleExportCSV}>
                        <Download size={18} style={{ marginRight: '8px' }} /> CSV 다운로드
                    </button>
                    <button className="btn-outline" onClick={handleExport}>
                        <Download size={18} style={{ marginRight: '8px' }} /> JSON 백업
                    </button>
                    <button className="btn-outline" onClick={() => window.print()}>
                        <Download size={18} style={{ marginRight: '8px' }} /> 리스트 출력(PDF)
                    </button>
                    <button className="btn-primary" onClick={handleAdd}>
                        <Plus size={18} style={{ marginRight: '8px' }} /> 거래처 추가
                    </button>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                        <input
                            style={{ paddingLeft: '40px', width: '100%' }}
                            placeholder="거래처명 또는 코드로 검색..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                        <option value="all">전체 구분</option>
                        <option value="업체">업체</option>
                        <option value="쇼핑몰">쇼핑몰</option>
                        <option value="홈쇼핑">홈쇼핑</option>
                        <option value="기타">기타</option>
                    </select>
                </div>
            </div>

            <div className="card">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>코드</th>
                                <th>구분</th>
                                <th>거래처명</th>
                                <th style={{ textAlign: 'right' }}>관리</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredVendors.map((vendor) => (
                                <tr key={vendor.no}>
                                    <td>{vendor.no}</td>
                                    <td>{vendor.code}</td>
                                    <td>
                                        {editingNo === vendor.no ? (
                                            <select
                                                value={editData.category}
                                                onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                                                style={{ padding: '4px', width: '100px' }}
                                            >
                                                <option value="업체">업체</option>
                                                <option value="쇼핑몰">쇼핑몰</option>
                                                <option value="홈쇼핑">홈쇼핑</option>
                                                <option value="기타">기타</option>
                                            </select>
                                        ) : (
                                            <span className={`category-tag ${getTagClass(vendor.category)}`}>
                                                {vendor.category}
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        {editingNo === vendor.no ? (
                                            <input
                                                value={editData.name}
                                                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                                style={{ padding: '4px', width: '100%' }}
                                                autoFocus
                                            />
                                        ) : (
                                            vendor.name
                                        )}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        {editingNo === vendor.no ? (
                                            <>
                                                <button
                                                    className="btn-primary"
                                                    style={{ padding: '4px 8px', fontSize: '0.8rem', marginRight: '5px' }}
                                                    onClick={() => saveEdit(vendor.no)}
                                                >
                                                    저장
                                                </button>
                                                <button
                                                    className="btn-outline"
                                                    style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                                                    onClick={cancelEdit}
                                                >
                                                    취소
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    style={{ background: 'transparent', color: 'var(--text-muted)', marginRight: '10px' }}
                                                    onClick={() => startEdit(vendor)}
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    style={{ background: 'transparent', color: 'var(--danger)' }}
                                                    onClick={() => handleDelete(vendor.no)}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default VendorList;
