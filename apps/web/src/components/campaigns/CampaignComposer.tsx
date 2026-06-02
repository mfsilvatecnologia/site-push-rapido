"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Bell, Edit2, Send } from "lucide-react";
import { api, Campaign, parseApiError, SiteConfig } from "@/lib/api";
import { useYoutubeBannerAutofill } from "@/hooks/useYoutubeBannerAutofill";
import { formatNumber, PreviewOS } from "./campaignUtils";
import { NotificationPreview } from "./NotificationPreview";

interface CampaignComposerProps {
  site: SiteConfig | null;
  editId: string | null;
  editingCampaign: Campaign | null;
  selectedSiteId: string | null;
  activeCount: number;
  showMsg: (text: string, type?: "ok" | "err") => void;
  onSaved: () => void;
  onCreated: (id: string) => void;
  onRequestSend: (id: string) => void;
  onBack: () => void;
}

export function CampaignComposer({
  site,
  editId,
  editingCampaign,
  selectedSiteId,
  activeCount,
  showMsg,
  onSaved,
  onCreated,
  onRequestSend,
  onBack,
}: CampaignComposerProps) {
  const [editingId, setEditingId] = useState<string | null>(editId);
  const [hydratedEditId, setHydratedEditId] = useState<string | null>(null);
  const [titulo, setTitulo] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [urlDestino, setUrlDestino] = useState("");
  const [iconeUrl, setIconeUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [bannerUploading, setBannerUploading] = useState(false);
  const [previewOS, setPreviewOS] = useState<PreviewOS>("mac");
  const bannerManuallyEditedRef = useRef(false);

  const { triggerAutofill } = useYoutubeBannerAutofill({
    enabled: true,
    destUrl: urlDestino,
    manuallyEditedRef: bannerManuallyEditedRef,
    onResolved: setBannerUrl,
    onError: (msg) => showMsg(msg, "err"),
  });

  // Defaults para nova campanha (sem editId).
  useEffect(() => {
    if (editId) return;
    setEditingId(null);
    setHydratedEditId(null);
    setTitulo("");
    setMensagem("");
    setUrlDestino(site?.url_origem ?? "");
    setIconeUrl(site?.icone_padrao_url ?? "");
    setBannerUrl("");
    bannerManuallyEditedRef.current = false;
  }, [editId, site?.icone_padrao_url, site?.url_origem]);

  // Hidratação ao editar campanha existente.
  useEffect(() => {
    if (!editId || !editingCampaign) return;
    if (hydratedEditId === editId) return;

    setEditingId(editingCampaign.id);
    setHydratedEditId(editingCampaign.id);
    setTitulo(editingCampaign.titulo);
    setMensagem(editingCampaign.mensagem);
    setUrlDestino(editingCampaign.url_destino);
    setIconeUrl(editingCampaign.icone_url ?? site?.icone_padrao_url ?? "");
    setBannerUrl(editingCampaign.banner_url ?? "");
    bannerManuallyEditedRef.current = Boolean(editingCampaign.banner_url);
    if (!editingCampaign.banner_url && editingCampaign.url_destino) {
      void triggerAutofill(editingCampaign.url_destino);
    }
  }, [editId, editingCampaign, hydratedEditId, site?.icone_padrao_url, triggerAutofill]);

  async function persistCampaign() {
    if (!titulo.trim() || !mensagem.trim()) {
      showMsg("Preencha título e mensagem", "err");
      return null;
    }

    try {
      const body = {
        titulo,
        mensagem,
        url_destino: urlDestino,
        icone_url: iconeUrl || undefined,
        banner_url: bannerUrl || undefined,
      };

      if (editingId) {
        const saved = await api.updateCampaign(editingId, body);
        if (saved.banner_url && !bannerManuallyEditedRef.current) {
          setBannerUrl(saved.banner_url);
        }
        showMsg("Rascunho salvo com sucesso.");
        onSaved();
        return editingId;
      }

      const created = await api.createCampaign(body);
      if (created.banner_url && !bannerManuallyEditedRef.current) {
        setBannerUrl(created.banner_url);
      }
      setEditingId(created.id);
      setHydratedEditId(created.id);
      showMsg("Rascunho criado com sucesso.");
      onSaved();
      onCreated(created.id);
      return created.id;
    } catch (err) {
      showMsg(parseApiError(err), "err");
      return null;
    }
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    await persistCampaign();
  }

  async function handleBannerUpload(file: File) {
    setBannerUploading(true);
    try {
      const { banner_url } = await api.uploadCampaignBanner(
        file,
        selectedSiteId ?? undefined
      );
      setBannerUrl(banner_url);
      bannerManuallyEditedRef.current = true;
      showMsg("Banner carregado.");
    } catch (err) {
      showMsg(parseApiError(err), "err");
    } finally {
      setBannerUploading(false);
    }
  }

  async function handleTest() {
    const savedId = await persistCampaign();
    if (!savedId) return;
    try {
      const result = await api.testCampaign(savedId);
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

  const previewIcon = iconeUrl || site?.icone_padrao_url || "/assets/icon.svg";
  const previewDomain = site?.url_origem?.replace(/^https?:\/\//, "") ?? "seu-site.com";
  const previewTitle = titulo || "Título da Mensagem";
  const previewMessage =
    mensagem || "Este é o corpo da mensagem que vai aparecer para os usuários.";

  return (
    <div>
      <header className="ui-header">
        <h1 className="ui-title">{editingId ? "Editar campanha" : "Nova Push"}</h1>
        <div className="ui-header-actions">
          <button type="button" onClick={onBack} className="btn btn-ghost">
            Voltar
          </button>
        </div>
      </header>

      <div className="ui-composer-grid">
        <div className="composer-main-column">
          <section className="ui-section">
            <h3 className="ui-section-label">Audiência</h3>
            <div className="ui-audience-pill">
              <div className="ui-audience-pill-dot" />
              <div>
                <p>Usuários ativos</p>
                <span>{formatNumber(activeCount)} destinatários</span>
              </div>
            </div>
          </section>

          <form onSubmit={handleSave} className="ui-stack">
            <section className="ui-section">
              <h3 className="ui-section-label">Mensagem</h3>
              <div className="ui-stack">
                <label className="ui-field-group">
                  <span className="field-label">Título</span>
                  <input
                    type="text"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Título da notificação"
                    maxLength={150}
                    required
                  />
                </label>
                <label className="ui-field-group">
                  <span className="field-label">Mensagem</span>
                  <textarea
                    value={mensagem}
                    onChange={(e) => setMensagem(e.target.value)}
                    rows={3}
                    placeholder="Corpo da mensagem"
                    required
                  />
                </label>
                <label className="ui-field-group">
                  <span className="field-label">Ícone (opcional)</span>
                  <input
                    type="url"
                    value={iconeUrl}
                    onChange={(e) => setIconeUrl(e.target.value)}
                    placeholder={site?.icone_padrao_url || "https://..."}
                  />
                </label>
              </div>
            </section>

            <section className="ui-section">
              <h3 className="ui-section-label">Ação ao clicar</h3>
              <label className="ui-field-group">
                <span className="field-label">URL de destino</span>
                <input
                  type="url"
                  value={urlDestino}
                  onChange={(e) => setUrlDestino(e.target.value)}
                  onBlur={() => void triggerAutofill(urlDestino)}
                  placeholder="https://www.youtube.com/watch?v=... ou https://youtu.be/..."
                  required
                />
              </label>
            </section>

            <section className="ui-section">
              <h3 className="ui-section-label">Banner (opcional)</h3>
              <div className="ui-stack">
                <label className="ui-field-group">
                  <span className="field-label">URL do banner</span>
                  <input
                    type="url"
                    value={bannerUrl}
                    onChange={(e) => {
                      setBannerUrl(e.target.value);
                      bannerManuallyEditedRef.current = true;
                    }}
                    placeholder="https://meusite.com/banner.jpg"
                  />
                </label>
                <div className="icon-upload-row">
                  <label className="btn btn-sm">
                    <span>{bannerUploading ? "Enviando..." : "Carregar imagem"}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                      hidden
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handleBannerUpload(file);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {bannerUrl ? (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        setBannerUrl("");
                        bannerManuallyEditedRef.current = false;
                        void triggerAutofill(urlDestino);
                      }}
                    >
                      Remover
                    </button>
                  ) : null}
                  {bannerUrl ? (
                    <img
                      src={bannerUrl}
                      alt="Preview banner"
                      className="banner-preview"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : null}
                </div>
                <span className="field-help">
                  Banner (imagem grande): recomendado 1024×512 px (2:1), máx. 1 MB — PNG, JPG,
                  GIF ou WebP. Ícone: quadrado ~256×256 px. YouTube na URL de destino preenche o
                  banner automaticamente. Exibido no Chrome (Windows/Android); Safari (macOS/iOS)
                  costuma ignorar o banner.
                </span>
              </div>
            </section>

            <div className="ui-actions composer-bottom-bar">
              <button type="button" onClick={onBack} className="btn btn-ghost">
                Voltar
              </button>
              <button type="submit" className="btn">
                <Edit2 size={16} />
                <span>{editingId ? "Salvar alterações" : "Salvar rascunho"}</span>
              </button>
              <button type="button" className="btn" onClick={() => void handleTest()}>
                <Bell size={16} />
                <span>Enviar teste</span>
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => editingId && onRequestSend(editingId)}
                disabled={!editingId || activeCount === 0}
              >
                <Send size={16} />
                <span>Rever e Enviar</span>
              </button>
            </div>
          </form>
        </div>

        <div className="composer-preview-column">
          <NotificationPreview
            previewOS={previewOS}
            onSelectOS={setPreviewOS}
            title={previewTitle}
            message={previewMessage}
            iconUrl={previewIcon}
            bannerUrl={bannerUrl}
            domain={previewDomain}
            siteName={site?.nome ?? ""}
          />
        </div>
      </div>
    </div>
  );
}
