"use client";

import { useMemo, useState } from "react";
import { Bell, Edit2, Search, Send, Users } from "lucide-react";
import { Campaign } from "@/lib/api";
import {
  campaignTone,
  formatDate,
  formatNumber,
  isSentLike,
  latestCampaignTimestamp,
  statusLabel,
} from "./campaignUtils";

interface CampaignListProps {
  campaigns: Campaign[];
  activeCount: number;
  onEdit: (id: string) => void;
  onTest: (id: string) => void;
  onSend: (id: string) => void;
}

export function CampaignList({
  campaigns,
  activeCount,
  onEdit,
  onTest,
  onSend,
}: CampaignListProps) {
  const [activeTab, setActiveTab] = useState<"sent" | "drafts">("sent");
  const [search, setSearch] = useState("");

  const sentCount = campaigns.filter((c) => isSentLike(c.status)).length;
  const draftCount = campaigns.filter((c) => c.status === "draft").length;

  const filteredCampaigns = useMemo(() => {
    const base = campaigns.filter((campaign) =>
      activeTab === "sent" ? isSentLike(campaign.status) : campaign.status === "draft"
    );
    const searchTerm = search.trim().toLowerCase();
    if (!searchTerm) return base;
    return base.filter((campaign) => {
      const haystack = `${campaign.titulo} ${campaign.mensagem}`.toLowerCase();
      return haystack.includes(searchTerm);
    });
  }, [activeTab, campaigns, search]);

  return (
    <>
      <div className="ui-summary">
        <div className="ui-chip">
          <Send size={16} />
          <span>{formatNumber(sentCount)} enviadas</span>
        </div>
        <div className="ui-chip">
          <Edit2 size={16} />
          <span>{formatNumber(draftCount)} rascunhos</span>
        </div>
        <div className="ui-chip">
          <Users size={16} />
          <span>{formatNumber(activeCount)} ativos</span>
        </div>
      </div>

      <section className="ui-section">
        <div className="ui-toolbar">
          <div className="ui-inline-tabs">
            <button
              type="button"
              onClick={() => setActiveTab("sent")}
              className={`ui-inline-tab${activeTab === "sent" ? " active" : ""}`}
            >
              Enviadas
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("drafts")}
              className={`ui-inline-tab${activeTab === "drafts" ? " active" : ""}`}
            >
              Rascunhos
            </button>
          </div>
          <div className="ui-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Buscar campanha"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {filteredCampaigns.length === 0 ? (
          <div className="empty">Nenhuma campanha encontrada.</div>
        ) : (
          <>
            <div className="ui-table-wrap messages-desktop-table">
              <table className="table">
                <thead>
                  <tr>
                    <th>Campanha</th>
                    <th style={{ textAlign: "right" }}>Destinatários</th>
                    <th style={{ textAlign: "right" }}>Entregues</th>
                    <th style={{ textAlign: "right" }}>Cliques</th>
                    <th>Última atualização</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filteredCampaigns.map((campaign) => (
                    <tr key={campaign.id} className="messages-row">
                      <td>
                        <div className="table-title-cell">
                          <span
                            className={`table-title-dot ${isSentLike(campaign.status) ? "success" : "warning"}`}
                            aria-hidden
                          />
                          <div>
                            <div className="table-title table-link">{campaign.titulo}</div>
                            <span className={`badge badge-${campaignTone(campaign.status)}`}>
                              {statusLabel(campaign.status)}
                            </span>
                            <span className="table-subtitle">{campaign.mensagem}</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: "right" }} className="table-number">
                        {campaign.total_alvo > 0 ? formatNumber(campaign.total_alvo) : "-"}
                      </td>
                      <td style={{ textAlign: "right" }} className="table-number">
                        <span>
                          {campaign.total_entregues > 0
                            ? formatNumber(campaign.total_entregues)
                            : "-"}
                        </span>
                        {campaign.total_entregues > 0 && campaign.total_alvo > 0 ? (
                          <span className="table-muted">
                            {((campaign.total_entregues / campaign.total_alvo) * 100).toFixed(1)}%
                          </span>
                        ) : null}
                      </td>
                      <td style={{ textAlign: "right" }} className="table-number">
                        <span>
                          {campaign.total_cliques > 0
                            ? formatNumber(campaign.total_cliques)
                            : "-"}
                        </span>
                        {campaign.total_entregues > 0 ? (
                          <span className="table-muted">
                            {((campaign.total_cliques / campaign.total_entregues) * 100).toFixed(1)}%
                          </span>
                        ) : null}
                      </td>
                      <td className="table-muted">{formatDate(latestCampaignTimestamp(campaign))}</td>
                      <td className="table-actions">
                        <button type="button" className="btn btn-sm" onClick={() => onEdit(campaign.id)}>
                          <Edit2 size={14} />
                          <span>Editar</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-ghost"
                          onClick={() => onTest(campaign.id)}
                        >
                          <Bell size={14} />
                          <span>Teste</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={() => onSend(campaign.id)}
                          disabled={
                            campaign.status === "processing" || campaign.status === "queued"
                          }
                        >
                          <Send size={14} />
                          <span>Enviar</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="messages-mobile-list">
              {filteredCampaigns.map((campaign) => (
                <article key={campaign.id} className="message-card">
                  <div className="message-card-top">
                    <div>
                      <h3>{campaign.titulo}</h3>
                      <p>{campaign.mensagem}</p>
                    </div>
                    <span className={`badge badge-${campaignTone(campaign.status)}`}>
                      {statusLabel(campaign.status)}
                    </span>
                  </div>
                  <div className="message-card-stats">
                    <div>
                      <span>Destinatários</span>
                      <strong>
                        {campaign.total_alvo > 0 ? formatNumber(campaign.total_alvo) : "-"}
                      </strong>
                    </div>
                    <div>
                      <span>Entregues</span>
                      <strong>
                        {campaign.total_entregues > 0
                          ? formatNumber(campaign.total_entregues)
                          : "-"}
                      </strong>
                    </div>
                    <div>
                      <span>Cliques</span>
                      <strong>
                        {campaign.total_cliques > 0
                          ? formatNumber(campaign.total_cliques)
                          : "-"}
                      </strong>
                    </div>
                  </div>
                  <div className="message-card-footer">
                    <span className="table-muted">
                      Atualizada em {formatDate(latestCampaignTimestamp(campaign))}
                    </span>
                    <div className="message-card-actions">
                      <button type="button" className="btn btn-sm" onClick={() => onEdit(campaign.id)}>
                        <Edit2 size={14} />
                        <span>Editar</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-ghost"
                        onClick={() => onTest(campaign.id)}
                      >
                        <Bell size={14} />
                        <span>Teste</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={() => onSend(campaign.id)}
                        disabled={
                          campaign.status === "processing" || campaign.status === "queued"
                        }
                      >
                        <Send size={14} />
                        <span>Enviar</span>
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </>
  );
}
