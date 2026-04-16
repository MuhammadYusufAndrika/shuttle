import { Head, router, usePage } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge, DriverStatusBadge, PriorityBadge } from '@/Components/StatusBadge';

export default function DriverIndex({ driverStatus: initial, queue: initialQueue, activeRequest: initialActive }) {
    const { auth } = usePage().props;
    const [lang, setLang] = useState('id');
    const [driverStatus, setDriverStatus] = useState(initial);
    const echoRef = useRef(null);

    const canUseNotification = typeof window !== 'undefined' && 'Notification' in window;

    const normalizeRequest = (req) => {
        if (!req || typeof req !== 'object') return null;

        return {
            ...req,
            user_name: req.user_name || req.user?.name || '-',
            location_name: typeof req.location === 'string'
                ? req.location
                : (req.location?.name || req.location_name || '-'),
            location_en: req.location_en || req.location?.name_en || req.location_name || '-',
        };
    };

    const [queue, setQueue] = useState((initialQueue || []).map(normalizeRequest).filter(Boolean));
    const [activeRequest, setActiveRequest] = useState(initialActive);

    const t = (id, en) => (lang === 'id' ? id : en);

    // Subscribe push + listen WebSocket
    useEffect(() => {
        registerPush();

        if (window.Echo) {
            const ch = window.Echo.channel('requests');

            ch.listen('.request.created', (e) => {
                const normalized = normalizeRequest(e);
                if (!normalized) return;

                setQueue((prev) => [normalized, ...prev]);

                if (canUseNotification && Notification.permission === 'granted' && driverStatus.status === 'available') {
                    new Notification(`🚌 ${normalized.priority === 1 ? '🚨 Urgent! ' : ''}Request Baru`, {
                        body: `${normalized.user_name} dari ${normalized.location_name}`,
                        icon: '/icons/icon-192.png',
                    });
                }
            });

            ch.listen('.request.status.updated', (e) => {
                if (e.status !== 'pending') {
                    setQueue((prev) => prev.filter((r) => r.id !== e.id));
                }

                if (activeRequest?.id === e.id) {
                    setActiveRequest((prev) => ({ ...prev, status: e.status }));
                }
            });

            echoRef.current = ch;
        }

        if (canUseNotification) {
            Notification.requestPermission().catch(() => {});
        }

        return () => {
            echoRef.current?.stopListening('.request.created');
            echoRef.current?.stopListening('.request.status.updated');
        };
    }, []);

    const registerPush = async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

        try {
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY,
            });

            await fetch(route('driver.push.subscribe'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                },
                body: JSON.stringify({ subscription: sub.toJSON() }),
            });
        } catch (e) {}
    };

    const toggleAvailability = () => {
        const newStatus = driverStatus.status === 'available' ? 'offline' : 'available';

        router.patch(route('driver.availability'), { status: newStatus }, {
            preserveScroll: true,
            onSuccess: () => setDriverStatus((prev) => ({ ...prev, status: newStatus })),
        });
    };

    const acceptRequest = (id) => {
        router.post(route('driver.requests.accept', id), {}, {
            preserveScroll: true,
            onSuccess: () => {
                const req = queue.find((r) => r?.id === id);
                if (req) {
                    setActiveRequest({
                        ...req,
                        status: 'on_the_way',
                        user: req.user || { name: req.user_name },
                        location: req.location || { name: req.location_name, name_en: req.location_en },
                    });
                }
                setDriverStatus((prev) => ({ ...prev, status: 'busy' }));
                setQueue((prev) => prev.filter((r) => r.id !== id));
            },
        });
    };

    const updateStatus = (id, status) => {
        router.patch(route('driver.requests.status', id), { status }, {
            preserveScroll: true,
            onSuccess: () => {
                setActiveRequest((prev) => ({ ...prev, status }));

                if (status === 'completed') {
                    setTimeout(() => {
                        setActiveRequest(null);
                        router.reload({ only: ['queue'] });
                    }, 2000);
                }
            },
        });
    };

    const statusIsAvailable = driverStatus?.status === 'available';
    const statusIsBusy = driverStatus?.status === 'busy';

    const nextStatusMap = {
        accepted: { label: t('OTW 🚌', 'On The Way 🚌'), next: 'on_the_way' },
        on_the_way: { label: t('Tiba 📍', 'Arrived 📍'), next: 'arrived' },
        arrived: { label: t('Selesai ✅', 'Complete ✅'), next: 'completed' },
    };

    const getPassengerName = (req) => req.user_name || req.user?.name || '-';

    const getLocationLabel = (req) => {
        if (typeof req.location === 'string') return req.location;

        if (req.location && typeof req.location === 'object') {
            return lang === 'id'
                ? (req.location.name || req.location.name_en || '-')
                : (req.location.name_en || req.location.name || '-');
        }

        return lang === 'id'
            ? (req.location_name || req.location_en || '-')
            : (req.location_en || req.location_name || '-');
    };

    const formatRequestedAt = (requestedAt) => {
        if (!requestedAt) return '-';

        const date = new Date(requestedAt);
        if (Number.isNaN(date.getTime())) return '-';

        return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <AppLayout>
            <Head title={t('Panel Driver', 'Driver Panel')} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
                        🧑‍✈️ {auth.user.name.split(' ')[0]}
                    </h1>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                        {t('Panel Driver · Shuttle Dahana', 'Driver Panel · Shuttle Dahana')}
                    </p>
                </div>
                <div className="lang-switcher">
                    <button className={`lang-btn ${lang === 'id' ? 'active' : ''}`} onClick={() => setLang('id')}>ID</button>
                    <button className={`lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')}>EN</button>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <div className="card-title" style={{ marginBottom: '0.25rem' }}>
                            {t('Status Anda', 'Your Status')}
                        </div>
                        <DriverStatusBadge status={driverStatus?.status} lang={lang} />
                    </div>
                    <div className="toggle-group">
                        <button
                            className={`toggle-opt ${statusIsAvailable ? 'active' : ''}`}
                            onClick={toggleAvailability}
                            style={statusIsAvailable ? { background: 'var(--success)' } : {}}
                            disabled={statusIsBusy}
                        >
                            ✅ {t('Tersedia', 'Available')}
                        </button>
                        <button
                            className={`toggle-opt ${!statusIsAvailable && !statusIsBusy ? 'active' : ''}`}
                            onClick={toggleAvailability}
                            disabled={statusIsBusy}
                        >
                            🔴 {t('Offline', 'Offline')}
                        </button>
                    </div>
                </div>
                {statusIsBusy && (
                    <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--warning)' }}>
                        ⚠️ {t('Anda sedang mengerjakan order. Selesaikan dulu.', 'You have an active order. Complete it first.')}
                    </div>
                )}
            </div>

            {activeRequest && (
                <div className="card animate-fade-in" style={{ marginBottom: '1.5rem', borderColor: 'rgba(249,115,22,0.4)' }}>
                    <div className="card-header">
                        <div>
                            <div className="card-title">🚨 {t('Order Aktif', 'Active Order')}</div>
                            <div className="card-subtitle">{activeRequest.request_code}</div>
                        </div>
                        <StatusBadge status={activeRequest.status} lang={lang} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' }}>
                        <div className="request-info">
                            <span>👤</span>
                            <span>{t('Penumpang', 'Passenger')}: <strong>{activeRequest.user?.name}</strong></span>
                        </div>
                        <div className="request-info">
                            <span>📍</span>
                            <span>{t('Lokasi', 'Location')}: <strong>{activeRequest.location?.name}</strong></span>
                        </div>
                        <div className="request-info">
                            <span>👥</span>
                            <span>{t('Penumpang', 'Passengers')}: <strong>{activeRequest.passenger_count} {t('orang', 'people')}</strong></span>
                        </div>
                        {activeRequest.notes && (
                            <div className="request-info">
                                <span>📝</span>
                                <span><em style={{ color: 'var(--text-muted)' }}>{activeRequest.notes}</em></span>
                            </div>
                        )}
                    </div>

                    {nextStatusMap[activeRequest.status] && (
                        <button
                            className="btn btn-primary btn-full btn-lg"
                            onClick={() => updateStatus(activeRequest.id, nextStatusMap[activeRequest.status].next)}
                        >
                            {nextStatusMap[activeRequest.status].label}
                        </button>
                    )}

                    {activeRequest.status === 'completed' && (
                        <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--success)', fontWeight: 700 }}>
                            🎉 {t('Order selesai! Terima kasih.', 'Order completed! Thank you.')}
                        </div>
                    )}
                </div>
            )}

            {statusIsAvailable && !activeRequest && (
                <div>
                    <div className="section-title">
                        📋 {t('Antrian Request', 'Request Queue')}
                        {queue.length > 0 && (
                            <span style={{ background: 'var(--danger)', color: 'white', borderRadius: '20px', padding: '0.1rem 0.5rem', fontSize: '0.75rem', marginLeft: '0.5rem' }}>
                                {queue.length}
                            </span>
                        )}
                    </div>

                    {queue.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">🕐</div>
                            <div className="empty-state-text">
                                {t('Belum ada request masuk.', 'No requests yet.')}<br />
                                <small>{t('Anda akan diberi tahu saat ada permintaan baru.', 'You\'ll be notified when a new request comes in.')}</small>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {queue.map((req) => (
                                <div key={req.id} className={`request-card ${req.priority === 1 ? 'urgent' : 'pending'} animate-fade-in`}>
                                    <div className="request-meta">
                                        {req.priority === 1 && <PriorityBadge priority={req.priority} lang={lang} />}
                                        <StatusBadge status="pending" lang={lang} />
                                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{req.request_code}</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '0.75rem' }}>
                                        <div className="request-info">
                                            <span>👤</span>
                                            <span><strong>{getPassengerName(req)}</strong></span>
                                        </div>
                                        <div className="request-info">
                                            <span>📍</span>
                                            <span>{getLocationLabel(req)}</span>
                                        </div>
                                        <div className="request-info">
                                            <span>👥</span>
                                            <span>{req.passenger_count} {t('penumpang', 'passengers')}</span>
                                        </div>
                                        <div className="request-info">
                                            <span>🕐</span>
                                            <span>{formatRequestedAt(req.requested_at)}</span>
                                        </div>
                                    </div>
                                    <button className="btn btn-success btn-full" onClick={() => acceptRequest(req.id)}>
                                        ✅ {t('Ambil Request', 'Accept Request')}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {!statusIsAvailable && !statusIsBusy && (
                <div className="empty-state">
                    <div className="empty-state-icon">😴</div>
                    <div className="empty-state-text">
                        {t('Status Anda offline. Set ke Tersedia untuk menerima request.', 'You\'re offline. Set to Available to receive requests.')}
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
