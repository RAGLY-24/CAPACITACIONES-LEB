import { useEffect, useState } from "react";
import Swal from "sweetalert2";

export default function NewsFormModal({
    open,
    mode,
    noticia,
    onClose,
    onSave,
}) {
    const initialState = {
        title: "",
        body: "",
        evidence: "",
        files: [],
    };

    const [formData, setFormData] = useState(initialState);

    useEffect(() => {
        if (mode === "editar" && noticia) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setFormData({
                title: noticia.title,
                body: noticia.body,
                evidence: noticia.evidence || "",
                files: [],
            });
        } else {
            setFormData(initialState);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, noticia, open]);

    const handleChange = ({ target: { name, value } }) => {
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleFileChange = ({ target: { files } }) => {
        setFormData((prev) => ({
            ...prev,
            files: Array.from(files),
        }));
    };

    const guardarNoticia = async (e) => {
        e.preventDefault();

        if (!formData.title || !formData.body) {
            Swal.fire({
                icon: "warning",
                title: "Faltan datos",
                text: "Completa el título y el cuerpo.",
                confirmButtonColor: "#802907",
            });
            return;
        }

        Swal.fire({
            title: "Guardando noticia...",
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
        });

        try {
            const dataToSend = new FormData();

            dataToSend.append("title", formData.title);
            dataToSend.append("body", formData.body);

            if (formData.evidence) {
                dataToSend.append("evidence", formData.evidence);
            }

            formData.files.forEach((file) => {
                dataToSend.append("files[]", file);
            });

            await onSave(dataToSend);

            Swal.fire({
                icon: "success",
                title: mode === "crear" ? "Publicada" : "Actualizada",
                confirmButtonColor: "#802907",
            });

            onClose();
        } catch (err) {
            console.error(err);

            Swal.fire({
                icon: "error",
                title: "Error",
                text: "No se pudo guardar la noticia.",
                confirmButtonColor: "#802907",
            });
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm">
            <div className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">

                {/* Header */}
                <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-5">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="text-xl font-semibold text-gray-900">
                                {mode === "crear"
                                    ? "Publicar nueva noticia"
                                    : "Editar noticia"}
                            </h3>

                            <p className="mt-1 text-sm text-gray-500">
                                Completa la información para publicar la noticia.
                            </p>
                        </div>

                        <button
                            onClick={onClose}
                            className="rounded-md p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                        >
                            <svg
                                className="h-5 w-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Contenido scrolleable */}
                <form
                    onSubmit={guardarNoticia}
                    className="flex-1 overflow-y-auto p-6"
                >
                    <div className="space-y-5">

                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Titular
                            </label>

                            <input
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="Titular llamativo..."
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-red-800 focus:outline-none focus:ring-1 focus:ring-red-800"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Desarrollo de la noticia
                            </label>

                            <textarea
                                name="body"
                                rows={5}
                                value={formData.body}
                                onChange={handleChange}
                                placeholder="Escribe todo el contenido aquí..."
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-red-800 focus:outline-none focus:ring-1 focus:ring-red-800"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Notas / Evidencia <span className="text-gray-400">(Opcional)</span>
                            </label>

                            <textarea
                                name="evidence"
                                rows={2}
                                value={formData.evidence}
                                onChange={handleChange}
                                placeholder="Links o información adicional..."
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-red-800 focus:outline-none focus:ring-1 focus:ring-red-800"
                            />
                        </div>

                        <div className="">
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Adjuntar archivos
                            </label>

                            <input
                                type="file"
                                name="files"
                                multiple
                                accept=".jpg,.jpeg,.png,.mp4"
                                onChange={handleFileChange}
                                className="
                                            w-full text-sm text-gray-600
                                            file:mr-4
                                            file:rounded-lg
                                            file:border-0
                                            file:bg-red-900
                                            file:px-4
                                            file:py-2
                                            file:font-medium
                                            file:text-white
                                            hover:file:bg-red-800
                                            cursor-pointer
                                        "
                            />

                            {formData.files.length > 0 && (
                                <p className="mt-2 text-sm text-zinc-600">
                                    {formData.files.length} archivo(s) seleccionado(s).
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Footer fijo */}
                    <div className="sticky bottom-0 mt-6 flex justify-end gap-3 border-t border-gray-200 bg-white pt-5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            className="rounded-lg bg-red-900 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-red-800"
                        >
                            {mode === "crear"
                                ? "Publicar"
                                : "Guardar cambios"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}