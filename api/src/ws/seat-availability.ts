import { WebSocketServer, WebSocket } from "ws";
import { verifyJwt } from "../auth/jwt.js";
import { env } from "../config/env.js";

interface SeatChangeMessage {
  type: "seat_change";
  eventId: number;
  seatId: number;
  status: "available" | "held" | "sold";
}

// Map: eventId → Set<WebSocket>
const eventSubscribers = new Map<number, Set<WebSocket>>();

export function startWebSocketServer() {
  const wss = new WebSocketServer({ port: env.ws.port });

  console.log(`[WS] Seat availability server on ws://localhost:${env.ws.port}`);

  wss.on("connection", (ws, req) => {
    const url = new URL(req.url ?? "/", `http://localhost:${env.ws.port}`);
    const eventId = Number(url.searchParams.get("eventId"));
    const token = url.searchParams.get("token");

    // Validar auth
    if (!token) {
      ws.close(4001, "missing_token");
      return;
    }

    try {
      verifyJwt(token);
    } catch {
      ws.close(4002, "invalid_token");
      return;
    }

    if (!eventId) {
      ws.close(4003, "missing_event_id");
      return;
    }

    // Suscribir al evento
    if (!eventSubscribers.has(eventId)) {
      eventSubscribers.set(eventId, new Set());
    }
    eventSubscribers.get(eventId)!.add(ws);

    ws.on("close", () => {
      eventSubscribers.get(eventId)?.delete(ws);
      if (eventSubscribers.get(eventId)?.size === 0) {
        eventSubscribers.delete(eventId);
      }
    });

    ws.send(JSON.stringify({ type: "connected", eventId }));
  });

  return wss;
}

/**
 * Broadcast cambio de asiento a todos los clientes suscritos a un evento.
 */
export function broadcastSeatChange(msg: SeatChangeMessage) {
  const subscribers = eventSubscribers.get(msg.eventId);
  if (!subscribers) return;

  const data = JSON.stringify(msg);
  for (const ws of subscribers) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  }
}
