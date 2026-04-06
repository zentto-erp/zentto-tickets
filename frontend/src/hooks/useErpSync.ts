"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface ErpSyncStats {
  pending: number;
  syncedToday: number;
  failed: number;
  total: number;
}

interface ErpSyncItem {
  SyncId: number;
  OrderId: number;
  EventType: string;
  Status: string;
  Attempts: number;
  LastError: string | null;
  CreatedAt: string;
  SyncedAt: string | null;
}

export function useErpSyncStats() {
  return useQuery<ErpSyncStats>({
    queryKey: ["erp-sync", "stats"],
    queryFn: () => api.get<ErpSyncStats>("/v1/erp-sync/stats"),
    refetchInterval: 30_000,
  });
}

export function useErpSyncRecent(limit = 10) {
  return useQuery<ErpSyncItem[]>({
    queryKey: ["erp-sync", "recent", limit],
    queryFn: () => api.get<ErpSyncItem[]>(`/v1/erp-sync/recent?limit=${limit}`),
    refetchInterval: 30_000,
  });
}
