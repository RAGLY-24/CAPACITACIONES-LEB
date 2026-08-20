import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Modal } from "../../components/Modal";
import Button from "../../components/Buttons/Button";
import Input from "../../components/Fields/Input";

export default function VideoFormModal({
    open,
    mode,
    video,
    onSave,
    onClose,
}) {
    const initialState = {
        titulo: "",
        url: "",
    };

    const [formData, setFormData] = useState(initialState);

    useEffect(() => {
        if (mode === "editar" && video) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setFormData({
                titulo: video.titulo || "",
                url: video.url || "",
            });
        } else {
            setFormData(initialState);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, video, open]);

    const handleChange = ({ target: { name, value } }) => {
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const guardarVideo = async (e) => {
        e.preventDefault();

        if (!formData.titulo || !formData.url) {
            Swal.fire({
                icon: "warning",
                title: "Faltan datos",
                text: "Completa el título del video y la URL.",
                confirmButtonColor: "#802907",
            });
            return;
        }
        const youtubeShortRegex = /^https?:\/\/(?:www\.)?youtube\.com\/shorts\/[A-Za-z0-9_-]+(?:\?.*)?$/;

        if (!youtubeShortRegex.test(formData.url.trim())) {
            Swal.fire({
                icon: "warning",
                title: "Enlace Incorrecto",
                text: "El enlace debe corresponder a un Short de YouTube.",
                confirmButtonColor: "#802907",
            });
            return;
        }

        Swal.fire({
            title: mode === "crear" ? "Agregando video..." : "Guardando video...",
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
        });

        try {
            const dataToSend = {
                titulo: formData.titulo,
                url: formData.url,
            };

            await onSave(dataToSend);

            Swal.fire({
                icon: "success",
                title: mode === "crear" ? "Agregado" : "Guardado",
                text:
                    mode === "crear"
                        ? "El video se agregó correctamente."
                        : "El video se actualizó correctamente.",
                confirmButtonColor: "#802907",
            });

            onClose();
        } catch (err) {
            console.error(err);

            Swal.fire({
                icon: "error",
                title: "Error",
                text: "No se pudo guardar el video.",
                confirmButtonColor: "#802907",
            });
        }
    };

    return (
        <Modal
            open={open}
            title={mode === "crear" ? "Agregar video" : "Editar video"}
            size="xl"
            aspect="default"
            onClose={onClose}
            footer={
                <>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        type="button"
                    >
                        Cancelar
                    </Button>

                    <Button type="submit" form="video-form">
                        {mode === "crear" ? "Agregar" : "Guardar cambios"}
                    </Button>
                </>
            }
        >
            <form
                id="video-form"
                onSubmit={guardarVideo}
                className="space-y-5"
            >
                <Input
                    isRequired
                    name="titulo"
                    label="Título del video"
                    placeholder="Título del video..."
                    value={formData.titulo}
                    onChange={handleChange}
                />

                <Input
                    isRequired
                    name="url"
                    type="url"
                    label="URL del video"
                    placeholder="https://www.youtube.com/shorts/......"
                    value={formData.url}
                    onChange={handleChange}
                />
            </form>
        </Modal>
    );
}