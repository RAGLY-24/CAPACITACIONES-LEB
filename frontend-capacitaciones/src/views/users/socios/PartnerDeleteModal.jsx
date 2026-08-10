import Button from "../../../components/Buttons/Button";
import { Modal } from "../../../components/Modal";
import { AlertTriangle } from "lucide-react";

export default function PartnerDeleteModal({
    open, // Recibe el objeto state del hook de overlay en lugar de open/onClose sueltos
    partner,
    onSubmit,
    onClose
}) {
    const handleSumbit = async () => {
        await onSubmit({ mode: "delete", payload: partner, type: "partner" });
    }

    if (!partner) return
    console.log(partner.nombre)
    return (
        <Modal
            open={open}
            title="Eliminar socio"
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
                <h3 className="text-black font-medium text-xl">{`Eliminar a ${partner.nombre}`}</h3>
                <p>Esta acción borrará permanentemente el socio y no se puede deshacer.</p>
            </div>
        </Modal>
    );
}