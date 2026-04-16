import { Head, useForm, usePage, router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge, PriorityBadge } from '@/Components/StatusBadge';

const STEPS = [
    { key: 'pending',    icon: '⏳', labelId: 'Menunggu',    labelEn: 'Waiting' },
    { key: 'accepted',   icon: '✅', labelId: 'Diterima',    labelEn: 'Accepted' },
    { key: 'on_the_way', icon: '🚌', labelId: 'OTW',         labelEn: 'On The Way' },
    { key: 'arrived',    icon: '📍', labelId: 'Tiba',        labelEn: 'Arrived' },
    { key: 'completed',  icon: '🎉', labelId: 'Selesai',     labelEn: 'Done' },
];

const stepIndex = (status) => STEPS.findIndex(s => s.key === status);

export default function UserIndex({ locations, activeRequest: initialActive, recentRequests }) {
    const { auth } = usePage().props;
    const [lang, setLang] = useState('id');
    const [activeRequest, setActiveRequest] = useState(initialActive);
    const [showForm, setShowForm] = useState(!initialActive);
    const echoRef = useRef(null);

    const t = (id, en) => lang === 'id' ? id : en;

    const { data, setData, post, processing, errors, reset } = useForm({
        location_id: '',
        destination: '',
        priority: 0,
        passenger_count: 1,
        notes: '',
    });

    // Keep local state in sync with latest Inertia props.
    useEffect(() => {
        setActiveRequest(initialActive || null);
        setShowForm(!initialActive);
    }, [initialActive?.id, initialActive?.status]);

    // Fallback polling to keep request status updated when websocket is unavailable.
    useEffect(() => {
        const intervalId = setInterval(() => {
            router.reload({
                only: ['activeRequest', 'recentRequests'],
                preserveState: true,
                preserveScroll: true,
            });
        }, 4000);

        return () => clearInterval(intervalId);
    }, []);

    // Real-time listen to own request updates
    useEffect(() => {
        if (!activeRequest) return;

        // Subscribe push notifications
        registerPush();

        // WebSocket via Echo (loaded in bootstrap.js)
        if (window.Echo) {
            const channel = window.Echo.private(`request.${activeRequest.id}`);
            channel.listen('.request.status.updated', (e) => {
                setActiveRequest(prev => ({ ...prev, status: e.status, driver_name: e.driver_name }));
                if (e.status === 'completed') {
                    setTimeout(() => { setActiveRequest(null); setShowForm(true); }, 3000);
                }
            });
            echoRef.current = channel;
        }

        return () => {
            echoRef.current?.stopListening('.request.status.updated');
        };
    }, [activeRequest?.id]);

    const registerPush = async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
        try {
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY,
            });
            await fetch(route('employee.push.subscribe'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content },
                body: JSON.stringify({ subscription: sub.toJSON() }),
            });
        } catch (e) { /* Push not available */ }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('employee.requests.store'), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setShowForm(false);
                router.reload({ only: ['activeRequest'] });
            },
        });
    };

    const handleCancel = () => {
        if (!confirm(t('Batalkan permintaan ini?', 'Cancel this request?'))) return;
        router.delete(route('employee.requests.cancel', activeRequest.id), {
            onSuccess: () => { setActiveRequest(null); setShowForm(true); },
        });
    };

    const currentStep = activeRequest ? stepIndex(activeRequest.status) : -1;

    return (
        <AppLayout>
            <Head title={t('Panggil Shuttle', 'Call Shuttle')} />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
                        👤 {t('Halo', 'Hi')}, {auth.user.name.split(' ')[0]}!
                    </h1>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                        {t('Butuh shuttle? Panggil sekarang.', 'Need a shuttle? Call one now.')}
                    </p>
                </div>
                <div className="lang-switcher">
                    <button className={`lang-btn ${lang === 'id' ? 'active' : ''}`} onClick={() => setLang('id')}>ID</button>
                    <button className={`lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')}>EN</button>
                </div>
            </div>

            {/* Active Request Tracker */}
            {activeRequest && (
                <div className="card animate-fade-in" style={{ marginBottom: '1.5rem', borderColor: 'rgba(249,115,22,0.3)' }}>
                    <div className="card-header">
                        <div>
                            <div className="card-title">🚌 {t('Request Aktif', 'Active Request')}</div>
                            <div className="card-subtitle">{activeRequest.request_code}</div>
                        </div>
                        <StatusBadge status={activeRequest.status} lang={lang} />
                    </div>

                    {/* Step tracker */}
                    <div className="status-tracker">
                        {STEPS.map((step, i) => {
                            const isDone   = i < currentStep;
                            const isActive = i === currentStep;
                            return (
                                <div key={step.key} className={`status-step ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}>
                                    <div className="status-step-dot">{step.icon}</div>
                                    <div className="status-step-label">{t(step.labelId, step.labelEn)}</div>
                                </div>
                            );
                        })}
                    </div>

                    {activeRequest.driver_name && (
                        <div className="request-info" style={{ marginTop: '0.75rem' }}>
                            <span>🧑‍✈️</span>
                            <span>{t('Driver', 'Driver')}: <strong>{activeRequest.driver_name}</strong></span>
                        </div>
                    )}

                    <div className="request-info" style={{ marginTop: '0.4rem' }}>
                        <span>📍</span>
                        <span>{t('Lokasi', 'Location')}: <strong>{activeRequest.location?.name}</strong></span>
                    </div>

                    {activeRequest.status === 'pending' && (
                        <div style={{ marginTop: '1rem' }}>
                            <button className="btn btn-danger" onClick={handleCancel} style={{ fontSize: '0.8rem' }}>
                                ✕ {t('Batalkan', 'Cancel')}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* New Request Form */}
            {showForm && !activeRequest && (
                <div className="animate-fade-in">
                    {/* Big CTA */}
                    <button
                        className="btn-call-shuttle"
                        style={{ marginBottom: '1.5rem' }}
                        onClick={() => document.getElementById('location-select').focus()}
                    >
                        <span>🚌 {t('Panggil Shuttle', 'Call Shuttle')}</span>
                        <span className="btn-sub">{t('Isi form di bawah & kirim', 'Fill form below & send')}</span>
                    </button>

                    <div className="card">
                        <div className="card-title" style={{ marginBottom: '1rem' }}>
                            {t('Detail Permintaan', 'Request Details')}
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">{t('Lokasi Penjemputan *', 'Pickup Location *')}</label>
                                <select
                                    id="location-select"
                                    className="form-control"
                                    value={data.location_id}
                                    onChange={e => setData('location_id', e.target.value)}
                                    required
                                >
                                    <option value="">{t('Pilih lokasi...', 'Select location...')}</option>
                                    {locations.map(loc => (
                                        <option key={loc.id} value={loc.id}>
                                            {lang === 'id' ? loc.name : (loc.name_en || loc.name)} — {loc.zone}
                                        </option>
                                    ))}
                                </select>
                                {errors.location_id && <div className="form-error">{errors.location_id}</div>}
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t('Tujuan (opsional)', 'Destination (optional)')}</label>
                                <input
                                    className="form-control"
                                    value={data.destination}
                                    onChange={e => setData('destination', e.target.value)}
                                    placeholder={t('Misal: Kantor Pusat', 'e.g. Head Office')}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t('Jumlah Penumpang', 'Passenger Count')}</label>
                                <div className="counter-group">
                                    <button type="button" className="counter-btn"
                                        onClick={() => setData('passenger_count', Math.max(1, data.passenger_count - 1))}>−</button>
                                    <span className="counter-value">{data.passenger_count}</span>
                                    <button type="button" className="counter-btn"
                                        onClick={() => setData('passenger_count', Math.min(20, data.passenger_count + 1))}>+</button>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t('Prioritas', 'Priority')}</label>
                                <div className="toggle-group">
                                    <button type="button" className={`toggle-opt ${data.priority === 0 ? 'active' : ''}`}
                                        onClick={() => setData('priority', 0)}>
                                        {t('Normal', 'Normal')}
                                    </button>
                                    <button type="button" className={`toggle-opt ${data.priority === 1 ? 'active' : ''}`}
                                        style={data.priority === 1 ? { background: 'var(--danger)' } : {}}
                                        onClick={() => setData('priority', 1)}>
                                        🚨 {t('Urgent', 'Urgent')}
                                    </button>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t('Catatan (opsional)', 'Notes (optional)')}</label>
                                <textarea
                                    className="form-control"
                                    value={data.notes}
                                    onChange={e => setData('notes', e.target.value)}
                                    placeholder={t('Info tambahan untuk driver...', 'Additional info for driver...')}
                                    rows={2}
                                />
                            </div>

                            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={processing}>
                                {processing ? <span className="spinner" /> : '🚀'}
                                {processing ? t('Mengirim...', 'Sending...') : t('Kirim Permintaan', 'Send Request')}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Recent History */}
            {recentRequests?.length > 0 && (
                <div style={{ marginTop: '2rem' }}>
                    <div className="section-title">📋 {t('Riwayat Terakhir', 'Recent History')}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {recentRequests.map(req => (
                            <div key={req.id} className="request-card">
                                <div className="request-meta">
                                    <StatusBadge status={req.status} lang={lang} />
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{req.request_code}</span>
                                </div>
                                <div className="request-info">
                                    <span>📍</span>
                                    <span>{lang === 'id' ? req.location?.name : (req.location?.name_en || req.location?.name)}</span>
                                </div>
                                <div className="request-info" style={{ marginTop: '0.25rem' }}>
                                    <span>🕐</span>
                                    <span>{new Date(req.requested_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
