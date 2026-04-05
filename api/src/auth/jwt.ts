import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

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

export type JwtPayload = {
  sub: string;
  name?: string | null;
  tipo?: string | null;
  isAdmin?: boolean;
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
  companyId?: number;
  companyCode?: string;
  companyName?: string;
  branchId?: number;
  branchCode?: string;
  branchName?: string;
  countryCode?: string;
  timeZone?: string;
  companyAccesses?: CompanyAccessClaim[];
};

/**
 * Verifica un JWT emitido por el microservicio de auth de Zentto.
 * Usa el mismo JWT_SECRET que zentto-web API.
 */
export function verifyJwt(token: string): JwtPayload & jwt.JwtPayload {
  return jwt.verify(token, env.jwt.secret) as JwtPayload & jwt.JwtPayload;
}
