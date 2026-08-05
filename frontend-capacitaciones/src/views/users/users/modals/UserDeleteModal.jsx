import { Modal } from "../../../../components/Modal";
import { AlertTriangle } from "lucide-react";

export default function UserDeleteModal({
    open, // Recibe el objeto state del hook de overlay en lugar de open/onClose sueltos
    user,
    onSubmit,
    onClose
}) {
    const handleSumbit = async () => {
        await onSubmit({ mode: "delete", payload: user, type: "user" });
    }

    if (!user) return
    return (
        <Modal
            open={open}
            title="Eliminar usuario"
            size="sm"
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
                        onClick={handleSumbit}
                        className="rounded-lg bg-red-500 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-red-800 cursor-pointer"
                    >
                        Eliminar
                    </button>
                </>
            }
        >
            <div className="flex flex-col gap-2 items-center">
                <AlertTriangle size={50} strokeWidth={2} className="text-red-500" />
                <h3 className="text-black font-medium text-xl">{`Eliminar ${user.name}`}</h3>
                <p>Esta acción borrará permanentemente la cuenta y no se puede deshacer.</p>
            </div>
        </Modal>
    );
}