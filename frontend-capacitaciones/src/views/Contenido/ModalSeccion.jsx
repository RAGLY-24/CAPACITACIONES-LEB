import { useLockBodyScroll } from "../../hooks/useLockBodyScroll";
import { useModalSeccion } from "../../hooks/contenido/useModalSeccion";

export function ModalSeccion({ tipo, datos, secciones, onGuardar, onCerrar }) {
    useLockBodyScroll();
    const { form, errs, saving, handle, submit } = useModalSeccion({ tipo, datos, onGuardar });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <h3 className="font-bold text-gray-800">{tipo === "crear" ? "Nueva Sección" : "Editar Sección"}</h3>
                    <button onClick={onCerrar} className="text-gray-400 hover:text-gray-700 text-xl">✕</button>
                </div>
                <form onSubmit={submit} className="p-6 space-y-4">
                    <div>
                        <label className="text-sm font-semibold text-gray-700">Nombre <span className="text-red-500">*</span></label>
                        <input name="nombre" value={form.nombre} onChange={handle} maxLength={150}
                            className={`mt-1 w-full rounded border p-2 text-sm focus:outline-none focus:border-[#802907] ${errs.nombre ? "border-red-500" : "border-gray-300"}`}
                            placeholder="Ej: Seguridad Laboral" />
                        {errs.nombre && <p className="text-xs text-red-500 mt-1">{errs.nombre}</p>}
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-gray-700">Descripción</label>
                        <textarea name="descripcion" value={form.descripcion} onChange={handle} rows={3} maxLength={1000}
                            className="mt-1 w-full rounded border border-gray-300 p-2 text-sm focus:outline-none focus:border-[#802907]"
                            placeholder="Descripción breve de la sección..." />
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-gray-700">Estado</label>
                        <select name="estado" value={form.estado} onChange={handle}
                            className="mt-1 w-full rounded border border-gray-300 p-2 text-sm focus:outline-none focus:border-[#802907]">
                            <option value="Activo">Activo</option>
                            <option value="Inactivo">Inactivo</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-gray-700">Sección requerida antes de esta</label>
                        <select name="seccion_requerida_id" value={form.seccion_requerida_id || ""} onChange={handle}
                            className="mt-1 w-full rounded border border-gray-300 p-2 text-sm focus:outline-none focus:border-[#802907]">
                            <option value="">Ninguna (no depende de otra)</option>
                            {secciones.filter(s => s.id !== datos?.id).map(sec => (
                                <option key={sec.id} value={sec.id}>{sec.nombre}</option>
                            ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-400">Esto ayuda a indicar qué contenido debe completarse antes.</p>
                    </div>
                    <div className="flex justify-end gap-3 pt-2 border-t">
                        <button type="button" onClick={onCerrar} className="rounded px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">Cancelar</button>
                        <button type="submit" disabled={saving}
                            className="rounded bg-brand-primary px-5 py-2 text-sm font-semibold text-white hover:bg-[#5a1b04] disabled:opacity-60">
                            {saving ? "Guardando..." : tipo === "crear" ? "Crear Sección" : "Guardar"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
