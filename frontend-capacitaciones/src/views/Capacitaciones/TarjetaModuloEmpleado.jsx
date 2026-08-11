import { Box, FileText, ImagesIcon, LockKeyhole, VideoIcon } from "lucide-react";
import Button from "../../components/Buttons/Button";
import { Badge } from "./Badge";

export function TarjetaModuloEmpleado({ item, onAbrir }) {
    const { modulo, estado, puntaje, intentos, tiene_examen } = item;
    const desbloqueado = item.desbloqueado !== false;
    const imgSrc = modulo.imagen_url || null;
    const necesitaRepaso = estado === "reprobado" && item.intentos_restantes === 0;
    const isApproved = estado === "completado"
    const botonLabel = () => {
        if (!desbloqueado) return "Bloqueado";
        if (necesitaRepaso) return "Repasar contenido";
        if (estado === "pendiente") return "Iniciar";
        if (estado === "en_progreso") return "Continuar";
        if (estado === "completado") return "Completado";
        return "Reintentar";
    };

    return (
        <div
            onClick={() => desbloqueado && onAbrir(modulo.id)}
            className={`rounded-3xl border border-zinc-200 bg-white  overflow-hidden flex flex-col group  ${desbloqueado ? "cursor-pointer" : "opacity-70"}`}
        >
            {/* Zona de imagen */}
            <div className="relative h-36 bg-gray-100 overflow-hidden">
                {imgSrc ? (
                    <img src={imgSrc} alt={modulo.nombre} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600 text-4xl">
                        {modulo.file_type === "pdf" ? <FileText size={40} /> : modulo.file_type === "presentacion" ? <ImagesIcon size={40} /> : modulo.file_type === "video" ? <VideoIcon size={40} /> : <Box size={40} />}
                    </div>
                )}
                {!desbloqueado && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center text-3xl"><LockKeyhole size={40} /> </div>
                )}
                {modulo.file_type && (
                    <span className={`absolute top-2.5 left-3 text-[10px] font-bold rounded-xl px-4 py-1 ${modulo.file_type === "pdf" ? "bg-red-600 text-white"
                        : modulo.file_type === "presentacion" ? "bg-purple-600 text-white"
                            : "bg-blue-600 text-white"
                        }`}>
                        {modulo.file_type === "presentacion" ? "PRESENTACIÓN" : modulo.file_type.toUpperCase()}
                    </span>
                )}
                <span className="absolute top-2.5 right-3"><Badge estado={estado} /></span>
            </div>

            {/* Información del módulo */}
            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex flex-1 flex-col gap-4">
                    {/* Título y descripción */}
                    <div>
                        <h4 className="line-clamp-2 text-sm font-semibold leading-snug text-gray-800">
                            {modulo.nombre}
                        </h4>

                        <p className="line-clamp-2 text-xs text-gray-400">
                            {modulo.descripcion}
                        </p>
                    </div>

                    {/* Estado del módulo */}
                    <div className="flex flex-col items-start gap-4 text-[10px]">
                        <div className="flex flex-row items-center gap-4 ">
                            {tiene_examen && (
                                <span className="rounded-full bg-sky-100 px-2 py-1 font-bold text-sky-600">
                                    Examen
                                </span>
                            )}

                            {intentos > 0 && (
                                <span className="text-gray-400">
                                    {intentos} intento(s)
                                </span>
                            )}

                            {puntaje !== null && (
                                <span
                                    className={`font-medium ${puntaje >= 70
                                        ? "text-green-600"
                                        : "text-red-500"
                                        }`}
                                >
                                    {puntaje}%
                                </span>
                            )}
                        </div>

                        {!desbloqueado && (
                            <span className="flex items-center gap-2 text-gray-400">
                                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-sky-500">
                                    <LockKeyhole
                                        size={10}
                                        strokeWidth={3}
                                        className="text-white"
                                    />
                                </span>

                                Requiere aprobar:{" "}
                                {item.requiere_modulo || "el módulo anterior"}
                            </span>
                        )}

                        {desbloqueado && necesitaRepaso && (
                            <span className="flex items-center gap-2 text-gray-400">
                                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-yellow-500">
                                    <LockKeyhole
                                        size={10}
                                        strokeWidth={3}
                                        className="text-white"
                                    />
                                </span>
                                Repasa el contenido para reintentar
                            </span>
                        )}
                    </div>
                </div>

                {/* Acción principal */}
                <Button
                    variant={isApproved ? necesitaRepaso ? "warning" : "success" : "secondary"}
                size="sm"
                disabled={!desbloqueado}
                title={
                    !desbloqueado
                        ? `Aprueba el examen de "${item.requiere_modulo || "el módulo anterior"
                        }" (mínimo 70%) para desbloquearlo`
                        : undefined
                }
                onClick={(e) => {
                    e.stopPropagation();

                    if (desbloqueado) {
                        onAbrir(modulo.id);
                    }
                }}
                >
                {botonLabel()}
            </Button>
        </div>
        </div >
    );
}
