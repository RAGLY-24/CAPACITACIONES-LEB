import { useLockBodyScroll } from "../../hooks/useLockBodyScroll";
import { useVisorProgresoOperador } from "../../hooks/capacitaciones/useVisorProgresoOperador";
import { RetroalimentacionExamen } from "./RetroalimentacionExamen";
import { TarjetaModuloOperador } from "./TarjetaModuloOperador";
import { TarjetaSeccionEmpleado } from "./TarjetaSeccionEmpleado";
import Button from "../../components/Buttons/Button";
import { ChevronLeft, X } from "lucide-react";

// Visor de progreso de un operador para el admin: navega por tarjetas de
// secciones y módulos igual que la vista del empleado (con su barra de
// avance), y al entrar a un módulo ya contestado muestra la retroalimentación
// pregunta por pregunta en vez de dejarlo rendir el examen.
export function VisorProgresoOperador({ usuarioId, usuarioNombre, moduloInicialId, onCerrar }) {
    useLockBodyScroll();
    const {
        secciones, cargando, moduloActivo, retro, cargandoRetro,
        seccionActiva, abrirRetro, volverASecciones, volverAModulos, setSeccionActivaId,
    } = useVisorProgresoOperador({ usuarioId, moduloInicialId });

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
            <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-3 shrink-0 bg-zinc-50 ">
                <div className="min-w-0 flex items-center gap-2 flex-wrap text-sm">
                    <span className="font-semibold text-zinc-700">Capacitaciones de {usuarioNombre}</span>
                    {seccionActiva && (
                        <>
                            <span className="text-gray-400">/</span>
                            <Button size="md" onClick={volverASecciones} variant="link" className="-m-4 text-zinc-500" >
                                {seccionActiva.seccion.nombre}
                            </Button>
                        </>
                    )}
                    {moduloActivo && (
                        <>
                            <span className="text-gray-400">/</span>
                            <span className="text-gray-800 font-semibold">{moduloActivo.modulo.nombre}</span>
                        </>
                    )}
                </div>
                <Button size="sm" onClick={onCerrar} variant="ghost" iconOnly Icon={X} />
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                {cargando ? (
                    <p className="text-center text-sm text-gray-400 py-12">Cargando progreso...</p>
                ) : moduloActivo ? (
                    <div className="max-w-2xl mx-auto space-y-4">
                        <Button Icon={ChevronLeft} onClick={volverAModulos} variant="outline" >
                            Módulos
                        </Button>
                        {cargandoRetro ? (
                            <p className="text-center text-sm text-gray-400 py-6">Cargando respuestas...</p>
                        ) : retro ? (
                            <RetroalimentacionExamen resultado={retro} />
                        ) : (
                            <p className="text-center text-sm text-gray-400 py-6">No se pudieron cargar las respuestas.</p>
                        )}
                    </div>
                ) : seccionActiva ? (
                    <div className="space-y-5">
                        <Button Icon={ChevronLeft} onClick={volverASecciones} variant="outline" >
                            Cursos
                        </Button>
                        {seccionActiva.modulos.length === 0 ? (
                            <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white py-16 text-center">
                                <p className="text-gray-400 text-sm">Esta sección no tiene módulos todavía.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                {seccionActiva.modulos.map(item => (
                                    <TarjetaModuloOperador key={item.modulo.id} item={item} onVer={abrirRetro} />
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-5">
                        {(() => {
                            const todosLosModulos = secciones.flatMap(s => s.modulos || []);
                            const completadosTotal = todosLosModulos.filter(m => m.estado === "completado").length;
                            const pctTotal = todosLosModulos.length ? Math.round((completadosTotal / todosLosModulos.length) * 100) : 0;
                            return (
                                <div className="flex flex-col rounded-3xl border border-zinc-200 bg-white gap-2 p-5">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-bold text-gray-700">Tu avance general</h3>
                                        <span className="text-sm font-bold">{pctTotal}%</span>
                                    </div>
                                    <div className="rounded-full bg-gray-200 h-2 overflow-hidden">
                                        <div className="h-2.5 rounded-full bg-green-500 transition-all" style={{ width: `${pctTotal}%` }} />
                                    </div>
                                    <p className="text-xs text-gray-400">{completadosTotal} de {todosLosModulos.length} módulo(s) completados</p>
                                </div>
                            );
                        })()}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {secciones.map(secData => {
                                if (!secData.modulos?.length) return null;
                                return (
                                    <TarjetaSeccionEmpleado
                                        key={secData.seccion.id}
                                        seccion={secData.seccion}
                                        modulos={secData.modulos}
                                        desbloqueada={secData.desbloqueada !== false}
                                        seccionRequerida={secData.seccion_requerida}
                                        onClick={() => setSeccionActivaId(secData.seccion.id)}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
