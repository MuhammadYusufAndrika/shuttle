import { Head, router, useForm, Link } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';

export default function AdminLocations({ locations }) {
    const [lang, setLang] = useState('id');
    const [showAdd, setShowAdd] = useState(false);
    const t = (id, en) => lang === 'id' ? id : en;

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '', name_en: '', code: '', zone: '', lat: '', lng: '', address: '',
    });

    const handleAdd = (e) => {
        e.preventDefault();
        post(route('admin.locations.store'), {
            onSuccess: () => { reset(); setShowAdd(false); },
        });
    };

    const toggleLocation = (loc) => {
        router.patch(route('admin.locations.update', loc.id), { is_active: !loc.is_active }, { preserveScroll: true });
    };

    return (
        <AppLayout>
            <Head title={t('Kelola Lokasi', 'Manage Locations')} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div>
                    <div style={{ marginBottom: '0.25rem' }}>
                        <Link href={route('admin.index')} style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textDecoration: 'none' }}>
                            ← {t('Dashboard', 'Dashboard')}
                        </Link>
                    </div>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
                        📍 {t('Kelola Lokasi', 'Manage Locations')}
                    </h1>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                        {locations?.length ?? 0} {t('lokasi terdaftar', 'registered locations')}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <div className="lang-switcher">
                        <button className={`lang-btn ${lang === 'id' ? 'active' : ''}`} onClick={() => setLang('id')}>ID</button>
                        <button className={`lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')}>EN</button>
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowAdd(v => !v)}>
                        + {t('Tambah Lokasi', 'Add Location')}
                    </button>
                </div>
            </div>

            {/* Add Form */}
            {showAdd && (
                <div className="card animate-fade-in" style={{ marginBottom: '1.5rem', borderColor: 'rgba(249,115,22,0.3)' }}>
                    <div className="card-title" style={{ marginBottom: '1rem' }}>+ {t('Tambah Lokasi', 'Add Location')}</div>
                    <form onSubmit={handleAdd}>
                        <div className="grid-2">
                            <div className="form-group">
                                <label className="form-label">{t('Nama (ID) *', 'Name (ID) *')}</label>
                                <input className="form-control" value={data.name} onChange={e => setData('name', e.target.value)} required />
                                {errors.name && <div className="form-error">{errors.name}</div>}
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('Nama (EN)', 'Name (EN)')}</label>
                                <input className="form-control" value={data.name_en} onChange={e => setData('name_en', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('Kode *', 'Code *')}</label>
                                <input className="form-control" value={data.code} onChange={e => setData('code', e.target.value.toUpperCase())} placeholder="RING-1" required />
                                {errors.code && <div className="form-error">{errors.code}</div>}
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('Zona', 'Zone')}</label>
                                <input className="form-control" value={data.zone} onChange={e => setData('zone', e.target.value)} placeholder="Ring 1" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Latitude</label>
                                <input type="number" step="any" className="form-control" value={data.lat} onChange={e => setData('lat', e.target.value)} placeholder="-6.9175" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Longitude</label>
                                <input type="number" step="any" className="form-control" value={data.lng} onChange={e => setData('lng', e.target.value)} placeholder="107.6191" />
                            </div>
                            <div className="form-group" style={{ gridColumn: '1/-1' }}>
                                <label className="form-label">{t('Alamat', 'Address')}</label>
                                <input className="form-control" value={data.address} onChange={e => setData('address', e.target.value)} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <button type="submit" className="btn btn-primary" disabled={processing}>
                                {processing ? <span className="spinner" /> : '✅'} {t('Simpan', 'Save')}
                            </button>
                            <button type="button" className="btn btn-secondary" onClick={() => setShowAdd(false)}>
                                {t('Batal', 'Cancel')}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Locations Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {locations?.map(loc => (
                    <div key={loc.id} className="card" style={{ opacity: loc.is_active ? 1 : 0.55 }}>
                        <div className="card-header">
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontWeight: 700 }}>{lang === 'id' ? loc.name : (loc.name_en || loc.name)}</span>
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, marginTop: '0.2rem' }}>
                                    {loc.code}
                                </div>
                            </div>
                            <span className={`badge ${loc.is_active ? 'badge-available' : 'badge-offline'}`}>
                                {loc.is_active ? t('Aktif', 'Active') : t('Nonaktif', 'Inactive')}
                            </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                            {loc.zone && <div>🏭 {t('Zona', 'Zone')}: <strong style={{ color: 'var(--text-primary)' }}>{loc.zone}</strong></div>}
                            {(loc.lat && loc.lng) && (
                                <div>📍 {parseFloat(loc.lat).toFixed(4)}, {parseFloat(loc.lng).toFixed(4)}</div>
                            )}
                        </div>

                        <div style={{ marginTop: '0.75rem' }}>
                            <button
                                className={`btn ${loc.is_active ? 'btn-danger' : 'btn-success'}`}
                                style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', minHeight: 'auto' }}
                                onClick={() => toggleLocation(loc)}
                            >
                                {loc.is_active ? t('Nonaktifkan', 'Deactivate') : t('Aktifkan', 'Activate')}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </AppLayout>
    );
}
