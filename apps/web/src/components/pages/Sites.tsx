"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, Plus, Settings } from "lucide-react";
import { api, parseApiError, SiteConfig, SiteInput } from "@/lib/api";
import { useSiteContext } from "@/components/SiteProvider";

function emptyForm(): SiteInput {
  return {
    nome: "",
    url_origem: "",
  };
}

export default function Sites() {
  const router = useRouter();
  const { sites, selectedSiteId, selectSite, refreshSites, loading: loadingSites, error } =
    useSiteContext();
  const [editingSiteId, setEditingSiteId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<SiteInput>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"ok" | "err">("ok");

  const activeSite = useMemo(
    () => sites.find((site) => String(site.id) === selectedSiteId) ?? null,
    [selectedSiteId, sites]
  );

  useEffect(() => {
    if (isCreating) return;

    if (!sites.length) {
      setEditingSiteId(null);
      setForm(emptyForm());
      return;
    }

    if (editingSiteId) return;
    if (activeSite) {
      setEditingSiteId(String(activeSite.id));
      void api
        .getSite(activeSite.id)
        .then((site) => {
          setForm({
            nome: site.nome,
            url_origem: site.url_origem,
            slug: site.slug,
            icone_padrao_url: site.icone_padrao_url ?? undefined,
            configurado: site.configurado,
            auto_resubscribe: site.auto_resubscribe,
            allow_localhost_http: site.allow_localhost_http,
            service_worker_path: site.service_worker_path,
            service_worker_scope: site.service_worker_scope,
            prompt_config: site.prompt_config,
            welcome_enabled: site.welcome_enabled,
            welcome_titulo: site.welcome_titulo,
            welcome_mensagem: site.welcome_mensagem,
            ativo: site.ativo,
          });
        })
        .catch(() => {
          setForm({
            nome: activeSite.nome,
            url_origem: activeSite.url_origem,
            slug: activeSite.slug,
          });
        });
    }
  }, [activeSite, editingSiteId, isCreating, sites]);

  async function startEdit(siteId: string | number) {
    try {
      const site = await api.getSite(siteId);
      setIsCreating(false);
      setEditingSiteId(String(site.id));
      setForm({
        nome: site.nome,
        url_origem: site.url_origem,
        slug: site.slug,
        icone_padrao_url: site.icone_padrao_url ?? undefined,
        configurado: site.configurado,
        auto_resubscribe: site.auto_resubscribe,
        allow_localhost_http: site.allow_localhost_http,
        service_worker_path: site.service_worker_path,
        service_worker_scope: site.service_worker_scope,
        prompt_config: site.prompt_config,
        welcome_enabled: site.welcome_enabled,
        welcome_titulo: site.welcome_titulo,
        welcome_mensagem: site.welcome_mensagem,
        ativo: site.ativo,
      });
      setMessage("");
    } catch (err) {
      setMessage(parseApiError(err));
      setMessageType("err");
    }
  }

  function startCreate() {
    setIsCreating(true);
    setEditingSiteId(null);
    setForm(emptyForm());
    setMessage("");
  }

  async function saveSite() {
    if (!form.nome?.trim() || !form.url_origem?.trim()) {
      setMessage("Informe nome e URL do site.");
      setMessageType("err");
      return;
    }

    setSaving(true);
    setMessage("");
    const creating = isCreating || !editingSiteId;
    try {
      const site: SiteConfig = creating
        ? await api.createSite(form)
        : await api.updateSite(form, editingSiteId);
      selectSite(site.id);
      await refreshSites();
      setIsCreating(false);
      setEditingSiteId(String(site.id));
      setMessage(creating ? "Site criado com sucesso." : "Site atualizado com sucesso.");
      setMessageType("ok");
    } catch (err) {
      setMessage(parseApiError(err));
      setMessageType("err");
    } finally {
      setSaving(false);
    }
  }

  if (loadingSites) return <div className="ui-loading">Carregando...</div>;

  return (
    <div className="ui-page animate-in fade-in">
      <header className="ui-header">
        <h1 className="ui-title">Sites</h1>
        <div className="ui-header-actions">
          <button type="button" className="btn btn-primary" onClick={startCreate}>
            <Plus size={16} />
            <span>Novo site</span>
          </button>
          {activeSite ? (
            <button type="button" className="btn btn-ghost" onClick={() => router.push("/integrar")}>
              <Settings size={16} />
              <span>Configuração Web</span>
            </button>
          ) : null}
        </div>
      </header>

      {error ? <div className="toast toast-error">{error}</div> : null}
      {message ? <div className={`toast ${messageType === "err" ? "toast-error" : ""}`}>{message}</div> : null}

      <div className="ui-dashboard-grid">
        <section className="ui-section">
          <div className="ui-section-heading">
            <Globe size={20} />
            <div>
              <h3>Sites cadastrados</h3>
            </div>
          </div>

          {sites.length === 0 ? (
            <p className="empty">Nenhum site cadastrado. Crie o primeiro acima.</p>
          ) : (
            <div className="ui-site-list">
              {sites.map((site) => {
                const isActive = String(site.id) === selectedSiteId;
                return (
                  <div key={site.id} className={`ui-site-row${isActive ? " active" : ""}`}>
                    <button
                      type="button"
                      className="ui-site-row-main"
                      style={{ border: "none", background: "transparent", cursor: "pointer", textAlign: "left" }}
                      onClick={() => {
                        selectSite(site.id);
                        void startEdit(site.id);
                      }}
                    >
                      <strong>{site.nome}</strong>
                      <span>
                        {site.url_origem} · {site.active_subscriptions ?? 0} ativos · {site.campaign_count ?? 0}{" "}
                        campanhas
                      </span>
                    </button>
                    <div className="ui-site-row-actions">
                      {isActive ? (
                        <span className="ui-chip">Ativo</span>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => {
                            selectSite(site.id);
                            void startEdit(site.id);
                          }}
                        >
                          Selecionar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="ui-section">
          <div className="ui-section-heading">
            <Settings size={20} />
            <div>
              <h3>{isCreating || !editingSiteId ? "Cadastrar site" : "Editar site"}</h3>
            </div>
          </div>

          <div className="ui-stack">
            <label className="ui-field-group">
              <span className="field-label">Nome do site</span>
              <input
                value={form.nome ?? ""}
                onChange={(e) => setForm((current) => ({ ...current, nome: e.target.value }))}
                placeholder="Ex.: Loja Principal"
              />
            </label>

            <label className="ui-field-group">
              <span className="field-label">URL do site</span>
              <input
                type="url"
                value={form.url_origem ?? ""}
                onChange={(e) => setForm((current) => ({ ...current, url_origem: e.target.value }))}
                placeholder="https://meusite.com"
              />
            </label>

            <label className="ui-field-group">
              <span className="field-label">Slug interno (opcional)</span>
              <input
                value={form.slug ?? ""}
                onChange={(e) => setForm((current) => ({ ...current, slug: e.target.value }))}
                placeholder="loja-principal"
              />
            </label>

            <div className="ui-actions">
              <button type="button" className="btn btn-ghost" onClick={startCreate}>
                Limpar
              </button>
              <button type="button" className="btn btn-primary" onClick={() => void saveSite()} disabled={saving}>
                {saving ? "Salvando..." : isCreating || !editingSiteId ? "Criar site" : "Salvar site"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
