import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Modal } from "../../components/Modal";

export default function NewsFormModal({
    state, // Recibe el objeto state del hook de overlay en lugar de open/onClose sueltos
    mode,
    noticia,
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
    }, [mode, noticia, state.isOpen]);

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

            state.close();
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

    return (
        <Modal
            state={state}
            title={mode === "crear" ? "Publicar nueva noticia" : "Editar noticia"}
            size="xl"
            aspect="default"
            footer={
                <>
                    <button
                        type="button"
                        onClick={state.close}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 cursor-pointer"
                    >
                        Cancelar
                    </button>

                    <button
                        type="submit"
                        form="news-form"
                        className="rounded-lg bg-red-900 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-red-800 cursor-pointer"
                    >
                        {mode === "crear" ? "Publicar" : "Guardar cambios"}
                    </button>
                </>
            }
        >
            <form id="news-form" onSubmit={guardarNoticia} className="space-y-5">
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

                <div>
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
            </form>
        </Modal>
    );
}