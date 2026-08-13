import { useLockBodyScroll } from "../../hooks/useLockBodyScroll";
import { usePanelExamen } from "../../hooks/contenido/usePanelExamen";
import { EditorOpciones } from "./EditorOpciones";
import { Ico } from "./icons";

export function PanelExamen({ modulo, onCerrar }) {
    useLockBodyScroll();
    const {
        preguntas, cargando,
        nueva, setNueva, cancelarNueva,
        npTipo, setNpTipo, npTexto, setNpTexto, npOps, setNpOps, setCorrectaNueva, guardarNueva,
        editId, setEditId, editTipo, editTexto, setEditTexto, editOps, setEditOps, setCorrectaEdit,
        iniciarEdicion, guardarEdicion, eliminar,
    } = usePanelExamen(modulo);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl bg-gray-50 shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between border-b bg-white px-6 py-4 shrink-0">
                    <div>
                        <h3 className="font-bold text-gray-800">Examen — {modulo.nombre}</h3>
                        <p className="text-xs text-gray-500">{preguntas.length} pregunta(s) · Aprueba con ≥70%</p>
                    </div>
                    <button onClick={onCerrar} className="text-gray-400 hover:text-gray-700 text-xl font-bold">✕</button>
                </div>
                {!cargando && (() => {
                    const numOpcionMultiple = preguntas.filter(p => p.tipo !== "feedback").length;
                    const listo = numOpcionMultiple >= 15;
                    return (
                        <div className={`px-6 py-2 text-xs font-medium shrink-0 border-b ${listo ? "bg-green-50 text-green-700 border-green-100" : "bg-amber-50 text-amber-800 border-amber-100"}`}>
                            {listo ? "✓" : "⚠"} Banco de preguntas: {numOpcionMultiple} de 15 preguntas de opción múltiple mínimas
                            {!listo && ` (faltan ${15 - numOpcionMultiple} para poder generar el examen)`}
                        </div>
                    );
                })()}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {cargando ? <p className="text-center text-sm text-gray-400 py-6">Cargando...</p> : (
                        <>
                            {preguntas.length === 0 && !nueva && (
                                <p className="text-center text-sm text-gray-400 py-6">Sin preguntas. Agrega la primera.</p>
                            )}
                            {preguntas.map((p, idx) => (
                                <div key={p.id} className="rounded-lg border bg-white p-4">
                                    {editId === p.id ? (
                                        <div className="space-y-2">
                                            <input value={editTexto} onChange={e => setEditTexto(e.target.value)}
                                                className="w-full rounded border border-gray-300 p-2 text-sm focus:outline-none focus:border-[#802907]" />
                                            {editTipo === "feedback" ? (
                                                <p className="text-xs text-gray-400">Pregunta de retroalimentación: el operador responderá con texto libre, no se califica.</p>
                                            ) : (
                                                <EditorOpciones ops={editOps} setOps={setEditOps} setCorrecta={setCorrectaEdit} />
                                            )}
                                            <div className="flex gap-2 pt-1">
                                                <button onClick={guardarEdicion} className="text-xs rounded bg-brand-primary text-white px-3 py-1 hover:bg-[#5a1b04]">Guardar</button>
                                                <button onClick={() => setEditId(null)} className="text-xs rounded border px-3 py-1 text-gray-600 hover:bg-gray-100">Cancelar</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-start justify-between">
                                                <p className="text-sm font-semibold text-gray-800">
                                                    {idx + 1}. {p.texto}
                                                    {p.tipo === "feedback" && <span className="ml-2 align-middle text-[10px] font-normal bg-gray-100 text-gray-500 rounded px-1.5 py-0.5">💬 Retroalimentación</span>}
                                                </p>
                                                <div className="flex gap-1 shrink-0 ml-2">
                                                    <button onClick={() => iniciarEdicion(p)} className="rounded p-1 text-blue-600 hover:bg-blue-50">{Ico.edit}</button>
                                                    <button onClick={() => eliminar(p.id)} className="rounded p-1 text-red-600 hover:bg-red-50">{Ico.trash}</button>
                                                </div>
                                            </div>
                                            {p.tipo === "feedback" ? (
                                                <p className="mt-2 pl-2 text-xs text-gray-400">Respuesta de texto libre, no se califica.</p>
                                            ) : (
                                                <ul className="mt-2 space-y-1 pl-2">
                                                    {p.opciones.map(op => (
                                                        <li key={op.id} className={`text-xs flex items-center gap-2 ${op.es_correcta ? "text-green-700 font-semibold" : "text-gray-500"}`}>
                                                            <span className={`h-2 w-2 rounded-full shrink-0 ${op.es_correcta ? "bg-green-500" : "bg-gray-300"}`} />
                                                            {op.texto}
                                                            {op.es_correcta && <span className="ml-1 text-[10px] bg-green-100 text-green-700 rounded px-1">Correcta</span>}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </>
                                    )}
                                </div>
                            ))}
                            {nueva && (
                                <div className="rounded-lg border-2 border-dashed border-[#802907] bg-white p-4 space-y-2">
                                    <p className="text-sm font-semibold text-gray-700">Nueva pregunta</p>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => setNpTipo("opcion_multiple")}
                                            className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${npTipo === "opcion_multiple" ? "border-[#802907] bg-brand-primary/5 text-[#802907]" : "border-gray-200 text-gray-500 hover:border-gray-400"}`}>
                                            Opción múltiple
                                        </button>
                                        <button type="button" onClick={() => setNpTipo("feedback")}
                                            className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${npTipo === "feedback" ? "border-[#802907] bg-brand-primary/5 text-[#802907]" : "border-gray-200 text-gray-500 hover:border-gray-400"}`}>
                                            💬 Retroalimentación
                                        </button>
                                    </div>
                                    <input value={npTexto} onChange={e => setNpTexto(e.target.value)}
                                        placeholder="Escribe la pregunta aquí..."
                                        className="w-full rounded border border-gray-300 p-2 text-sm focus:outline-none focus:border-[#802907]" />
                                    {npTipo === "feedback" ? (
                                        <p className="text-xs text-gray-400">El operador responderá con texto libre; esta pregunta no se califica.</p>
                                    ) : (
                                        <EditorOpciones ops={npOps} setOps={setNpOps} setCorrecta={setCorrectaNueva} />
                                    )}
                                    <div className="flex gap-2 pt-1">
                                        <button onClick={guardarNueva} className="text-xs rounded bg-brand-primary text-white px-3 py-1.5 hover:bg-[#5a1b04]">Guardar pregunta</button>
                                        <button onClick={cancelarNueva}
                                            className="text-xs rounded border px-3 py-1.5 text-gray-600 hover:bg-gray-100">Cancelar</button>
                                    </div>
                                </div>
                            )}
                            {!nueva && (
                                <button onClick={() => setNueva(true)}
                                    className="w-full rounded-lg border-2 border-dashed border-gray-300 py-3 text-sm text-gray-400 hover:border-[#802907] hover:text-[#802907] transition-colors">
                                    + Agregar pregunta
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
