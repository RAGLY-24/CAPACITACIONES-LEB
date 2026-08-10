import Button from "../../../../components/Buttons/Button";
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
                    <Button variant="outline" onClick={onClose} type="button">
                        Cancelar
                    </Button>
                    <Button variant="danger" onClick={handleSumbit}>
                        Eliminar
                    </Button>
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