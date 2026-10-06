import { useCallback, useEffect, useRef } from "react";
import { RUTA_BASE } from "../config";

// Devuelve una función que reproduce el sonido de alerta.
// Desbloquea el audio en el primer toque/click (necesario en iOS y Android).
export function useAlertaSonora() {
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = new Audio(`${RUTA_BASE}alerta.mp3`);
    audio.preload = "auto";
    audioRef.current = audio;

    const quitar = () => {
      document.removeEventListener("click", desbloquear);
      document.removeEventListener("touchstart", desbloquear);
    };
    const desbloquear = () => {
      audio.muted = true;
      audio
        .play()
        .then(() => {
          audio.pause();
          audio.currentTime = 0;
        })
        .catch(() => {})
        .finally(() => {
          audio.muted = false;
        });
      quitar();
    };

    document.addEventListener("click", desbloquear);
    document.addEventListener("touchstart", desbloquear);

    return () => {
      quitar();
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  return useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {
      /* el navegador aún no permite audio: esperando interacción */
    });
  }, []);
}
