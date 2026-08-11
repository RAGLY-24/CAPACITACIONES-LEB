import Button from "../../components/Buttons/Button";
import TextArea from "../../components/Fields/TextArea";
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
            <p className="text-md text-zinc-700 font-medium">{preguntas.length} preguntas — necesitas 70% para aprobar (máx. 2 intentos)</p>
            {preguntas.map((p, i) => (
                <div key={p.id} className="rounded-2xl border border-zinc-200 bg-white p-4">
                    <div className="flex items-start gap-3 mb-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[11px] font-bold text-zinc-500">
                            {i + 1}
                        </span>
                        <p className="text-sm font-semibold text-zinc-800">
                            {p.texto}
                        </p>
                        <p className="text-sm font-semibold text-zinc-800">
                            {p.tipo === "feedback" && <span className="text-xs font-normal text-gray-400">(opcional)</span>}
                        </p>
                    </div>

                    {p.tipo === "feedback" ? (
                        <TextArea
                            variant="secondary"
                            value={respuestas[p.id] || ""}
                            onChange={(e) => setRespuestas(r => ({ ...r, [p.id]: e.target.value }))}
                            maxLength={2000}
                            rows={3}
                            placeholder="Escribe tu comentario u opinión sobre este módulo..."
                        />

                    ) : (
                        <div className="space-y-2">
                            {p.opciones.map(op => (
                                <label key={op.id} className={`flex items-center gap-3 rounded-xl border cursor-pointer px-3 py-2 text-sm transition-colors ${respuestas[p.id] === op.id ? "border-blue-200 bg-blue-50  font-medium" : "border-zinc-200 bg-white text-gray-700 hover:border-zinc-200 hover:bg-zinc-50"}`}>
                                    <input type="radio" name={`p_${p.id}`} value={op.id} checked={respuestas[p.id] === op.id}
                                        onChange={() => setRespuestas(r => ({ ...r, [p.id]: op.id }))} className="accent-blue-500" />
                                    {op.texto}
                                </label>
                            ))}
                        </div>
                    )}
                </div>
            ))}
            <Button onClick={enviar} disabled={enviando} className="w-full">
                {enviando ? "Enviando..." : "Enviar Examen"}
            </Button>
        </div>
    );
}
