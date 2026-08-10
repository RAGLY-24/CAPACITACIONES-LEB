import { Pencil, X } from "lucide-react";
import Button from "../../components/Buttons/Button";
import { VisorArchivo } from "../../components/VisorArchivo";
import { useLockBodyScroll } from "../../hooks/useLockBodyScroll";

// Vista previa del contenido de un módulo (misma vista que ve el empleado).
export function ModalVistaPrevia({ modulo, onCerrar, onEditar }) {
    useLockBodyScroll();
    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
            <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 shrink-0 bg-gray-50 ">
                <div className="min-w-0">
                    <h3 className="font-bold text-gray-800 truncate">{modulo.nombre}</h3>
                    <p className="text-xs text-gray-500 line-clamp-1">{modulo.descripcion}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-4">
                    <Button variant="outline" size="sm" Icon={Pencil} onClick={() => onEditar(modulo)} title="Editar módulo" className="flex-1 sm:flex-none" > Editar módulo </Button>
                    <Button variant="ghost" size="sm" Icon={X} onClick={onCerrar} className="flex-1 sm:flex-none" iconOnly>  </Button>
                </div>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-6 flex flex-col">
                <VisorArchivo fileUrl={modulo.file_url} fileType={modulo.file_type} presentacionJson={modulo.presentacion_json} />
            </div>
        </div>
    );
}
