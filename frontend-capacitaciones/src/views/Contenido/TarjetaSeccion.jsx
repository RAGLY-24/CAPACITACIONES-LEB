import { Pencil, Trash2 } from "lucide-react";
import Button from "../../components/Buttons/Button";

export function TarjetaSeccion({
    seccion,
    onClick,
    onEditar,
    onEliminar,
}) {
    const activa = seccion.estado === "Activo";

    return (
        <div
            onClick={onClick}
            className="group relative flex min-h-42.5 cursor-pointer flex-col rounded-3xl border border-gray-200 bg-white hover:bg-zinc-50 p-4 transition-all hover:border-zinc-200 "
        >
            {/* Encabezado */}
            <div className="flex items-start justify-between gap-1">
                <div className="flex min-w-0 items-center gap-2">
                    <span
                        className={`h-2.5 w-2.5 shrink-0 rounded-full ${activa ? "bg-green-500" : "bg-gray-400"
                            }`}
                    />

                    <h3 className="truncate text-sm font-semibold text-gray-800">
                        {seccion.nombre}
                    </h3>
                </div>

                {/* Acciones */}
                <div
                    className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Button
                        Icon={Pencil}
                        iconOnly
                        size="xs"
                        variant="ghost"
                        title="Editar"
                        onClick={() => onEditar(seccion)}
                    />
                    <Button
                        Icon={Trash2}
                        iconOnly
                        size="xs"
                        variant="ghost"
                        title="Eliminar"
                        onClick={() => onEliminar(seccion)}
                    />
                </div>
            </div>

            {/* Descripción */}
            <div className="mt-1 flex-1">
                {seccion.descripcion ? (
                    <p className="line-clamp-3 text-xs leading-5 text-gray-500">
                        {seccion.descripcion}
                    </p>
                ) : (
                    <p className="text-xs  text-gray-300">
                        Sin descripción
                    </p>
                )}
            </div>

            {/* Pie */}
            <div className="mt-4 flex items-center justify-between pt-3">
                <span className="text-xs text-gray-400">
                    {seccion.modulos?.length || 0} módulo(s)
                </span>

            </div>

        </div>
    );
}