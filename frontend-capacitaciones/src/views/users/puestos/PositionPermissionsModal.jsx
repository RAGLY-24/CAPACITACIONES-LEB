import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Modal } from "../../../components/Modal";
import { PERMISSION_CATALOG, emptyPermissions } from "../../../utils/permissions";

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
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 cursor-pointer"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        className="rounded-lg bg-red-900 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-red-800 cursor-pointer"
                    >
                        Guardar
                    </button>
                </>
            }
        >
            <div className="flex flex-col gap-3">
                <div className="flex items-start gap-2 rounded-md bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
                    <ShieldCheck size={18} className="shrink-0 mt-0.5" />
                    <p>
                        Cualquier usuario con este puesto que no tenga un permiso especial asignado
                        heredará estos valores automáticamente, incluso si ya existe.
                    </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                    {PERMISSION_CATALOG.map(permission => (
                        <label key={permission.key} className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                            <input
                                type="checkbox"
                                name={permission.key}
                                checked={permissions?.[permission.key] || false}
                                onChange={handlePermissionChange}
                                className="h-4 w-4 rounded border-gray-300 text-[#802907] focus:ring-[#802907]"
                            />
                            {permission.label}
                        </label>
                    ))}
                </div>
            </div>
        </Modal>
    );
}
