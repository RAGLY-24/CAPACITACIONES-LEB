import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Modal } from "../../../components/Modal";
import { PERMISSION_CATALOG, emptyPermissions } from "../../../utils/permissions";
import Button from "../../../components/Buttons/Button";
import Checkbox from "../../../components/Fields/Checkbox";

export default function PositionPermissionsModal({
    open,
    position,
    onSubmit,
    onClose
}) {
    const [permissions, setPermissions] = useState(emptyPermissions());

    useEffect(() => {
        if (position) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setPermissions({ ...emptyPermissions(), ...(position.default_permissions || {}) });
        }
    }, [position, open]);

    const handlePermissionChange = (e) => {
        const { name, checked } = e.target;
        setPermissions(prev => ({ ...prev, [name]: checked }));
    };

    const handleSubmit = async () => {
        await onSubmit({
            mode: "edit",
            type: "position",
            payload: { id: position.id, nombre: position.nombre, default_permissions: permissions },
        });
    };

    if (!position) return null;

    return (
        <Modal
            open={open}
            title={`Permisos predeterminados — ${position.nombre}`}
            size="xl"
            aspect="default"
            onClose={onClose}
            footer={
                <>
                    <Button variant="outline" onClick={onClose} type="button">
                        Cancelar
                    </Button>
                    <Button type="button" onClick={handleSubmit}>
                        {"Guardar"}
                    </Button>
                </>

            }
        >
            <div className="flex flex-col gap-3">
                <div className="flex items-start gap-2 rounded-xl bg-blue-50 border border-blue-300 p-3 text-sm text-blue-500">
                    <ShieldCheck size={18} className="shrink-0 mt-0.5" />
                    <p>
                        Cualquier usuario con este puesto que no tenga un permiso especial asignado
                        heredará estos valores automáticamente, incluso si ya existe.
                    </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                    {PERMISSION_CATALOG.map(permission => (
                        <Checkbox
                            key={permission.key}
                            name={permission.key}
                            label={permission.label}
                            checked={permissions?.[permission.key] || false}
                            onChange={handlePermissionChange}
                        />
                    ))}
                </div>
            </div>
        </Modal>
    );
}
