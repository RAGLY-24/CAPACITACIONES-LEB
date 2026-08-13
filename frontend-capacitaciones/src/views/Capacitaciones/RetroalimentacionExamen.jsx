import {
    Check,
    X,
    Circle,
    MessageCircle,
    LockKeyhole,
} from "lucide-react";

// Detalle pregunta por pregunta de un examen ya calificado (aprobado o no).
// La usan tanto el empleado (al reabrir un módulo ya contestado) como el
// admin (al revisar las respuestas de un operador).
export function RetroalimentacionExamen({
    resultado,
    onReintentar,
    intentosRestantes,
    onRepasarContenido,
}) {
    // Con intentosRestantes sin definir (ej. la vista del admin) se ignora el
    // límite de 2 intentos: solo aplica a la propia vista del empleado.
    const sinIntentos =
        !resultado.aprobado &&
        intentosRestantes !== undefined &&
        intentosRestantes <= 0;

    return (
        <div className="space-y-5">

            {/* Resumen del resultado */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-5">
                <div className="flex flex-col items-center text-center">

                    <p
                        className={`text-3xl font-bold mb-1 ${resultado.aprobado
                                ? "text-green-600"
                                : "text-zinc-800"
                            }`}
                    >
                        {resultado.puntaje}%
                    </p>

                    <p className="text-base font-semibold text-zinc-800">
                        {resultado.aprobado ? "¡Aprobado!" : "Reprobado"}
                    </p>

                    <p className="text-sm text-zinc-500 mt-1">
                        {resultado.aciertos} de {resultado.total} respuestas
                        correctas
                    </p>

                    {!resultado.aprobado &&
                        intentosRestantes !== undefined && (
                            <p className="text-xs text-zinc-500 mt-2">
                                {sinIntentos
                                    ? "Agotaste tus 2 intentos."
                                    : `Te queda${intentosRestantes === 1 ? "" : "n"
                                    } ${intentosRestantes} intento(s).`}
                            </p>
                        )}

                    {/* Acción */}
                    {sinIntentos
                        ? onRepasarContenido && (
                            <button
                                onClick={onRepasarContenido}
                                className="mt-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 transition-colors hover:bg-amber-100"
                            >
                                <LockKeyhole
                                    size={15}
                                    strokeWidth={2}
                                />
                                Repasar contenido para volver a intentar
                            </button>
                        )
                        : (onReintentar && !resultado.aprobado) && (
                            <button
                                onClick={onReintentar}
                                className="mt-4 flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
                            >
                                Volver a intentar
                            </button>
                        )}
                </div>
            </div>

            {/* Detalle de respuestas */}
            <div className="space-y-3">
                {resultado.resultados.map((r, i) => {

                    {/* Retroalimentación */ }
                    if (r.tipo === "feedback") {
                        return (
                            <div
                                key={r.pregunta_id}
                                className="rounded-2xl border border-zinc-200 bg-white p-4"
                            >
                                <div className="flex items-start justify-between gap-3">

                                    <p className="text-sm font-semibold text-zinc-800">
                                        {i + 1}. {r.texto}
                                    </p>

                                    <span className="shrink-0 flex items-center gap-1.5 text-[11px] font-medium text-zinc-400">
                                        <MessageCircle
                                            size={14}
                                            strokeWidth={1.8}
                                        />
                                        Retroalimentación
                                    </span>
                                </div>

                                <div className="mt-3 border-l-2 border-zinc-200 pl-3">
                                    <p className="text-xs leading-5 text-zinc-600 whitespace-pre-wrap">
                                        {r.respuesta_texto?.trim() ? (
                                            r.respuesta_texto
                                        ) : (
                                            <em className="text-zinc-400">
                                                Sin comentarios.
                                            </em>
                                        )}
                                    </p>
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div
                            key={r.pregunta_id}
                            className="rounded-2xl border border-zinc-200 bg-white p-4"
                        >

                            {/* Pregunta */}
                            <div className="flex items-start gap-3 mb-3">

                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[11px] font-bold text-zinc-500">
                                    {i + 1}
                                </span>

                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-zinc-800">
                                        {r.texto}
                                    </p>

                                    <p
                                        className={`mt-1 flex items-center gap-1.5 text-xs font-medium ${r.acertada
                                                ? "text-green-600"
                                                : "text-red-500"
                                            }`}
                                    >
                                        {r.acertada ? (
                                            <>
                                                <Check
                                                    size={14}
                                                    strokeWidth={2.5}
                                                />
                                                Respuesta correcta
                                            </>
                                        ) : (
                                            <>
                                                <X
                                                    size={14}
                                                    strokeWidth={2.5}
                                                />
                                                Respuesta incorrecta
                                            </>
                                        )}
                                    </p>
                                </div>
                            </div>

                            {/* Opciones */}
                            <ul className="space-y-1.5 ml-9">
                                {r.opciones.map((op) => {
                                    const sel =
                                        op.id === r.opcion_seleccionada;
                                    const cor = op.es_correcta;

                                    let cls =
                                        "text-zinc-500 bg-transparent";

                                    if (cor) {
                                        cls =
                                            "text-green-600 font-semibold bg-green-50 border border-green-200";
                                    } else if (sel) {
                                        cls =
                                            "text-red-500 font-medium bg-red-50 border border-red-200";
                                    }

                                    return (
                                        <li
                                            key={op.id}
                                            className={`flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-sm ${cls}`}
                                        >
                                            <span className="w-3 shrink-0 flex justify-center">
                                                {sel ? (
                                                    <Circle
                                                        size={10}
                                                        fill="currentColor"
                                                        strokeWidth={0}
                                                    />
                                                ) : (
                                                    <Circle
                                                        size={10}
                                                        strokeWidth={1.8}
                                                    />
                                                )}
                                            </span>

                                            <span className="flex-1 ml-2">
                                                {op.texto}
                                            </span>

                                            {cor && (
                                                <span className="shrink-0 flex items-center gap-1 rounded-md bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">
                                                    <Check
                                                        size={12}
                                                        strokeWidth={2.5}
                                                    />
                                                    Correcta
                                                </span>
                                            )}

                                            {sel && !cor && (
                                                <span className="shrink-0 flex items-center gap-1 rounded-md bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">
                                                    <X
                                                        size={11}
                                                        strokeWidth={2.5}
                                                    />
                                                    Tu respuesta
                                                </span>
                                            )}
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