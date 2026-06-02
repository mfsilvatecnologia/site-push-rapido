"use client";

import { formatNumber } from "./campaignUtils";

interface SendConfirmModalProps {
  activeCount: number;
  onCancel: () => void;
  onConfirm: () => void;
}

export function SendConfirmModal({
  activeCount,
  onCancel,
  onConfirm,
}: SendConfirmModalProps) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <h3>Confirmar envio</h3>
        <p>
          Enviar esta campanha para <strong>{formatNumber(activeCount)}</strong> inscrito
          {activeCount !== 1 ? "s" : ""} ativo{activeCount !== 1 ? "s" : ""}?
        </p>
        <p className="hint">Inscritos inativos serão ignorados.</p>
        <div className="ui-actions">
          <button type="button" className="btn" onClick={onCancel}>
            Cancelar
          </button>
          <button type="button" className="btn btn-primary" onClick={onConfirm}>
            Confirmar envio
          </button>
        </div>
      </div>
    </div>
  );
}
