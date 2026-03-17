import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './components/tabs/Dashboard';
import VendorList from './components/tabs/VendorList';
import DataEntry from './components/tabs/DataEntry';
import Analysis from './components/tabs/Analysis';
import SettingsTab from './components/tabs/Settings';
import './App.css';

// Pre-bundled data for reliability
import vendorsData from './data/vendors.json';
import recordsData from './data/records.json';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [vendors, setVendors] = useState([]);
  const [records, setRecords] = useState([]);
  const [vendorMappings, setVendorMappings] = useState({});

  useEffect(() => {
    // 1. Initial Data Load from LocalStorage
    const savedVendors = localStorage.getItem('abar_vendors');
    const savedRecords = localStorage.getItem('abar_records');
    const savedMappings = localStorage.getItem('abar_vendor_mappings');

    let initialVendors = [];
    let initialRecords = [];

    // Check if we have valid non-empty data in localStorage
    if (savedVendors && JSON.parse(savedVendors).length > 0) {
      initialVendors = JSON.parse(savedVendors);
    } else {
      initialVendors = vendorsData;
      localStorage.setItem('abar_vendors', JSON.stringify(vendorsData));
    }

    if (savedRecords && JSON.parse(savedRecords).length > 0) {
      initialRecords = JSON.parse(savedRecords);
    } else {
      initialRecords = recordsData;
      localStorage.setItem('abar_records', JSON.stringify(recordsData));
    }

    setVendors(initialVendors);
    setRecords(initialRecords);
    if (savedMappings) setVendorMappings(JSON.parse(savedMappings));
  }, []);

  const resetData = () => {
    if (window.confirm("모든 데이터를 서버 초기값(271건)으로 복구하시겠습니까? 현재 입력된 새 데이터는 사라집니다.")) {
      localStorage.removeItem('abar_vendors');
      localStorage.removeItem('abar_records');
      localStorage.removeItem('abar_vendor_mappings');
      window.location.reload();
    }
  };

  const saveVendors = (newVendors) => {
    setVendors(newVendors);
    localStorage.setItem('abar_vendors', JSON.stringify(newVendors));
  };

  const saveRecords = (newRecords) => {
    setRecords(newRecords);
    localStorage.setItem('abar_records', JSON.stringify(newRecords));
  };

  const saveMappings = (newMappings) => {
    setVendorMappings(newMappings);
    localStorage.setItem('abar_vendor_mappings', JSON.stringify(newMappings));
  };

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onReset={resetData} />
      <main className="content-area">
        {activeTab === 'dashboard' && <Dashboard vendors={vendors} records={records} />}
        {activeTab === 'vendors' && <VendorList vendors={vendors} onSave={saveVendors} />}
        {activeTab === 'entry' && (
          <DataEntry
            vendors={vendors}
            records={records}
            onSave={saveRecords}
            onVendorSave={saveVendors}
            mappings={vendorMappings}
            onMappingSave={saveMappings}
          />
        )}
        {activeTab === 'analysis' && <Analysis vendors={vendors} records={records} />}
        {activeTab === 'settings' && <SettingsTab onResetData={resetData} />}
      </main>
    </div>
  );
}

export default App;
