import { List, Pencil, Trash2 } from "lucide-react";
import Button from "../../components/Buttons/Button";
import { useTarjetaModulo } from "../../hooks/contenido/useTarjetaModulo";
import { Ico } from "./icons";

export function TarjetaModulo({ modulo, onEditar, onExamen, onEliminar, onImagenCambiada, onVerContenido }) {
    const { inputRef, subiendo, subirImagen } = useTarjetaModulo(modulo, onImagenCambiada);
    const imgSrc = modulo.imagen_url || null;

    return (
        <div
            onClick={() => onVerContenido(modulo)}
            title="Haz clic para ver el contenido del módulo"
            className="rounded-3xl border border-zinc-200 bg-white  overflow-hidden flex flex-col group  hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer"
        >
            {/* Zona de imagen */}
            <div
                className="relative h-40 bg-gray-100 cursor-pointer overflow-hidden"
                onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}
                title="Haz clic para cambiar la imagen"
            >
                {imgSrc ? (
                    <img src={imgSrc} alt={modulo.nombre} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-300">
                        {Ico.img}
                        <span className="text-xs text-gray-400">Sin imagen</span>
                    </div>
                )}
                {/* Overlay al hover */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <span className="text-white text-xs font-semibold">
                        {subiendo ? "Subiendo..." : imgSrc ? "Cambiar imagen" : "Subir imagen"}
                    </span>
                </div>
                {/* Badge tipo de contenido */}
                {modulo.file_type && (
                    <span className={`absolute top-3 left-3 text-[10px] font-medium rounded-xl px-4 py-1 ${modulo.file_type === "pdf" ? "bg-red-600 text-white"
                        : modulo.file_type === "presentacion" ? "bg-purple-600 text-white"
                            : "bg-blue-600 text-white"
                        }`}>
                        {modulo.file_type === "presentacion" ? "PRESENTACIÓN" : modulo.file_type.toUpperCase()}
                    </span>
                )}
                {/* Badge estado */}
                <span className={`absolute top-3 right-3 px-2 py-1 text-[10px] font-medium rounded-xl  ${modulo.estado === "Activo" ? "bg-green-500 text-white" : "bg-gray-500 text-white"}`}>
                    {modulo.estado}
                </span>
                <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp" onChange={subirImagen} className="hidden" />
            </div>

            {/* Info del módulo */}
            <div className="p-4 flex flex-col gap-3 flex-1">
                <div>
                    <h4 className="font-semibold text-gray-800 text-sm leading-snug line-clamp-2">{modulo.nombre}</h4>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{modulo.descripcion}</p>
                </div>
                {modulo.preguntas_count > 0 && (
                    <span className="text-[10px] font-medium rounded-full px-2 py-1 bg-sky-100 text-sky-700 self-start">
                        {modulo.preguntas_count} pregunta(s)
                    </span>
                )}

                {/* Acciones */}
                <div className="flex gap-2 mt-auto pt-2 border-t border-gray-100 " onClick={e => e.stopPropagation()}>
                    <Button Icon={Pencil} className="w-full" variant="outline" size="sm" onClick={() => onEditar(modulo)} title="Editar módulo">
                        Editar
                    </Button>
                    <Button Icon={List} className="w-full" variant="primary" isSoft size="sm" onClick={() => onExamen(modulo)} title="Gestionar examen">
                        Examen
                    </Button>
                    <Button Icon={Trash2} iconOnly variant="danger" isSoft size="sm"  onClick={() => onEliminar(modulo)} title="Eliminar módulo">
                    </Button>
                </div>
            </div>
        </div>
    );
}
