import Swal from "sweetalert2";
import { useVistaEmpleado } from "../../hooks/capacitaciones/useVistaEmpleado";
import { TarjetaModuloEmpleado } from "./TarjetaModuloEmpleado";
import { TarjetaSeccionEmpleado } from "./TarjetaSeccionEmpleado";
import { VisorCurso } from "./VisorCurso";
import Button from "../../components/Buttons/Button";
import { ChevronLeft } from "lucide-react";

export function VistaEmpleado({ seccionInicialId = null, moduloInicialId = null } = {}) {
    const {
        secciones, cargando, hayModulos,
        setSeccionActivaId, seccionActiva,
        cursoModuloId, setCursoModuloId,
        cargar,
    } = useVistaEmpleado({ seccionInicialId, moduloInicialId });

    if (cargando) return <p className="text-center text-sm text-gray-400 py-12">Cargando módulos...</p>;

    if (!hayModulos) {
        return (
            <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center">
                <p className="text-gray-400 text-sm">No hay módulos disponibles en este momento.</p>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {seccionActiva ? (
                // ── Módulos de la sección activa, en tarjetas ──
                <>
                    <div className="flex items-center gap-2 flex-wrap">
                        <Button onClick={() => setSeccionActivaId(null)} Icon={ChevronLeft} variant="outline" size="sm">
                            Cursos
                        </Button>
                        <span className="text-gray-400">/</span>
                        <span className="font-medium text-sm text-zinc-800">{seccionActiva.seccion.nombre}</span>
                    </div>
                    {seccionActiva.seccion.descripcion && (
                        <p className="text-sm text-gray-500">{seccionActiva.seccion.descripcion}</p>
                    )}

                    {seccionActiva.modulos.length === 0 ? (
                        <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white py-16 text-center">
                            <p className="text-gray-400 text-sm">Esta sección no tiene módulos todavía.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                            {seccionActiva.modulos.map(item => (
                                <TarjetaModuloEmpleado key={item.modulo.id} item={item} onAbrir={setCursoModuloId} />
                            ))}
                        </div>
                    )}
                </>
            ) : (
                // ── Lista de secciones, en tarjetas ─
                <>
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
                            const desbloqueada = secData.desbloqueada !== false;
                            return (
                                <TarjetaSeccionEmpleado
                                    key={secData.seccion.id}
                                    seccion={secData.seccion}
                                    modulos={secData.modulos}
                                    desbloqueada={desbloqueada}
                                    seccionRequerida={secData.seccion_requerida}
                                    onClick={() => {
                                        if (!desbloqueada) {
                                            Swal.fire({
                                                icon: "warning",
                                                title: "Sección bloqueada",
                                                text: `Debes completar la sección "${secData.seccion_requerida}" antes de acceder a esta.`,
                                                confirmButtonColor: "#802907",
                                            });
                                            return;
                                        }
                                        setSeccionActivaId(secData.seccion.id);
                                    }}
                                />
                            );
                        })}
                    </div>
                </>
            )}

            {cursoModuloId && (
                <VisorCurso
                    secciones={secciones}
                    moduloInicialId={cursoModuloId}
                    onCerrar={() => { setCursoModuloId(null); cargar(); }}
                    onProgresoActualizado={() => cargar(true)}
                />
            )}
        </div>
    );
}
