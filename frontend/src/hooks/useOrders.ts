"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Order, Ticket, PaginatedResponse } from "@/types";

export function useMyOrders(page = 1, limit = 20) {
  return useQuery({
    queryKey: ["orders", page, limit],
    queryFn: () => api.get<PaginatedResponse<Order>>(`/v1/orders?page=${page}&limit=${limit}`),
  });
}

export function useOrder(orderId: number) {
  return useQuery({
    queryKey: ["orders", orderId],
    queryFn: () => api.get<Order>(`/v1/orders/${orderId}`),
    enabled: orderId > 0,
  });
}

export function useOrderTickets(orderId: number) {
  return useQuery({
    queryKey: ["orders", orderId, "tickets"],
    queryFn: () => api.get<Ticket[]>(`/v1/orders/${orderId}/tickets`),
    enabled: orderId > 0,
  });
}

export function useCheckout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      eventId: number;
      seatIds: number[];
      buyerName: string;
      buyerEmail: string;
      buyerPhone?: string;
    }) => api.post<{ success: boolean; order: Order }>("/v1/orders/checkout", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useConfirmPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, paymentRef, paymentMethod }: {
      orderId: number;
      paymentRef: string;
      paymentMethod: string;
    }) => api.post<{ success: boolean; order: Order }>(`/v1/orders/${orderId}/confirm-payment`, {
      paymentRef,
      paymentMethod,
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useCreatePaymentIntent() {
  return useMutation({
    mutationFn: ({ orderId }: { orderId: number }) =>
      api.post<{ clientSecret: string; paymentIntentId: string }>("/v1/payments/create-intent", {
        orderId,
      }),
  });
}

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: number) => api.post(`/v1/orders/${orderId}/cancel`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["events"] });
    },
  });
}
