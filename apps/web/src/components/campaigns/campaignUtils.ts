import { Campaign, STATUS_LABELS } from "@/lib/api";

export function statusLabel(status: string) {
  return STATUS_LABELS[status] ?? status;
}

export function formatNumber(value: number | undefined) {
  return new Intl.NumberFormat("pt-BR").format(value ?? 0);
}

export function formatDate(value?: string) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function latestCampaignTimestamp(c: Campaign) {
  return c.finalizado_em || c.iniciado_em || c.criado_em;
}

export function isSentLike(status: string) {
  return status !== "draft";
}

export function campaignTone(status: string) {
  if (status === "finished") return "finished";
  if (status === "queued" || status === "processing" || status === "skipped") return status;
  if (status === "failed") return "failed";
  return "draft";
}

export type PreviewOS = "mac" | "windows" | "android";
