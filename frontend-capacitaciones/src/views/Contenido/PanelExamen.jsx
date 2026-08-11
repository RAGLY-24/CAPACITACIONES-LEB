import { useLockBodyScroll } from "../../hooks/useLockBodyScroll";
import { usePanelExamen } from "../../hooks/contenido/usePanelExamen";
import { EditorOpciones } from "./EditorOpciones";
import { Modal } from "../../components/Modal";
import Button from "../../components/Buttons/Button";
import Input from "../../components/Fields/Input";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef } from "react";
import Swal from "sweetalert2";

export function PanelExamen({ modulo, onCerrar }) {
    useLockBodyScroll();
    const preguntasContainerRef = useRef(null);
    const {
        preguntas,
        cargando,

        nueva,
        setNueva,
        cancelarNueva,

        npTipo,
        setNpTipo,
        npTexto,
        setNpTexto,
        npOps,
        setNpOps,
        setCorrectaNueva,
        guardarNueva,

        editId,
        setEditId,
        editTipo,
        editTexto,
        setEditTexto,
        editOps,
        setEditOps,
        setCorrectaEdit,

        iniciarEdicion,
        guardarEdicion,
        eliminar,
    } = usePanelExamen(modulo);

    const numOpcionMultiple = preguntas.filter(
        (p) => p.tipo !== "feedback"
    ).length;

    const listo = numOpcionMultiple >= 15;

    useEffect(() => {
        if (!nueva && preguntas.length > 0) {
            requestAnimationFrame(() => {
                preguntasContainerRef.current?.scrollTo({
                    top: preguntasContainerRef.current.scrollHeight,
                    behavior: "smooth",
                });
            });
        }
    }, [preguntas.length, nueva]);


    const handleClose = () => {
        if (nueva || editId) {
            Swal.fire({
                title: '¿Tienes cambios sin guardar!',
                text: "¿Estás seguro de que deseas salir y descartar todo?",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#6b7280',
                confirmButtonText: 'Sí, descartar',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    onCerrar()
                    return
                }
            });
            return;
        }
        onCerrar()
        return;
    }

    return (
        <Modal
            open={true}
            title={`Examen — ${modulo.nombre}`}
            size="xl"
            aspect="default"
            onClose={handleClose}
            contentRef={preguntasContainerRef}
            footer={
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleClose}
                >
                    Guardar
                </Button>
            }
        >
            <div className="space-y-4 ">
                {/* Información del examen */}
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-gray-500">
                        {preguntas.length} pregunta(s) · Aprueba con ≥70%
                    </p>

                    <span
                        className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold ${listo
                            ? "bg-green-50 text-green-700"
                            : "bg-amber-50 text-amber-700"
                            }`}
                    >
                        {listo
                            ? "Banco listo"
                            : "Banco incompleto"}
                    </span>
                </div>

                {/* Estado del banco */}
                {!cargando && (
                    <div
                        className={`rounded-xl border px-4 py-2.5 text-xs font-medium ${listo
                            ? "border-green-100 bg-green-50 text-green-700"
                            : "border-amber-100 bg-amber-50 text-amber-800"
                            }`}
                    >
                        <span className="font-bold">
                            {listo ? "✓" : "⚠"}
                        </span>{" "}
                        Banco de preguntas: {numOpcionMultiple} de 15
                        preguntas de opción múltiple mínimas.

                        {!listo && (
                            <span>
                                {" "}
                                Faltan {15 - numOpcionMultiple} para poder
                                generar el examen.
                            </span>
                        )}
                    </div>
                )}

                {/* Contenido */}
                {cargando && !preguntas ? (
                    <div className="flex items-center justify-center py-10">
                        <p className="text-sm text-gray-400">
                            Cargando...
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Sin preguntas */}
                        {preguntas.length === 0 && !nueva && (
                            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-10 text-center">
                                <p className="text-sm text-gray-400">
                                    Sin preguntas. Agrega la primera.
                                </p>
                            </div>
                        )}

                        {/* Preguntas existentes */}
                        {preguntas.map((p, idx) => (
                            <div
                                key={p.id}
                                className="rounded-xl border border-gray-200 bg-white p-4"
                            >
                                {editId === p.id ? (
                                    <div className="space-y-3">
                                        <Input
                                            name={`editar-pregunta-${p.id}`}
                                            value={editTexto}
                                            onChange={(e) =>
                                                setEditTexto(e.target.value)
                                            }
                                            placeholder="Escribe la pregunta..."
                                        />

                                        {editTipo === "feedback" ? (
                                            <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-400">
                                                Pregunta de retroalimentación:
                                                el operador responderá con
                                                texto libre, no se califica.
                                            </p>
                                        ) : (
                                            <EditorOpciones
                                                ops={editOps}
                                                setOps={setEditOps}
                                                setCorrecta={setCorrectaEdit}
                                            />
                                        )}

                                        <div className="flex flex-wrap gap-2 pt-1">
                                            <Button
                                                type="button"
                                                variant="primary"
                                                size="xs"
                                                onClick={guardarEdicion}
                                            >
                                                Guardar
                                            </Button>

                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="xs"
                                                onClick={() =>
                                                    setEditId(null)
                                                }
                                            >
                                                Cancelar
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-gray-800">
                                                    {idx + 1}. {p.texto}

                                                    {p.tipo === "feedback" && (
                                                        <span className="ml-2 inline-flex rounded-full bg-gray-100 px-2 py-0.5 align-middle text-[10px] font-medium text-gray-500">
                                                            Retroalimentación
                                                        </span>
                                                    )}
                                                </p>
                                            </div>

                                            <div className="flex shrink-0 gap-1">
                                                <Button
                                                    Icon={Pencil}
                                                    iconOnly
                                                    size="xs"
                                                    variant="ghost"
                                                    title="Editar"
                                                    onClick={() =>
                                                        iniciarEdicion(p)
                                                    }
                                                />
                                                <Button
                                                    Icon={Trash2}
                                                    iconOnly
                                                    size="xs"
                                                    variant="ghost"
                                                    title="Eliminar"
                                                    className="hover:text-red-500"
                                                    onClick={() =>
                                                        eliminar(p.id)
                                                    }
                                                />
                                            </div>
                                        </div>

                                        {p.tipo === "feedback" ? (
                                            <p className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-400">
                                                Respuesta de texto libre, no se
                                                califica.
                                            </p>
                                        ) : (
                                            <ul className="mt-3 space-y-1.5">
                                                {p.opciones.map((op) => (
                                                    <li
                                                        key={op.id}
                                                        className={`flex items-center gap-2 text-xs ${op.es_correcta
                                                            ? "font-semibold text-green-700"
                                                            : "text-gray-500"
                                                            }`}
                                                    >
                                                        <span
                                                            className={`h-2 w-2 shrink-0 rounded-full ${op.es_correcta
                                                                ? "bg-green-500"
                                                                : "bg-gray-300"
                                                                }`}
                                                        />

                                                        <span className="min-w-0">
                                                            {op.texto}
                                                        </span>

                                                        {op.es_correcta && (
                                                            <span className="shrink-0 rounded-full bg-green-50 px-1.5 py-0.5 text-[10px] font-medium text-green-700">
                                                                Correcta
                                                            </span>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </>
                                )}
                            </div>
                        ))}

                        {/* Nueva pregunta */}
                        {nueva && (
                            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                                <div className="mb-3 flex items-center justify-between gap-3">
                                    <p className="text-sm font-semibold text-gray-700">
                                        Nueva pregunta
                                    </p>

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="xs"
                                        onClick={cancelarNueva}
                                    >
                                        Cancelar
                                    </Button>
                                </div>

                                {/* Tipo */}
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                    <Button
                                        type="button"
                                        variant={
                                            npTipo === "opcion_multiple"
                                                ? "primary"
                                                : "outline"
                                        }
                                        size="sm"
                                        onClick={() =>
                                            setNpTipo("opcion_multiple")
                                        }
                                    >
                                        Opción múltiple
                                    </Button>

                                    <Button
                                        type="button"
                                        variant={
                                            npTipo === "feedback"
                                                ? "primary"
                                                : "outline"
                                        }
                                        size="sm"
                                        onClick={() =>
                                            setNpTipo("feedback")
                                        }
                                    >
                                        Retroalimentación
                                    </Button>
                                </div>

                                <div className="mt-3">
                                    <Input
                                        name="nueva-pregunta"
                                        value={npTexto}
                                        onChange={(e) =>
                                            setNpTexto(e.target.value)
                                        }
                                        placeholder="Escribe la pregunta aquí..."
                                    />
                                </div>

                                {npTipo === "feedback" ? (
                                    <p className="mt-3 rounded-lg bg-white px-3 py-2 text-xs text-gray-400">
                                        El operador responderá con texto libre;
                                        esta pregunta no se califica.
                                    </p>
                                ) : (
                                    <div className="mt-3">
                                        <EditorOpciones
                                            ops={npOps}
                                            setOps={setNpOps}
                                            setCorrecta={setCorrectaNueva}
                                        />
                                    </div>
                                )}

                                <div className="mt-3 flex justify-end">
                                    <Button
                                        type="button"
                                        variant="primary"
                                        size="sm"
                                        onClick={guardarNueva}
                                    >
                                        Guardar pregunta
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Agregar pregunta */}
                        {!nueva && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setNueva(true)}
                                Icon={Plus}
                                className="w-full border-dashed text-gray-500 hover:border-brand-primary hover:text-brand-primary"
                            >
                                Agregar pregunta
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
}
