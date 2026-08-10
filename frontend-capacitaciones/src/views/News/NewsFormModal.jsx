import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Modal } from "../../components/Modal";
import Button from "../../components/Buttons/Button";
import Input from "../../components/Fields/Input";
import TextArea from "../../components/Fields/TextArea";

export default function NewsFormModal({
    open, // Recibe el objeto state del hook de overlay en lugar de open/onClose sueltos
    mode,
    noticia,
    onSave,
    onClose
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

            onClose()
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
            open={open}
            title={mode === "crear" ? "Publicar nueva noticia" : "Editar noticia"}
            size="xl"
            aspect="default"
            onClose={onClose}
            footer={
                <>
                    <Button variant="outline" onClick={onClose} type="button">
                        Cancelar
                    </Button>
                    <Button type="submit" form="news-form">
                        {mode === "crear" ? "Publicar" : "Guardar cambios"}
                    </Button>
                </>
            }
        >
            <form id="news-form" onSubmit={guardarNoticia} className="space-y-5">
                <Input isRequired   name="title" label="Titular" placeholder="Titular llamativo..." value={formData.title} onChange={handleChange} />
                <TextArea isRequired  label="Desarrollo de la noticia" name="body" rows={5} value={formData.body} onChange={handleChange} placeholder="Escribe el desarrollo de la nota..." />
                <TextArea label="Notas / Evidencia" name="evidence" rows={3} value={formData.evidence} onChange={handleChange} placeholder="Links o información adicional..." />
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
                            file:bg-brand-primary
                            file:px-4
                            file:py-2
                            file:font-medium
                            file:text-white
                            hover:file:bg-brand-primary/80
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