// Detalle pregunta por pregunta de un examen ya calificado (aprobado o no).
// La usan tanto el empleado (al reabrir un módulo ya contestado) como el
// admin (al revisar las respuestas de un operador).
export function RetroalimentacionExamen({ resultado, onReintentar, intentosRestantes, onRepasarContenido }) {
    // Con intentosRestantes sin definir (ej. la vista del admin) se ignora el
    // límite de 2 intentos: solo aplica a la propia vista del empleado.
    const sinIntentos = !resultado.aprobado && intentosRestantes !== undefined && intentosRestantes <= 0;

    return (
        <div className="space-y-4">
            <div className={`rounded-xl p-5 text-center ${resultado.aprobado ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                <p className={`text-3xl font-bold mb-1 ${resultado.aprobado ? "text-green-700" : "text-red-600"}`}>
                    {resultado.puntaje}%
                </p>
                <p className={`text-lg font-semibold ${resultado.aprobado ? "text-green-700" : "text-red-600"}`}>
                    {resultado.aprobado ? "¡Aprobado!" : "Reprobado"}
                </p>
                <p className="text-sm text-gray-500 mt-1">{resultado.aciertos} de {resultado.total} respuestas correctas</p>
                {!resultado.aprobado && intentosRestantes !== undefined && (
                    <p className="text-xs text-gray-500 mt-1">
                        {sinIntentos ? "Agotaste tus 2 intentos." : `Te queda${intentosRestantes === 1 ? "" : "n"} ${intentosRestantes} intento(s).`}
                    </p>
                )}
                {sinIntentos ? (
                    onRepasarContenido && (
                        <button onClick={onRepasarContenido} className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-1.5 text-sm text-amber-800 hover:bg-amber-100">
                            🔒 Repasar contenido para volver a intentar
                        </button>
                    )
                ) : (
                    onReintentar && (
                        <button onClick={onReintentar} className="mt-3 rounded-lg border px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-100">
                            Volver a intentar
                        </button>
                    )
                )}
            </div>
            <div className="space-y-3">
                {resultado.resultados.map((r, i) => {
                    if (r.tipo === "feedback") {
                        return (
                            <div key={r.pregunta_id} className="rounded-lg p-4 border border-gray-200 bg-gray-50">
                                <p className="text-sm font-semibold text-gray-800 mb-2">
                                    {i + 1}. {r.texto}
                                    <span className="ml-2 text-xs font-bold text-gray-400">💬 Retroalimentación</span>
                                </p>
                                <p className="text-xs text-gray-600 pl-2 whitespace-pre-wrap">
                                    {r.respuesta_texto?.trim() ? r.respuesta_texto : <em className="text-gray-400">Sin comentarios.</em>}
                                </p>
                            </div>
                        );
                    }
                    return (
                        <div key={r.pregunta_id} className={`rounded-lg p-4 border ${r.acertada ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
                            <p className="text-sm font-semibold text-gray-800 mb-2">
                                {i + 1}. {r.texto}
                                <span className={`ml-2 text-xs font-bold ${r.acertada ? "text-green-700" : "text-red-600"}`}>
                                    {r.acertada ? "✓ Correcto" : "✗ Incorrecto"}
                                </span>
                            </p>
                            <ul className="space-y-1 pl-2">
                                {r.opciones.map(op => {
                                    const sel = op.id === r.opcion_seleccionada;
                                    const cor = op.es_correcta;
                                    let cls = "text-gray-600";
                                    if (cor) cls = "text-green-700 font-semibold";
                                    if (sel && !cor) cls = "text-red-600 font-semibold line-through";
                                    return (
                                        <li key={op.id} className={`text-xs flex items-center gap-2 ${cls}`}>
                                            <span>{sel ? "●" : "○"}</span>
                                            {op.texto}
                                            {cor && <span className="text-[10px] bg-green-100 rounded px-1">Correcta</span>}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
