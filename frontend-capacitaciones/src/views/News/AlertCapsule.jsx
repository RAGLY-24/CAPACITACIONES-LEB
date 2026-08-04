import { useState } from "react";
import Swal from "sweetalert2";
import { useAlert } from "../../hooks/extra/useAlert";
import { ChevronDown, Pencil } from "lucide-react";

export function AlertCapsule({ canEdit, show }) {

    const UseAlert = useAlert()

    const { data: alert, isLoading: isAlertLoading } = UseAlert.Get()
    const { mutateAsync: updateAlert } = UseAlert.Update

    const [avisoColapsado, setAvisoColapsado] = useState(
        () => typeof window !== 'undefined' && sessionStorage.getItem('aviso_colapsado') === '1'
    );

    const toggleAviso = () => {
        setAvisoColapsado(prev => {
            const nuevo = !prev;
            sessionStorage.setItem('aviso_colapsado', nuevo ? '1' : '0');
            return nuevo;
        });
    };
    const editarAviso = async () => {
        const { value: mensaje, isConfirmed } = await Swal.fire({
            title: 'Editar aviso de emergencia',
            input: 'textarea',
            inputValue: alert?.mensaje || '',
            inputPlaceholder: 'Ej. En caso de emergencia llamar a: 5555-5555',
            showCancelButton: true,
            confirmButtonText: 'Guardar',
            confirmButtonColor: '#802907',
            cancelButtonText: 'Cancelar',
            inputValidator: (v) => !v ? 'Escribe un mensaje.' : undefined,
        });

        if (!isConfirmed) return;

        try {
            //setAviso(response.data);
            await updateAlert({
                mensaje
            })

            setAvisoColapsado(false);
            sessionStorage.setItem('aviso_colapsado', '0');
            Swal.fire({ icon: 'success', title: 'Aviso actualizado', confirmButtonColor: '#802907' });
        } catch {
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo guardar el aviso.', confirmButtonColor: '#802907' });
        }
    };

    if (isAlertLoading || !show ) return null

    return (
        <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4 pointer-events-none">
            <div className={`transition-all duration-700 pointer-events-auto flex items-center w-full gap-3 border border-zinc-100 bg-white backdrop-blur-sm px-4 py-2 text-black shadow-2xl ${avisoColapsado ? "max-w-68 rounded-2xl" : "max-w-3xl rounded-xl"}`}>
                <p className="flex-1 text-md leading-snug whitespace-pre-wrap transition-all duration-700 text-red-500 font-medium">
                    {avisoColapsado ? "Aviso de emergencia" : alert?.mensaje || (canEdit ? "Aún no has configurado el aviso de emergencia." : "")}
                </p>

                <div className="flex items-center gap-1 shrink-0">
                    {canEdit && !avisoColapsado && (
                        <button type="button" onClick={editarAviso} className="rounded-full p-1.5 hover:bg-white/10" title="Editar aviso" aria-label="Editar aviso">
                            <Pencil size={15} />
                        </button>
                    )}

                    <button type="button" onClick={toggleAviso} className="rounded-full p-1.5 hover:bg-white/10" title={avisoColapsado ? "Expandir aviso" : "Minimizar aviso"} aria-label={avisoColapsado ? "Expandir aviso" : "Minimizar aviso"}>
                        <ChevronDown size={24} className={`transition-transform duration-700 ${avisoColapsado ? "rotate-180" : ""}`} />
                    </button>
                </div>
            </div>
        </div>
    )
}