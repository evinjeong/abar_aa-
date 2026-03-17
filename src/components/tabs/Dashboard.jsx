import React, { useState } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, BarChart, Bar, Legend, LabelList
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart } from 'lucide-react';

const Dashboard = ({ vendors, records }) => {
    const [selectedVendorNo, setSelectedVendorNo] = useState('');
    const [vendorSearch, setVendorSearch] = useState('');
    const [activeCat, setActiveCat] = useState('업체');
    const [activeMonth, setActiveMonth] = useState(null);
    const [vendorActiveMonth, setVendorActiveMonth] = useState(null);
    const [shopActiveMonth, setShopActiveMonth] = useState(null);
    const [homeActiveMonth, setHomeActiveMonth] = useState(null);
    const [otherActiveMonth, setOtherActiveMonth] = useState(null);

    // Pre-calculate all available months for cross-referencing
    const allMonths = [...new Set(records.map(r => r.month))].sort();

    const handleVendorClick = (vendorNo) => {
        if (!vendorNo) return;
        setSelectedVendorNo(vendorNo.toString());
        // Small delay to ensure state updates if needed, then scroll
        setTimeout(() => {
            const section = document.getElementById('vendor-analysis-section');
            if (section) {
                section.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100);
    };

    // 1. GLOBAL STATS
    const totalSales = records.reduce((acc, r) => acc + r.sales, 0);
    const totalPurchases = records.reduce((acc, r) => acc + r.purchases, 0);
    const totalAds = records.reduce((acc, r) => acc + r.ads, 0);
    const totalProfit = records.reduce((acc, r) => acc + (r.sales - r.purchases - r.ads - r.commission - r.others), 0);

    // 2. DATA PREPARATION FOR CATEGORIES
    const getStatsByCategory = (cat) => {
        const filtered = records.filter(r => r.category === cat);
        const sales = filtered.reduce((acc, r) => acc + r.sales, 0);
        const purchases = filtered.reduce((acc, r) => acc + r.purchases, 0);
        const ads = filtered.reduce((acc, r) => acc + r.ads, 0);
        const comm = filtered.reduce((acc, r) => acc + r.commission, 0);
        const others = filtered.reduce((acc, r) => acc + r.others, 0);
        const profit = sales - purchases - ads - comm - others;

        // Group by month
        const monthlyMap = filtered.reduce((acc, r) => {
            if (!acc[r.month]) acc[r.month] = { month: r.month, sales: 0, purchases: 0, ads: 0, comm: 0, others: 0, profit: 0 };
            acc[r.month].sales += r.sales;
            acc[r.month].purchases += r.purchases;
            acc[r.month].ads += r.ads;
            acc[r.month].comm += r.commission;
            acc[r.month].others += r.others;
            acc[r.month].profit += (r.sales - r.purchases - r.ads - r.commission - r.others);
            return acc;
        }, {});

        return {
            sales, purchases, ads, comm, others, profit,
            monthly: Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month)),
            allVendors: vendors.filter(v => v.category === cat).map(v => {
                const vRecs = filtered.filter(r => r.vendorNo === v.no);
                return {
                    name: v.name,
                    sales: vRecs.reduce((sum, r) => sum + r.sales, 0),
                    purchases: vRecs.reduce((sum, r) => sum + r.purchases, 0)
                };
            }).filter(v => v.sales > 0 || v.purchases > 0).sort((a, b) => (b.sales + b.purchases) - (a.sales + a.purchases))
        };
    };

    const shopStats = getStatsByCategory('쇼핑몰');
    const vendorStats = getStatsByCategory('업체');
    const homeStats = getStatsByCategory('홈쇼핑');
    const otherStats = getStatsByCategory('기타');

    // 3. MONTHLY OVERALL TREND
    const monthlyOverall = records.reduce((acc, r) => {
        if (!acc[r.month]) acc[r.month] = { month: r.month, sales: 0, profit: 0 };
        acc[r.month].sales += r.sales;
        acc[r.month].profit += (r.sales - r.purchases - r.ads - r.commission - r.others);
        return acc;
    }, {});
    const overallChart = Object.values(monthlyOverall).sort((a, b) => a.month.localeCompare(b.month));

    const StatCard = ({ title, value, icon, color }) => (
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="icon-circle" style={{ background: color, margin: 0, minWidth: '50px' }}>
                {icon}
            </div>
            <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '4px' }}>{title}</p>
                <h3 style={{ fontSize: '1.25rem' }}>{value.toLocaleString()}원</h3>
            </div>
        </div>
    );

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
            <div className="tab-header">
                <h2>통합 대시보드 리포트</h2>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    총 {records.length}개의 데이터 분석 중
                </div>
            </div>

            {/* Section 1: Integrated Global Summary */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
            }}>
                <StatCard title="전체 매출 합계" value={totalSales} icon={<TrendingUp size={20} />} color="rgba(99, 102, 241, 0.4)" />
                <StatCard title="전체 매입 합계" value={totalPurchases} icon={<ShoppingCart size={20} />} color="rgba(239, 68, 68, 0.4)" />
                <StatCard title="누적 영업 수익" value={totalProfit} icon={<DollarSign size={20} />} color="rgba(16, 185, 129, 0.4)" />
                <StatCard title="누적 광고비 집행" value={totalAds} icon={<TrendingDown size={20} />} color="rgba(245, 158, 11, 0.4)" />
            </div>

            <div className="card" style={{ marginBottom: '2.5rem', height: '380px' }}>
                <h3 style={{ marginBottom: '1.5rem' }}>📈 전체 월별 성장 추이</h3>
                <ResponsiveContainer width="100%" height="90%">
                    <AreaChart data={overallChart} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                        <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => (v / 10000).toLocaleString() + '만'} />
                        <Tooltip
                            contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}
                            itemStyle={{ fontSize: '0.85rem' }}
                            formatter={(v) => v.toLocaleString() + '원'}
                        />
                        <Legend verticalAlign="top" align="right" height={36} iconType="circle" />
                        <Area
                            type="monotone"
                            dataKey="sales"
                            name="매출"
                            stroke="#6366f1"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorSales)"
                            dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                        <Area
                            type="monotone"
                            dataKey="profit"
                            name="수익"
                            stroke="#10b981"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorProfit)"
                            dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Section: Category Monthly Explorer (New Selection Layout) */}
            <div className="card" style={{ marginBottom: '2.5rem', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h3 style={{ marginBottom: '4px' }}>📊 카테고리별 월별 실적 분석</h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>카테고리를 선택하여 월별 실적을 분석합니다.</p>
                    </div>
                    <div className="tab-buttons" style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '8px', overflowX: 'auto', maxWidth: '100%' }}>
                        {['업체', '쇼핑몰', '홈쇼핑', '기타'].map(cat => (
                            <button
                                key={cat}
                                onClick={() => { setActiveCat(cat); setActiveMonth(null); }}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    fontSize: '0.85rem',
                                    fontWeight: '600',
                                    background: activeCat === cat ? 'var(--primary)' : 'transparent',
                                    color: activeCat === cat ? '#fff' : 'var(--text-muted)',
                                    border: 'none',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {(() => {
                    const stats = getStatsByCategory(activeCat);
                    const categoryColor = activeCat === '쇼핑몰' ? '#6366f1' :
                        activeCat === '업체' ? '#8b5cf6' :
                            activeCat === '홈쇼핑' ? '#fbbf24' : '#94a3b8';

                    if (stats.monthly.length === 0) {
                        return <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>'{activeCat}' 카테고리에 해당하는 데이터가 없습니다.</div>;
                    }

                    return (
                        <div className="responsive-grid" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div className="table-container" style={{ order: 2 }}>
                                <table style={{ fontSize: '0.85rem' }}>
                                    <thead>
                                        <tr>
                                            <th>분석월</th>
                                            <th style={{ textAlign: 'right' }}>매출액</th>
                                            <th style={{ textAlign: 'right' }}>매입액</th>
                                            <th style={{ textAlign: 'right' }}>기타비용</th>
                                            <th style={{ textAlign: 'right' }}>순수익</th>
                                            <th style={{ textAlign: 'right' }}>수수료/광고비</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.monthly.map((m, i) => (
                                            <tr
                                                key={i}
                                                onClick={() => setActiveMonth(activeMonth === m.month ? null : m.month)}
                                                style={{
                                                    cursor: 'pointer',
                                                    background: activeMonth === m.month ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                                                    transition: 'background 0.2s'
                                                }}
                                            >
                                                <td style={{ fontWeight: '600', color: activeMonth === m.month ? 'var(--primary)' : 'inherit' }}>
                                                    {m.month} {activeMonth === m.month && '✓'}
                                                </td>
                                                <td style={{ textAlign: 'right', color: 'var(--primary)', fontWeight: '500' }}>{m.sales.toLocaleString()}</td>
                                                <td style={{ textAlign: 'right', color: 'var(--danger)' }}>{m.purchases.toLocaleString()}</td>
                                                <td style={{ textAlign: 'right' }}>{m.others.toLocaleString()}</td>
                                                <td style={{ textAlign: 'right', fontWeight: '700', color: m.profit >= 0 ? 'var(--accent)' : 'var(--danger)' }}>
                                                    {m.profit.toLocaleString()}
                                                </td>
                                                <td style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    {(m.comm + m.ads).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                        <tr style={{ background: 'rgba(255,255,255,0.03)', fontWeight: 'bold' }}>
                                            <td>합계</td>
                                            <td style={{ textAlign: 'right' }}>{stats.sales.toLocaleString()}</td>
                                            <td style={{ textAlign: 'right' }}>{stats.purchases.toLocaleString()}</td>
                                            <td style={{ textAlign: 'right' }}>{stats.others.toLocaleString()}</td>
                                            <td style={{ textAlign: 'right', color: stats.profit >= 0 ? 'var(--accent)' : 'var(--danger)' }}>{stats.profit.toLocaleString()}</td>
                                            <td style={{ textAlign: 'right' }}>{(stats.comm + stats.ads).toLocaleString()}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div className="chart-container" style={{ height: '320px', background: 'rgba(0,0,0,0.1)', borderRadius: '12px', padding: '1.2rem', order: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <h4 style={{ margin: 0, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: categoryColor }}></div>
                                        {activeCat} {activeMonth ? `[${activeMonth}]` : '전체'} 실적 추이
                                    </h4>
                                    {activeMonth && (
                                        <button
                                            onClick={() => setActiveMonth(null)}
                                            style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer' }}
                                        >
                                            전체보기
                                        </button>
                                    )}
                                </div>
                                <ResponsiveContainer width="100%" height="80%">
                                    <BarChart data={activeMonth ? stats.monthly.filter(m => m.month === activeMonth) : stats.monthly} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                        <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                                        <YAxis stroke="var(--text-muted)" fontSize={11} hide />
                                        <Tooltip
                                            contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px' }}
                                            formatter={(v) => v.toLocaleString() + '원'}
                                        />
                                        <Legend iconType="circle" />
                                        <Bar dataKey="sales" name="매출" fill={categoryColor} radius={[6, 6, 0, 0]} barSize={24}>
                                            <LabelList dataKey="sales" position="top" formatter={(v) => (v / 10000).toFixed(0) + '만'} style={{ fill: '#fff', fontSize: '10px', fontWeight: 'bold' }} />
                                        </Bar>
                                        <Bar dataKey="profit" name="수익" fill="#10b981" radius={[6, 6, 0, 0]} barSize={24}>
                                            <LabelList dataKey="profit" position="top" formatter={(v) => v !== 0 ? (v / 10000).toFixed(0) + '만' : ''} style={{ fill: '#6ee7b7', fontSize: '10px', fontWeight: 'bold' }} />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    );
                })()}
            </div>

            {/* Section 2: Vendor (업체) 분석 */}
            <div className="card" style={{ marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <h3 style={{ margin: 0 }}>[업체] {vendorActiveMonth ? `[${vendorActiveMonth}] 상세 거래내역` : '월별 매입/매출 분석 (매입처 vs 매출처)'}</h3>
                        {vendorActiveMonth && <button onClick={() => setVendorActiveMonth(null)} style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer' }}>전체보기</button>}
                    </div>
                    <span className="category-tag tag-vendor">업체</span>
                </div>

                {!vendorActiveMonth ? (
                    <div className="responsive-grid" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div className="chart-container" style={{ height: '320px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={vendorStats.monthly}
                                    margin={{ top: 25, right: 30, left: 20, bottom: 5 }}
                                    onClick={(data) => data && data.activeLabel && setVendorActiveMonth(data.activeLabel)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="var(--text-muted)" fontSize={12} hide />
                                    <Tooltip
                                        contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px' }}
                                        formatter={(val) => val.toLocaleString() + '원'}
                                    />
                                    <Legend verticalAlign="top" align="right" height={36} iconType="circle" />
                                    <Bar dataKey="sales" name="매출액" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={20}>
                                        <LabelList dataKey="sales" position="top" formatter={(v) => v > 0 ? (v / 10000).toFixed(0) + '만' : ''} style={{ fill: '#a78bfa', fontSize: '10px', fontWeight: 'bold' }} />
                                    </Bar>
                                    <Bar dataKey="purchases" name="매입액" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={20} />
                                    <Bar dataKey="profit" name="수익" fill="#10b981" radius={[6, 6, 0, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="table-container" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                            <table style={{ fontSize: '0.85rem' }}>
                                <thead style={{ position: 'sticky', top: 0, zIndex: 1, background: '#1e293b' }}>
                                    <tr>
                                        <th>분석월</th>
                                        <th style={{ textAlign: 'right' }}>매출액</th>
                                        <th style={{ textAlign: 'right' }}>매입액</th>
                                        <th style={{ textAlign: 'right' }}>이익</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {vendorStats.monthly.map((m, i) => (
                                        <tr key={i} onClick={() => setVendorActiveMonth(m.month)} style={{ cursor: 'pointer' }}>
                                            <td style={{ fontWeight: '600' }}>{m.month}</td>
                                            <td style={{ textAlign: 'right', color: 'var(--primary)' }}>{m.sales.toLocaleString()}</td>
                                            <td style={{ textAlign: 'right', color: 'var(--danger)' }}>{m.purchases.toLocaleString()}</td>
                                            <td style={{ textAlign: 'right', fontWeight: '700', color: m.profit >= 0 ? 'var(--accent)' : 'var(--danger)' }}>{m.profit.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="table-container animate-fade-in">
                        <table>
                            <thead>
                                <tr>
                                    <th>거래처명</th>
                                    <th style={{ textAlign: 'right' }}>매출(판매)</th>
                                    <th style={{ textAlign: 'right' }}>매입(구매)</th>
                                    <th style={{ textAlign: 'right' }}>기타비용</th>
                                    <th style={{ textAlign: 'right' }}>수수료/광고비</th>
                                    <th style={{ textAlign: 'right' }}>차익(수익)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records
                                    .filter(r => r.category === '업체' && r.month === vendorActiveMonth)
                                    .map((r, i) => {
                                        const profit = r.sales - r.purchases - r.ads - r.commission - r.others;
                                        return (
                                            <tr key={i}>
                                                <td
                                                    style={{ fontWeight: '500', cursor: 'pointer', textDecoration: 'underline', color: 'var(--primary)' }}
                                                    onClick={() => handleVendorClick(r.vendorNo)}
                                                >
                                                    {r.vendorName}
                                                </td>
                                                <td style={{ textAlign: 'right', color: 'var(--primary)' }}>{r.sales.toLocaleString()}</td>
                                                <td style={{ textAlign: 'right', color: 'var(--danger)' }}>{r.purchases.toLocaleString()}</td>
                                                <td style={{ textAlign: 'right' }}>{r.others.toLocaleString()}</td>
                                                <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{(r.commission + r.ads).toLocaleString()}</td>
                                                <td style={{ textAlign: 'right', fontWeight: '700', color: profit >= 0 ? 'var(--accent)' : 'var(--danger)' }}>
                                                    {profit.toLocaleString()}
                                                </td>
                                            </tr>
                                        );
                                    })
                                }
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Section 3: Shopping Mall (쇼핑몰) 분석 */}
            <div className="card" style={{ marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h3>[쇼핑몰] {shopActiveMonth ? `[${shopActiveMonth}] 상세 현황` : '월별 상세 분석 (광고비/수수료 및 ROAS)'}</h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {shopActiveMonth && <button onClick={() => setShopActiveMonth(null)} style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer' }}>전체보기</button>}
                        <span className="category-tag tag-shopping">쇼핑몰</span>
                    </div>
                </div>

                {!shopActiveMonth ? (
                    <div className="responsive-grid" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div className="chart-container" style={{ height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={shopStats.monthly}
                                    margin={{ top: 25, right: 10, left: 10, bottom: 5 }}
                                    onClick={(data) => data && data.activeLabel && setShopActiveMonth(data.activeLabel)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                                    <YAxis yAxisId="left" stroke="var(--text-muted)" fontSize={11} hide />
                                    <YAxis yAxisId="right" orientation="right" stroke="var(--primary)" fontSize={11} hide />
                                    <Tooltip
                                        contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.3)' }}
                                        formatter={(v, name) => name === 'ROAS' ? v + '%' : v.toLocaleString() + '원'}
                                    />
                                    <Legend verticalAlign="top" align="right" height={36} iconType="circle" />
                                    <Bar yAxisId="left" dataKey="sales" name="매출액" fill="var(--primary)" radius={[6, 6, 0, 0]} barSize={20}>
                                        <LabelList dataKey="sales" position="top" formatter={(v) => v > 0 ? (v / 10000).toFixed(0) + '만' : ''} style={{ fill: '#fff', fontSize: '10px', fontWeight: 'bold' }} />
                                    </Bar>
                                    <Bar yAxisId="left" dataKey="profit" name="순수익" fill="var(--accent)" radius={[6, 6, 0, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="table-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            <table style={{ fontSize: '0.85rem' }}>
                                <thead style={{ position: 'sticky', top: 0, background: '#1e293b', zIndex: 1 }}>
                                    <tr>
                                        <th>분석월</th>
                                        <th style={{ textAlign: 'right' }}>매출액</th>
                                        <th style={{ textAlign: 'right' }}>수수료/광고비</th>
                                        <th style={{ textAlign: 'right' }}>순수익</th>
                                        <th style={{ textAlign: 'right' }}>ROAS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {shopStats.monthly.length > 0 ? shopStats.monthly.map((m, i) => {
                                        const roas = m.ads > 0 ? ((m.sales / m.ads) * 100).toFixed(0) : '0';
                                        return (
                                            <tr key={i} onClick={() => setShopActiveMonth(m.month)} style={{ cursor: 'pointer' }}>
                                                <td>{m.month}</td>
                                                <td style={{ textAlign: 'right', fontWeight: '500' }}>{m.sales.toLocaleString()}</td>
                                                <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{(m.comm + m.others + m.ads).toLocaleString()}</td>
                                                <td style={{ textAlign: 'right', fontWeight: '600', color: 'var(--accent)' }}>{m.profit.toLocaleString()}</td>
                                                <td style={{ textAlign: 'right', color: 'var(--primary)', fontWeight: '700' }}>{roas}%</td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>데이터가 없습니다.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="table-container animate-fade-in">
                        <table>
                            <thead>
                                <tr>
                                    <th>쇼핑몰명</th>
                                    <th style={{ textAlign: 'right' }}>매출액</th>
                                    <th style={{ textAlign: 'right' }}>광고비(비중)</th>
                                    <th style={{ textAlign: 'right' }}>수수료/기타(비중)</th>
                                    <th style={{ textAlign: 'right' }}>순수익(수익률)</th>
                                    <th style={{ textAlign: 'right' }}>ROAS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(() => {
                                    const filtered = records.filter(r => r.category === '쇼핑몰' && r.month === shopActiveMonth);
                                    return filtered.map((r, i) => {
                                        const profit = r.sales - r.purchases - r.ads - r.commission - r.others;
                                        const roas = r.ads > 0 ? ((r.sales / r.ads) * 100).toFixed(0) : '0';
                                        const adsRatio = r.sales > 0 ? ((r.ads / r.sales) * 100).toFixed(1) : '0';
                                        const commRatio = r.sales > 0 ? (((r.commission + r.others) / r.sales) * 100).toFixed(1) : '0';
                                        const profitMargin = r.sales > 0 ? ((profit / r.sales) * 100).toFixed(1) : '0';

                                        return (
                                            <tr key={i}>
                                                <td
                                                    style={{ fontWeight: '500', cursor: 'pointer', textDecoration: 'underline', color: 'var(--primary)' }}
                                                    onClick={() => handleVendorClick(r.vendorNo)}
                                                >
                                                    {r.vendorName}
                                                </td>
                                                <td style={{ textAlign: 'right', color: 'var(--primary)', fontWeight: '600' }}>{r.sales.toLocaleString()}</td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <div style={{ color: '#fbbf24' }}>{r.ads.toLocaleString()}</div>
                                                    <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>({adsRatio}%)</div>
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <div>{(r.commission + r.others).toLocaleString()}</div>
                                                    <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>({commRatio}%)</div>
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <div style={{ fontWeight: '700', color: profit >= 0 ? 'var(--accent)' : 'var(--danger)' }}>{profit.toLocaleString()}</div>
                                                    <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>({profitMargin}%)</div>
                                                </td>
                                                <td style={{ textAlign: 'right', color: 'var(--primary)', fontWeight: '600' }}>{roas}%</td>
                                            </tr>
                                        );
                                    });
                                })()}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Section 4: Home Shopping & Others */}
            <div className="responsive-double-grid" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h3>[홈쇼핑] {homeActiveMonth ? `[${homeActiveMonth}] 상세 현황` : '매입/매출/수익 종합 분석'}</h3>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {homeActiveMonth && <button onClick={() => setHomeActiveMonth(null)} style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer' }}>전체보기</button>}
                            <span className="category-tag tag-home">홈쇼핑</span>
                        </div>
                    </div>

                    {!homeActiveMonth ? (
                        <>
                            <div style={{ height: '220px', marginBottom: '1.5rem' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={homeStats.monthly}
                                        margin={{ top: 25, right: 30, left: 20, bottom: 5 }}
                                        onClick={(data) => data && data.activeLabel && setHomeActiveMonth(data.activeLabel)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                        <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="var(--text-muted)" fontSize={12} hide />
                                        <Tooltip
                                            contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px' }}
                                            formatter={(val) => val.toLocaleString() + '원'}
                                        />
                                        <Legend verticalAlign="top" align="right" height={36} iconType="circle" />
                                        <Bar dataKey="sales" name="매출액" fill="#fbbf24" radius={[6, 6, 0, 0]} barSize={20}>
                                            <LabelList dataKey="sales" position="top" formatter={(v) => v > 0 ? (v / 10000).toFixed(0) + '만' : ''} style={{ fill: '#fbbf24', fontSize: '10px', fontWeight: 'bold' }} />
                                        </Bar>
                                        <Bar dataKey="profit" name="수익" fill="#10b981" radius={[6, 6, 0, 0]} barSize={20}>
                                            <LabelList dataKey="profit" position="top" formatter={(v) => v !== 0 ? (v / 10000).toFixed(0) + '만' : ''} style={{ fill: '#6ee7b7', fontSize: '10px', fontWeight: 'bold' }} />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="table-container" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                <table style={{ fontSize: '0.85rem' }}>
                                    <thead style={{ position: 'sticky', top: 0, background: '#1e293b', zIndex: 1 }}>
                                        <tr>
                                            <th>월별</th>
                                            <th style={{ textAlign: 'right' }}>매출액</th>
                                            <th style={{ textAlign: 'right' }}>수익</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {homeStats.monthly.map((m, i) => (
                                            <tr key={i} onClick={() => setHomeActiveMonth(m.month)} style={{ cursor: 'pointer' }}>
                                                <td>{m.month}</td>
                                                <td style={{ textAlign: 'right', color: '#fbbf24' }}>{m.sales.toLocaleString()}</td>
                                                <td style={{ textAlign: 'right', color: '#10b981', fontWeight: '600' }}>{m.profit.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : (
                        <div className="table-container animate-fade-in">
                            <table style={{ fontSize: '0.85rem' }}>
                                <thead>
                                    <tr>
                                        <th>거래처명 (홈쇼핑)</th>
                                        <th style={{ textAlign: 'right' }}>매출액</th>
                                        <th style={{ textAlign: 'right' }}>매입액</th>
                                        <th style={{ textAlign: 'right' }}>수익</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {records.filter(r => r.category === '홈쇼핑' && r.month === homeActiveMonth).map((r, i) => (
                                        <tr key={i}>
                                            <td
                                                style={{ fontWeight: '500', cursor: 'pointer', textDecoration: 'underline', color: 'var(--primary)' }}
                                                onClick={() => handleVendorClick(r.vendorNo)}
                                            >
                                                {r.vendorName}
                                            </td>
                                            <td style={{ textAlign: 'right', color: 'var(--primary)' }}>{r.sales.toLocaleString()}</td>
                                            <td style={{ textAlign: 'right', color: 'var(--danger)' }}>{r.purchases.toLocaleString()}</td>
                                            <td style={{ textAlign: 'right', fontWeight: '600', color: (r.sales - r.purchases - r.ads - r.commission - r.others) >= 0 ? 'var(--accent)' : 'var(--danger)' }}>
                                                {(r.sales - r.purchases - r.ads - r.commission - r.others).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h3>[기타/운영비] {otherActiveMonth ? `[${otherActiveMonth}] 상세 비용` : '월별 비용 및 실적'}</h3>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {otherActiveMonth && <button onClick={() => setOtherActiveMonth(null)} style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer' }}>전체보기</button>}
                            <span className="category-tag tag-etc">기타</span>
                        </div>
                    </div>

                    {!otherActiveMonth ? (
                        <>
                            <div style={{ height: '220px', marginBottom: '1.5rem' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={otherStats.monthly}
                                        margin={{ top: 25, right: 30, left: 20, bottom: 5 }}
                                        onClick={(data) => data && data.activeLabel && setOtherActiveMonth(data.activeLabel)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                        <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="var(--text-muted)" fontSize={12} hide />
                                        <Tooltip
                                            contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px' }}
                                            formatter={(v) => v.toLocaleString() + '원'}
                                        />
                                        <Legend verticalAlign="top" align="right" height={36} iconType="circle" />
                                        <Bar dataKey="sales" name="매출" fill="#94a3b8" radius={[6, 6, 0, 0]} barSize={20}>
                                            <LabelList dataKey="sales" position="top" formatter={(v) => v > 0 ? (v / 10000).toFixed(0) + '만' : ''} style={{ fill: '#94a3b8', fontSize: '10px', fontWeight: 'bold' }} />
                                        </Bar>
                                        <Bar dataKey="profit" name="수익" fill="#10b981" radius={[6, 6, 0, 0]} barSize={20}>
                                            <LabelList dataKey="profit" position="top" formatter={(v) => v !== 0 ? (v / 10000).toFixed(0) + '만' : ''} style={{ fill: '#6ee7b7', fontSize: '10px', fontWeight: 'bold' }} />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="table-container" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                <table style={{ fontSize: '0.85rem' }}>
                                    <thead style={{ position: 'sticky', top: 0, background: '#1e293b', zIndex: 1 }}>
                                        <tr>
                                            <th>월별</th>
                                            <th style={{ textAlign: 'right' }}>비용(매입)</th>
                                            <th style={{ textAlign: 'right' }}>영업이익</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {otherStats.monthly.map((m, i) => (
                                            <tr key={i} onClick={() => setOtherActiveMonth(m.month)} style={{ cursor: 'pointer' }}>
                                                <td>{m.month}</td>
                                                <td style={{ textAlign: 'right', color: 'var(--danger)' }}>{m.purchases.toLocaleString()}</td>
                                                <td style={{ textAlign: 'right', color: '#10b981', fontWeight: '600' }}>{m.profit.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : (
                        <div className="table-container animate-fade-in">
                            <table style={{ fontSize: '0.85rem' }}>
                                <thead>
                                    <tr>
                                        <th>비용 항목 (기타)</th>
                                        <th style={{ textAlign: 'right' }}>매출액</th>
                                        <th style={{ textAlign: 'right' }}>매입액</th>
                                        <th style={{ textAlign: 'right' }}>수수료/광고비</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {records.filter(r => r.category === '기타' && r.month === otherActiveMonth).map((r, i) => (
                                        <tr key={i}>
                                            <td
                                                style={{ fontWeight: '500', cursor: 'pointer', textDecoration: 'underline', color: 'var(--primary)' }}
                                                onClick={() => handleVendorClick(r.vendorNo)}
                                            >
                                                {r.vendorName}
                                            </td>
                                            <td style={{ textAlign: 'right' }}>{r.sales.toLocaleString()}</td>
                                            <td style={{ textAlign: 'right', color: 'var(--danger)' }}>{r.purchases.toLocaleString()}</td>
                                            <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{(r.commission + r.ads + r.others).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Section 5: 업체별 상세 월별 분석 (Drill-down) */}
            <div id="vendor-analysis-section" className="card" style={{ border: '1px solid var(--primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                        <h3 style={{ marginBottom: '4px' }}>🔍 업체별 상세 월별 분석</h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>특정 업체를 선택하여 월별 상세 실적 및 추이를 분석합니다.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <input
                            type="text"
                            placeholder="업체명 검색..."
                            value={vendorSearch}
                            onChange={(e) => setVendorSearch(e.target.value)}
                            style={{
                                padding: '6px 12px',
                                border: 'none',
                                background: 'transparent',
                                color: '#fff',
                                fontSize: '0.85rem',
                                width: '130px',
                                borderRight: '1px solid rgba(255,255,255,0.1)'
                            }}
                        />
                        <select
                            value={selectedVendorNo}
                            onChange={(e) => setSelectedVendorNo(e.target.value)}
                            style={{
                                padding: '6px 12px',
                                border: 'none',
                                background: 'transparent',
                                color: '#fff',
                                width: '180px',
                                fontSize: '0.85rem',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="" style={{ background: '#1e293b' }}>거래처 선택</option>
                            {vendors
                                .filter(v => v.name.toLowerCase().includes(vendorSearch.toLowerCase()))
                                .map(v => (
                                    <option key={v.no} value={v.no} style={{ background: '#1e293b' }}>{v.name} ({v.category})</option>
                                ))
                            }
                        </select>
                    </div>
                </div>

                {selectedVendorNo ? (
                    <div className="animate-fade-in">
                        {(() => {
                            const vendor = vendors.find(v => v.no === Number(selectedVendorNo));
                            const vendorRecs = records.filter(r => r.vendorNo === vendor.no);

                            // Group by month
                            const monthlyData = allMonths.map(m => {
                                const monthRecs = vendorRecs.filter(r => r.month === m);
                                const s = monthRecs.reduce((sum, r) => sum + r.sales, 0);
                                const p = monthRecs.reduce((sum, r) => sum + r.purchases, 0);
                                const a = monthRecs.reduce((sum, r) => sum + r.ads, 0);
                                const c = monthRecs.reduce((sum, r) => sum + r.commission, 0);
                                const o = monthRecs.reduce((sum, r) => sum + r.others, 0);
                                return {
                                    month: m,
                                    sales: s,
                                    purchases: p,
                                    ads: a,
                                    comm: c,
                                    others: o,
                                    profit: s - p - a - c - o
                                };
                            }).filter(d => d.sales > 0 || d.purchases > 0 || d.ads > 0 || d.others > 0);

                            if (monthlyData.length === 0) {
                                return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>해당 업체에 대한 거래 실적이 없습니다.</div>;
                            }

                            return (
                                <div className="responsive-grid" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                    <div className="chart-container" style={{ height: '300px', background: 'rgba(0,0,0,0.1)', borderRadius: '8px', padding: '1rem', order: 1 }}>
                                        <h4 style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>{vendor.name} 실적 추이</h4>
                                        <ResponsiveContainer width="100%" height="85%">
                                            <AreaChart data={monthlyData}>
                                                <defs>
                                                    <linearGradient id="colorVendorSales" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                    </linearGradient>
                                                    <linearGradient id="colorVendorProfit" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                                                <YAxis stroke="var(--text-muted)" fontSize={11} hide />
                                                <Tooltip
                                                    contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.3)' }}
                                                    formatter={(v) => v.toLocaleString() + '원'}
                                                />
                                                <Area type="monotone" dataKey="sales" name="매출" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorVendorSales)" dot={{ r: 3, fill: '#6366f1' }} />
                                                <Area type="monotone" dataKey="profit" name="수익" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorVendorProfit)" dot={{ r: 3, fill: '#10b981' }} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="table-container" style={{ order: 2 }}>
                                        <table style={{ fontSize: '0.85rem' }}>
                                            <thead>
                                                <tr>
                                                    <th>분석월</th>
                                                    <th>매출</th>
                                                    <th className="hide-on-mobile">매입</th>
                                                    <th>수익</th>
                                                    <th className="hide-on-mobile">수익률</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {monthlyData.map((d, i) => (
                                                    <tr key={i}>
                                                        <td style={{ fontWeight: '600' }}>{d.month}</td>
                                                        <td style={{ color: 'var(--primary)' }}>{d.sales.toLocaleString()}</td>
                                                        <td className="hide-on-mobile" style={{ color: 'var(--danger)' }}>{d.purchases.toLocaleString()}</td>
                                                        <td style={{ fontWeight: '700', color: d.profit >= 0 ? 'var(--accent)' : 'var(--danger)' }}>
                                                            {d.profit.toLocaleString()}
                                                        </td>
                                                        <td className="hide-on-mobile">{d.sales > 0 ? ((d.profit / d.sales) * 100).toFixed(1) : '0'}%</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                ) : (
                    <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                        분석할 거래처를 위 목록에서 선택해 주세요.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
