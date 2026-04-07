import { Request, Response, NextFunction } from "express";
import { verifyJwt, JwtPayload } from "../auth/jwt.js";

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
  scope: {
    userId: string;
    companyId: number;
    branchId: number;
    companyCode: string;
    countryCode: string;
    timeZone: string;
    isAdmin: boolean;
  };
}

const PUBLIC_PATHS = new Set(["/health", "/ws"]);

/**
 * Detecta si la request viene de un navegador (defensa contra XSS).
 */
function isBrowserUserAgent(ua: string | undefined): boolean {
  if (!ua) return false;
  return /Mozilla|Chrome|Safari|Firefox|Edge|Opera|Webkit/i.test(ua);
}

/**
 * Middleware que valida JWT emitido por zentto-auth microservice.
 *
 * Browsers: SOLO cookie HttpOnly zentto_token / zentto_access.
 * Server-to-server (sin User-Agent de browser): acepta tambien Bearer.
 *
 * Si una request llega desde un navegador con Authorization: Bearer (en
 * vez de cookie HttpOnly) la rechazamos. Eso significa que JavaScript leyo
 * el token de algun lado (XSS, localStorage, etc.) y nunca debe pasar.
 *
 * Headers opcionales para override de scope:
 *   - x-company-id, x-branch-id
 */
export function requireJwt(req: Request, res: Response, next: NextFunction) {
  if (PUBLIC_PATHS.has(req.path)) return next();

  // Extraer cookie y bearer en paralelo para poder validar la combinacion
  let cookieToken: string | undefined;
  if (req.headers.cookie) {
    const cookies = req.headers.cookie.split(";").reduce((acc, c) => {
      const [k, v] = c.trim().split("=");
      if (k && v) acc[k] = v;
      return acc;
    }, {} as Record<string, string>);
    cookieToken = cookies["zentto_token"] || cookies["zentto_access"];
  }

  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;

  const fromBrowser = isBrowserUserAgent(req.headers["user-agent"] as string | undefined);

  if (fromBrowser && bearerToken && !cookieToken) {
    return res.status(401).json({ error: "browser_bearer_rejected" });
  }

  const token = cookieToken ?? bearerToken;

  if (!token) {
    return res.status(401).json({ error: "missing_token" });
  }

  try {
    const payload = verifyJwt(token);

    const companyIdHeader = req.headers["x-company-id"];
    const branchIdHeader = req.headers["x-branch-id"];

    const companyId = companyIdHeader
      ? parseInt(String(companyIdHeader), 10)
      : payload.companyId ?? 0;
    const branchId = branchIdHeader
      ? parseInt(String(branchIdHeader), 10)
      : payload.branchId ?? 0;

    // Validar acceso a la company solicitada
    if (companyIdHeader && payload.companyAccesses?.length) {
      const hasAccess = payload.companyAccesses.some(
        (a) => a.companyId === companyId
      );
      if (!hasAccess) {
        return res.status(403).json({ error: "company_access_denied" });
      }
    }

    const access = payload.companyAccesses?.find(
      (a) => a.companyId === companyId && a.branchId === branchId
    );

    (req as AuthenticatedRequest).user = payload;
    (req as AuthenticatedRequest).scope = {
      userId: payload.sub,
      companyId,
      branchId,
      companyCode: access?.companyCode ?? payload.companyCode ?? "",
      countryCode: access?.countryCode ?? payload.countryCode ?? "",
      timeZone: access?.timeZone ?? payload.timeZone ?? "UTC",
      isAdmin: payload.isAdmin ?? false,
    };

    next();
  } catch {
    return res.status(401).json({ error: "invalid_token" });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const scope = (req as AuthenticatedRequest).scope;
  if (!scope?.isAdmin) {
    return res.status(403).json({ error: "admin_required" });
  }
  next();
}
