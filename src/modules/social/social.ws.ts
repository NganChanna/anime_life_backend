import type { FastifyInstance, FastifyRequest } from "fastify";
import type { WebSocket } from "ws";
import { socketManager } from "./socket-manager.js";

export async function socialWsRoutes(server: FastifyInstance) {

    // ── Helper: verify JWT from query param ──

    function verifyToken(socket: WebSocket, request: FastifyRequest): string | null {
        const url = new URL(request.url, `http://${request.headers.host}`);
        const token = url.searchParams.get("token");

        if (!token) {
            socket.send(JSON.stringify({ event: "error", data: { message: "Authentication required" } }));
            socket.close(4001, "Authentication required");
            return null;
        }

        try {
            const decoded = server.jwt.verify<{ id: string; role: string }>(token);
            return decoded.id;
        } catch {
            socket.send(JSON.stringify({ event: "error", data: { message: "Invalid token" } }));
            socket.close(4001, "Invalid token");
            return null;
        }
    }

    // ─────────────────────────────────────────────
    // 1. POST ROOM — /ws/post/:postId?token=JWT
    // ─────────────────────────────────────────────

    server.get<{ Params: { postId: string } }>("/post/:postId", { websocket: true }, (socket: WebSocket, request: FastifyRequest<{ Params: { postId: string } }>) => {
        const userId = verifyToken(socket, request);
        if (!userId) return;

        const { postId } = request.params;
        const roomKey = `post:${postId}`;

        socketManager.join(roomKey, socket);

        socket.send(JSON.stringify({
            event: "connected",
            data: { message: `Joined post room ${postId}`, userId, viewers: socketManager.getRoomSize(roomKey) },
        }));

        socketManager.broadcast(roomKey, "viewer_count", { viewers: socketManager.getRoomSize(roomKey) });

        socket.on("message", (raw: Buffer) => {
            try {
                const msg = JSON.parse(raw.toString());
                if (msg.event === "typing") {
                    socketManager.broadcast(roomKey, "user_typing", { userId });
                }
            } catch { /* ignore */ }
        });

        socket.on("close", () => {
            socketManager.broadcast(roomKey, "viewer_count", { viewers: socketManager.getRoomSize(roomKey) });
        });
    });

    // ─────────────────────────────────────────────
    // 2. CHAT ROOM — /ws/chat/:conversationId?token=JWT
    // ─────────────────────────────────────────────

    server.get<{ Params: { conversationId: string } }>("/chat/:conversationId", { websocket: true }, async (socket: WebSocket, request: FastifyRequest<{ Params: { conversationId: string } }>) => {
        const userId = verifyToken(socket, request);
        if (!userId) return;

        const { conversationId } = request.params;

        // Verify the user is a member of this conversation
        const membership = await server.prisma.conversationMember.findUnique({
            where: { conversationId_userId: { conversationId, userId } },
        });

        if (!membership) {
            socket.send(JSON.stringify({ event: "error", data: { message: "Not a member of this conversation" } }));
            socket.close(4003, "Forbidden");
            return;
        }

        const roomKey = `chat:${conversationId}`;
        socketManager.join(roomKey, socket);

        socket.send(JSON.stringify({
            event: "connected",
            data: { message: `Joined chat room ${conversationId}`, userId, online: socketManager.getRoomSize(roomKey) },
        }));

        socket.on("message", (raw: Buffer) => {
            try {
                const msg = JSON.parse(raw.toString());
                if (msg.event === "typing") {
                    socketManager.broadcast(roomKey, "user_typing", { userId });
                }
            } catch { /* ignore */ }
        });

        socket.on("close", () => {
            socketManager.broadcast(roomKey, "online_count", { online: socketManager.getRoomSize(roomKey) });
        });
    });

    // ─────────────────────────────────────────────
    // 3. NOTIFICATIONS — /ws/notifications?token=JWT
    // ─────────────────────────────────────────────

    server.get("/notifications", { websocket: true }, async (socket: WebSocket, request: FastifyRequest) => {
        const userId = verifyToken(socket, request);
        if (!userId) return;

        const roomKey = `user:${userId}`;
        socketManager.join(roomKey, socket);

        // Send unread count on connect
        const unreadCount = await server.prisma.notification.count({
            where: { userId, isRead: false },
        });

        socket.send(JSON.stringify({
            event: "connected",
            data: { message: "Notification channel connected", userId, unreadCount },
        }));
    });
}
