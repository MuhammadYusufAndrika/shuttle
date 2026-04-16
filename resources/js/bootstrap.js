import axios from 'axios';
window.axios = axios;
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Laravel Echo + Reverb WebSocket
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

const reverbHost = import.meta.env.VITE_REVERB_HOST || window.location.hostname;
const reverbPort = Number(import.meta.env.VITE_REVERB_PORT || 8080);
const reverbScheme = import.meta.env.VITE_REVERB_SCHEME || window.location.protocol.replace(':', '') || 'http';

window.Echo = new Echo({
    broadcaster: 'reverb',
    key:         import.meta.env.VITE_REVERB_APP_KEY,
    wsHost:      reverbHost,
    wsPort:      reverbPort,
    wssPort:     reverbPort,
    forceTLS:    reverbScheme === 'https',
    enabledTransports: ['ws', 'wss'],
});

// Register service worker for push notifications
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(console.error);
}
