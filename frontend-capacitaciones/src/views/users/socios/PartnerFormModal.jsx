import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Modal } from "../../../components/Modal";
import Button from "../../../components/Buttons/Button";
import Input from "../../../components/Fields/Input";
import Select from "../../../components/Fields/Select";

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
            // El teléfono llega oculto desde el backend (ej. xxxxxxxx32), así que
            // el campo inicia vacío: si no se escribe uno nuevo, no se modifica.
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setFormData({ nombre: partner.nombre || "", telefono: "", correo: partner.correo || "", estado: partner.estado || "Activo" });

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

        const telefono = formData.telefono.trim();

        if (telefono && !/^\d{10}$/.test(telefono)) {
            setErroresForm({
                telefono: "Ingrese un número de teléfono válido de 10 dígitos."
            });
            return;
        }

        if (!formData.correo.trim()) {
            setErroresForm("Ingrese un correo para el socio.");
            return;
        }

        const payload = {
            nombre: formData.nombre.trim(),
            correo: formData.correo.trim(),
            estado: formData.estado,
        };
        if (telefono) {
            payload.telefono = telefono;
        } else if (mode === "create") {
            payload.telefono = null;
        }
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
                    <>
                        <Button variant="outline" onClick={handleClose} type="button">
                            Cancelar
                        </Button>
                        <Button type="submit" form="partners-form">
                            {mode === "create" ? "Crear" : "Guardar"}
                        </Button>
                    </>
                </>
            }
        >
            <form id="partners-form" onSubmit={guardarUsuario} className="grid grid-rows gap-4">
                <Input
                    name="nombre"
                    label="Nombre"
                    placeholder="Ej: Juan Pérez"
                    isRequired
                    value={formData.nombre}
                    onChange={handleChange}
                    error={erroresForm.nombre}
                />

                <Input
                    name="telefono"
                    label="Número de teléfono"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                    maxLength={10}
                    placeholder={
                        mode === "edit" && partner?.telefono
                            ? `Actual: ${partner.telefono} (dejar vacío para no cambiar)`
                            : "Ej: 5551234567"
                    }
                    value={formData.telefono}
                    onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                        handleChange({
                            target: {
                                name: "telefono",
                                value,
                            },
                        });
                    }}
                    error={erroresForm.telefono}
                />

                <Input
                    name="correo"
                    label="Correo"
                    type="email"
                    placeholder="Ej: usuario@empresa.com"
                    isRequired
                    value={formData.correo}
                    onChange={handleChange}
                    error={erroresForm.correo}
                />

                <Select
                    label="Estado"
                    name="estado"
                    value={formData.estado}
                    onChange={handleChange}
                    options={[
                        { value: "Activo", label: "Activo" },
                        { value: "Inactivo", label: "Inactivo" },
                    ]}
                />
            </form>
        </Modal>
    );
}