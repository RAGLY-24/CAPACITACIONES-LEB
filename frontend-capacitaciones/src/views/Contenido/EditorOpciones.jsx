import { Ico } from "./icons";

// Componente fuera de PanelExamen para evitar pérdida de foco al escribir.
export function EditorOpciones({ ops, setOps, setCorrecta }) {
    return (
        <div className="space-y-2 mt-2">
            {ops.map((op, i) => (
                <div key={i} className="flex items-center gap-2">
                    <input
                        type="radio"
                        checked={op.es_correcta}
                        onChange={() => setCorrecta(i)}
                        className="accent-green-600 shrink-0"
                        title="Respuesta correcta"
                    />
                    <input
                        value={op.texto}
                        onChange={e => {
                            const val = e.target.value;
                            setOps(o => { const c = [...o]; c[i] = { ...c[i], texto: val }; return c; });
                        }}
                        placeholder={`Opción ${i + 1}`}
                        className="flex-1 rounded border border-gray-300 p-1.5 text-sm focus:outline-none focus:border-[#802907]"
                    />
                    {ops.length > 2 && (
                        <button
                            type="button"
                            onClick={() => setOps(o => o.filter((_, idx) => idx !== i))}
                            className="text-red-400 hover:text-red-600 shrink-0"
                        >
                            {Ico.trash}
                        </button>
                    )}
                </div>
            ))}
            <p className="text-xs text-gray-400">El radio seleccionado = respuesta correcta</p>
            {ops.length < 5 && (
                <button
                    type="button"
                    onClick={() => setOps(o => [...o, { texto: "", es_correcta: false }])}
                    className="text-xs rounded border px-2 py-1 text-blue-600 hover:bg-blue-50"
                >
                    + Agregar opción
                </button>
            )}
        </div>
    );
}
