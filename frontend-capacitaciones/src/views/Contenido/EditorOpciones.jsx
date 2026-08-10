import { Plus, Trash2 } from "lucide-react";
import Button from "../../components/Buttons/Button";
import Input from "../../components/Fields/Input";

// Componente fuera de PanelExamen para evitar pérdida de foco al escribir.
export function EditorOpciones({ ops, setOps, setCorrecta }) {
    return (
        <div className="space-y-3">
            <div className="space-y-2">
                {ops.map((op, i) => (
                    <div
                        key={i}
                        className="flex items-center gap-2"
                    >
                        {/* Respuesta correcta */}
                        <input
                            type="radio"
                            checked={op.es_correcta}
                            onChange={() => setCorrecta(i)}
                            className="h-4 w-4 shrink-0 accent-green-600"
                            title="Respuesta correcta"
                        />

                        <div className="min-w-0 flex-1">
                            <Input
                                name={`opcion-${i}`}
                                value={op.texto}
                                onChange={(e) => {
                                    const val = e.target.value;

                                    setOps((o) => {
                                        const copia = [...o];

                                        copia[i] = {
                                            ...copia[i],
                                            texto: val,
                                        };

                                        return copia;
                                    });
                                }}
                                placeholder={`Opción ${i + 1}`}
                                size="sm"
                            />
                        </div>

                        {ops.length > 2 && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="xs"
                                Icon={Trash2}
                                iconOnly
                                onClick={() =>
                                    setOps((o) =>
                                        o.filter(
                                            (_, idx) => idx !== i
                                        )
                                    )
                                }
                                className="shrink-0 text-red-400 hover:bg-red-50 hover:text-red-500"
                                title="Eliminar opción"
                            >
                            </Button>
                        )}
                    </div>
                ))}
            </div>

            <div className="flex flex-col items-start gap-4">
                <p className="text-xs text-gray-400">
                    Selecciona el círculo para marcar la respuesta correcta.
                </p>

                {ops.length < 5 && (
                    <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        Icon={Plus}
                        onClick={() =>
                            setOps((o) => [
                                ...o,
                                {
                                    texto: "",
                                    es_correcta: false,
                                },
                            ])
                        }
                    >
                        Agregar opción
                    </Button>
                )}
            </div>
        </div>
    );
}