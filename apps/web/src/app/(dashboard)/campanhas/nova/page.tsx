import { Suspense } from "react";
import CampaignComposerPage from "@/components/pages/CampaignComposerPage";

export default function NovaCampanhaPage() {
  return (
    <Suspense fallback={<div className="ui-loading">Carregando...</div>}>
      <CampaignComposerPage />
    </Suspense>
  );
}
