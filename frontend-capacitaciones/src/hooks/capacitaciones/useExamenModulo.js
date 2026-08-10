import { useCallback, useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import { capacitacionesApi } from "../../api/capacitaciones.api";

// Lógica del examen de un módulo: carga (en blanco o retroalimentación ya
// guardada), respuestas del usuario y envío/calificación.
export function useExamenModulo({ moduloId, estadoInicial, onCalificado }) {
    const [preguntas, setPreguntas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [respuestas, setRespuestas] = useState({});
    const [enviando, setEnviando] = useState(false);
    const [resultado, setResultado] = useState(null);
    const [sinExamen, setSinExamen] = useState(false);
    const [sinExamenMensaje, setSinExamenMensaje] = useState("");
    const [bloqueado, setBloqueado] = useState(false);
    const [intentosRestantes, setIntentosRestantes] = useState(undefined);

    // Examen en blanco para responder (o reintentar). No consulta la
    // retroalimentación guardada: se usa explícitamente para un intento nuevo.
    const cargarExamenBlanco = useCallback(async () => {
        setCargando(true); setSinExamen(false); setSinExamenMensaje(""); setBloqueado(false); setResultado(null); setRespuestas({});
        try {
            const data = await capacitacionesApi.getExamen(moduloId);
            setPreguntas(data.preguntas || []);
        } catch (err) {
            // 404: el módulo aún no tiene preguntas. 422: tiene preguntas pero el
            // banco no llega al mínimo de 15 para poder sortear el examen.
            if (err.response?.status === 404 || err.response?.status === 422) {
                setSinExamen(true);
                setSinExamenMensaje(err.response.data?.message || "Este módulo aún no tiene examen configurado.");
            }
            else if (err.response?.status === 403) setBloqueado(true);
            else Swal.fire({ icon: "error", title: "Error al cargar el examen.", confirmButtonColor: "#802907" });
        } finally { setCargando(false); }
    }, [moduloId]);

    // Se captura el estado con el que se abrió el módulo una sola vez: tras
    // calificar un examen nuevo, el padre refresca el progreso y estadoInicial
    // cambia, pero eso no debe disparar de nuevo esta carga inicial.
    const estadoAlAbrir = useRef(estadoInicial);

    // Al abrir un módulo ya contestado, se muestra directamente lo que el
    // usuario respondió la última vez, en vez de un examen en blanco.
    useEffect(() => {
        let cancelado = false;
        (async () => {
            if (estadoAlAbrir.current === "completado" || estadoAlAbrir.current === "reprobado") {
                setCargando(true);
                try {
                    const data = await capacitacionesApi.getRetroalimentacionModulo(moduloId);
                    if (!cancelado) { setResultado(data); setIntentosRestantes(data.intentos_restantes); }
                    if (!cancelado) setCargando(false);
                    return;
                } catch (err) {
                    if (cancelado) return;
                    if (err.response?.status !== 404) {
                        Swal.fire({ icon: "error", title: "Error al cargar la retroalimentación.", confirmButtonColor: "#802907" });
                        setCargando(false);
                        return;
                    }
                    // Sin respuestas guardadas todavía (no debería pasar si el estado
                    // ya indica que se contestó): cae al examen en blanco.
                }
            }
            if (!cancelado) await cargarExamenBlanco();
        })();
        return () => { cancelado = true; };
    }, [moduloId, cargarExamenBlanco]);

    const enviar = async () => {
        // Las preguntas de feedback son texto libre y opcionales (el backend las
        // valida como "nullable"); solo las de opción múltiple son obligatorias.
        const faltantes = preguntas.filter(p => p.tipo !== "feedback" && !respuestas[p.id]);
        if (faltantes.length) {
            Swal.fire({ icon: "warning", title: `Faltan ${faltantes.length} pregunta(s) por responder.`, confirmButtonColor: "#802907" });
            return;
        }
        setEnviando(true);
        try {
            const data = await capacitacionesApi.enviarExamen(moduloId, respuestas);
            setResultado(data);
            setIntentosRestantes(data.intentos_restantes);
            onCalificado?.();
        } catch (err) {
            if (err.response?.status === 403) {
                setBloqueado(true);
                Swal.fire({ icon: "warning", title: err.response.data?.message || "Agotaste tus intentos.", confirmButtonColor: "#802907" });
            } else {
                Swal.fire({ icon: "error", title: err.response?.data?.message || "Error al enviar.", confirmButtonColor: "#802907" });
            }
        } finally { setEnviando(false); }
    };

    return {
        preguntas,
        cargando,
        respuestas,
        setRespuestas,
        enviando,
        resultado,
        sinExamen,
        sinExamenMensaje,
        bloqueado,
        intentosRestantes,
        cargarExamenBlanco,
        enviar,
    };
}
