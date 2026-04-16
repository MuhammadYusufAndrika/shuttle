import { Head, usePage, router, Link } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge, DriverStatusBadge, PriorityBadge } from '@/Components/StatusBadge';

// Lazy-load Leaflet only in browser
let MapPanel = null;

export default function AdminIndex({ stats, activeRequests: initial, drivers: initialDrivers, locations }) {
    const [lang, setLang] = useState('id');
    const [requests, setRequests] = useState(initial || []);
    const [drivers, setDrivers]   = useState(initialDrivers || []);
    const [liveStats, setStats]   = useState(stats);
    const [activeTab, setActiveTab] = useState('requests');
    const [MapComponent, setMapComponent] = useState(null);
    const echoRef = useRef(null);

    const t = (id, en) => lang === 'id' ? id : en;

    // Lazy load map
    useEffect(() => {
        import('./LiveMap.jsx').then(m => setMapComponent(() => m.default)).catch(() => {});
    }, []);

    // Real-time WebSocket
    useEffect(() => {
        if (!window.Echo) return;
        const ch = window.Echo.channel('requests');

        ch.listen('.request.created', (e) => {
            setRequests(prev => [{ ...e, status: 'pending' }, ...prev]);
            setStats(prev => ({
                ...prev,
                total_requests_today: prev.total_requests_today + 1,
                pending_requests: prev.pending_requests + 1,
            }));
        });

        ch.listen('.request.status.updated', (e) => {
            setRequests(prev => prev.map(r => r.id === e.id ? { ...r, ...e } : r)
                .filter(r => ['pending','accepted','on_the_way','arrived'].includes(r.status)));

            if (e.status === 'completed') {
                setStats(prev => ({
                    ...prev,
                    pending_requests: Math.max(0, prev.pending_requests - 1),
                    completed_today: prev.completed_today + 1,
                }));
            }
        });

        ch.listen('.driver.status.changed', (e) => {
            setDrivers(prev => prev.map(d => d.id === e.driver_id
                ? { ...d, driver_status: { ...d.driver_status, status: e.status, current_lat: e.current_lat, current_lng: e.current_lng } }
                : d
            ));
            const available = drivers.filter(d => d.id === e.driver_id
                ? e.status === 'available'
                : d.driver_status?.status === 'available'
            ).length;
            setStats(prev => ({ ...prev, available_drivers: available }));
        });

        echoRef.current = ch;
        return () => {
            ch.stopListening('.request.created');
            ch.stopListening('.request.status.updated');
            ch.stopListening('.driver.status.changed');
        };
    }, []);

    return (
        <AppLayout>
            <Head title={t('Dashboard Admin', 'Admin Dashboard')} />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
                        🎛️ {t('Control Room', 'Control Room')}
                    </h1>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                        {t('Monitoring real-time · PT Dahana', 'Real-time monitoring · PT Dahana')}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <div className="lang-switcher">
                        <button className={`lang-btn ${lang === 'id' ? 'active' : ''}`} onClick={() => setLang('id')}>ID</button>
                        <button className={`lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')}>EN</button>
                    </div>
                    <Link href={route('admin.requests')} className="btn btn-secondary" style={{ fontSize: '0.8rem' }}>
                        {t('Semua Request', 'All Requests')} →
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="stat-card">
                    <div className="stat-value" style={{ color: 'var(--primary)' }}>{liveStats.total_requests_today}</div>
                    <div className="stat-label">{t('Request Hari Ini', 'Requests Today')}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value" style={{ color: 'var(--warning)' }}>{liveStats.pending_requests}</div>
                    <div className="stat-label">{t('Menunggu', 'Pending')}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value" style={{ color: 'var(--success)' }}>{liveStats.completed_today}</div>
                    <div className="stat-label">{t('Selesai', 'Completed')}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value" style={{ color: 'var(--info)' }}>{liveStats.available_drivers}</div>
                    <div className="stat-label">{t('Driver Tersedia', 'Avail. Drivers')}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value" style={{ fontSize: '1.4rem', color: 'var(--text-secondary)' }}>
                        {liveStats.avg_response_time ? `${Math.round(liveStats.avg_response_time / 60)}'` : '—'}
                    </div>
                    <div className="stat-label">{t('Rata-rata Respons', 'Avg Response')}</div>
                </div>
            </div>

            {/* Map + Drivers */}
            <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
                <div>
                    <div className="section-title">🗺️ {t('Peta Live', 'Live Map')}</div>
                    <div className="map-container">
                        {MapComponent ? (
                            <MapComponent drivers={drivers} requests={requests} locations={locations} />
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                                <div className="spinner" style={{ borderTopColor: 'var(--primary)' }} />
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <div className="section-title">🧑‍✈️ {t('Status Driver', 'Driver Status')}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {drivers.map(driver => (
                            <div key={driver.id} className="card" style={{ padding: '0.85rem 1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{driver.name}</div>
                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                            {driver.driver_status?.current_location_name || t('Lokasi tidak diketahui', 'Location unknown')}
                                        </div>
                                    </div>
                                    <DriverStatusBadge status={driver.driver_status?.status || 'offline'} lang={lang} />
                                </div>
                            </div>
                        ))}
                        {drivers.length === 0 && (
                            <div className="empty-state" style={{ padding: '2rem' }}>
                                <div className="empty-state-text">{t('Belum ada driver aktif.', 'No active drivers.')}</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Active Requests */}
            <div className="section-title">
                📋 {t('Request Aktif', 'Active Requests')}
                <span className={`badge ${requests.length > 0 ? 'badge-pending' : ''}`} style={{ marginLeft: '0.5rem' }}>
                    {requests.length}
                </span>
            </div>

            {requests.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">✅</div>
                    <div className="empty-state-text">{t('Tidak ada request aktif.', 'No active requests.')}</div>
                </div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div className="table-wrap">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>{t('Kode', 'Code')}</th>
                                    <th>{t('Karyawan', 'Employee')}</th>
                                    <th>{t('Lokasi', 'Location')}</th>
                                    <th>{t('Driver', 'Driver')}</th>
                                    <th>{t('Status', 'Status')}</th>
                                    <th>{t('Waktu', 'Time')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map(req => (
                                    <tr key={req.id}>
                                        <td>
                                            <strong>{req.request_code}</strong>
                                            {req.priority === 1 && <PriorityBadge priority={1} lang={lang} />}
                                        </td>
                                        <td>{req.user?.name || req.user_name}</td>
                                        <td>{lang === 'id' ? (req.location?.name || req.location) : (req.location?.name_en || req.location_en || req.location?.name || req.location)}</td>
                                        <td>{req.driver?.name || req.driver_name || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                                        <td><StatusBadge status={req.status} lang={lang} /></td>
                                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            {new Date(req.requested_at || req.created_at).toLocaleTimeString('id-ID', {hour:'2-digit',minute:'2-digit'})}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Quick nav */}
            <div className="grid-3" style={{ marginTop: '2rem' }}>
                <Link href={route('admin.users')} className="card clickable" style={{ textAlign: 'center', padding: '1.5rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</div>
                    <div className="card-title">{t('Kelola User', 'Manage Users')}</div>
                </Link>
                <Link href={route('admin.locations')} className="card clickable" style={{ textAlign: 'center', padding: '1.5rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📍</div>
                    <div className="card-title">{t('Kelola Lokasi', 'Manage Locations')}</div>
                </Link>
                <Link href={route('admin.logs')} className="card clickable" style={{ textAlign: 'center', padding: '1.5rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
                    <div className="card-title">{t('Activity Log', 'Activity Log')}</div>
                </Link>
            </div>
        </AppLayout>
    );
}
