import { io } from 'socket.io-client'

let socket = null

export const connect = (options = {}) => {
	if (socket?.connected) return socket

	const url = options.url || import.meta.env?.VITE_SOCKET_URL || window.location.origin
	const path = options.path

    socket = io(url, {
        transports: ['websocket'],
		autoConnect: true,
		reconnection: true,
		reconnectionAttempts: Infinity,
        reconnectionDelay: 200,
        reconnectionDelayMax: 1500,
        timeout: 8000,
		...(path ? { path } : {}),
		...(options.ioOptions || {})
	})

	return socket
}

export const getSocket = () => socket

export const disconnect = () => {
	if (!socket) return
	socket.disconnect()
	socket = null
}

export const on = (eventName, handler) => {
	if (!socket) return
	socket.on(eventName, handler)
}

export const off = (eventName, handler) => {
	if (!socket) return
	socket.off(eventName, handler)
}

export const emit = (eventName, payload, ack) => {
	if (!socket) return
	if (typeof ack === 'function') {
		socket.timeout(5000).emit(eventName, payload, ack)
		return
	}
	socket.emit(eventName, payload)
}

// Convenience helpers for the monitoring flow
export const onMonitoringUpdate = (handler) => on('monitoring:update', handler)
export const offMonitoringUpdate = (handler) => off('monitoring:update', handler)


