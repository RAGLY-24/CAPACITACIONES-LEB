import { lazy, Suspense } from "react";
import { useVistaModulos } from "../../hooks/contenido/useVistaModulos";
import { ModalModulo } from "./ModalModulo";
import { ModalSeccion } from "./ModalSeccion";
import { ModalVistaPrevia } from "./ModalVistaPrevia";
import { PanelExamen } from "./PanelExamen";
import { TarjetaModulo } from "./TarjetaModulo";
import Button from "../../components/Buttons/Button";
import {  ChevronLeft, Library, Pencil, Plus } from "lucide-react";

// Carga diferida: tldraw es pesado y solo se necesita al crear/editar presentaciones.
const EditorPresentacion = lazy(() =>
    import("../../components/PresentacionTldraw").then(m => ({ default: m.EditorPresentacion }))
);

export function VistaModulos({ seccion, secciones, onVolver, onRefrescar }) {
    const {
        modalMod, setModalMod,
        examenMod, setExamenMod,
        editSec, setEditSec,
        presentacionMod, setPresentacionMod,
        previewMod, setPreviewMod,
        eliminarModulo, alGuardar, alAbrirLienzo, alGuardarSeccion,
    } = useVistaModulos(onRefrescar);

    return (
        <div className="space-y-5">
            {/* Breadcrumb + acciones */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {/* Breadcrumb / información de la sección */}
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" Icon={ChevronLeft} onClick={onVolver} > Cursos </Button>
                    <span className="text-gray-300">/</span>
                    <span className="max-w-55 truncate text-sm font-semibold text-gray-800 sm:max-w-none">
                        {seccion.nombre} </span>
                    <span className={`rounded-full px-2 py-1 text-[11px] font-semibold leading-none ${seccion.estado === "Activo" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`} > {seccion.estado} </span>
                </div> {/* Acciones */}
                <div className="flex w-full gap-2 sm:w-auto">
                    <Button variant="outline" size="sm" Icon={Pencil} onClick={() => setEditSec(true)} className="flex-1 sm:flex-none" > Editar sección </Button>
                    <Button variant="primary" size="sm" Icon={Plus} onClick={() => setModalMod({ tipo: "crear", datos: null })} className="flex-1 sm:flex-none" > Nuevo módulo </Button>
                </div>
            </div>

            {seccion.descripcion && (
                <p className="text-sm text-gray-500">{seccion.descripcion}</p>
            )}

            {/* Grid de tarjetas de módulo */}
            {(seccion.modulos || []).length === 0 ? (
                <div className="rounded-xl gap-4 flex flex-col items-center border border-zinc-200 bg-white p-16 text-center">
                    <Library size={40} />
                    <p className="text-lg font-semibold text-gray-800 ">Sin Módulos</p>
                    <p className="text-sm text-gray-400 ">Este curso no tiene módulos todavía.</p>
                    <Button variant="secondary" onClick={() => setModalMod({ tipo: "crear", datos: null })}>
                        Crear primer módulo
                    </Button>
                </div>

            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {(seccion.modulos || []).map(m => (
                        <TarjetaModulo
                            key={m.id}
                            modulo={m}
                            onEditar={mod => setModalMod({ tipo: "editar", datos: mod })}
                            onExamen={mod => setExamenMod(mod)}
                            onEliminar={eliminarModulo}
                            onImagenCambiada={onRefrescar}
                            onVerContenido={mod => setPreviewMod(mod)}
                        />
                    ))}
                </div>
            )}

            {previewMod && (
                <ModalVistaPrevia
                    modulo={previewMod}
                    onCerrar={() => setPreviewMod(null)}
                    onEditar={mod => { setPreviewMod(null); setModalMod({ tipo: "editar", datos: mod }); }}
                />
            )}

            {modalMod && (
                <ModalModulo tipo={modalMod.tipo} seccionId={seccion.id} datos={modalMod.datos} modulos={seccion.modulos || []}
                    onGuardar={alGuardar} onAbrirLienzo={alAbrirLienzo} onCerrar={() => setModalMod(null)} />
            )}
            {examenMod && (
                <PanelExamen modulo={examenMod} onCerrar={() => { setExamenMod(null); onRefrescar(); }} />
            )}

            {presentacionMod && (
                <Suspense fallback={
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
                        <p className="text-sm text-gray-400">Cargando lienzo...</p>
                    </div>
                }>
                    <EditorPresentacion modulo={presentacionMod} onCerrar={() => { setPresentacionMod(null); onRefrescar(); }}
                        onGuardado={() => onRefrescar()} />
                </Suspense>
            )}

            {editSec &&
                (<ModalSeccion
                    open={true}
                    tipo={"editar"}
                    datos={seccion}
                    secciones={secciones}
                    onGuardar={alGuardarSeccion}
                    onCerrar={() => setEditSec(false)}
                />)
            }
        </div>
    );
}
