import { useLockBodyScroll } from "../../hooks/useLockBodyScroll";
import { useModalModulo } from "../../hooks/contenido/useModalModulo";
import { Ico } from "./icons";
import Button from "../../components/Buttons/Button";
import { Modal } from "../../components/Modal";
import Input from "../../components/Fields/Input";
import Select from "../../components/Fields/Select";
import TextArea from "../../components/Fields/TextArea";


export function ModalModulo({
    tipo,
    seccionId,
    datos,
    modulos,
    onGuardar,
    onAbrirLienzo,
    onCerrar,
}) {
    useLockBodyScroll();

    const {
        form,
        preview,
        errs,
        saving,
        tienePresentacion,
        handle,
        quitarImagen,
        submit,
    } = useModalModulo({
        tipo,
        seccionId,
        datos,
        onGuardar,
        onAbrirLienzo,
    });

    console.log(errs)
    const estadoOptions = [
        {
            value: "Activo",
            label: "Activo",
        },
        {
            value: "Inactivo",
            label: "Inactivo",
        },
    ];

    const prerequisiteOptions = (modulos || [])
        .filter((m) => m.id !== datos?.id)
        .map((mod) => ({
            value: mod.id,
            label: mod.nombre,
        }));

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

                    <Button
                        type="submit"
                        form="form-modulo"
                        variant="primary"
                        isPending={saving}
                    >
                        {tipo === "crear" ? "Crear Módulo" : "Guardar"}
                    </Button>
                </>
            }
        >
            <form
                id="form-modulo"
                onSubmit={submit}
                className="space-y-5"
            >
                {/* Imagen de portada */}
                <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                        Imagen de portada
                    </label>

                    <label className="flex min-h-35 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-gray-300 transition-colors hover:border-brand-primary/50">
                        {preview ? (
                            <img
                                src={preview}
                                alt="Portada"
                                className="h-36 w-full object-cover"
                            />
                        ) : (
                            <div className="flex flex-col items-center gap-2 py-8 text-gray-400">
                                {Ico.img}

                                <span className="text-xs">
                                    Haz clic para subir imagen
                                </span>

                                <span className="text-[11px] text-gray-300">
                                    JPG, PNG o WEBP · máx. 5 MB
                                </span>
                            </div>
                        )}

                        <input
                            type="file"
                            name="imagen"
                            accept=".jpg,.jpeg,.png,.webp"
                            onChange={handle}
                            className="hidden"
                        />
                    </label>

                    {preview && (
                        <div className="flex w-full items-center justify-center">
                            <Button
                                type="button"
                                variant="link"
                                size="xs"
                                onClick={quitarImagen}
                                className="mt-1 text-red-500"
                            >
                                Quitar imagen
                            </Button>
                        </div>
                    )}

                    {errs.imagen && (
                        <p className="mt-1 text-xs text-red-500">
                            {errs.imagen}
                        </p>
                    )}
                </div>

                {/* Nombre */}
                <div>
                    <Input
                        name="nombre"
                        label="Nombre"
                        placeholder="Ej: Uso correcto de EPP"
                        isRequired
                        value={form.nombre}
                        onChange={handle}
                        error={errs.nombre}
                        maxLength={150}
                    />

                    <p className="mt-0.5 text-xs text-gray-400">
                        {form.nombre.length}/150
                    </p>
                </div>

                {/* Descripción */}
                <div>
                    <TextArea
                        name="descripcion"
                        label="Descripción"
                        placeholder="Objetivos y contenido del módulo..."
                        isRequired
                        rows={4}
                        maxLength={2000}
                        value={form.descripcion}
                        onChange={handle}
                        error={errs.descripcion}
                    />

                    <p className="mt-0.5 text-xs text-gray-400">
                        {form.descripcion.length}/2000
                    </p>
                </div>


                {/* Estado */}
                <Select
                    label="Estado"
                    name="estado"
                    value={form.estado}
                    onChange={handle}
                    options={estadoOptions}
                />

                {/* Prerrequisito */}
                <div>
                    <Select
                        label="Módulo requerido antes de este"
                        name="prerequisite_module_id"
                        value={form.prerequisite_module_id || ""}
                        onChange={handle}
                        options={prerequisiteOptions}
                        placeholder="Ninguno"
                    />

                    <p className="mt-1 text-xs text-gray-400">
                        Indica qué contenido debe completarse previamente.
                    </p>
                </div>

                {/* Contenido */}
                <div>
                    <div className="mb-2">
                        <label className="block text-sm font-semibold text-gray-700">
                            Contenido del módulo
                        </label>

                        <p className="mt-0.5 text-xs text-gray-400">
                            Elige una de las dos opciones para el contenido
                            que verá el empleado.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 ">
                        {/* Archivo */}
                        <label className="flex min-h-27.5 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 bg-white px-3 py-4 text-center transition-colors hover:border-zinc-400 hover:bg-zinc-50">
                            <span className="text-gray-400">
                                {Ico.file}
                            </span>

                            <span className="line-clamp-2 text-xs font-medium text-gray-600">
                                {form.archivo
                                    ? form.archivo.name
                                    : "Subir PDF / Video"}
                            </span>

                            <span className="text-[11px] text-gray-400">
                                PDF, MP4 o WEBM
                            </span>

                            <input
                                type="file"
                                name="archivo"
                                accept=".pdf,.mp4,.webm"
                                onChange={handle}
                                className="hidden"
                            />
                        </label>
                    </div>

                    {datos?.file_type &&
                        datos.file_type !== "presentacion" &&
                        !form.archivo && (
                            <p className="mt-1.5 text-xs text-gray-400">
                                Actual:{" "}
                                <strong>
                                    {datos.file_type.toUpperCase()}
                                </strong>
                            </p>
                        )}

                    {tienePresentacion && (
                        <p className="mt-1.5 text-xs text-gray-400">
                            Este módulo ya tiene una presentación diseñada.
                        </p>
                    )}

                    {!datos?.file_type && (
                        <p className="mt-1.5 text-xs text-gray-400">
                            Este módulo todavía no tiene contenido.
                        </p>
                    )}

                    {errs.archivo && (
                        <p className="mt-1 text-xs text-red-500">
                            {errs.archivo}
                        </p>
                    )}
                </div>
            </form>
        </Modal>
    );
}
