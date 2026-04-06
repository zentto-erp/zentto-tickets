"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useDashboardStats() {
  return useQuery({ queryKey: ["dashboard", "stats"], queryFn: () => api.get<any>("/v1/dashboard/stats"), refetchInterval: 30_000 });
}
export function useDashboardSales(period = "month") {
  return useQuery({ queryKey: ["dashboard", "sales", period], queryFn: () => api.get<any[]>(`/v1/dashboard/sales?period=${period}`) });
}
export function useDashboardUpcomingEvents(limit = 5) {
  return useQuery({ queryKey: ["dashboard", "events", limit], queryFn: () => api.get<any[]>(`/v1/dashboard/events?limit=${limit}`) });
}
export function useDashboardRaceStats() {
  return useQuery({ queryKey: ["dashboard", "races"], queryFn: () => api.get<any[]>("/v1/dashboard/races") });
}
export function useDashboardVenueOccupancy() {
  return useQuery({ queryKey: ["dashboard", "venues"], queryFn: () => api.get<any[]>("/v1/dashboard/venues") });
}
