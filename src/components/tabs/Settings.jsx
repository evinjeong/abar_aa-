import React, { useState } from 'react';
import { Settings, Trash2, Key, RefreshCw, Save, LogOut, Cloud, Github } from 'lucide-react';
import { getSyncSettings, saveSyncSettings } from '../../utils/githubSync';

const SettingsTab = ({ onResetData }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });
    const [githubSettings, setGithubSettings] = useState(getSyncSettings() || {
        token: '',
        owner: '',
        repo: 'abar_aa-',
        branch: 'main'
    });

    const handlePasswordChange = (e) => {
        e.preventDefault();
        const savedPassword = localStorage.getItem('abar_password') || 'abcd1234';

        if (currentPassword !== savedPassword) {
            setMessage({ type: 'error', text: '현재 비밀번호가 일치하지 않습니다.' });
            return;
        }

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: '새 비밀번호가 일치하지 않습니다.' });
            return;
        }

        if (newPassword.length < 4) {
            setMessage({ type: 'error', text: '비밀번호는 최소 4자 이상이어야 합니다.' });
            return;
        }

        localStorage.setItem('abar_password', newPassword);
        setMessage({ type: 'success', text: '비밀번호가 성공적으로 변경되었습니다.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    };

    const handleReset = () => {
        if (window.confirm("주의: 모든 업체 정보와 입력된 실적 데이터가 영구적으로 삭제되고 초기 상태로 돌아갑니다. 계속하시겠습니까?")) {
            onResetData();
        }
    };

    const handleLogout = () => {
        if (window.confirm("로그아웃 하시겠습니까?")) {
            window.location.reload();
        }
    };

    const handleSaveGithub = (e) => {
        e.preventDefault();
        saveSyncSettings(githubSettings);
        setMessage({ type: 'success', text: 'GitHub 동기화 설정이 저장되었습니다.' });
    };

    return (
        <div className="animate-fade-in">
            <div className="tab-header">
                <h2>환경 설정</h2>
            </div>

            <div className="grid grid-2">
                {/* Password Change Card */}
                <div className="card">
                    <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                        <Key size={20} color="var(--accent)" />
                        <h3 style={{ margin: 0 }}>비밀번호 변경</h3>
                    </div>

                    <form onSubmit={handlePasswordChange}>
                        <div className="form-group" style={{ marginBottom: '15px' }}>
                            <label>현재 비밀번호</label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="현재 비밀번호 입력"
                                required
                            />
                        </div>
                        <div className="form-group" style={{ marginBottom: '15px' }}>
                            <label>새 비밀번호</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="새 비밀번호 입력"
                                required
                            />
                        </div>
                        <div className="form-group" style={{ marginBottom: '20px' }}>
                            <label>새 비밀번호 확인</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="비밀번호 재입력"
                                required
                            />
                        </div>

                        {message.text && (
                            <div style={{
                                padding: '10px',
                                borderRadius: '8px',
                                marginBottom: '15px',
                                backgroundColor: message.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                color: message.type === 'error' ? '#ef4444' : '#10b981',
                                fontSize: '0.9rem'
                            }}>
                                {message.text}
                            </div>
                        )}

                        <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                            <Save size={18} style={{ marginRight: '8px' }} /> 비밀번호 저장
                        </button>
                    </form>
                </div>

                {/* Data Management Card */}
                <div className="card">
                    <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                        <RefreshCw size={20} color="var(--accent)" />
                        <h3 style={{ margin: 0 }}>데이터 및 세션 관리</h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div style={{ padding: '15px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                            <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem' }}>전체 초기화</h4>
                            <p style={{ margin: '0 0 15px 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                모든 업체 리스트와 실적 데이터를 공장 초기화 상태로 되돌립니다.
                            </p>
                            <button onClick={handleReset} className="btn-outline" style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', width: '100%' }}>
                                <Trash2 size={18} style={{ marginRight: '8px' }} /> 시스템 전체 초기화
                            </button>
                        </div>

                        <div style={{ padding: '15px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                            <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem' }}>로그아웃</h4>
                            <p style={{ margin: '0 0 15px 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                대시보드 세션을 종료하고 로그인 화면으로 돌아갑니다.
                            </p>
                            <button onClick={handleLogout} className="btn-outline" style={{ width: '100%' }}>
                                <LogOut size={18} style={{ marginRight: '8px' }} /> 안전하게 로그아웃
                            </button>
                        </div>
                    </div>
                </div>
                {/* Cloud Sync Card */}
                <div className="card">
                    <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                        <Cloud size={20} color="var(--primary)" />
                        <h3 style={{ margin: 0 }}>클라우드 동기화 (GitHub)</h3>
                    </div>

                    <form onSubmit={handleSaveGithub}>
                        <div className="form-group" style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <Github size={14} /> Personal Access Token (PAT)
                            </label>
                            <input
                                type="password"
                                value={githubSettings.token}
                                onChange={(e) => setGithubSettings({ ...githubSettings, token: e.target.value })}
                                placeholder="ghp_..."
                            />
                        </div>
                        <div className="grid grid-2" style={{ gap: '10px', marginBottom: '15px' }}>
                            <div className="form-group">
                                <label>Repo Owner</label>
                                <input
                                    type="text"
                                    value={githubSettings.owner}
                                    onChange={(e) => setGithubSettings({ ...githubSettings, owner: e.target.value })}
                                    placeholder="evinjeong"
                                />
                            </div>
                            <div className="form-group">
                                <label>Repo Name</label>
                                <input
                                    type="text"
                                    value={githubSettings.repo}
                                    onChange={(e) => setGithubSettings({ ...githubSettings, repo: e.target.value })}
                                    placeholder="abar_aa-"
                                />
                            </div>
                        </div>
                        <button type="submit" className="btn-primary" style={{ width: '100%', background: 'var(--bg-dark)', border: '1px solid var(--primary)' }}>
                            <Save size={18} style={{ marginRight: '8px' }} /> 동기화 설정 저장
                        </button>
                        <p style={{ marginTop: '10px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            * 설정이 저장되면 다음번 데이터 저장 시 자동으로 GitHub에 백업됩니다.
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SettingsTab;
