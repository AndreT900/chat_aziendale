import io from 'socket.io-client';

// Centralized socket connection to avoid duplicates
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const socket = io(API_URL, {
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
});

export { socket, API_URL };
