import { useTarjetaModulo } from "../../hooks/contenido/useTarjetaModulo";
import { Ico } from "./icons";

export function TarjetaModulo({ modulo, onEditar, onExamen, onEliminar, onImagenCambiada, onVerContenido }) {
    const { inputRef, subiendo, subirImagen } = useTarjetaModulo(modulo, onImagenCambiada);
    const imgSrc = modulo.imagen_url || null;

    return (
        <div
            onClick={() => onVerContenido(modulo)}
            title="Haz clic para ver el contenido del módulo"
            className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col group hover:shadow-md hover:border-[#802907] transition-all cursor-pointer"
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
                    <span className={`absolute top-2 left-2 text-[10px] font-bold rounded px-1.5 py-0.5 ${modulo.file_type === "pdf" ? "bg-red-600 text-white"
                        : modulo.file_type === "presentacion" ? "bg-purple-600 text-white"
                            : "bg-blue-600 text-white"
                        }`}>
                        {modulo.file_type === "presentacion" ? "PRESENTACIÓN" : modulo.file_type.toUpperCase()}
                    </span>
                )}
                {/* Badge estado */}
                <span className={`absolute top-2 right-2 text-[10px] font-bold rounded-full px-2 py-0.5 ${modulo.estado === "Activo" ? "bg-green-500 text-white" : "bg-gray-500 text-white"}`}>
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
                    <span className="text-[10px] font-bold rounded-full px-2 py-0.5 bg-purple-100 text-purple-700 self-start">
                        {modulo.preguntas_count} pregunta(s)
                    </span>
                )}

                {/* Acciones */}
                <div className="flex gap-2 mt-auto pt-2 border-t border-gray-100" onClick={e => e.stopPropagation()}>
                    <button onClick={() => onEditar(modulo)} title="Editar módulo"
                        className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-blue-200 bg-blue-50 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100">
                        {Ico.edit} Editar
                    </button>
                    <button onClick={() => onExamen(modulo)} title="Gestionar examen"
                        className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-purple-200 bg-purple-50 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-100">
                        {Ico.qa} Examen
                    </button>
                    <button onClick={() => onEliminar(modulo)} title="Eliminar módulo"
                        className="rounded-lg border border-red-200 bg-red-50 px-2 py-1.5 text-red-700 hover:bg-red-100">
                        {Ico.trash}
                    </button>
                </div>
            </div>
        </div>
    );
}
