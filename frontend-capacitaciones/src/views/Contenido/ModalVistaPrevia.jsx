import { VisorArchivo } from "../../components/VisorArchivo";
import { useLockBodyScroll } from "../../hooks/useLockBodyScroll";
import { Ico } from "./icons";

// Vista previa del contenido de un módulo (misma vista que ve el empleado).
export function ModalVistaPrevia({ modulo, onCerrar, onEditar }) {
    useLockBodyScroll();
    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
            <div className="flex items-center justify-between border-b px-6 py-4 shrink-0 bg-gray-50 shadow-sm">
                <div className="min-w-0">
                    <h3 className="font-bold text-gray-800 truncate">{modulo.nombre}</h3>
                    <p className="text-xs text-gray-500 line-clamp-1">{modulo.descripcion}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-4">
                    <button onClick={() => onEditar(modulo)} title="Editar módulo"
                        className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100">
                        {Ico.edit} Editar
                    </button>
                    <button onClick={onCerrar} className="text-gray-400 hover:text-gray-700 text-xl font-bold">✕</button>
                </div>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-6 flex flex-col">
                <VisorArchivo fileUrl={modulo.file_url} fileType={modulo.file_type} presentacionJson={modulo.presentacion_json} />
            </div>
        </div>
    );
}
