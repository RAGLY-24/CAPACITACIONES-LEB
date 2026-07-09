import { useEffect } from "react";

// Bloquea el scroll del body mientras `bloqueado` sea true (p. ej. mientras
// un modal está abierto), y lo restaura al desmontar o al desbloquear.
export function useLockBodyScroll(bloqueado = true) {
  useEffect(() => {
    if (!bloqueado) return;
    const overflowOriginal = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflowOriginal;
    };
  }, [bloqueado]);
}
