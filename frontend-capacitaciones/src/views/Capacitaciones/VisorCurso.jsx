import { VisorArchivo } from "../../components/VisorArchivo";
import { useLockBodyScroll } from "../../hooks/useLockBodyScroll";
import { useVisorCurso } from "../../hooks/capacitaciones/useVisorCurso";
import { IconoEstadoModulo } from "./IconoEstadoModulo";
import { SeccionExamen } from "./SeccionExamen";
import Button from "../../components/Buttons/Button";
import { File, LockKeyhole, LockKeyholeOpen, X } from "lucide-react";
import { useState } from "react";

// VISTA ESTILO CISCO
export function VisorCurso({ secciones, moduloInicialId, onCerrar, onProgresoActualizado }) {

    useLockBodyScroll();
    const { activoId, tab, setTab, contenidoListo, setContenidoListo, activo, seccionActiva, seleccionar, marcarContenidoListo } =
        useVisorCurso({ secciones, moduloInicialId });

    const [percent, setPercent] = useState(0)


    if (!activo) return null;

    const { modulo, tiene_examen } = activo;

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
            <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-3 shrink-0 bg-gray-50 shadow-sm">
                <div className="min-w-0">
                    <h3 className="font-bold text-gray-800 truncate">{modulo.nombre}</h3>
                    <p className="text-xs text-gray-500 line-clamp-1">{modulo.descripcion}</p>
                </div>
                <Button variant="ghost" size="sm" Icon={X} onClick={onCerrar} iconOnly>  </Button>
            </div>

            <div className="flex flex-1 min-h-0">
                {/* Esquema de curso: solo la sección que se está cursando actualmente */}
                <aside className="w-72 shrink-0 border-r border-gray-200 bg-gray-50 overflow-y-auto hidden md:block">
                    {seccionActiva && (() => {
                        const { seccion, modulos } = seccionActiva;
                        const completados = modulos.filter(m => m.estado === "completado").length;
                        const pct = modulos.length ? Math.round((completados / modulos.length) * 100) : 0;
                        return (
                            <div className="border-b  border-zinc-200">
                                <div className="w-full flex items-center justify-between gap-2 px-4 py-3">
                                    <span className="text-sm font-semibold text-gray-800">{seccion.nombre}</span>
                                    <span className="text-[10px] text-gray-400 shrink-0">{completados}/{modulos.length}</span>
                                </div>
                                <div className="px-4 pb-3 -mt-1">
                                    <div className="rounded-full bg-gray-200 h-1.5 overflow-hidden">
                                        <div className="h-1.5 rounded-full bg-brand-primary transition-all" style={{ width: `${pct}%` }} />
                                    </div>
                                </div>
                                {modulos.map(item => {
                                    const esActivo = item.modulo.id === activoId;
                                    if (esActivo)
                                    {
                                        console.log(item.estado)
                                    }
                                    if (esActivo && (item.estado == undefined || item.estado == "pendiente")){
                                        item.estado = "en_progreso"
                                    }
                                    const bloqueado = !item.desbloqueado;
                                    return (
                                        <button key={item.modulo.id}
                                            onClick={() => seleccionar(item)}
                                            disabled={bloqueado}
                                            title={bloqueado ? "Aprueba el examen del módulo anterior (mínimo 70%) para desbloquearlo" : undefined}
                                            className={`w-full flex items-center gap-2 pl-6 pr-4 py-2.5 text-left text-xs border-l-4  transition-colors ${esActivo ? "border-brand-primary bg-white font-semibold text-brand-primary"
                                                : bloqueado ? "border-transparent text-gray-400 cursor-not-allowed"
                                                    : "border-transparent text-gray-600 hover:bg-gray-100"
                                                }`}>
                                            <IconoEstadoModulo estado={item.estado} percent={esActivo ? percent : 0} desbloqueado={item.desbloqueado} />
                                            <span className="truncate flex-1">{item.modulo.nombre}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        );
                    })()}
                </aside>

                {/* Contenido del módulo activo */}
                <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex border-b border-zinc-200 shrink-0 px-6 pt-2 bg-gray-50">
                        <button onClick={() => setTab("contenido")}
                            className={`px-5 py-2 text-sm font-medium transition-colors rounded-t-lg ${tab === "contenido" ? "border-b border-[#802907]  bg-white" : "text-gray-500 hover:text-gray-700"}`}>
                            <div className="flex flex-row items-center gap-2">
                                <span className="bg-yellow-500 h-5 w-5 rounded-md flex items-center justify-center">
                                    <File size={10} strokeWidth={3} className="text-white" />
                                </span>
                                Contenido
                            </div>
                        </button>
                        {tiene_examen && (
                            <button onClick={() => contenidoListo && setTab("examen")}
                                disabled={!contenidoListo}
                                title={!contenidoListo ? "Revisa todo el contenido (PDF hasta el final o video completo) para desbloquear el examen" : undefined}
                                className={`px-5 py-2 text-sm font-semibold transition-colors rounded-t-lg ${tab === "examen" ? "border-b border-[#802907] bg-white"
                                    : !contenidoListo ? "text-gray-300 cursor-not-allowed"
                                        : "text-gray-500 hover:text-gray-700"
                                    }`}>

                                <div className="flex flex-row items-center gap-2">
                                    <span className={`${contenidoListo ? "bg-green-500" : "bg-sky-500"} h-5 w-5 rounded-md flex items-center justify-center`}>

                                        {contenidoListo ? <LockKeyholeOpen size={10} strokeWidth={3} className="text-white" /> : <LockKeyhole size={10} strokeWidth={3} className="text-white" />}
                                    </span>
                                    Examen
                                </div>
                            </button>
                        )}
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto p-6">
                        {tab === "contenido" ? (
                            <div className="h-full flex flex-col gap-4">
                                <VisorArchivo fileUrl={modulo.file_url} fileType={modulo.file_type} presentacionJson={modulo.presentacion_json}
                                    onCompletado={marcarContenidoListo}
                                    setPercent={(e) => { setPercent(e);}}
                                />

                            </div>
                        ) : (
                            <div className="max-w-2xl mx-auto">
                                <SeccionExamen
                                    moduloId={modulo.id}
                                    estadoInicial={activo.estado}
                                    onCalificado={onProgresoActualizado}
                                    onRepasarContenido={() => { setContenidoListo(false); setTab("contenido"); }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
