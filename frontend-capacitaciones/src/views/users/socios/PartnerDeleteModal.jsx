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
                <h3 className="text-black font-medium text-xl">{`Eliminar a ${partner.nombre}`}</h3>
                <p>Esta acción borrará permanentemente el socio y no se puede deshacer.</p>
            </div>
        </Modal>
    );
}