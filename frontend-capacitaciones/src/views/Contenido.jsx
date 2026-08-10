import { useMe } from "../hooks/auth/useMe";
import { useSecciones } from "../hooks/contenido/useSecciones";
import { ModalSeccion } from "./Contenido/ModalSeccion";
import { Ico } from "./Contenido/icons";
import { TarjetaSeccion } from "./Contenido/TarjetaSeccion";
import { VistaModulos } from "./Contenido/VistaModulos";

function Contenido() {
    const { data } = useMe();

    const storedUser = typeof window !== "undefined" ? data : null;
    const rol = storedUser?.puesto?.nombre || null;
    const permisos = storedUser?.permissions || {};
    const puedeEditar = rol === "SistemasAdmin" || permisos.edit_trainings;

    const {
        secciones, cargando, seccionActiva, setActiva, modalSec, setModalSec,
        refrescar, confirmarEliminar, alGuardarSeccion,
    } = useSecciones();

    if (!puedeEditar) {
        return (
            <div className="rounded-xl bg-white p-8 shadow-sm text-center">
                <h2 className="text-xl font-bold text-red-600 mb-2">Acceso Denegado</h2>
                <p className="text-sm text-gray-500">No tienes permisos para editar el contenido de las capacitaciones.</p>
            </div>
        );
    }

    // ── Vista módulos de la sección activa ──
    if (seccionActiva) {
        return (
            <div className="p-6">
                <VistaModulos
                    seccion={seccionActiva}
                    secciones={secciones}
                    onVolver={() => setActiva(null)}
                    onRefrescar={refrescar}
                />
            </div>
        );
    }

    // ── Vista lista de secciones ──
    return (
        <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Editar Contenido</h2>
                    <p className="text-sm text-gray-500">Selecciona una sección para ver y gestionar sus módulos.</p>
                </div>
                <button onClick={() => setModalSec({ tipo: "crear", datos: null })}
                    className="flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:bg-[#5a1b04]">
                    {Ico.plus} Nueva Sección
                </button>
            </div>

            {cargando ? (
                <div className="rounded-xl bg-white p-12 text-center shadow-sm border border-gray-200">
                    <p className="text-sm text-gray-400">Cargando...</p>
                </div>
            ) : secciones.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white p-16 text-center">
                    <p className="text-lg font-semibold text-gray-600 mb-1">Sin secciones</p>
                    <p className="text-sm text-gray-400 mb-5">Crea la primera sección para organizar los módulos.</p>
                    <button onClick={() => setModalSec({ tipo: "crear", datos: null })}
                        className="rounded-lg bg-brand-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#5a1b04]">
                        Crear primera sección
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {secciones.map(sec => (
                        <TarjetaSeccion
                            key={sec.id}
                            seccion={sec}
                            onClick={() => setActiva(sec)}
                            onEditar={s => setModalSec({ tipo: "editar", datos: s })}
                            onEliminar={confirmarEliminar}
                        />
                    ))}
                </div>
            )}

            {modalSec && (
                <ModalSeccion
                    tipo={modalSec.tipo}
                    datos={modalSec.datos}
                    secciones={secciones}
                    onGuardar={alGuardarSeccion}
                    onCerrar={() => setModalSec(null)}
                />
            )}
        </div>
    );
}

export default Contenido;
