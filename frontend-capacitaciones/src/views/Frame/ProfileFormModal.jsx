import { useState } from "react";
import Button from "../../components/Buttons/Button";
import { Modal } from "../../components/Modal";
import Input from "../../components/Fields/Input";
import TextArea from "../../components/Fields/TextArea";
import { Avatar } from "../../components/Avatar/Avatar";

export default function ProfileFormModal({
    open,
    user,
    onSubmit,
    onClose
}) {
    const [perfilForm, setPerfilForm] = useState({
        name: user?.name || '',
        lastname: user?.lastname || '',
        descripcion: user?.descripcion || ''
    });

    const [fotoFile, setFotoFile] = useState(null);
    const [fotoPreview, setFotoPreview] = useState(user?.foto_url || null);

    // NUEVO: Función que limpia los estados y luego cierra el modal
    const handleClose = () => {
        setPerfilForm({
            name: user?.name || '',
            lastname: user?.lastname || '',
            descripcion: user?.descripcion || ''
        });
        setFotoFile(null);
        setFotoPreview(user?.foto_url || null);

        // Llamamos al onClose original que viene por props
        onClose();
    };

    const handleSumbit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('name', perfilForm.name);
        formData.append('lastname', perfilForm.lastname || '');
        formData.append('descripcion', perfilForm.descripcion || '');
        if (fotoFile) formData.append('foto', fotoFile);

        await onSubmit({ mode: "edit", payload: formData, type: "profile" });
        // Opcional: Si tu onSubmit no cierra el modal automáticamente desde el componente padre, 
        // podrías llamar a handleClose() aquí también.
    }

    const handlePerfilChange = (e) => {
        const { name, value } = e.target;
        setPerfilForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleFotoChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFotoFile(file);
        setFotoPreview(URL.createObjectURL(file));
    };

    if (!user) return null;

    return (
        <Modal
            open={open}
            title="Editar perfil"
            size="sm"
            aspect="default"
            onClose={handleClose} // Reemplazamos onClose por handleClose
            footer={
                <>
                    {/* Reemplazamos onClose por handleClose en el botón de Cancelar */}
                    <Button variant="outline" onClick={handleClose} type="button">
                        Cancelar
                    </Button>
                    <Button type="submit" form="form-profile">
                        Guardar
                    </Button>
                </>
            }
        >
            <form id="form-profile" onSubmit={handleSumbit} className="space-y-5">
                {/* Foto de perfil */}
                <div className="flex flex-col items-center gap-3">
                    <Avatar src={fotoPreview} size="2xl" />
                    <label className="cursor-pointer text-sm font-semibold text-blue-500 hover:underline">
                        Cambiar foto
                        <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={handleFotoChange}
                            className="hidden"
                        />
                    </label>
                </div>
                <Input
                    label="Nombre"
                    isRequired
                    name="name"
                    value={perfilForm.name}
                    onChange={handlePerfilChange}
                />
                <Input
                    label="Apellido"
                    name="lastname"
                    value={perfilForm.lastname}
                    onChange={handlePerfilChange}
                />
                <TextArea
                    label="Descripción"
                    name="descripcion"
                    value={perfilForm.descripcion}
                    onChange={handlePerfilChange}
                    maxLength={500}
                    placeholder="Cuéntanos algo sobre ti..."
                    rows={3}
                />
            </form>
        </Modal>
    );
}