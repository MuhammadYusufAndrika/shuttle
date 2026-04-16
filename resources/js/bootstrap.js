import axios from 'axios';
window.axios = axios;
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Laravel Echo + Reverb WebSocket
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

const envReverbHost = import.meta.env.VITE_REVERB_HOST;
const reverbHost = !envReverbHost || envReverbHost === 'localhost' || envReverbHost === '127.0.0.1'
    ? window.location.hostname
    : envReverbHost;
const reverbPort = Number(import.meta.env.VITE_REVERB_PORT || 8080);
const reverbScheme = import.meta.env.VITE_REVERB_SCHEME || window.location.protocol.replace(':', '') || 'http';
const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

if (csrfToken) {
    window.axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;
}

window.Echo = new Echo({
    broadcaster: 'reverb',
    key:         import.meta.env.VITE_REVERB_APP_KEY,
    wsHost:      reverbHost,
    wsPort:      reverbPort,
    wssPort:     reverbPort,
    forceTLS:    reverbScheme === 'https',
    authEndpoint: '/broadcasting/auth',
    auth: {
        headers: {
            ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
        },
    },
    enabledTransports: ['ws', 'wss'],
});

const syncSocketIdHeader = () => {
    const socketId = window.Echo?.socketId();
    if (socketId) {
        window.axios.defaults.headers.common['X-Socket-ID'] = socketId;
    }
};

syncSocketIdHeader();
window.Echo.connector.pusher.connection.bind('connected', syncSocketIdHeader);

// Register service worker for push notifications
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(console.error);
}
