import { useState } from "react";
import Button from "../../components/Buttons/Button";
import { Modal } from "../../components/Modal";
import Input from "../../components/Fields/Input";
import TextArea from "../../components/Fields/TextArea";

export default function ProfileFormModal({
    open, // Recibe el objeto state del hook de overlay en lugar de open/onClose sueltos
    user,
    onSubmit,
    onClose
}) {

    const [perfilForm, setPerfilForm] = useState({ name: user.name || '', lastname: user.lastname || '', descripcion: user.descripcion || '' });

    const [fotoFile, setFotoFile] = useState(null);
    const [fotoPreview, setFotoPreview] = useState(user.foto_url || null);


    const handleSumbit = async (e) => {
        e.preventDefault()
        const formData = new FormData();
        formData.append('name', perfilForm.name);
        formData.append('lastname', perfilForm.lastname || '');
        formData.append('descripcion', perfilForm.descripcion || '');
        if (fotoFile) formData.append('foto', fotoFile);

        await onSubmit({ mode: "edit", payload: formData, type: "profile" });
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

    if (!user) return
    return (
        <Modal
            open={open}
            title="Editar perfil"
            size="sm"
            aspect="default"
            onClose={onClose}
            footer={
                <>
                    <Button variant="outline" onClick={onClose} type="button">
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
                    <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-brand-primary text-white shadow-md">
                        {fotoPreview ? (
                            <img src={fotoPreview} alt="Vista previa" className="h-full w-full object-cover" />
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-12 w-12">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                            </svg>
                        )}
                    </div>
                    <label className="cursor-pointer text-sm font-semibold text-blue-500  hover:underline">
                        Cambiar foto
                        <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFotoChange} className="hidden" />
                    </label>
                </div>
                <Input label="Nombre" isRequired name="name" value={perfilForm.name} onChange={handlePerfilChange} />
                <Input label="Apellido" name="lastname" value={perfilForm.lastname} onChange={handlePerfilChange} />
                <TextArea label="Descripción" name="descripcion" value={perfilForm.descripcion} onChange={handlePerfilChange} maxLength={500} placeholder="Cuéntanos algo sobre ti..." rows={3} />
            </form>
        </Modal>
    );
}
