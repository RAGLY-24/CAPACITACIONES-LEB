import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Modal } from "../../../components/Modal";

export default function PartnerFormModal({
    open, // Recibe el objeto state del hook de overlay en lugar de open/onClose sueltos
    mode,
    partner,
    onSave,
    onClose
}) {

    const [erroresForm, setErroresForm] = useState({});

    const handleClose = () => {
        if (isDirty) {
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
                    onClose()
                    setIsDirty(false)
                }
            });
            return;
        }
        onClose()
        setIsDirty(false)
    }

    const initialState = { nombre: "", telefono: "", correo: "", estado: "Activo" };

    const [formData, setFormData] = useState(initialState);

    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        if (mode === "edit" && partner) {
            console.log(partner)
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setFormData({ nombre: partner.nombre || "", telefono: partner.telefono || "", correo: partner.correo || "", estado: partner.estado || "Activo" });

        } else {
            setFormData(initialState);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, partner, open]);

    const handleChange = ({ target: { name, value } }) => {
        setIsDirty(true)
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        if (erroresForm) setErroresForm("");
    };

    const guardarUsuario = async (e) => {
        e.preventDefault();
        if (!formData.nombre.trim()) {
            setErroresForm("Ingrese un nombre para el socio.");
            return;
        }
        if (!formData.telefono.trim()) {
            setErroresForm("Ingrese un número de contacto para el socio.");
            return;
        }
        if (!formData.correo.trim()) {
            setErroresForm("Ingrese un correo para el socio.");
            return;
        }

        const payload = {
            nombre: formData.nombre.trim(),
            telefono: formData.telefono.trim(),
            correo: formData.correo.trim(),
            estado: formData.estado,
        };
        if (partner && partner.id) {
            payload["id"] = partner.id
        }
        await onSave({ mode, payload: payload, type: "partner" });
    };

    return (
        <Modal
            open={open}
            title={mode === "create" ? "Crear nuevo socio" : "Editar socio"}
            size="xl"
            aspect="default"
            onClose={handleClose}
            footer={
                <>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 cursor-pointer"
                    >
                        Cancelar
                    </button>

                    <button
                        type="submit"
                        form="partners-form"
                        className="rounded-lg bg-red-900 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-red-800 cursor-pointer"
                    >
                        {mode === "create" ? "Crear" : "Guardar cambios"}
                    </button>
                </>
            }
        >
            <form id="partners-form" onSubmit={guardarUsuario} className="grid grid-rows gap-4">
                <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">Nombre <span className="text-red-500">*</span></label>
                    <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} className="w-full rounded-md border border-gray-300 p-2 focus:border-[#802907] focus:outline-none" />
                </div>
                <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">Número <span className="text-red-500">*</span></label>
                    <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} className="w-full rounded-md border border-gray-300 p-2 focus:border-[#802907] focus:outline-none" />
                </div>
                <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">Correo <span className="text-red-500">*</span></label>
                    <input type="email" name="correo" value={formData.correo} onChange={handleChange} className="w-full rounded-md border border-gray-300 p-2 focus:border-[#802907] focus:outline-none" />
                </div>
                <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">Estado</label>
                    <select name="estado" value={formData.estado} onChange={handleChange} className="w-full h-11 rounded-md border border-gray-300 p-2 focus:border-[#802907] focus:outline-none">
                        <option value="Activo">Activo</option>
                        <option value="Inactivo">Inactivo</option>
                    </select>
                </div>
            </form>
        </Modal>
    );
}