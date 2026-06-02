"use client";

import { MutableRefObject, useCallback, useEffect, useRef } from "react";
import { api, parseApiError } from "@/lib/api";
import { looksLikeYoutubeUrl, youtubeThumbnailFromDestUrl } from "@/lib/youtube";

const DEBOUNCE_MS = 500;

interface UseYoutubeBannerAutofillParams {
  /** Só roda quando true (ex.: tela de composição). */
  enabled: boolean;
  /** URL de destino observada (debounced). */
  destUrl: string;
  /** Quando o usuário edita o banner manualmente, o auto-fill é suprimido. */
  manuallyEditedRef: MutableRefObject<boolean>;
  /** Aplica a thumbnail resolvida ao estado do banner. */
  onResolved: (thumbnailUrl: string) => void;
  /** Reporta erro (somente quando não há fallback local). */
  onError?: (message: string) => void;
}

/**
 * Preenche o banner com a thumbnail do YouTube a partir da URL de destino.
 *
 * Evita race condition de duas formas:
 * - `generationRef`: só aplica o resultado se ainda for a requisição mais recente.
 * - `AbortController`: cancela a requisição anterior ao iniciar uma nova.
 */
export function useYoutubeBannerAutofill({
  enabled,
  destUrl,
  manuallyEditedRef,
  onResolved,
  onError,
}: UseYoutubeBannerAutofillParams) {
  const generationRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const onResolvedRef = useRef(onResolved);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onResolvedRef.current = onResolved;
    onErrorRef.current = onError;
  }, [onResolved, onError]);

  const triggerAutofill = useCallback(
    async (rawUrl: string) => {
      const raw = rawUrl.trim();
      if (!raw || manuallyEditedRef.current) return;
      if (!looksLikeYoutubeUrl(raw)) return;

      const generation = ++generationRef.current;
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const apply = (thumbnailUrl: string) => {
        if (manuallyEditedRef.current) return;
        if (generation !== generationRef.current) return;
        onResolvedRef.current(thumbnailUrl);
      };

      const localThumb = youtubeThumbnailFromDestUrl(raw);
      if (localThumb) apply(localThumb);

      try {
        const res = await api.resolveYoutubeThumbnail(raw, {
          signal: controller.signal,
        });
        apply(res.thumbnail_url);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (!localThumb && generation === generationRef.current) {
          onErrorRef.current?.(
            parseApiError(err) || "Não foi possível obter a thumbnail do YouTube."
          );
        }
      }
    },
    [manuallyEditedRef]
  );

  useEffect(() => {
    if (!enabled) return;
    const url = destUrl.trim();
    if (!url || manuallyEditedRef.current) return;

    const timer = setTimeout(() => {
      void triggerAutofill(url);
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [enabled, destUrl, manuallyEditedRef, triggerAutofill]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  return { triggerAutofill };
}
