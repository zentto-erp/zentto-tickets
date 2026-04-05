import { app } from "./app.js";
import { env } from "./config/env.js";
import { startHoldCleanup } from "./jobs/hold-cleanup.js";
import { seedNotifyTemplates } from "./notifications/notify.js";

const PORT = env.port;

app.listen(PORT, () => {
  console.log(`[zentto-tickets] API running on http://localhost:${PORT}`);
  console.log(`[zentto-tickets] Zentto auth via ${env.zenttoApiUrl}`);
  console.log(`[zentto-tickets] Notify via ${env.notifyUrl}`);

  startHoldCleanup();

  // Registrar templates de email en zentto-notify
  if (env.notifyApiKey) {
    seedNotifyTemplates().catch((err) =>
      console.warn("[notify] No se pudieron registrar templates:", err.message)
    );
  }
});
