import { useEffect, useRef } from 'react';

// Leaflet is loaded dynamically to avoid SSR issues
export default function LiveMap({ drivers = [], requests = [], locations = [] }) {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef({});

    useEffect(() => {
        if (mapInstanceRef.current) return;

        // Dynamically import Leaflet
        Promise.all([
            import('leaflet'),
            import('leaflet/dist/leaflet.css'),
        ]).then(([L]) => {
            L = L.default || L;

            // Default to PT Dahana location
            const defaultLat = locations[0]?.lat ?? -6.9175;
            const defaultLng = locations[0]?.lng ?? 107.6191;

            const map = L.map(mapRef.current, {
                center: [defaultLat, defaultLng],
                zoom: 16,
                zoomControl: true,
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19,
            }).addTo(map);

            mapInstanceRef.current = { map, L };

            // Add location markers
            const locIcon = L.divIcon({
                className: '',
                html: `<div style="background:#1e3a5f;border:2px solid #3b82f6;border-radius:6px;padding:4px 8px;font-size:10px;color:white;font-weight:600;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.5)">📍</div>`,
                iconSize: [28, 28],
                iconAnchor: [14, 14],
            });

            locations.forEach(loc => {
                if (loc.lat && loc.lng) {
                    L.marker([loc.lat, loc.lng], { icon: locIcon })
                        .addTo(map)
                        .bindPopup(`<strong>${loc.name}</strong><br>${loc.zone || ''}`);
                }
            });

            // Initial driver markers
            renderMarkers({ map, L }, drivers, requests);
        });

        return () => {
            if (mapInstanceRef.current?.map) {
                mapInstanceRef.current.map.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    // Update markers when data changes
    useEffect(() => {
        if (!mapInstanceRef.current) return;
        renderMarkers(mapInstanceRef.current, drivers, requests);
    }, [drivers, requests]);

    function renderMarkers({ map, L }, drivers, requests) {
        // Clear old driver markers
        Object.values(markersRef.current).forEach(m => map.removeLayer(m));
        markersRef.current = {};

        // Driver markers
        drivers.forEach(driver => {
            const ds = driver.driver_status;
            if (!ds?.current_lat || !ds?.current_lng) return;

            const statusColor = { available: '#22c55e', busy: '#f97316', offline: '#64748b' }[ds.status] ?? '#64748b';
            const icon = L.divIcon({
                className: '',
                html: `<div style="background:${statusColor};width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;border:3px solid rgba(255,255,255,0.3);box-shadow:0 4px 16px rgba(0,0,0,0.4)">🚌</div>`,
                iconSize: [36, 36],
                iconAnchor: [18, 18],
            });

            const marker = L.marker([ds.current_lat, ds.current_lng], { icon })
                .addTo(map)
                .bindPopup(`<strong>🧑‍✈️ ${driver.name}</strong><br>Status: ${ds.status}<br>${ds.current_location_name || ''}`);

            markersRef.current[`driver-${driver.id}`] = marker;
        });
    }

    return (
        <div
            ref={mapRef}
            style={{ width: '100%', height: '100%', borderRadius: 'var(--radius)' }}
        />
    );
}
