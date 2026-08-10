import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import { contenidoApi } from "../../api/contenido.api";

// Constructor de examen: banco de preguntas de un módulo (crear, editar, eliminar).
export function usePanelExamen(modulo) {
    const [preguntas, setPreguntas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [nueva, setNueva] = useState(false);
    const [npTipo, setNpTipo] = useState("opcion_multiple");
    const [npTexto, setNpTexto] = useState("");
    const [npOps, setNpOps] = useState([{ texto: "", es_correcta: true }, { texto: "", es_correcta: false }]);
    const [editId, setEditId] = useState(null);
    const [editTipo, setEditTipo] = useState("opcion_multiple");
    const [editTexto, setEditTexto] = useState("");
    const [editOps, setEditOps] = useState([]);

    const cargar = useCallback(async () => {
        setCargando(true);
        try {
            setPreguntas(await contenidoApi.getPreguntas(modulo.id));
        } catch { /* silencioso */ }
        finally { setCargando(false); }
    }, [modulo.id]);

    useEffect(() => { cargar(); }, [cargar]);

    const setCorrectaNueva = i => setNpOps(o => o.map((x, idx) => ({ ...x, es_correcta: idx === i })));
    const setCorrectaEdit = i => setEditOps(o => o.map((x, idx) => ({ ...x, es_correcta: idx === i })));

    const validarOps = (ops, texto) => {
        if (!texto.trim()) { Swal.fire({ icon: "warning", title: "Escribe el texto de la pregunta.", confirmButtonColor: "#802907" }); return false; }
        if (ops.some(o => !o.texto.trim())) { Swal.fire({ icon: "warning", title: "Completa todas las opciones.", confirmButtonColor: "#802907" }); return false; }
        if (!ops.some(o => o.es_correcta)) { Swal.fire({ icon: "warning", title: "Marca una opción como correcta.", confirmButtonColor: "#802907" }); return false; }
        return true;
    };

    const validarTexto = texto => {
        if (!texto.trim()) { Swal.fire({ icon: "warning", title: "Escribe el texto de la pregunta.", confirmButtonColor: "#802907" }); return false; }
        return true;
    };

    const cancelarNueva = () => {
        setNueva(false);
        setNpTexto("");
        setNpOps([{ texto: "", es_correcta: true }, { texto: "", es_correcta: false }]);
        setNpTipo("opcion_multiple");
    };

    const guardarNueva = async () => {
        const esFeedback = npTipo === "feedback";
        if (esFeedback ? !validarTexto(npTexto) : !validarOps(npOps, npTexto)) return;
        try {
            const payload = esFeedback ? { texto: npTexto, tipo: "feedback" } : { texto: npTexto, opciones: npOps };
            await contenidoApi.crearPregunta(modulo.id, payload);
            cancelarNueva();
            cargar();
        } catch (err) {
            Swal.fire({ icon: "error", title: err.response?.data?.message || "Error.", confirmButtonColor: "#802907" });
        }
    };

    const iniciarEdicion = p => {
        setEditId(p.id);
        setEditTexto(p.texto);
        setEditTipo(p.tipo);
        if (p.tipo !== "feedback") setEditOps(p.opciones.map(o => ({ texto: o.texto, es_correcta: o.es_correcta })));
    };

    const guardarEdicion = async () => {
        const esFeedback = editTipo === "feedback";
        if (esFeedback ? !validarTexto(editTexto) : !validarOps(editOps, editTexto)) return;
        try {
            const payload = esFeedback ? { texto: editTexto } : { texto: editTexto, opciones: editOps };
            await contenidoApi.actualizarPregunta(editId, payload);
            setEditId(null);
            cargar();
        } catch (err) {
            Swal.fire({ icon: "error", title: err.response?.data?.message || "Error.", confirmButtonColor: "#802907" });
        }
    };

    const eliminar = async id => {
        const ok = await Swal.fire({ title: "¿Eliminar pregunta?", icon: "warning", showCancelButton: true, confirmButtonColor: "#d33", cancelButtonColor: "#6b7280", confirmButtonText: "Sí", cancelButtonText: "Cancelar" });
        if (!ok.isConfirmed) return;
        try { await contenidoApi.eliminarPregunta(id); cargar(); }
        catch { Swal.fire({ icon: "error", title: "Error al eliminar.", confirmButtonColor: "#802907" }); }
    };

    return {
        preguntas, cargando,
        nueva, setNueva, cancelarNueva,
        npTipo, setNpTipo, npTexto, setNpTexto, npOps, setNpOps, setCorrectaNueva, guardarNueva,
        editId, setEditId, editTipo, editTexto, setEditTexto, editOps, setEditOps, setCorrectaEdit,
        iniciarEdicion, guardarEdicion, eliminar,
    };
}
