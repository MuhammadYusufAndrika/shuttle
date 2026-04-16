import { Head, router, useForm, Link } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';

const ROLES = ['employee', 'driver', 'admin'];

export default function AdminUsers({ users }) {
    const [lang, setLang] = useState('id');
    const [showAdd, setShowAdd] = useState(false);
    const t = (id, en) => lang === 'id' ? id : en;

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '', employee_id: '', email: '', password: '',
        role: 'employee', phone: '',
    });

    const handleAdd = (e) => {
        e.preventDefault();
        post(route('admin.users.store'), {
            onSuccess: () => { reset(); setShowAdd(false); },
        });
    };

    const toggleActive = (user) => {
        router.patch(route('admin.users.update', user.id), { is_active: !user.is_active }, { preserveScroll: true });
    };

    const data_list = users?.data || [];
    const meta = users?.meta || {};

    return (
        <AppLayout>
            <Head title={t('Kelola User', 'Manage Users')} />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div>
                    <div style={{ marginBottom: '0.25rem' }}>
                        <Link href={route('admin.index')} style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textDecoration: 'none' }}>
                            ← {t('Dashboard', 'Dashboard')}
                        </Link>
                    </div>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
                        👥 {t('Kelola User', 'Manage Users')}
                    </h1>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                        {meta?.total ?? 0} {t('total user', 'total users')}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <div className="lang-switcher">
                        <button className={`lang-btn ${lang === 'id' ? 'active' : ''}`} onClick={() => setLang('id')}>ID</button>
                        <button className={`lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')}>EN</button>
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowAdd(v => !v)}>
                        + {t('Tambah User', 'Add User')}
                    </button>
                </div>
            </div>

            {/* Add Form */}
            {showAdd && (
                <div className="card animate-fade-in" style={{ marginBottom: '1.5rem', borderColor: 'rgba(249,115,22,0.3)' }}>
                    <div className="card-title" style={{ marginBottom: '1rem' }}>+ {t('Tambah User Baru', 'Add New User')}</div>
                    <form onSubmit={handleAdd}>
                        <div className="grid-2">
                            <div className="form-group">
                                <label className="form-label">{t('Nama *', 'Name *')}</label>
                                <input className="form-control" value={data.name} onChange={e => setData('name', e.target.value)} required />
                                {errors.name && <div className="form-error">{errors.name}</div>}
                            </div>
                            <div className="form-group">
                                <label className="form-label">NIP / Employee ID</label>
                                <input className="form-control" value={data.employee_id} onChange={e => setData('employee_id', e.target.value)} placeholder="EMP001" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email *</label>
                                <input type="email" className="form-control" value={data.email} onChange={e => setData('email', e.target.value)} required />
                                {errors.email && <div className="form-error">{errors.email}</div>}
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('Password *', 'Password *')}</label>
                                <input type="password" className="form-control" value={data.password} onChange={e => setData('password', e.target.value)} required />
                                {errors.password && <div className="form-error">{errors.password}</div>}
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('Role *', 'Role *')}</label>
                                <select className="form-control" value={data.role} onChange={e => setData('role', e.target.value)}>
                                    {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('No. HP', 'Phone')}</label>
                                <input className="form-control" value={data.phone} onChange={e => setData('phone', e.target.value)} placeholder="08xxxxxxxxxx" />
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

            {/* Users Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="table-wrap">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>{t('Nama', 'Name')}</th>
                                <th>NIP</th>
                                <th>Email</th>
                                <th>{t('Role', 'Role')}</th>
                                <th>{t('No. HP', 'Phone')}</th>
                                <th>{t('Status', 'Status')}</th>
                                <th>{t('Aksi', 'Action')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data_list.map(user => (
                                <tr key={user.id}>
                                    <td><strong>{user.name}</strong></td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{user.employee_id || '—'}</td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{user.email}</td>
                                    <td>
                                        <span className={`nav-role-badge ${user.role}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{user.phone || '—'}</td>
                                    <td>
                                        <span className={`badge ${user.is_active ? 'badge-available' : 'badge-offline'}`}>
                                            {user.is_active ? t('Aktif', 'Active') : t('Nonaktif', 'Inactive')}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            className={`btn ${user.is_active ? 'btn-danger' : 'btn-success'}`}
                                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', minHeight: 'auto' }}
                                            onClick={() => toggleActive(user)}
                                        >
                                            {user.is_active ? t('Nonaktifkan', 'Deactivate') : t('Aktifkan', 'Activate')}
                                        </button>
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
