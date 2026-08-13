import { useLockBodyScroll } from "../../hooks/useLockBodyScroll";
import { useModalModulo } from "../../hooks/contenido/useModalModulo";
import { Ico } from "./icons";

export function ModalModulo({ tipo, seccionId, datos, modulos, onGuardar, onAbrirLienzo, onCerrar }) {
    useLockBodyScroll();
    const { form, preview, errs, saving, tienePresentacion, handle, quitarImagen, submit, irAlLienzo } =
        useModalModulo({ tipo, seccionId, datos, onGuardar, onAbrirLienzo });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
                <div className="flex items-center justify-between border-b px-6 py-4 shrink-0">
                    <h3 className="font-bold text-gray-800">{tipo === "crear" ? "Nuevo Módulo" : "Editar Módulo"}</h3>
                    <button onClick={onCerrar} className="text-gray-400 hover:text-gray-700 text-xl">✕</button>
                </div>
                <form onSubmit={submit} className="flex-1 overflow-y-auto p-6 space-y-4">
                    {/* Imagen portada */}
                    <div>
                        <label className="text-sm font-semibold text-gray-700">Imagen de portada</label>
                        <label className="mt-1 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 cursor-pointer hover:border-[#802907] transition-colors overflow-hidden"
                            style={{ minHeight: 140 }}>
                            {preview ? (
                                <img src={preview} alt="portada" className="w-full h-36 object-cover" />
                            ) : (
                                <div className="flex flex-col items-center gap-2 py-8 text-gray-400">
                                    {Ico.img}
                                    <span className="text-xs">Haz clic para subir imagen (JPG, PNG, WEBP · máx. 20 MB, se comprime a 5 MB)</span>
                                </div>
                            )}
                            <input type="file" name="imagen" accept=".jpg,.jpeg,.png,.webp" onChange={handle} className="hidden" />
                        </label>
                        {preview && (
                            <button type="button" onClick={quitarImagen}
                                className="mt-1 text-xs text-red-500 hover:underline">Quitar imagen</button>
                        )}
                        {errs.imagen && <p className="text-xs text-red-500 mt-1">{errs.imagen}</p>}
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-gray-700">Nombre <span className="text-red-500">*</span></label>
                        <input name="nombre" value={form.nombre} onChange={handle} maxLength={150}
                            className={`mt-1 w-full rounded border p-2 text-sm focus:outline-none focus:border-[#802907] ${errs.nombre ? "border-red-500" : "border-gray-300"}`}
                            placeholder="Ej: Uso correcto de EPP" />
                        {errs.nombre && <p className="text-xs text-red-500 mt-1">{errs.nombre}</p>}
                        <p className="text-xs text-gray-400 mt-0.5">{form.nombre.length}/150</p>
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-gray-700">Descripción <span className="text-red-500">*</span></label>
                        <textarea name="descripcion" value={form.descripcion} onChange={handle} rows={3} maxLength={2000}
                            className={`mt-1 w-full rounded border p-2 text-sm focus:outline-none focus:border-[#802907] ${errs.descripcion ? "border-red-500" : "border-gray-300"}`}
                            placeholder="Objetivos y contenido del módulo..." />
                        {errs.descripcion && <p className="text-xs text-red-500 mt-1">{errs.descripcion}</p>}
                        <p className="text-xs text-gray-400 mt-0.5">{form.descripcion.length}/2000</p>
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
                        <label className="text-sm font-semibold text-gray-700">Módulo requerido antes de este</label>
                        <select name="prerequisite_module_id" value={form.prerequisite_module_id || ""} onChange={handle}
                            className="mt-1 w-full rounded border border-gray-300 p-2 text-sm focus:outline-none focus:border-[#802907]">
                            <option value="">Ninguno</option>
                            {(modulos || []).filter(m => m.id !== datos?.id).map(mod => (
                                <option key={mod.id} value={mod.id}>{mod.nombre}</option>
                            ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-400">Indica qué contenido debe completarse previamente.</p>
                    </div>

                    {/* Contenido: subir archivo o crear presentación son alternativas */}
                    <div>
                        <label className="text-sm font-semibold text-gray-700">Contenido del módulo</label>
                        <p className="text-xs text-gray-400 mt-0.5 mb-2">Elige una de las dos opciones para el contenido que verá el empleado.</p>
                        <div className="grid grid-cols-2 gap-3">
                            <label className="flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-gray-300 hover:border-[#802907] cursor-pointer transition-colors py-4 px-2 text-center">
                                {Ico.file}
                                <span className="text-xs font-medium text-gray-600 line-clamp-1">
                                    {form.archivo ? form.archivo.name : "Subir PDF / Video"}
                                </span>
                                <input type="file" name="archivo" accept=".pdf,.mp4,.webm" onChange={handle} className="hidden" />
                            </label>
                            <button type="button" onClick={irAlLienzo} disabled={saving}
                                className="flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-purple-300 hover:border-purple-500 bg-purple-50 py-4 px-2 text-center disabled:opacity-60">
                                {Ico.img}
                                <span className="text-xs font-medium text-purple-700">
                                    {tienePresentacion ? "Editar presentación" : "Crear presentación"}
                                </span>
                            </button>
                        </div>
                        {datos?.file_type && datos.file_type !== "presentacion" && !form.archivo && (
                            <p className="text-xs text-gray-400 mt-1.5">Actual: <strong>{datos.file_type.toUpperCase()}</strong></p>
                        )}
                        {tienePresentacion && (
                            <p className="text-xs text-gray-400 mt-1.5">Este módulo ya tiene una presentación diseñada.</p>
                        )}
                        {!datos?.file_type && (
                            <p className="text-xs text-gray-400 mt-1.5">Este módulo todavía no tiene contenido.</p>
                        )}
                        {errs.archivo && <p className="text-xs text-red-500 mt-1">{errs.archivo}</p>}
                    </div>

                    <div className="flex justify-end gap-3 pt-2 border-t">
                        <button type="button" onClick={onCerrar} className="rounded px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">Cancelar</button>
                        <button type="submit" disabled={saving}
                            className="rounded bg-brand-primary px-5 py-2 text-sm font-semibold text-white hover:bg-[#5a1b04] disabled:opacity-60">
                            {saving ? "Guardando..." : tipo === "crear" ? "Crear Módulo" : "Guardar"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
