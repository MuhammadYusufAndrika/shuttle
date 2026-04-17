import { Head, router, usePage } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge, DriverStatusBadge, PriorityBadge } from '@/Components/StatusBadge';

export default function DriverIndex({ driverStatus: initial, queue: initialQueue, activeRequests: initialActiveRequests = [] }) {
    const { auth } = usePage().props;
    const [lang, setLang] = useState('id');
    const [driverStatus, setDriverStatus] = useState(initial);
    const echoRef = useRef(null);

    const canUseNotification = typeof window !== 'undefined' && 'Notification' in window;

    const normalizeRequest = (req) => {
        if (!req || typeof req !== 'object') return null;

        return {
            ...req,
            user_name: req.user_name || req.requester_name || req.user?.name || '-',
            location_name: typeof req.location === 'string'
                ? req.location
                : (req.location?.name || req.location_name || '-'),
            location_en: req.location_en || req.location?.name_en || req.location_name || '-',
        };
    };

    const normalizeActiveRequest = (req) => {
        const normalized = normalizeRequest(req);
        if (!normalized) return null;

        return {
            ...normalized,
            user: normalized.user || (normalized.user_name ? { name: normalized.user_name } : null),
            location: normalized.location && typeof normalized.location === 'object'
                ? normalized.location
                : {
                    name: normalized.location_name,
                    name_en: normalized.location_en,
                },
        };
    };

    const [queue, setQueue] = useState((initialQueue || []).map(normalizeRequest).filter(Boolean));
    const [activeRequests, setActiveRequests] = useState((initialActiveRequests || []).map(normalizeActiveRequest).filter(Boolean));

    const t = (id, en) => (lang === 'id' ? id : en);

    useEffect(() => {
        registerPush();

        if (window.Echo) {
            const ch = window.Echo.channel('requests');

            ch.listen('.request.created', (e) => {
                const normalized = normalizeRequest(e);
                if (!normalized) return;

                setQueue((prev) => [normalized, ...prev]);

                if (canUseNotification && Notification.permission === 'granted' && (driverStatus.status === 'available' || driverStatus.status === 'busy')) {
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

                setActiveRequests((prev) => {
                    const exists = prev.some((r) => r.id === e.id);
                    if (!exists) return prev;

                    if (e.status === 'completed') {
                        const next = prev.filter((r) => r.id !== e.id);
                        if (next.length === 0) {
                            setDriverStatus((current) => ({ ...current, status: 'available' }));
                        }
                        return next;
                    }

                    return prev.map((r) => (r.id === e.id ? { ...r, status: e.status } : r));
                });
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

    useEffect(() => {
        setDriverStatus(initial);
    }, [initial?.status, initial?.updated_at]);

    useEffect(() => {
        setQueue((initialQueue || []).map(normalizeRequest).filter(Boolean));
    }, [initialQueue]);

    useEffect(() => {
        setActiveRequests((initialActiveRequests || []).map(normalizeActiveRequest).filter(Boolean));
    }, [initialActiveRequests]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            router.reload({
                only: ['driverStatus', 'queue', 'activeRequests'],
                preserveState: true,
                preserveScroll: true,
            });
        }, 4000);

        return () => clearInterval(intervalId);
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
                    setActiveRequests((prev) => {
                        if (prev.some((r) => r.id === req.id)) return prev;

                        return [
                            {
                                ...req,
                                status: 'on_the_way',
                                user: req.user || { name: req.user_name },
                                location: req.location || { name: req.location_name, name_en: req.location_en },
                            },
                            ...prev,
                        ];
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
                if (status === 'completed') {
                    setActiveRequests((prev) => {
                        const next = prev.filter((r) => r.id !== id);
                        if (next.length === 0) {
                            setDriverStatus((current) => ({ ...current, status: 'available' }));
                        }
                        return next;
                    });
                    router.reload({ only: ['queue', 'activeRequests', 'driverStatus'] });
                    return;
                }

                setActiveRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
            },
        });
    };

    const statusIsAvailable = driverStatus?.status === 'available';
    const statusIsBusy = driverStatus?.status === 'busy';
    const canTakeOrders = statusIsAvailable || statusIsBusy;

    const nextStatusMap = {
        accepted: { label: t('OTW 🚌', 'On The Way 🚌'), next: 'on_the_way' },
        on_the_way: { label: t('Tiba 📍', 'Arrived 📍'), next: 'arrived' },
        arrived: { label: t('Selesai ✅', 'Complete ✅'), next: 'completed' },
    };

    const getPassengerName = (req) => req.user_name || req.requester_name || req.user?.name || '-';

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
                        ⚠️ {t('Anda sedang mengerjakan order, tetapi masih bisa mengambil order lain.', 'You are currently busy, but you can still take more orders.')}
                    </div>
                )}
            </div>

            {activeRequests.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                    <div className="section-title">
                        🚨 {t('Order Aktif', 'Active Orders')}
                        <span style={{ background: 'var(--warning)', color: '#111827', borderRadius: '20px', padding: '0.1rem 0.5rem', fontSize: '0.75rem', marginLeft: '0.5rem' }}>
                            {activeRequests.length}
                        </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {activeRequests.map((req) => (
                            <div key={req.id} className="card animate-fade-in" style={{ borderColor: 'rgba(249,115,22,0.4)' }}>
                                <div className="card-header">
                                    <div>
                                        <div className="card-title">{req.request_code}</div>
                                    </div>
                                    <StatusBadge status={req.status} lang={lang} />
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' }}>
                                    <div className="request-info">
                                        <span>👤</span>
                                        <span>{t('Penumpang', 'Passenger')}: <strong>{req.user?.name || req.requester_name || '-'}</strong></span>
                                    </div>
                                    <div className="request-info">
                                        <span>📍</span>
                                        <span>{t('Lokasi', 'Location')}: <strong>{req.location?.name || getLocationLabel(req)}</strong></span>
                                    </div>
                                    <div className="request-info">
                                        <span>👥</span>
                                        <span>{t('Penumpang', 'Passengers')}: <strong>{req.passenger_count} {t('orang', 'people')}</strong></span>
                                    </div>
                                    {req.notes && (
                                        <div className="request-info">
                                            <span>📝</span>
                                            <span><em style={{ color: 'var(--text-muted)' }}>{req.notes}</em></span>
                                        </div>
                                    )}
                                </div>

                                {nextStatusMap[req.status] && (
                                    <button
                                        className="btn btn-primary btn-full btn-lg"
                                        onClick={() => updateStatus(req.id, nextStatusMap[req.status].next)}
                                    >
                                        {nextStatusMap[req.status].label}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {canTakeOrders && (
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

            {!canTakeOrders && (
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
