import { useEffect, useMemo, useState } from "react";
import { capacitacionesApi } from "../../api/capacitaciones.api";

// Navegación y estado del módulo activo dentro del visor de curso (estilo Cisco).
export function useVisorCurso({ secciones, moduloInicialId, onProgresoActualizado }) {
    const [activoId, setActivoId] = useState(moduloInicialId);
    const [tab, setTab] = useState("contenido");
    // El examen se desbloquea solo tras revisar el contenido (scroll al final
    // del PDF o video terminado). Si el módulo ya fue aprobado antes, no se
    // vuelve a exigir para permitir repasar el examen libremente.
    const [contenidoListo, setContenidoListo] = useState(false);

    const activo = useMemo(() => {
        for (const s of secciones) {
            const found = s.modulos.find(m => m.modulo.id === activoId);
            if (found) return found;
        }
        return null;
    }, [secciones, activoId]);

    useEffect(() => {
        setContenidoListo(activo?.estado === "completado");
    }, [activoId, activo?.estado]);

    // Solo la sección que contiene el módulo activo se muestra en el esquema del curso
    const seccionActiva = useMemo(() => (
        secciones.find(s => s.modulos.some(m => m.modulo.id === activoId))
    ), [secciones, activoId]);

    useEffect(() => {
        if (activo && activo.estado === "pendiente") {
            capacitacionesApi.iniciarModulo(activo.modulo.id).catch(() => { });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activo?.modulo.id]);

    const seleccionar = item => {
        if (!item.desbloqueado) return;
        setActivoId(item.modulo.id);
        setTab("contenido");
    };

    const marcarContenidoListo = () => {
        setContenidoListo(true);
        if (!activo) return;

        capacitacionesApi.marcarContenidoVisto(activo.modulo.id)
            .then(() => {
                // Los módulos sin examen quedan completados al terminar el
                // contenido; refrescamos el progreso para que se refleje al
                // instante (badge verde, % de la sección, etc.).
                if (!activo.tiene_examen) onProgresoActualizado?.();
            })
            .catch(() => { });
    };

    return { activoId, tab, setTab, contenidoListo, setContenidoListo, activo, seccionActiva, seleccionar, marcarContenidoListo };
}
