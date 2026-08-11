import { Box, FileText, ImagesIcon, VideoIcon } from "lucide-react";
import { Badge } from "./Badge";
import Button from "../../components/Buttons/Button";

// Tarjeta de módulo para el visor de progreso del admin: en vez de "Iniciar" /
// "Continuar" muestra "Ver respuestas" cuando el operador ya contestó el examen.
export function TarjetaModuloOperador({ item, onVer }) {
    const { modulo, estado, puntaje, intentos, tiene_examen } = item;
    const desbloqueado = item.desbloqueado !== false;
    const imgSrc = modulo.imagen_url || null;
    const puedeVer = tiene_examen && (estado === "completado" || estado === "reprobado");

    return (
        <div
            onClick={() => puedeVer && onVer(item)}
            className={`rounded-3xl border border-zinc-200 bg-white  overflow-hidden flex flex-col group transition-shadow ${puedeVer ? "cursor-pointer" : ""}`}
        >
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
                <span className="absolute top-2.5 right-3"><Badge estado={estado} /></span>
            </div>

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
                </div>
                <Button size="sm" onClick={e => { e.stopPropagation(); if (puedeVer) onVer(item); }}>
                    {puedeVer ? "Ver respuestas" : tiene_examen ? "Aún sin contestar" : "Sin examen"}
                </Button>
            </div>
        </div>
    );
}
