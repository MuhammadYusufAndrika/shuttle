import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';

const ACTION_ICONS = {
    'request.created':   '🆕',
    'request.accepted':  '✅',
    'request.on_the_way':'🚌',
    'request.arrived':   '📍',
    'request.completed': '🎉',
    'request.cancelled': '❌',
};

export default function AdminLogs({ logs }) {
    const [lang, setLang] = useState('id');
    const t = (id, en) => lang === 'id' ? id : en;

    const data = logs?.data || [];
    const meta = logs?.meta || {};

    return (
        <AppLayout>
            <Head title={t('Activity Log', 'Activity Log')} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div>
                    <div style={{ marginBottom: '0.25rem' }}>
                        <Link href={route('admin.index')} style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textDecoration: 'none' }}>
                            ← {t('Dashboard', 'Dashboard')}
                        </Link>
                    </div>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
                        📊 Activity Log
                    </h1>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                        {meta?.total ?? 0} {t('total log', 'total logs')}
                    </p>
                </div>
                <div className="lang-switcher">
                    <button className={`lang-btn ${lang === 'id' ? 'active' : ''}`} onClick={() => setLang('id')}>ID</button>
                    <button className={`lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')}>EN</button>
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="table-wrap">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>{t('Waktu', 'Time')}</th>
                                <th>{t('User', 'User')}</th>
                                <th>{t('Aksi', 'Action')}</th>
                                <th>{t('Target', 'Target')}</th>
                                <th>IP</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.length === 0 && (
                                <tr>
                                    <td colSpan={5}>
                                        <div className="empty-state">
                                            <div className="empty-state-icon">📭</div>
                                            <div className="empty-state-text">{t('Belum ada log.', 'No logs yet.')}</div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {data.map(log => (
                                <tr key={log.id}>
                                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                        {new Date(log.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'medium' })}
                                    </td>
                                    <td>
                                        <strong>{log.user?.name ?? <span style={{ color: 'var(--text-muted)' }}>System</span>}</strong>
                                        {log.user?.role && (
                                            <span className={`nav-role-badge ${log.user.role}`} style={{ marginLeft: '0.4rem', fontSize: '0.6rem' }}>
                                                {log.user.role}
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <span>{ACTION_ICONS[log.action] ?? '📝'}</span>
                                            <code style={{ fontSize: '0.78rem', background: 'var(--bg-input)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                                                {log.action}
                                            </code>
                                        </span>
                                    </td>
                                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                        {log.model_type ? `${log.model_type.split('\\').pop()} #${log.model_id}` : '—'}
                                    </td>
                                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                        {log.ip_address ?? '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
