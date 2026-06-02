"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, parseApiError } from "@/lib/api";
import {
  useCampaignQuery,
  useInvalidateCampaigns,
  useMetricsQuery,
  useServicesHealthQuery,
  useSiteConfigQuery,
} from "@/hooks/useCampaignsQuery";
import { useSiteContext } from "@/components/SiteProvider";
import { CampaignComposer } from "@/components/campaigns/CampaignComposer";
import { SendConfirmModal } from "@/components/campaigns/SendConfirmModal";

export default function CampaignComposerPage() {
  const { selectedSiteId, loading: sitesLoading } = useSiteContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"ok" | "err">("ok");
  const [pendingSendId, setPendingSendId] = useState<string | null>(null);

  const showMsg = (text: string, type: "ok" | "err" = "ok") => {
    setMessage(text);
    setMessageType(type);
  };

  const siteQuery = useSiteConfigQuery(selectedSiteId);
  const metricsQuery = useMetricsQuery(selectedSiteId);
  const healthQuery = useServicesHealthQuery(selectedSiteId);
  const campaignQuery = useCampaignQuery(editId, selectedSiteId);
  const invalidateCampaigns = useInvalidateCampaigns();

  const site = siteQuery.data ?? null;
  const activeCount = metricsQuery.data?.active_subscriptions ?? 0;
  const health = healthQuery.data ?? null;

  function openSendModal(id: string) {
    if (activeCount === 0) {
      showMsg(
        "Nenhum inscrito ativo. Abra o site integrado e aceite as notificações primeiro.",
        "err"
      );
      return;
    }
    setPendingSendId(id);
  }

  async function confirmSend() {
    if (!pendingSendId) return;
    const sendId = pendingSendId;
    setPendingSendId(null);
    try {
      const res = await api.sendCampaign(sendId);
      showMsg(
        `Campanha enfileirada para ${res.total_alvo} inscrito(s). Tempo estimado: ~${res.estimated_seconds}s`
      );
      invalidateCampaigns(selectedSiteId);
      router.push("/campanhas");
    } catch (err) {
      showMsg(parseApiError(err), "err");
    }
  }

  if (sitesLoading) return <div className="ui-loading">Carregando...</div>;
  if (!selectedSiteId) {
    return (
      <div className="ui-page ui-empty">
        <div className="banner-warn">
          Nenhum site selecionado. Abra <a href="/sites">Sites</a> para escolher um site.
        </div>
      </div>
    );
  }

  return (
    <div className="ui-page ui-page-wide animate-in fade-in">
      {health && !health.all_ok && (
        <div className="banner-error">
          {health.message ??
            "Alguns serviços essenciais estão indisponíveis. Revise a infraestrutura antes de disparar campanhas."}
        </div>
      )}

      {message && (
        <div className={`toast ${messageType === "err" ? "toast-error" : ""}`}>{message}</div>
      )}

      <CampaignComposer
        site={site}
        editId={editId}
        editingCampaign={campaignQuery.data ?? null}
        selectedSiteId={selectedSiteId}
        activeCount={activeCount}
        showMsg={showMsg}
        onSaved={() => invalidateCampaigns(selectedSiteId)}
        onCreated={(id) => router.replace(`/campanhas/nova?edit=${id}`)}
        onRequestSend={openSendModal}
        onBack={() => router.push("/campanhas")}
      />

      {pendingSendId && (
        <SendConfirmModal
          activeCount={activeCount}
          onCancel={() => setPendingSendId(null)}
          onConfirm={confirmSend}
        />
      )}
    </div>
  );
}
