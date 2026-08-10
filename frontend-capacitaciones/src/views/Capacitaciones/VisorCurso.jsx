import { VisorArchivo } from "../../components/VisorArchivo";
import { useLockBodyScroll } from "../../hooks/useLockBodyScroll";
import { useVisorCurso } from "../../hooks/capacitaciones/useVisorCurso";
import { IconoEstadoModulo } from "./IconoEstadoModulo";
import { SeccionExamen } from "./SeccionExamen";

// VISTA ESTILO CISCO
export function VisorCurso({ secciones, moduloInicialId, onCerrar, onProgresoActualizado }) {
    useLockBodyScroll();
    const { activoId, tab, setTab, contenidoListo, setContenidoListo, activo, seccionActiva, seleccionar, marcarContenidoListo } =
        useVisorCurso({ secciones, moduloInicialId });

    if (!activo) return null;

    const { modulo, tiene_examen } = activo;

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
            <div className="flex items-center justify-between border-b px-6 py-3 shrink-0 bg-gray-50 shadow-sm">
                <div className="min-w-0">
                    <h3 className="font-bold text-gray-800 truncate">{modulo.nombre}</h3>
                    <p className="text-xs text-gray-500 line-clamp-1">{modulo.descripcion}</p>
                </div>
                <button onClick={onCerrar} className="text-gray-400 hover:text-gray-700 text-xl font-bold ml-4 shrink-0">✕</button>
            </div>

            <div className="flex flex-1 min-h-0">
                {/* Esquema de curso: solo la sección que se está cursando actualmente */}
                <aside className="w-72 shrink-0 border-r border-gray-200 bg-gray-50 overflow-y-auto hidden md:block">
                    {seccionActiva && (() => {
                        const { seccion, modulos } = seccionActiva;
                        const completados = modulos.filter(m => m.estado === "completado").length;
                        const pct = modulos.length ? Math.round((completados / modulos.length) * 100) : 0;
                        return (
                            <div className="border-b border-gray-200">
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
                                    const bloqueado = !item.desbloqueado;
                                    return (
                                        <button key={item.modulo.id}
                                            onClick={() => seleccionar(item)}
                                            disabled={bloqueado}
                                            title={bloqueado ? "Aprueba el examen del módulo anterior (mínimo 70%) para desbloquearlo" : undefined}
                                            className={`w-full flex items-center gap-2 pl-6 pr-4 py-2.5 text-left text-xs border-l-4 transition-colors ${esActivo ? "border-[#802907] bg-white font-semibold text-[#802907]"
                                                : bloqueado ? "border-transparent text-gray-400 cursor-not-allowed"
                                                    : "border-transparent text-gray-600 hover:bg-gray-100"
                                                }`}>
                                            <IconoEstadoModulo estado={item.estado} desbloqueado={item.desbloqueado} />
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
                    <div className="flex border-b shrink-0 px-6 pt-2 bg-gray-50">
                        <button onClick={() => setTab("contenido")}
                            className={`px-5 py-2 text-sm font-semibold transition-colors rounded-t-lg ${tab === "contenido" ? "border-b-2 border-[#802907] text-[#802907] bg-white" : "text-gray-500 hover:text-gray-700"}`}>
                            📄 Contenido
                        </button>
                        {tiene_examen && (
                            <button onClick={() => contenidoListo && setTab("examen")}
                                disabled={!contenidoListo}
                                title={!contenidoListo ? "Revisa todo el contenido (PDF hasta el final o video completo) para desbloquear el examen" : undefined}
                                className={`px-5 py-2 text-sm font-semibold transition-colors rounded-t-lg ${tab === "examen" ? "border-b-2 border-[#802907] text-[#802907] bg-white"
                                    : !contenidoListo ? "text-gray-300 cursor-not-allowed"
                                        : "text-gray-500 hover:text-gray-700"
                                    }`}>
                                {contenidoListo ? "📝 Examen" : "🔒 Examen"}
                            </button>
                        )}
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto p-6">
                        {tab === "contenido" ? (
                            <div className="h-full flex flex-col gap-4">
                                <VisorArchivo fileUrl={modulo.file_url} fileType={modulo.file_type} presentacionJson={modulo.presentacion_json}
                                    onCompletado={marcarContenidoListo} />
                                {tiene_examen && (
                                    <div className={`rounded-lg border p-4 shrink-0 ${contenidoListo ? "bg-blue-50 border-blue-200" : "bg-amber-50 border-amber-200"}`}>
                                        {contenidoListo ? (
                                            <>
                                                <p className="text-sm text-blue-800 font-medium">¿Ya revisaste el contenido?</p>
                                                <p className="text-xs text-blue-600 mt-1">Ve a la pestaña <strong>Examen</strong> cuando estés listo.</p>
                                            </>
                                        ) : (
                                            <>
                                                <p className="text-sm text-amber-800 font-medium">🔒 El examen está bloqueado</p>
                                                <p className="text-xs text-amber-700 mt-1">
                                                    {modulo.file_type === "video"
                                                        ? "Deja que el video termine para desbloquearlo."
                                                        : "Desplázate hasta el final del contenido para desbloquearlo."}
                                                </p>
                                            </>
                                        )}
                                    </div>
                                )}
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
