import { useState } from "react";
import Swal from "sweetalert2";
import { contenidoApi } from "../../api/contenido.api";
import { useLockBodyScroll } from "../useLockBodyScroll";

// Estado y acciones de la vista de módulos de una sección: modal de módulo,
// examen, edición de la sección y el lienzo de presentaciones.
export function useVistaModulos(onRefrescar) {
    const [modalMod, setModalMod] = useState(null);
    const [examenMod, setExamenMod] = useState(null);
    const [editSec, setEditSec] = useState(false);
    const [presentacionMod, setPresentacionMod] = useState(null);
    const [previewMod, setPreviewMod] = useState(null);

    useLockBodyScroll(!!presentacionMod);

    const eliminarModulo = async m => {
        const ok = await Swal.fire({
            title: `¿Eliminar "${m.nombre}"?`, icon: "warning",
            text: "Se eliminarán sus preguntas y el progreso asociado.",
            showCancelButton: true, confirmButtonColor: "#d33", cancelButtonColor: "#6b7280",
            confirmButtonText: "Sí, eliminar", cancelButtonText: "Cancelar",
        });
        if (!ok.isConfirmed) return;
        try {
            await contenidoApi.eliminarModulo(m.id);
            onRefrescar();
            Swal.fire({ icon: "success", title: "Módulo eliminado.", confirmButtonColor: "#802907" });
        } catch (err) {
            Swal.fire({ icon: "error", title: err.response?.data?.message || "Error.", confirmButtonColor: "#802907" });
        }
    };

    const alGuardar = () => {
        setModalMod(null);
        onRefrescar();
        Swal.fire({ icon: "success", title: "Módulo guardado.", confirmButtonColor: "#802907" });
    };

    const alAbrirLienzo = moduloGuardado => {
        setModalMod(null);
        onRefrescar();
        setPresentacionMod(moduloGuardado);
    };

    const alGuardarSeccion = () => {
        setEditSec(false);
        onRefrescar();
        Swal.fire({ icon: "success", title: "Sección actualizada.", confirmButtonColor: "#802907" });
    };

    return {
        modalMod, setModalMod,
        examenMod, setExamenMod,
        editSec, setEditSec,
        presentacionMod, setPresentacionMod,
        previewMod, setPreviewMod,
        eliminarModulo, alGuardar, alAbrirLienzo, alGuardarSeccion,
    };
}
