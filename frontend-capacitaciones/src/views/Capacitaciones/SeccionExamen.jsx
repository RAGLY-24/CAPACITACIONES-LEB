import { useExamenModulo } from "../../hooks/capacitaciones/useExamenModulo";
import { RetroalimentacionExamen } from "./RetroalimentacionExamen";

export function SeccionExamen({ moduloId, estadoInicial, onCalificado, onRepasarContenido }) {
    const {
        preguntas, cargando, respuestas, setRespuestas, enviando, resultado,
        sinExamen, sinExamenMensaje, bloqueado, intentosRestantes, cargarExamenBlanco, enviar,
    } = useExamenModulo({ moduloId, estadoInicial, onCalificado });

    if (cargando) return <p className="text-center text-sm text-gray-400 py-6">Cargando examen...</p>;
    if (sinExamen) return <p className="text-center text-sm text-gray-400 py-6">{sinExamenMensaje || "Este módulo aún no tiene examen configurado."}</p>;

    if (bloqueado) {
        return (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
                <p className="text-sm font-semibold text-amber-800">🔒 Agotaste tus 2 intentos.</p>
                <p className="text-xs text-amber-700 mt-1">Repasa el contenido (PDF o video) para desbloquear el examen de nuevo.</p>
                {onRepasarContenido && (
                    <button onClick={onRepasarContenido} className="mt-3 rounded-lg border border-amber-300 px-4 py-1.5 text-sm text-amber-800 hover:bg-amber-100">
                        Ir al contenido
                    </button>
                )}
            </div>
        );
    }

    if (resultado) {
        return (
            <RetroalimentacionExamen
                resultado={resultado}
                intentosRestantes={intentosRestantes}
                onReintentar={cargarExamenBlanco}
                onRepasarContenido={onRepasarContenido}
            />
        );
    }

    return (
        <div className="space-y-5">
            <p className="text-sm text-gray-600 font-medium">{preguntas.length} pregunta(s) — necesitas 70% para aprobar (máx. 2 intentos)</p>
            {preguntas.map((p, i) => (
                <div key={p.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <p className="text-sm font-semibold text-gray-800 mb-3">
                        {i + 1}. {p.texto}
                        {p.tipo === "feedback" && <span className="ml-2 text-xs font-normal text-gray-400">(opcional)</span>}
                    </p>
                    {p.tipo === "feedback" ? (
                        <textarea
                            value={respuestas[p.id] || ""}
                            onChange={(e) => setRespuestas(r => ({ ...r, [p.id]: e.target.value }))}
                            maxLength={2000}
                            rows={3}
                            placeholder="Escribe tu comentario u opinión sobre este módulo..."
                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#802907] focus:outline-none"
                        />
                    ) : (
                        <div className="space-y-2">
                            {p.opciones.map(op => (
                                <label key={op.id} className={`flex items-center gap-3 rounded-lg border cursor-pointer px-3 py-2 text-sm transition-colors ${respuestas[p.id] === op.id ? "border-[#802907] bg-brand-primary/5 text-[#802907] font-medium" : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"}`}>
                                    <input type="radio" name={`p_${p.id}`} value={op.id} checked={respuestas[p.id] === op.id}
                                        onChange={() => setRespuestas(r => ({ ...r, [p.id]: op.id }))} className="accent-[#802907]" />
                                    {op.texto}
                                </label>
                            ))}
                        </div>
                    )}
                </div>
            ))}
            <button onClick={enviar} disabled={enviando}
                className="w-full rounded-lg bg-brand-primary py-3 font-semibold text-white hover:bg-[#5a1b04] disabled:opacity-60">
                {enviando ? "Enviando..." : "Enviar Examen"}
            </button>
        </div>
    );
}
