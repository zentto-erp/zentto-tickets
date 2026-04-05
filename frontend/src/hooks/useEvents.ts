"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Event, PricingZone, SectionAvailability, SeatAvailability, PaginatedResponse } from "@/types";

export function useEvents(params?: { search?: string; status?: string; venueId?: number }) {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set("search", params.search);
  if (params?.status) searchParams.set("status", params.status);
  if (params?.venueId) searchParams.set("venueId", String(params.venueId));

  return useQuery({
    queryKey: ["events", params],
    queryFn: () => api.get<PaginatedResponse<Event>>(`/v1/events?${searchParams}`),
  });
}

export function useEvent(eventId: number) {
  return useQuery({
    queryKey: ["events", eventId],
    queryFn: () => api.get<Event>(`/v1/events/${eventId}`),
    enabled: eventId > 0,
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Event>) => api.post<{ success: boolean; event: Event }>("/v1/events", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, ...data }: Partial<Event> & { eventId: number }) =>
      api.put<{ success: boolean; event: Event }>(`/v1/events/${eventId}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });
}

export function usePricingZones(eventId: number) {
  return useQuery({
    queryKey: ["events", eventId, "pricing-zones"],
    queryFn: () => api.get<PricingZone[]>(`/v1/events/${eventId}/pricing-zones`),
    enabled: eventId > 0,
  });
}

export function useEventAvailability(eventId: number, sectionId?: number) {
  return useQuery({
    queryKey: ["events", eventId, "availability", sectionId],
    queryFn: () => {
      const params = sectionId ? `?sectionId=${sectionId}` : "";
      return api.get<{ sections?: SectionAvailability[]; seats?: SeatAvailability[] }>(
        `/v1/events/${eventId}/availability${params}`
      );
    },
    enabled: eventId > 0,
    refetchInterval: 10_000, // Refrescar cada 10s
  });
}

export function useHoldSeats() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, seatIds }: { eventId: number; seatIds: number[] }) =>
      api.post<{ success: boolean; heldSeats: number[]; expiresInMinutes: number }>(
        `/v1/events/${eventId}/hold`,
        { seatIds }
      ),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["events", vars.eventId, "availability"] }),
  });
}

export function useReleaseSeats() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, seatIds }: { eventId: number; seatIds: number[] }) =>
      api.post(`/v1/events/${eventId}/release`, { seatIds }),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["events", vars.eventId, "availability"] }),
  });
}

export function useInitializeInventory() {
  return useMutation({
    mutationFn: (eventId: number) =>
      api.post<{ success: boolean; seatsCreated: number }>(`/v1/events/${eventId}/initialize-inventory`),
  });
}
