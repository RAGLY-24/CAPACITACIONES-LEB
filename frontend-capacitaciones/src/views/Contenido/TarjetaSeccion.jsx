import { Ico } from "./icons";

export function TarjetaSeccion({ seccion, onClick, onEditar, onEliminar }) {
    return (
        <div
            onClick={onClick}
            className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 cursor-pointer hover:border-[#802907] hover:shadow-md transition-all group relative"
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${seccion.estado === "Activo" ? "bg-green-500" : "bg-red-400"}`} />
                        <h3 className="font-bold text-gray-800 truncate group-hover:text-[#802907] transition-colors">
                            {seccion.nombre}
                        </h3>
                    </div>
                    {seccion.descripcion && (
                        <p className="text-xs text-gray-400 line-clamp-2 mt-1">{seccion.descripcion}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-3 font-medium">
                        {seccion.modulos?.length || 0} módulo(s)
                    </p>
                </div>
                {/* Botones de acción (no propagan el click a la tarjeta) */}
                <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                    <button onClick={() => onEditar(seccion)} title="Editar sección"
                        className="rounded p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600">
                        {Ico.edit}
                    </button>
                    <button onClick={() => onEliminar(seccion)} title="Eliminar sección"
                        className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600">
                        {Ico.trash}
                    </button>
                </div>
            </div>

            {/* Flecha indicadora */}
            <div className="absolute bottom-4 right-4 text-gray-200 group-hover:text-[#802907] transition-colors text-lg">
                →
            </div>
        </div>
    );
}
