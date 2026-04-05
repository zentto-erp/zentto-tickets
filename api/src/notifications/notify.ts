import { env } from "../config/env.js";

/* ══════════════════════════════════════════
   Cliente HTTP para zentto-notify microservice.
   Usa X-API-Key para auth service-to-service.
   ══════════════════════════════════════════ */

export const TEMPLATES = {
  ORDER_CONFIRMATION: "zt-order-confirmation",
  RACE_REGISTRATION: "zt-race-registration",
  TICKET_CANCELLED: "zt-ticket-cancelled",
} as const;

async function notifyPost(path: string, body: Record<string, unknown>) {
  if (!env.notifyApiKey) return;
  try {
    await fetch(`${env.notifyUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": env.notifyApiKey,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error(`[notify] POST ${path} error:`, err);
  }
}

export const notify = {
  email: {
    send: (opts: {
      to: string;
      templateId?: string;
      subject?: string;
      html?: string;
      variables?: Record<string, string>;
      track?: boolean;
    }) => notifyPost("/api/email/send", opts),
  },
  templates: {
    create: (tpl: Record<string, unknown>) => notifyPost("/api/templates", tpl),
  },
};

/**
 * Registrar templates de email en zentto-notify (una vez en startup).
 */
export async function seedNotifyTemplates() {
  const templates = [
    {
      id: TEMPLATES.ORDER_CONFIRMATION,
      name: "Confirmación de Compra — Zentto Tickets",
      subject: "Confirmación de tu compra — {{eventName}}",
      category: "transactional",
      variables: ["buyerName", "eventName", "eventDate", "venueName", "ticketCount", "total", "currency", "orderId"],
      html: `<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:24px;"><h1 style="color:#6366F1;">Zentto Tickets</h1><h2>Compra confirmada</h2><p>Hola <strong>{{buyerName}}</strong>,</p><p>Tu compra para <strong>{{eventName}}</strong> ha sido confirmada.</p><div style="background:#F8FAFC;border-radius:12px;padding:16px;margin:16px 0;"><p><strong>Evento:</strong> {{eventName}}</p><p><strong>Fecha:</strong> {{eventDate}}</p><p><strong>Venue:</strong> {{venueName}}</p><p><strong>Boletos:</strong> {{ticketCount}}</p><p><strong>Total:</strong> {{total}} {{currency}}</p><p><strong>Orden:</strong> #{{orderId}}</p></div><p style="color:#94A3B8;font-size:12px;">Zentto Tickets</p></div>`,
    },
    {
      id: TEMPLATES.RACE_REGISTRATION,
      name: "Inscripción a Carrera — Zentto Tickets",
      subject: "Inscripción confirmada — {{eventName}} ({{distance}})",
      category: "transactional",
      variables: ["fullName", "eventName", "distance", "bibNumber", "categoryName", "eventDate", "startTime"],
      html: `<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:24px;"><h1 style="color:#EF4444;">Zentto Tickets</h1><h2>Inscripción confirmada</h2><p>Hola <strong>{{fullName}}</strong>,</p><p>Tu inscripción a <strong>{{eventName}} — {{distance}}</strong> ha sido confirmada.</p><div style="background:#FEF2F2;border-radius:12px;padding:16px;margin:16px 0;border-left:4px solid #EF4444;"><p style="font-size:24px;font-weight:700;color:#EF4444;text-align:center;">Dorsal: #{{bibNumber}}</p><p><strong>Categoría:</strong> {{categoryName}}</p><p><strong>Distancia:</strong> {{distance}}</p><p><strong>Fecha:</strong> {{eventDate}}</p></div></div>`,
    },
    {
      id: TEMPLATES.TICKET_CANCELLED,
      name: "Boleto Cancelado — Zentto Tickets",
      subject: "Tu orden #{{orderId}} ha sido cancelada",
      category: "transactional",
      variables: ["buyerName", "eventName", "orderId", "total", "currency"],
      html: `<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:24px;"><h2 style="color:#EF4444;">Orden cancelada</h2><p>Hola <strong>{{buyerName}}</strong>,</p><p>Tu orden <strong>#{{orderId}}</strong> para <strong>{{eventName}}</strong> ha sido cancelada.</p><p>El monto de <strong>{{total}} {{currency}}</strong> será reembolsado.</p></div>`,
    },
  ];

  for (const tpl of templates) {
    try {
      await notify.templates.create(tpl);
      console.log(`[notify] Template: ${tpl.id}`);
    } catch {
      // Template ya existe — ignorar
    }
  }
}
