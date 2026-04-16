const STATUS_LABELS = {
    pending:    { id: 'Menunggu',    en: 'Waiting' },
    accepted:   { id: 'Diterima',   en: 'Accepted' },
    on_the_way: { id: 'OTW',        en: 'On the Way' },
    arrived:    { id: 'Tiba',       en: 'Arrived' },
    completed:  { id: 'Selesai',    en: 'Completed' },
    cancelled:  { id: 'Dibatalkan', en: 'Cancelled' },
};

const DRIVER_STATUS_LABELS = {
    available: { id: 'Tersedia', en: 'Available' },
    busy:      { id: 'Sibuk',    en: 'Busy' },
    offline:   { id: 'Offline',  en: 'Offline' },
};

export function StatusBadge({ status, lang = 'id' }) {
    const label = STATUS_LABELS[status]?.[lang] ?? status;
    const dotColor = {
        pending: '#fbbf24', accepted: '#60a5fa', on_the_way: '#a78bfa',
        arrived: '#2dd4bf', completed: '#4ade80', cancelled: '#f87171',
    }[status] ?? '#94a3b8';

    return (
        <span className={`badge badge-${status}`}>
            <span className="badge-dot" style={{ background: dotColor }} />
            {label}
        </span>
    );
}

export function DriverStatusBadge({ status, lang = 'id' }) {
    const label = DRIVER_STATUS_LABELS[status]?.[lang] ?? status;
    return <span className={`badge badge-${status}`}>{label}</span>;
}

export function PriorityBadge({ priority, lang = 'id' }) {
    return priority === 1
        ? <span className="badge badge-urgent">🚨 {lang === 'id' ? 'Urgent' : 'Urgent'}</span>
        : null;
}
