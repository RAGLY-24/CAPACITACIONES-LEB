import Button from "../../../components/Buttons/Button";
import { Modal } from "../../../components/Modal";

export default function PartnerViewModal({
    open, // Recibe el objeto state del hook de overlay en lugar de open/onClose sueltos
    partner,
    onClose
}) {

    if (!partner) return

    return (
        <Modal
            open={open}
            title={"Ver socio"}
            size="xl"
            aspect="default"
            onClose={onClose}
            footer={
                <>
                    <Button variant="outline" onClick={onClose} type="button">
                        Cerrar
                    </Button>
                </>
            }
        >
            <div id="partners-form" className="space-y-6">
                {/* Información del socio */}
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <h3 className="text-2xl font-bold text-gray-800">
                        {partner.nombre}
                    </h3>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                Teléfono
                            </p>
                            <p className="text-sm text-gray-800">
                                {partner.telefono || "Sin teléfono"}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                Correo
                            </p>
                            <p className="text-sm text-gray-800 break-all">
                                {partner.correo || "Sin correo"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Operadores */}
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-base font-semibold text-gray-800">
                                Operadores asignados
                            </h4>
                            <p className="text-sm text-gray-500">
                                {partner.usuarios_count ?? partner.usuarios?.length ?? 0} registrado(s)
                            </p>
                        </div>

                        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                            {partner.usuarios_count ?? partner.usuarios?.length ?? 0}
                        </span>
                    </div>

                    <div className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
                        {(partner.usuarios || []).length === 0 ? (
                            <div className="rounded-lg border border-dashed border-gray-300 bg-white py-8 text-center">
                                <p className="text-sm text-gray-500">
                                    No hay operadores asignados.
                                </p>
                            </div>
                        ) : (
                            partner.usuarios.map((usuario) => (
                                <div
                                    key={usuario.id}
                                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 transition hover:border-red-300 hover:shadow-sm"
                                >
                                    <div>
                                        <p className="font-medium text-gray-800">
                                            {usuario.name} {usuario.lastname}
                                        </p>

                                        <p className="text-sm text-gray-500">
                                            {usuario.puesto?.nombre || "Sin puesto"}
                                        </p>
                                    </div>

                                    <div className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                                        Operador
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
}