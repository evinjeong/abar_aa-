import React, { useRef } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { FileText, Printer, ChevronRight } from 'lucide-react';

const Analysis = ({ vendors, records }) => {
    const reportRef = useRef();
    const [analysisMode, setAnalysisMode] = React.useState('cumulative'); // 'monthly' or 'cumulative'
    const [selectedMonth, setSelectedMonth] = React.useState(
        records.length > 0 ? [...new Set(records.map(r => r.month))].sort().reverse()[0] : ""
    );

    const allMonths = [...new Set(records.map(r => r.month))].sort().reverse();

    const exportPDF = async () => {
        const element = reportRef.current;
        const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#0f172a' });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('Abar_Analysis_Report.pdf');
    };

    // Group records by category
    const categories = ['전체', '업체', '쇼핑몰', '홈쇼핑', '기타'];

    const getSummaryStats = (filteredRecs) => {
        const sales = filteredRecs.reduce((acc, r) => acc + r.sales, 0);
        const purchases = filteredRecs.reduce((acc, r) => acc + r.purchases, 0);
        const ads = filteredRecs.reduce((acc, r) => acc + r.ads, 0);
        const commission = filteredRecs.reduce((acc, r) => acc + r.commission, 0);
        const others = filteredRecs.reduce((acc, r) => acc + r.others, 0);
        const profit = sales - purchases - ads - commission - others;
        const roas = ads > 0 ? ((sales / ads) * 100).toFixed(1) : '0';

        return { sales, purchases, ads, commission, others, profit, roas };
    };

    const getStatsByCategory = (category, mode, month) => {
        const catRecords = records.filter(r => {
            const matchCat = category === '전체' ? true : r.category === category;
            const matchMonth = mode === 'monthly' ? r.month === month : true;
            return matchCat && matchMonth;
        });
        return getSummaryStats(catRecords);
    };

    const getMonthlyTrend = () => {
        const months = [...new Set(records.map(r => r.month))].sort();
        let cumSales = 0;
        let cumProfit = 0;
        let cumPurchases = 0;

        return months.map(m => {
            const monthRecs = records.filter(r => r.month === m);
            const s = monthRecs.reduce((sum, r) => sum + r.sales, 0);
            const p = monthRecs.reduce((sum, r) => sum + r.purchases, 0);
            const pr = monthRecs.reduce((sum, r) => sum + (r.sales - r.purchases - r.ads - r.commission - r.others), 0);

            cumSales += s;
            cumProfit += pr;
            cumPurchases += p;

            return {
                month: m,
                sales: s,
                cumSales,
                profit: pr,
                cumProfit,
                purchases: p,
                cumPurchases
            };
        });
    };

    return (
        <div className="animate-fade-in">
            <div className="tab-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <h2>심층 분석 리포트</h2>
                    <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '8px' }}>
                        <button
                            onClick={() => setAnalysisMode('monthly')}
                            style={{
                                padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', border: 'none', transition: 'all 0.2s',
                                background: analysisMode === 'monthly' ? 'var(--primary)' : 'transparent',
                                color: analysisMode === 'monthly' ? '#fff' : 'var(--text-muted)'
                            }}
                        >월별 분석</button>
                        <button
                            onClick={() => setAnalysisMode('cumulative')}
                            style={{
                                padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', border: 'none', transition: 'all 0.2s',
                                background: analysisMode === 'cumulative' ? 'var(--primary)' : 'transparent',
                                color: analysisMode === 'cumulative' ? '#fff' : 'var(--text-muted)'
                            }}
                        >누적 분석</button>
                    </div>

                    {analysisMode === 'monthly' && (
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            style={{ padding: '6px 12px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.85rem' }}
                        >
                            {allMonths.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    )}
                </div>
                <button className="btn-primary" onClick={exportPDF} style={{ display: 'flex', alignItems: 'center' }}>
                    <FileText size={18} style={{ marginRight: '8px' }} /> PDF 출력
                </button>
            </div>

            <div ref={reportRef} style={{ padding: '10px' }}>
                <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
                    <h1 className="report-header-title" style={{ fontSize: '2.2rem', marginBottom: '0.5rem', color: '#fff' }}>
                        {analysisMode === 'monthly' ? `[${selectedMonth}] 월간` : '전체 기간 누적'} 사업 성과 리포트
                    </h1>
                    <div className="report-header-meta" style={{ display: 'flex', justifyContent: 'center', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        <span>출력일: {new Date().toLocaleDateString()}</span>
                        <span className="hide-on-mobile">•</span>
                        <span>대상: {analysisMode === 'monthly' ? selectedMonth : '전체 데이터'}</span>
                    </div>
                </div>

                {categories.map(cat => {
                    const stats = getStatsByCategory(cat, analysisMode, selectedMonth);
                    if (stats.sales === 0 && stats.purchases === 0) return null;

                    return (
                        <div key={cat} className="card" style={{ marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '1.4rem', color: 'var(--primary)' }}>{cat} 실적 분석</h3>
                                <span className="category-tag tag-vendor">종합지표</span>
                            </div>

                            <div className="stat-grid-3" style={{ marginBottom: '2rem' }}>
                                <div style={{ borderLeft: '3px solid var(--primary)', paddingLeft: '1rem' }}>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>매출 합계</p>
                                    <p style={{ fontSize: '1.2rem', fontWeight: '600' }}>{stats.sales.toLocaleString()}원</p>
                                </div>
                                <div style={{ borderLeft: '3px solid var(--accent)', paddingLeft: '1rem' }}>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>영업 수익</p>
                                    <p style={{ fontSize: '1.2rem', fontWeight: '600', color: 'var(--accent)' }}>{stats.profit.toLocaleString()}원</p>
                                </div>
                                <div style={{ borderLeft: '3px solid var(--danger)', paddingLeft: '1rem' }}>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>광고 대비 수익(ROAS)</p>
                                    <p style={{ fontSize: '1.2rem', fontWeight: '600' }}>{stats.roas}%</p>
                                </div>
                            </div>

                            <div className="table-container">
                                <table style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                                    <thead>
                                        <tr>
                                            <th>항목</th>
                                            <th>금액</th>
                                            <th>비중 (대비 매출)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>매입원가</td>
                                            <td>{stats.purchases.toLocaleString()}</td>
                                            <td>{((stats.purchases / stats.sales) * 100).toFixed(1)}%</td>
                                        </tr>
                                        <tr>
                                            <td>광고비</td>
                                            <td>{stats.ads.toLocaleString()}</td>
                                            <td>{((stats.ads / stats.sales) * 100).toFixed(1)}%</td>
                                        </tr>
                                        <tr>
                                            <td>판매수수료</td>
                                            <td>{stats.commission.toLocaleString()}</td>
                                            <td>{((stats.commission / stats.sales) * 100).toFixed(1)}%</td>
                                        </tr>
                                        <tr>
                                            <td>기타 운영비</td>
                                            <td>{stats.others.toLocaleString()}</td>
                                            <td>{((stats.others / stats.sales) * 100).toFixed(1)}%</td>
                                        </tr>
                                        <tr style={{ background: 'rgba(16, 185, 129, 0.1)', fontWeight: '700' }}>
                                            <td>최종 순수익</td>
                                            <td style={{ color: 'var(--accent)' }}>{stats.profit.toLocaleString()}</td>
                                            <td>{((stats.profit / stats.sales) * 100).toFixed(1)}%</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {cat === '전체' && (
                                <div style={{ marginTop: '2.5rem' }}>
                                    <h4 style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '1rem' }}>📈 통합 전체 월별 누적 현황</h4>
                                    <div className="table-container">
                                        <table style={{ background: 'rgba(255,255,255,0.01)', fontSize: '0.85rem' }}>
                                            <thead>
                                                <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                                                    <th>분석월</th>
                                                    <th style={{ textAlign: 'right' }}>월 매출</th>
                                                    <th style={{ textAlign: 'right', color: 'var(--primary)' }}>누적 매출</th>
                                                    <th style={{ textAlign: 'right' }}>월 수익</th>
                                                    <th style={{ textAlign: 'right', color: 'var(--accent)' }}>누적 수익</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {getMonthlyTrend().map((t, idx) => (
                                                    <tr key={idx}>
                                                        <td style={{ fontWeight: '600' }}>{t.month}</td>
                                                        <td style={{ textAlign: 'right' }}>{t.sales.toLocaleString()}</td>
                                                        <td style={{ textAlign: 'right', fontWeight: '600', color: 'var(--primary)' }}>{t.cumSales.toLocaleString()}</td>
                                                        <td style={{ textAlign: 'right', color: t.profit >= 0 ? '#fff' : 'var(--danger)' }}>{t.profit.toLocaleString()}</td>
                                                        <td style={{ textAlign: 'right', fontWeight: '600', color: 'var(--accent)' }}>{t.cumProfit.toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}

                {records.length === 0 && (
                    <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
                        <p style={{ color: 'var(--text-muted)' }}>분석할 데이터가 없습니다. 먼저 데이터를 입력해 주세요.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Analysis;
