"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, Campaign, Metrics, ServicesHealth, SiteConfig } from "@/lib/api";

const CAMPAIGN_POLL_MS = 10_000;

export const campaignsKey = (siteId: string | null) => ["campaigns", siteId] as const;
export const metricsKey = (siteId: string | null) => ["metrics", siteId] as const;
export const siteConfigKey = (siteId: string | null) => ["site-config", siteId] as const;
export const servicesHealthKey = (siteId: string | null) =>
  ["services-health", siteId] as const;

/** Lista de campanhas com polling pausado quando a aba está em background. */
export function useCampaignsQuery(siteId: string | null) {
  return useQuery<Campaign[]>({
    queryKey: campaignsKey(siteId),
    queryFn: async () => (await api.getCampaigns()).campaigns,
    enabled: !!siteId,
    refetchInterval: CAMPAIGN_POLL_MS,
    refetchIntervalInBackground: false,
  });
}

/** Campanha única para hidratar o composer em ?edit=<id>. */
export function useCampaignQuery(id: string | null, siteId: string | null) {
  return useQuery<Campaign>({
    queryKey: ["campaign", id, siteId],
    queryFn: () => api.getCampaign(id as string),
    enabled: !!id && !!siteId,
  });
}

export function useMetricsQuery(siteId: string | null) {
  return useQuery<Metrics>({
    queryKey: metricsKey(siteId),
    queryFn: () => api.getMetrics(),
    enabled: !!siteId,
    refetchInterval: CAMPAIGN_POLL_MS,
    refetchIntervalInBackground: false,
  });
}

export function useSiteConfigQuery(siteId: string | null) {
  return useQuery<SiteConfig>({
    queryKey: siteConfigKey(siteId),
    queryFn: () => api.getSite(),
    enabled: !!siteId,
  });
}

export function useServicesHealthQuery(siteId: string | null) {
  return useQuery<ServicesHealth>({
    queryKey: servicesHealthKey(siteId),
    queryFn: () => api.getServicesHealth(),
    enabled: !!siteId,
    refetchInterval: CAMPAIGN_POLL_MS,
    refetchIntervalInBackground: false,
  });
}

/** Invalida campanhas + métricas após salvar/enviar. */
export function useInvalidateCampaigns() {
  const queryClient = useQueryClient();
  return (siteId: string | null) => {
    void queryClient.invalidateQueries({ queryKey: campaignsKey(siteId) });
    void queryClient.invalidateQueries({ queryKey: metricsKey(siteId) });
  };
}
