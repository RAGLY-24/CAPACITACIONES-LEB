import { useRef, useState } from "react";
import { Tldraw, getSnapshot, loadSnapshot } from "tldraw";
import axios from "axios";
import Swal from "sweetalert2";
import "tldraw/tldraw.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

function parseSnapshot(presentacionJson) {
  if (!presentacionJson) return null;
  try {
    return JSON.parse(presentacionJson);
  } catch {
    return null;
  }
}

// ─── Editor de presentación (admin) ───────────────────────────────────────────
// Pantalla completa para diseñar el contenido de un módulo con tldraw.
// El lienzo se guarda como snapshot JSON en el módulo vía la API.
export function EditorPresentacion({ modulo, onCerrar, onGuardado }) {
  const editorRef = useRef(null);
  const [guardando, setGuardando] = useState(false);

  const handleMount = editor => {
    editorRef.current = editor;
    const snapshot = parseSnapshot(modulo.presentacion_json);
    if (snapshot) loadSnapshot(editor.store, snapshot);
  };

  const guardar = async () => {
    if (!editorRef.current) return;
    setGuardando(true);
    try {
      const snapshot = getSnapshot(editorRef.current.store);
      const { data } = await axios.put(`${API}/api/modulos/${modulo.id}/presentacion`, {
        contenido: JSON.stringify(snapshot),
      });
      Swal.fire({ icon: "success", title: "Presentación guardada.", confirmButtonColor: "#802907" });
      onGuardado?.(data.modulo);
    } catch (err) {
      Swal.fire({ icon: "error", title: err.response?.data?.message || "Error al guardar la presentación.", confirmButtonColor: "#802907" });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="flex items-center justify-between border-b px-6 py-3 shrink-0 shadow-sm">
        <div className="min-w-0">
          <h3 className="font-bold text-gray-800 truncate">Presentación — {modulo.nombre}</h3>
          <p className="text-xs text-gray-500">Diseña el contenido en el lienzo y haz clic en «Guardar» para publicarlo.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={guardar} disabled={guardando}
            className="rounded-lg bg-[#802907] px-4 py-2 text-sm font-semibold text-white hover:bg-[#5a1b04] disabled:opacity-60">
            {guardando ? "Guardando..." : "Guardar presentación"}
          </button>
          <button onClick={onCerrar}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
            Cerrar
          </button>
        </div>
      </div>
      <div className="flex-1 relative">
        <Tldraw onMount={handleMount} />
      </div>
    </div>
  );
}

// ─── Visor de presentación (empleado, solo lectura) ───────────────────────────
export function VisorPresentacion({ presentacionJson }) {
  const [error, setError] = useState(false);

  const handleMount = editor => {
    const snapshot = parseSnapshot(presentacionJson);
    if (!snapshot) {
      setError(true);
      return;
    }
    loadSnapshot(editor.store, snapshot);
    editor.updateInstanceState({ isReadonly: true });
    requestAnimationFrame(() => editor.zoomToFit());
  };

  if (!presentacionJson) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-gray-400">
        Esta presentación todavía no tiene contenido.
      </div>
    );
  }

  return (
    <div className="relative h-96 rounded-lg overflow-hidden border border-gray-200">
      <Tldraw onMount={handleMount} hideUi />
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/95 text-sm text-gray-400">
          No se pudo cargar la presentación.
        </div>
      )}
    </div>
  );
}
