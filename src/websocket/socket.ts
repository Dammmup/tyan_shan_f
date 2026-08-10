import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';

const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket) return socket;

  socket = io(wsUrl, {
    autoConnect: false,
    transports: ['websocket', 'polling'],
    auth: (cb) => {
      const token = useAuthStore.getState().accessToken;
      cb({ token });
    },
  });

  return socket;
}

export function connectSocket(): Socket {
  const s = getSocket();
  if (!s.connected) {
    s.auth = { token: useAuthStore.getState().accessToken };
    s.connect();
  }
  return s;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function joinRestaurantRoom(restaurantId: string): void {
  const s = connectSocket();
  s.emit('join', { room: `restaurant:${restaurantId}` });
}

export function joinKitchenRoom(restaurantId: string): void {
  const s = connectSocket();
  s.emit('join', { room: `kitchen:${restaurantId}` });
}
