import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import { capacitacionesApi } from "../../api/capacitaciones.api";

// Progreso de un operador visto por el admin: navega por tarjetas de
// secciones y módulos igual que la vista del empleado, y al entrar a un
// módulo ya contestado carga la retroalimentación pregunta por pregunta.
export function useVisorProgresoOperador({ usuarioId, moduloInicialId }) {
    const [secciones, setSecciones] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [seccionActivaId, setSeccionActivaId] = useState(null);
    const [moduloActivo, setModuloActivo] = useState(null);
    const [retro, setRetro] = useState(null);
    const [cargandoRetro, setCargandoRetro] = useState(false);

    const abrirRetro = useCallback((item) => {
        if (!item.progreso_id) return;
        setModuloActivo(item);
        setRetro(null);
        setCargandoRetro(true);
        capacitacionesApi.getRetroalimentacionProgreso(item.progreso_id)
            .then(data => setRetro(data))
            .catch(() => Swal.fire({ icon: "error", title: "Error al cargar las respuestas.", confirmButtonColor: "#802907" }))
            .finally(() => setCargandoRetro(false));
    }, []);

    useEffect(() => {
        let cancelado = false;
        capacitacionesApi.getProgresoUsuario(usuarioId)
            .then(data => {
                if (cancelado) return;
                setSecciones(data);
                if (moduloInicialId) {
                    const sec = data.find(s => s.modulos.some(m => m.modulo.id === moduloInicialId));
                    const item = sec?.modulos.find(m => m.modulo.id === moduloInicialId);
                    if (sec) setSeccionActivaId(sec.seccion.id);
                    if (item) abrirRetro(item);
                }
            })
            .catch(() => Swal.fire({ icon: "error", title: "Error al cargar el progreso.", confirmButtonColor: "#802907" }))
            .finally(() => { if (!cancelado) setCargando(false); });
        return () => { cancelado = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [usuarioId]);

    const seccionActiva = secciones.find(s => s.seccion.id === seccionActivaId);

    const volverASecciones = () => { setSeccionActivaId(null); setModuloActivo(null); setRetro(null); };
    const volverAModulos = () => { setModuloActivo(null); setRetro(null); };

    return {
        secciones, cargando, seccionActivaId, setSeccionActivaId, moduloActivo, retro, cargandoRetro,
        seccionActiva, abrirRetro, volverASecciones, volverAModulos,
    };
}
