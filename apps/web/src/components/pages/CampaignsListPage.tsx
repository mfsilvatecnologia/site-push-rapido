"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { api, parseApiError } from "@/lib/api";
import {
  useCampaignsQuery,
  useInvalidateCampaigns,
  useMetricsQuery,
  useServicesHealthQuery,
} from "@/hooks/useCampaignsQuery";
import { useSiteContext } from "@/components/SiteProvider";
import { CampaignList } from "@/components/campaigns/CampaignList";
import { SendConfirmModal } from "@/components/campaigns/SendConfirmModal";

export default function CampaignsListPage() {
  const { selectedSiteId, loading: sitesLoading } = useSiteContext();
  const router = useRouter();

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"ok" | "err">("ok");
  const [pendingSendId, setPendingSendId] = useState<string | null>(null);

  const showMsg = (text: string, type: "ok" | "err" = "ok") => {
    setMessage(text);
    setMessageType(type);
  };

  const campaignsQuery = useCampaignsQuery(selectedSiteId);
  const metricsQuery = useMetricsQuery(selectedSiteId);
  const healthQuery = useServicesHealthQuery(selectedSiteId);
  const invalidateCampaigns = useInvalidateCampaigns();

  const campaigns = campaignsQuery.data ?? [];
  const activeCount = metricsQuery.data?.active_subscriptions ?? 0;
  const health = healthQuery.data ?? null;

  function openComposer(editId?: string) {
    router.push(editId ? `/campanhas/nova?edit=${editId}` : "/campanhas/nova");
  }

  async function handleTest(id: string) {
    try {
      const result = await api.testCampaign(id);
      const hasMedia = result.payload?.icon || result.payload?.image;
      showMsg(
        hasMedia
          ? "Teste enviado (com ícone/banner). Verifique o navegador."
          : "Teste enviado, mas sem ícone/banner no payload — salve o rascunho com banner e tente de novo."
      );
    } catch (err) {
      showMsg(parseApiError(err), "err");
    }
  }

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
    } catch (err) {
      showMsg(parseApiError(err), "err");
    }
  }

  if (sitesLoading || (selectedSiteId && campaignsQuery.isLoading)) {
    return <div className="ui-loading">Carregando...</div>;
  }
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

      <div>
        <header className="ui-header">
          <h1 className="ui-title">Campanhas</h1>
          <div className="ui-header-actions">
            <button type="button" onClick={() => openComposer()} className="btn btn-primary">
              <Plus size={16} />
              <span>Nova Push</span>
            </button>
          </div>
        </header>

        <CampaignList
          campaigns={campaigns}
          activeCount={activeCount}
          onEdit={openComposer}
          onTest={handleTest}
          onSend={openSendModal}
        />
      </div>

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
