import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import { contenidoApi } from "../../api/contenido.api";

// Lista de secciones, sección activa y CRUD de secciones para la vista de
// gestión de contenido.
export function useSecciones() {
    const [secciones, setSecciones] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [seccionActiva, setActiva] = useState(null);
    const [modalSec, setModalSec] = useState(null);

    // Carga la lista de secciones sin tocar seccionActiva
    const cargar = useCallback(async () => {
        setCargando(true);
        try {
            setSecciones(await contenidoApi.getSecciones());
        } catch {
            Swal.fire({ icon: "error", title: "Error al cargar secciones.", confirmButtonColor: "#802907" });
        } finally { setCargando(false); }
    }, []);

    // Recarga solo la sección activa (para cuando se crean/editan sus módulos)
    const refrescar = useCallback(async () => {
        if (!seccionActiva) return;
        try {
            setActiva(await contenidoApi.getSeccion(seccionActiva.id));
        } catch {
            Swal.fire({ icon: "error", title: "Error al cargar.", confirmButtonColor: "#802907" });
        }
    }, [seccionActiva]);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => { cargar(); }, [cargar]);

    const confirmarEliminar = async seccion => {
        const ok = await Swal.fire({
            title: `¿Eliminar "${seccion.nombre}"?`,
            text: "Solo puedes eliminarla si no tiene módulos.",
            icon: "warning", showCancelButton: true,
            confirmButtonColor: "#d33", cancelButtonColor: "#6b7280",
            confirmButtonText: "Eliminar", cancelButtonText: "Cancelar",
        });
        if (!ok.isConfirmed) return;
        try {
            await contenidoApi.eliminarSeccion(seccion.id);
            if (seccionActiva?.id === seccion.id) setActiva(null);
            cargar();
            Swal.fire({ icon: "success", title: "Sección eliminada.", confirmButtonColor: "#802907" });
        } catch (err) {
            Swal.fire({ icon: "error", title: err.response?.data?.message || "No se pudo eliminar.", confirmButtonColor: "#802907" });
        }
    };

    const alGuardarSeccion = () => {
        const esCrear = modalSec?.tipo === "crear";
        setModalSec(null);
        cargar();
        Swal.fire({ icon: "success", title: esCrear ? "Sección creada." : "Sección actualizada.", confirmButtonColor: "#802907" });
    };

    return {
        secciones, cargando, seccionActiva, setActiva, modalSec, setModalSec,
        cargar, refrescar, confirmarEliminar, alGuardarSeccion,
    };
}
