import type { WebSocket } from "ws";

/**
 * Centralized room-based WebSocket manager for real-time events.
 *
 * Room key patterns:
 *   - "post:{postId}"              — Social post (comments, likes, viewer count)
 *   - "chat:{conversationId}"      — Chat conversation (DM or group)
 *   - "user:{userId}"              — Personal channel (notifications)
 */
export class SocketManager {
    // Map of roomKey -> Set of connected sockets
    private rooms: Map<string, Set<WebSocket>> = new Map();

    // ── Generic Room Operations ──

    /** Add a socket to any room */
    join(roomKey: string, socket: WebSocket): void {
        if (!this.rooms.has(roomKey)) {
            this.rooms.set(roomKey, new Set());
        }
        this.rooms.get(roomKey)!.add(socket);

        // Auto-cleanup on close
        socket.on("close", () => {
            this.leave(roomKey, socket);
        });
    }

    /** Remove a socket from a room */
    leave(roomKey: string, socket: WebSocket): void {
        const room = this.rooms.get(roomKey);
        if (room) {
            room.delete(socket);
            if (room.size === 0) {
                this.rooms.delete(roomKey);
            }
        }
    }

    /** Broadcast a JSON message to all sockets in a room */
    broadcast(roomKey: string, event: string, data: unknown): void {
        const room = this.rooms.get(roomKey);
        if (!room) return;

        const message = JSON.stringify({ event, data });
        for (const socket of room) {
            if (socket.readyState === socket.OPEN) {
                socket.send(message);
            }
        }
    }

    /** Get the count of connected clients in a room */
    getRoomSize(roomKey: string): number {
        return this.rooms.get(roomKey)?.size ?? 0;
    }

    // ── Convenience Helpers (sugar over generic ops) ──

    /** Join a post room */
    joinRoom(postId: string, socket: WebSocket): void {
        this.join(`post:${postId}`, socket);
    }

    /** Leave a post room */
    leaveRoom(postId: string, socket: WebSocket): void {
        this.leave(`post:${postId}`, socket);
    }

    /** Broadcast to a post room */
    broadcastToRoom(postId: string, event: string, data: unknown): void {
        this.broadcast(`post:${postId}`, event, data);
    }

    /** Send a real-time event to a specific user's notification channel */
    sendToUser(userId: string, event: string, data: unknown): void {
        this.broadcast(`user:${userId}`, event, data);
    }

    /** Broadcast to a chat conversation room */
    broadcastToChat(conversationId: string, event: string, data: unknown): void {
        this.broadcast(`chat:${conversationId}`, event, data);
    }
}

// Singleton instance
export const socketManager = new SocketManager();
