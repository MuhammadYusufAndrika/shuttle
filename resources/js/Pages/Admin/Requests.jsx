import { Head, router, usePage, Link } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge, PriorityBadge } from '@/Components/StatusBadge';

export default function AdminRequests({ requests, drivers, filters }) {
    const [lang, setLang] = useState('id');
    const [form, setForm] = useState({
        status: filters?.status || '',
        date: filters?.date || '',
        driver: filters?.driver || '',
    });

    const t = (id, en) => lang === 'id' ? id : en;

    const applyFilter = () => {
        router.get(route('admin.requests'), form, { preserveScroll: true });
    };

    const clearFilter = () => {
        const empty = { status: '', date: '', driver: '' };
        setForm(empty);
        router.get(route('admin.requests'), empty);
    };

    const data = requests?.data || [];
    const meta = requests?.meta || {};
    const links = requests?.links || {};

    return (
        <AppLayout>
            <Head title={t('Semua Request', 'All Requests')} />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <Link href={route('admin.index')} style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textDecoration: 'none' }}>
                            ← {t('Dashboard', 'Dashboard')}
                        </Link>
                    </div>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
                        📋 {t('Semua Request', 'All Requests')}
                    </h1>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                        {meta?.total ?? 0} {t('total request', 'total requests')}
                    </p>
                </div>
                <div className="lang-switcher">
                    <button className={`lang-btn ${lang === 'id' ? 'active' : ''}`} onClick={() => setLang('id')}>ID</button>
                    <button className={`lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')}>EN</button>
                </div>
            </div>

            {/* Filter */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', alignItems: 'end' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">{t('Status', 'Status')}</label>
                        <select className="form-control" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                            <option value="">{t('Semua', 'All')}</option>
                            <option value="pending">{t('Menunggu', 'Pending')}</option>
                            <option value="accepted">{t('Diterima', 'Accepted')}</option>
                            <option value="on_the_way">OTW</option>
                            <option value="arrived">{t('Tiba', 'Arrived')}</option>
                            <option value="completed">{t('Selesai', 'Completed')}</option>
                            <option value="cancelled">{t('Dibatalkan', 'Cancelled')}</option>
                        </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">{t('Tanggal', 'Date')}</label>
                        <input type="date" className="form-control" value={form.date}
                            onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">{t('Driver', 'Driver')}</label>
                        <select className="form-control" value={form.driver} onChange={e => setForm(f => ({ ...f, driver: e.target.value }))}>
                            <option value="">{t('Semua Driver', 'All Drivers')}</option>
                            {drivers?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-primary" onClick={applyFilter}>
                            🔍 {t('Filter', 'Filter')}
                        </button>
                        {(form.status || form.date || form.driver) && (
                            <button className="btn btn-secondary" onClick={clearFilter}>✕</button>
                        )}
                    </div>
                </div>
            </div>

            {/* Table */}
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
                                <th>{t('Prioritas', 'Priority')}</th>
                                <th>{t('Penumpang', 'Passengers')}</th>
                                <th>{t('Waktu Req', 'Req. Time')}</th>
                                <th>{t('Resp (dtk)', 'Resp (s)')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.length === 0 && (
                                <tr>
                                    <td colSpan={9}>
                                        <div className="empty-state">
                                            <div className="empty-state-icon">📭</div>
                                            <div className="empty-state-text">{t('Tidak ada request.', 'No requests found.')}</div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {data.map(req => (
                                <tr key={req.id}>
                                    <td><strong>{req.request_code}</strong></td>
                                    <td>{req.user?.name}</td>
                                    <td>{lang === 'id' ? req.location?.name : (req.location?.name_en || req.location?.name)}</td>
                                    <td>{req.driver?.name ?? <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                                    <td><StatusBadge status={req.status} lang={lang} /></td>
                                    <td>{req.priority === 1 ? <PriorityBadge priority={1} lang={lang} /> : <span style={{ color: 'var(--text-muted)' }}>Normal</span>}</td>
                                    <td style={{ textAlign: 'center' }}>{req.passenger_count}</td>
                                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                        {req.requested_at ? new Date(req.requested_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                                    </td>
                                    <td style={{ textAlign: 'center', color: req.response_time_seconds ? 'var(--success)' : 'var(--text-muted)' }}>
                                        {req.response_time_seconds ?? '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {meta?.last_page > 1 && (
                    <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {t('Halaman', 'Page')} {meta.current_page} / {meta.last_page}
                        </span>
                        {links?.prev && (
                            <button className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                                onClick={() => router.get(links.prev)}>← {t('Sebelumnya', 'Previous')}</button>
                        )}
                        {links?.next && (
                            <button className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                                onClick={() => router.get(links.next)}>{t('Berikutnya', 'Next')} →</button>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
