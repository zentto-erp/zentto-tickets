"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useRaces(search?: string) {
  return useQuery({ queryKey: ["races", search], queryFn: () => api.get<any>(`/v1/races?search=${search ?? ""}`) });
}
export function useRace(raceId: number) {
  return useQuery({ queryKey: ["races", raceId], queryFn: () => api.get<any>(`/v1/races/${raceId}`), enabled: raceId > 0 });
}
export function useRaceCategories(raceId: number) {
  return useQuery({ queryKey: ["races", raceId, "categories"], queryFn: () => api.get<any[]>(`/v1/races/${raceId}/categories`), enabled: raceId > 0 });
}
export function useRaceLeaderboard(raceId: number, categoryId?: number) {
  const params = categoryId ? `?categoryId=${categoryId}` : "";
  return useQuery({ queryKey: ["races", raceId, "leaderboard", categoryId], queryFn: () => api.get<any[]>(`/v1/races/${raceId}/leaderboard${params}`), enabled: raceId > 0, refetchInterval: 15_000 });
}
export function useRegisterRace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ raceId, ...data }: { raceId: number } & Record<string, unknown>) => api.post<{ success: boolean; registration: any }>(`/v1/races/${raceId}/register`, data),
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ["races", vars.raceId] }); },
  });
}
export function useScanRaceQR() {
  return useMutation({ mutationFn: (barcode: string) => api.post<any>("/v1/races/scan", { barcode }) });
}
