import { Head, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

export default function GuestBook({ locations }) {
    const { flash } = usePage().props;

    const { data, setData, post, processing, errors, reset } = useForm({
        requester_name: '',
        location_id: '',
        destination: '',
        priority: 0,
        passenger_count: 1,
        notes: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('guest.requests.store'), {
            preserveScroll: true,
            onSuccess: () => reset('destination', 'priority', 'passenger_count', 'notes'),
        });
    };

    return (
        <AppLayout>
            <Head title="Guest Booking" />

            <div style={{ maxWidth: '760px', margin: '0 auto' }}>
                <div className="card" style={{ marginBottom: '1rem' }}>
                    <div className="card-title" style={{ fontSize: '1.1rem' }}>Book Shuttle Tanpa Login</div>
                    <div className="card-subtitle">Isi data Anda lalu kirim permintaan shuttle.</div>
                </div>

                {flash?.success?.request_code && (
                    <div className="card" style={{ marginBottom: '1rem', borderColor: 'rgba(34,197,94,0.45)' }}>
                        <div className="card-title" style={{ color: 'var(--success)' }}>Permintaan terkirim</div>
                        <div className="card-subtitle">Kode booking: <strong>{flash.success.request_code}</strong></div>
                    </div>
                )}

                <div className="card">
                    <form onSubmit={submit}>
                        <div className="form-group">
                            <label className="form-label">Nama *</label>
                            <input
                                className="form-control"
                                value={data.requester_name}
                                onChange={(e) => setData('requester_name', e.target.value)}
                                required
                            />
                            {errors.requester_name && <div className="form-error">{errors.requester_name}</div>}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Lokasi Penjemputan *</label>
                            <select
                                className="form-control"
                                value={data.location_id}
                                onChange={(e) => setData('location_id', e.target.value)}
                                required
                            >
                                <option value="">Pilih lokasi...</option>
                                {locations.map((loc) => (
                                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                                ))}
                            </select>
                            {errors.location_id && <div className="form-error">{errors.location_id}</div>}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Tujuan</label>
                            <input
                                className="form-control"
                                value={data.destination}
                                onChange={(e) => setData('destination', e.target.value)}
                            />
                            {errors.destination && <div className="form-error">{errors.destination}</div>}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Jumlah Penumpang</label>
                            <div className="counter-group">
                                <button
                                    type="button"
                                    className="counter-btn"
                                    onClick={() => setData('passenger_count', Math.max(1, data.passenger_count - 1))}
                                >
                                    -
                                </button>
                                <span className="counter-value">{data.passenger_count}</span>
                                <button
                                    type="button"
                                    className="counter-btn"
                                    onClick={() => setData('passenger_count', Math.min(20, data.passenger_count + 1))}
                                >
                                    +
                                </button>
                            </div>
                            {errors.passenger_count && <div className="form-error">{errors.passenger_count}</div>}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Prioritas</label>
                            <div className="toggle-group">
                                <button type="button" className={`toggle-opt ${data.priority === 0 ? 'active' : ''}`} onClick={() => setData('priority', 0)}>
                                    Normal
                                </button>
                                <button type="button" className={`toggle-opt ${data.priority === 1 ? 'active' : ''}`} onClick={() => setData('priority', 1)}>
                                    Urgent
                                </button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Catatan</label>
                            <textarea
                                className="form-control"
                                rows={3}
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                            />
                            {errors.notes && <div className="form-error">{errors.notes}</div>}
                        </div>

                        <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={processing}>
                            {processing ? 'Mengirim...' : 'Kirim Booking'}
                        </button>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
