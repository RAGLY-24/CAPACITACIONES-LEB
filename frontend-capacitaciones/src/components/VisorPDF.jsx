import { useEffect, useRef, useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

// Distancia en px al final del scroll a partir de la cual se considera
// "leído completo" (evita que el redondeo de subpíxeles impida detectarlo).
const UMBRAL_FINAL_PX = 24;

// Renderiza el PDF página por página en canvases dentro de un contenedor con
// scroll propio, para poder detectar cuándo el usuario llega al final.
export function VisorPDF({ src, onScrollFinal }) {
  const contenedorRef = useRef(null);
  const avisadoRef = useRef(false);
  const [estado, setEstado] = useState("cargando");

  const verificarFinal = useCallback(() => {
    const el = contenedorRef.current;
    if (!el || avisadoRef.current) return;
    const alFinal = el.scrollTop + el.clientHeight >= el.scrollHeight - UMBRAL_FINAL_PX;
    if (alFinal) {
      avisadoRef.current = true;
      onScrollFinal?.();
    }
  }, [onScrollFinal]);

  useEffect(() => {
    avisadoRef.current = false;
    let cancelado = false;
    setEstado("cargando");

    (async () => {
      try {
        const pdf = await pdfjsLib.getDocument({ url: src }).promise;
        const contenedor = contenedorRef.current;
        if (!contenedor || cancelado) return;
        contenedor.innerHTML = "";

        for (let numPagina = 1; numPagina <= pdf.numPages; numPagina++) {
          if (cancelado) return;
          const pagina = await pdf.getPage(numPagina);
          const viewport = pagina.getViewport({ scale: 1.5 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.className = "mx-auto block shadow-sm mb-3 max-w-full h-auto";
          contenedor.appendChild(canvas);
          await pagina.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
        }

        if (cancelado) return;
        setEstado("listo");
        requestAnimationFrame(verificarFinal);
      } catch (error) {
        console.error("Error detallado al cargar el PDF:", error);
        if (!cancelado) setEstado("error");
      }
    })();

    return () => { cancelado = true; };
  }, [src, verificarFinal]);

  if (estado === "error") {
    return (
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-2 text-center py-12">
        <p className="text-sm text-gray-500">No se pudo cargar el PDF.</p>
        <a href={src} target="_blank" rel="noreferrer" className="text-blue-600 underline text-sm">
          Abrir en una pestaña nueva
        </a>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-lg overflow-hidden border border-gray-200 bg-gray-100 relative">
      {estado === "cargando" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-100">
          <p className="text-sm text-gray-400">Cargando documento...</p>
        </div>
      )}
      <div ref={contenedorRef} onScroll={verificarFinal} className="flex-1 min-h-0 overflow-y-auto p-3" />
      <p className="text-xs text-center text-gray-400 py-1 shrink-0 border-t bg-white">
        Desplázate hasta el final del documento para habilitar el examen.{" "}
        <a href={src} target="_blank" rel="noreferrer" className="text-blue-600 underline">
          Abrir en pestaña nueva
        </a>.
      </p>
    </div>
  );
}
