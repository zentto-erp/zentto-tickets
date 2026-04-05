import { app } from "./app.js";
import { env } from "./config/env.js";
import { startHoldCleanup } from "./jobs/hold-cleanup.js";

const PORT = env.port;

app.listen(PORT, () => {
  console.log(`[zentto-tickets] API running on http://localhost:${PORT}`);
  console.log(`[zentto-tickets] Zentto auth via ${env.zenttoApiUrl}`);

  // Iniciar job de limpieza de holds expirados
  startHoldCleanup();
});
