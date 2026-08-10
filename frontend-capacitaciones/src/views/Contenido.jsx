import { useMe } from "../hooks/auth/useMe";
import { useSecciones } from "../hooks/contenido/useSecciones";
import { ModalSeccion } from "./Contenido/ModalSeccion";
import { TarjetaSeccion } from "./Contenido/TarjetaSeccion";
import { VistaModulos } from "./Contenido/VistaModulos";
import Button from "../components/Buttons/Button";
import { BookText, Plus } from "lucide-react";

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
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Editar Contenido</h2>
                    <p className="text-sm text-gray-500">
                        Selecciona una sección para ver y gestionar sus módulos.
                    </p>
                </div>

                <Button
                    Icon={Plus}
                    size="sm"
                    onClick={() => setModalSec({ tipo: "crear", datos: null })}
                >
                    Nueva Sección
                </Button>
            </div>

            {cargando ? (
                <div className="rounded-xl bg-white p-12 text-center shadow-sm border border-zinc-200">
                    <p className="text-sm text-gray-400">Cargando...</p>
                </div>
            ) : secciones.length === 0 ? (
                <div className="rounded-xl gap-4 flex flex-col items-center border border-zinc-200 bg-white p-16 text-center">
                    <BookText size={40} />
                    <p className="text-lg font-semibold text-gray-800 ">Sin cursos</p>
                    <p className="text-sm text-gray-400 ">Crea la primera sección para organizar los módulos.</p>
                    <Button variant="secondary" onClick={() => setModalSec({ tipo: "crear", datos: null })}>
                        Crear primer curso
                    </Button>
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

            {modalSec &&
                (<ModalSeccion
                    open={true}
                    tipo={modalSec.tipo}
                    datos={modalSec.datos}
                    secciones={secciones}
                    onGuardar={alGuardarSeccion}
                    onCerrar={() => setModalSec(null)}
                />)
            }
        </div>
    );
}

export default Contenido;
