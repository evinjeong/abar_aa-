import React from 'react';
import { LayoutDashboard, Users, Database, BarChart3, FileText, Settings, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, onReset, syncStatus }) => {
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
        { id: 'vendors', label: '업체 관리', icon: <Users size={20} /> },
        { id: 'entry', label: '데이터 입력', icon: <Database size={20} /> },
        { id: 'analysis', label: '심층 분석', icon: <BarChart3 size={20} /> },
        { id: 'settings', label: '환경 설정', icon: <Settings size={20} /> },
    ];

    return (
        <aside className="sidebar glass">
            <div className="sidebar-logo">
                ABAR
            </div>
            <nav className="sidebar-nav">
                {menuItems.map((item) => (
                    <div
                        key={item.id}
                        className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(item.id)}
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </div>
                ))}
            </nav>
            <div style={{ marginTop: 'auto', padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                {syncStatus && syncStatus !== 'idle' && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        marginBottom: '10px',
                        padding: '6px',
                        borderRadius: '6px',
                        background: syncStatus === 'syncing' ? 'rgba(99, 102, 241, 0.1)' :
                            syncStatus === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: syncStatus === 'syncing' ? '#818cf8' :
                            syncStatus === 'success' ? '#34d399' : '#f87171'
                    }}>
                        {syncStatus === 'syncing' && <RefreshCw size={14} className="animate-spin" />}
                        {syncStatus === 'success' && <CheckCircle size={14} />}
                        {syncStatus === 'error' && <AlertCircle size={14} />}
                        {syncStatus === 'syncing' ? 'Syncing...' :
                            syncStatus === 'success' ? 'Cloud Synced' : 'Sync Error'}
                    </div>
                )}
                <div style={{ padding: '10px', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                    ABAR v1.2 Stable
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
