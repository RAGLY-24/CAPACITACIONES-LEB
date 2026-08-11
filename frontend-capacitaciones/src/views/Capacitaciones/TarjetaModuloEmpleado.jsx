import { Box, FileText, ImagesIcon, VideoIcon } from "lucide-react";
import Button from "../../components/Buttons/Button";
import { Badge } from "./Badge";

export function TarjetaModuloEmpleado({ item, onAbrir }) {
    const { modulo, estado, puntaje, intentos, tiene_examen } = item;
    const desbloqueado = item.desbloqueado !== false;
    const imgSrc = modulo.imagen_url || null;
    const necesitaRepaso = estado === "reprobado" && item.intentos_restantes === 0;
    const isApproved = estado == "completado"
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
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center text-3xl">🔒</div>
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

            {/* Info del módulo */}
            <div className="p-4 flex flex-col gap-3 flex-1">
                <div>
                    <h4 className="font-semibold text-gray-800 text-sm leading-snug line-clamp-2">{modulo.nombre}</h4>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{modulo.descripcion}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap text-[10px]">
                    {tiene_examen && <span className="font-bold rounded-full px-2 py-1 bg-sky-100 text-sky-600">Examen</span>}
                    {intentos > 0 && <span className="text-gray-400">{intentos} intento(s)</span>}
                    {puntaje !== null && (
                        <span className={`font-medium ${puntaje >= 70 ? "text-green-600" : "text-red-500"}`}>{puntaje}%</span>
                    )}
                    {!desbloqueado && <span className="text-gray-400">🔒 Requiere aprobar: {item.requiere_modulo || "el módulo anterior"}</span>}
                    {desbloqueado && necesitaRepaso && <span className="font-bold text-amber-600">🔒 Repasa el contenido para reintentar</span>}
                </div>
                <Button variant={`${isApproved ? "success" : "secondary"}`} title={!desbloqueado ? `Aprueba el examen de "${item.requiere_modulo || "el módulo anterior"}" (mínimo 70%) para desbloquearlo` : undefined} size="sm" onClick={e => { e.stopPropagation(); if (desbloqueado) onAbrir(modulo.id); }} disabled={!desbloqueado}>
                    {botonLabel()}
                </Button>
            </div>
        </div>
    );
}
