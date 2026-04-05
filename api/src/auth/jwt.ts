import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

/**
 * Payload del JWT emitido por zentto-auth microservice.
 * zentto-auth firma con JWT_SECRET compartido entre todos los servicios.
 */
export type JwtPayload = {
  sub: string;              // userId
  name?: string | null;
  email?: string | null;
  isAdmin?: boolean;
  roles?: string[];
  // Campos opcionales que zentto-auth puede incluir
  companyId?: number;
  companyCode?: string;
  companyName?: string;
  branchId?: number;
  branchCode?: string;
  branchName?: string;
  countryCode?: string;
  timeZone?: string;
  companyAccesses?: CompanyAccessClaim[];
  // Campos legacy del ERP (compatibilidad)
  tipo?: string | null;
  permisos?: {
    canUpdate: boolean;
    canCreate: boolean;
    canDelete: boolean;
    canChangePrice: boolean;
    canGiveCredit: boolean;
    canChangePwd: boolean;
    isCreator: boolean;
  };
  modulos?: string[];
};

export type CompanyAccessClaim = {
  companyId: number;
  companyCode: string;
  companyName: string;
  branchId: number;
  branchCode: string;
  branchName: string;
  countryCode: string;
  timeZone?: string;
  isDefault?: boolean;
};

/**
 * Verifica un JWT emitido por zentto-auth.
 * IMPORTANTE: JWT_SECRET debe ser el MISMO en zentto-auth y en este servicio.
 */
export function verifyJwt(token: string): JwtPayload & jwt.JwtPayload {
  return jwt.verify(token, env.jwt.secret) as JwtPayload & jwt.JwtPayload;
}
