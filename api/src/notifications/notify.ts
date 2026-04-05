import { ZenttoNotify } from "@zentto/notify-sdk";
import { env } from "../config/env.js";

/**
 * Cliente de notificaciones — consume zentto-notify microservice.
 * Usa API key (X-API-Key: zntfy_...) para auth service-to-service.
 */
export const notify = new ZenttoNotify({
  apiKey: env.notifyApiKey,
  baseUrl: env.notifyUrl,
  timeout: 15_000,
  maxRetries: 2,
});

/* ══════════════════════════════════════════
   Templates IDs para zentto-tickets
   ══════════════════════════════════════════ */

export const TEMPLATES = {
  TICKET_PURCHASED: "zt-ticket-purchased",
  ORDER_CONFIRMATION: "zt-order-confirmation",
  RACE_REGISTRATION: "zt-race-registration",
  EVENT_REMINDER: "zt-event-reminder",
  TICKET_TRANSFER: "zt-ticket-transfer",
  TICKET_CANCELLED: "zt-ticket-cancelled",
} as const;

/**
 * Registrar templates en zentto-notify (ejecutar una vez en startup).
 */
export async function seedNotifyTemplates() {
  const templates = [
    {
      id: TEMPLATES.ORDER_CONFIRMATION,
      name: "Confirmación de Compra — Zentto Tickets",
      subject: "Confirmación de tu compra — {{eventName}}",
      category: "transactional" as const,
      variables: ["buyerName", "eventName", "eventDate", "venueName", "ticketCount", "total", "currency", "orderId"],
      html: `
        <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
          <div style="text-align:center;margin-bottom:24px;">
            <h1 style="color:#6366F1;margin:0;">Zentto Tickets</h1>
          </div>
          <h2 style="color:#1E293B;">¡Compra confirmada!</h2>
          <p>Hola <strong>{{buyerName}}</strong>,</p>
          <p>Tu compra para <strong>{{eventName}}</strong> ha sido confirmada.</p>
          <div style="background:#F8FAFC;border-radius:12px;padding:16px;margin:16px 0;">
            <p style="margin:4px 0;"><strong>Evento:</strong> {{eventName}}</p>
            <p style="margin:4px 0;"><strong>Fecha:</strong> {{eventDate}}</p>
            <p style="margin:4px 0;"><strong>Venue:</strong> {{venueName}}</p>
            <p style="margin:4px 0;"><strong>Boletos:</strong> {{ticketCount}}</p>
            <p style="margin:4px 0;"><strong>Total:</strong> {{total}} {{currency}}</p>
            <p style="margin:4px 0;"><strong>Orden:</strong> #{{orderId}}</p>
          </div>
          <p>Tus boletos con código QR están disponibles en tu cuenta.</p>
          <div style="text-align:center;margin:24px 0;">
            <a href="https://tickets.zentto.net/boletos/{{orderId}}" style="background:#6366F1;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;">Ver mis boletos</a>
          </div>
          <p style="color:#94A3B8;font-size:12px;text-align:center;">Zentto Tickets — Eventos, boletos y experiencias</p>
        </div>
      `,
    },
    {
      id: TEMPLATES.RACE_REGISTRATION,
      name: "Inscripción a Carrera — Zentto Tickets",
      subject: "Inscripción confirmada — {{eventName}} ({{distance}})",
      category: "transactional" as const,
      variables: ["fullName", "eventName", "distance", "bibNumber", "categoryName", "eventDate", "startTime"],
      html: `
        <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
          <div style="text-align:center;margin-bottom:24px;">
            <h1 style="color:#EF4444;margin:0;">Zentto Tickets</h1>
          </div>
          <h2 style="color:#1E293B;">¡Inscripción confirmada!</h2>
          <p>Hola <strong>{{fullName}}</strong>,</p>
          <p>Tu inscripción a <strong>{{eventName}} — {{distance}}</strong> ha sido confirmada.</p>
          <div style="background:#FEF2F2;border-radius:12px;padding:16px;margin:16px 0;border-left:4px solid #EF4444;">
            <p style="margin:4px 0;font-size:24px;font-weight:700;color:#EF4444;text-align:center;">Dorsal: #{{bibNumber}}</p>
            <p style="margin:4px 0;"><strong>Categoría:</strong> {{categoryName}}</p>
            <p style="margin:4px 0;"><strong>Distancia:</strong> {{distance}}</p>
            <p style="margin:4px 0;"><strong>Fecha:</strong> {{eventDate}}</p>
            <p style="margin:4px 0;"><strong>Hora de salida:</strong> {{startTime}}</p>
          </div>
          <p style="color:#94A3B8;font-size:12px;text-align:center;">Zentto Tickets — Eventos, boletos y experiencias</p>
        </div>
      `,
    },
    {
      id: TEMPLATES.TICKET_CANCELLED,
      name: "Boleto Cancelado — Zentto Tickets",
      subject: "Tu orden #{{orderId}} ha sido cancelada",
      category: "transactional" as const,
      variables: ["buyerName", "eventName", "orderId", "total", "currency"],
      html: `
        <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
          <h2 style="color:#EF4444;">Orden cancelada</h2>
          <p>Hola <strong>{{buyerName}}</strong>,</p>
          <p>Tu orden <strong>#{{orderId}}</strong> para <strong>{{eventName}}</strong> ha sido cancelada.</p>
          <p>El monto de <strong>{{total}} {{currency}}</strong> será reembolsado a tu método de pago original.</p>
          <p style="color:#94A3B8;font-size:12px;">Zentto Tickets</p>
        </div>
      `,
    },
  ];

  for (const tpl of templates) {
    try {
      await notify.templates.create(tpl);
      console.log(`[notify] Template registrado: ${tpl.id}`);
    } catch (err: any) {
      // Si ya existe, ignorar
      if (!String(err).includes("already exists")) {
        console.warn(`[notify] Error registrando template ${tpl.id}:`, err.message || err);
      }
    }
  }
}
