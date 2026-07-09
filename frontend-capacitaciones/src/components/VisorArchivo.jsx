import { useState, useEffect, Suspense, lazy } from "react";
import { VisorPDF } from "./VisorPDF";

const VisorPresentacion = lazy(() =>
  import("./PresentacionTldraw").then(m => ({ default: m.VisorPresentacion }))
);

function SinArchivo() {
  return (
    <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
      <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z" />
      </svg>
      <p className="text-gray-500 font-medium text-sm">No hay archivo multimedia</p>
      <p className="text-gray-400 text-xs">El administrador aún no ha subido contenido para este módulo.</p>
    </div>
  );
}

// El examen solo debe desbloquearse cuando el empleado revisó el contenido:
// hizo scroll hasta el final del PDF o dejó que el video terminara. Los
// demás tipos de contenido (presentación, o si no hay archivo) no soportan
// esa detección, así que no bloquean el examen.
export function VisorArchivo({ fileUrl, fileType, presentacionJson, onCompletado }) {
  const [estado, setEstado] = useState("verificando");

  useEffect(() => {
    if (fileType === "presentacion") { onCompletado?.(); return; }
    if (!fileUrl) { setEstado("error"); onCompletado?.(); return; }
    setEstado("verificando");
    fetch(fileUrl, { method: "HEAD" })
      .then(r => {
        const ct = r.headers.get("content-type") || "";
        const esArchivoReal = r.ok && !ct.includes("text/html");
        setEstado(esArchivoReal ? "ok" : "error");
        if (!esArchivoReal) onCompletado?.();
      })
      .catch(() => { setEstado("error"); onCompletado?.(); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileUrl, fileType]);

  if (fileType === "presentacion") {
    if (!presentacionJson) return <SinArchivo />;
    return (
      <div className="flex-1 min-h-0 flex flex-col">
        <Suspense fallback={<p className="text-center text-sm text-gray-400 py-12">Cargando presentación...</p>}>
          <VisorPresentacion presentacionJson={presentacionJson} />
        </Suspense>
      </div>
    );
  }

  if (!fileUrl || estado === "error") return <SinArchivo />;

  if (estado === "verificando") {
    return (
      <div className="flex-1 min-h-0 flex items-center justify-center py-12">
        <p className="text-sm text-gray-400">Verificando archivo...</p>
      </div>
    );
  }

  const src = fileUrl;

  if (fileType === "video") {
    return (
      <div className="flex-1 min-h-0 rounded-lg overflow-hidden bg-black">
        <video
          src={src}
          controls
          className="w-full h-full object-contain"
          onError={() => setEstado("error")}
          onEnded={() => onCompletado?.()}
        />
      </div>
    );
  }

  return <VisorPDF src={src} onScrollFinal={onCompletado} />;
}
