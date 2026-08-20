import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import { capacitacionesApi } from "../../api/capacitaciones.api";

// Progreso propio del empleado: secciones/módulos y navegación entre ellos.
// seccionInicialId/moduloInicialId permiten llegar directo a una sección o
// abrir el visor de un módulo específico (p. ej. desde una notificación).
export function useVistaEmpleado({ seccionInicialId = null, moduloInicialId = null } = {}) {
    const [secciones, setSecciones] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [seccionActivaId, setSeccionActivaId] = useState(seccionInicialId);
    const [cursoModuloId, setCursoModuloId] = useState(moduloInicialId);

    // silencioso=true evita el parpadeo de "Cargando..." cuando se refresca el
    // progreso mientras el visor de curso sigue abierto (p. ej. tras un examen).
    const cargar = useCallback(async (silencioso = false) => {
        if (!silencioso) setCargando(true);
        try {
            const data = await capacitacionesApi.getProgresoMio();
            setSecciones(data);
        } catch {
            Swal.fire({ icon: "error", title: "Error al cargar tus capacitaciones.", confirmButtonColor: "#802907" });
        } finally { if (!silencioso) setCargando(false); }
    }, []);

    useEffect(() => { cargar(); }, [cargar]);

    const seccionActiva = secciones.find(s => s.seccion.id === seccionActivaId);
    const hayModulos = secciones.some(s => s.modulos?.length > 0);

    return {
        secciones, cargando, hayModulos,
        seccionActivaId, setSeccionActivaId, seccionActiva,
        cursoModuloId, setCursoModuloId,
        cargar,
    };
}
