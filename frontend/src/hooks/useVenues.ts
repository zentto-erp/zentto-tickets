"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Venue, VenueConfiguration, Section, SeatMapData, PaginatedResponse } from "@/types";

export function useVenues(params?: { search?: string; city?: string; country?: string }) {
  return useQuery({
    queryKey: ["venues", params],
    queryFn: () => api.get<PaginatedResponse<Venue>>(`/v1/venues?${new URLSearchParams(params as Record<string, string>)}`),
  });
}

export function useVenue(venueId: number) {
  return useQuery({
    queryKey: ["venues", venueId],
    queryFn: () => api.get<Venue>(`/v1/venues/${venueId}`),
    enabled: venueId > 0,
  });
}

export function useVenueConfigurations(venueId: number) {
  return useQuery({
    queryKey: ["venues", venueId, "configurations"],
    queryFn: () => api.get<VenueConfiguration[]>(`/v1/venues/${venueId}/configurations`),
    enabled: venueId > 0,
  });
}

export function useSections(configId: number) {
  return useQuery({
    queryKey: ["configurations", configId, "sections"],
    queryFn: () => api.get<Section[]>(`/v1/venues/configurations/${configId}/sections`),
    enabled: configId > 0,
  });
}

export function useSeatMap(configId: number) {
  return useQuery({
    queryKey: ["seatmap", configId],
    queryFn: () => api.get<SeatMapData>(`/v1/venues/configurations/${configId}/seatmap`),
    enabled: configId > 0,
  });
}

export function useCreateVenue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Venue>) => api.post<{ success: boolean; venue: Venue }>("/v1/venues", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["venues"] }),
  });
}

export function useUpdateVenue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ venueId, ...data }: Partial<Venue> & { venueId: number }) =>
      api.put<{ success: boolean; venue: Venue }>(`/v1/venues/${venueId}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["venues"] }),
  });
}

export function useGenerateSeats() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sectionId, ...data }: { sectionId: number; rows: number; seatsPerRow: number; startLabel?: string }) =>
      api.post(`/v1/venues/sections/${sectionId}/generate-seats`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["seatmap"] }),
  });
}
