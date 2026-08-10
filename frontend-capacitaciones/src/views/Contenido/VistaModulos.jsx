import { lazy, Suspense } from "react";
import { useVistaModulos } from "../../hooks/contenido/useVistaModulos";
import { Ico } from "./icons";
import { ModalModulo } from "./ModalModulo";
import { ModalSeccion } from "./ModalSeccion";
import { ModalVistaPrevia } from "./ModalVistaPrevia";
import { PanelExamen } from "./PanelExamen";
import { TarjetaModulo } from "./TarjetaModulo";

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
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                    <button onClick={onVolver}
                        className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
                        {Ico.back} Secciones
                    </button>
                    <span className="text-gray-400">/</span>
                    <span className="font-semibold text-gray-800">{seccion.nombre}</span>
                    <span className={`text-xs font-bold rounded-full px-2 py-0.5 ${seccion.estado === "Activo" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                        {seccion.estado}
                    </span>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setEditSec(true)}
                        className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
                        {Ico.edit} Editar sección
                    </button>
                    <button onClick={() => setModalMod({ tipo: "crear", datos: null })}
                        className="flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-1.5 text-sm font-semibold text-white hover:bg-[#5a1b04]">
                        {Ico.plus} Nuevo módulo
                    </button>
                </div>
            </div>

            {seccion.descripcion && (
                <p className="text-sm text-gray-500">{seccion.descripcion}</p>
            )}

            {/* Grid de tarjetas de módulo */}
            {(seccion.modulos || []).length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white py-16 text-center">
                    <p className="text-gray-400 text-sm mb-4">Esta sección no tiene módulos todavía.</p>
                    <button onClick={() => setModalMod({ tipo: "crear", datos: null })}
                        className="rounded-lg bg-brand-primary px-5 py-2 text-sm font-semibold text-white hover:bg-[#5a1b04]">
                        + Nuevo módulo
                    </button>
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
            {editSec && (
                <ModalSeccion tipo="editar" datos={seccion} secciones={secciones}
                    onGuardar={alGuardarSeccion}
                    onCerrar={() => setEditSec(false)} />
            )}
        </div>
    );
}
