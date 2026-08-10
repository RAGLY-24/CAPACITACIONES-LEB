import { useState } from "react";
import Swal from "sweetalert2";
import { contenidoApi } from "../../api/contenido.api";

// Formulario de creación/edición de un módulo. El contenido se resuelve con
// una de dos alternativas: subir un archivo (PDF/MP4) o diseñar una
// presentación en el lienzo de tldraw (ver `irAlLienzo`).
export function useModalModulo({ tipo, seccionId, datos, onGuardar, onAbrirLienzo }) {
    const [form, setForm] = useState({
        nombre: datos?.nombre || "",
        descripcion: datos?.descripcion || "",
        estado: datos?.estado || "Activo",
        prerequisite_module_id: datos?.prerequisite_module_id || "",
        archivo: null,
        imagen: null,
    });
    const [preview, setPreview] = useState(datos?.imagen_url || null);
    const [errs, setErrs] = useState({});
    const [saving, setSaving] = useState(false);
    const tienePresentacion = datos?.file_type === "presentacion";

    const handle = e => {
        const { name, value, files } = e.target;
        if (files && files[0]) {
            const file = files[0];
            setForm(p => ({ ...p, [name]: file }));
            if (name === "imagen") setPreview(window.URL.createObjectURL(file));
        } else {
            setForm(p => ({ ...p, [name]: value }));
        }
        if (errs[name]) setErrs(p => ({ ...p, [name]: null }));
    };

    const quitarImagen = () => {
        setPreview(null);
        setForm(p => ({ ...p, imagen: null }));
    };

    const validar = () => {
        const v = {};
        if (!form.nombre || form.nombre.trim().length < 5) v.nombre = "Mínimo 5 caracteres.";
        if (form.nombre.length > 150) v.nombre = "Máximo 150 caracteres.";
        if (!form.descripcion || form.descripcion.trim().length < 10) v.descripcion = "Mínimo 10 caracteres.";
        if (Object.keys(v).length) { setErrs(v); return false; }
        return true;
    };

    const guardarModulo = async () => {
        const fd = new FormData();
        fd.append("seccion_id", seccionId);
        fd.append("nombre", form.nombre);
        fd.append("descripcion", form.descripcion);
        fd.append("estado", form.estado);
        if (form.prerequisite_module_id) fd.append("prerequisite_module_id", form.prerequisite_module_id);
        if (form.archivo) fd.append("archivo", form.archivo);
        if (form.imagen) fd.append("imagen", form.imagen);

        const data = tipo === "crear"
            ? await contenidoApi.crearModulo(fd)
            : await contenidoApi.actualizarModulo(datos.id, fd);
        return data.modulo;
    };

    const manejarError = err => {
        const back = err.response?.data?.errors || {};
        const mapped = {};
        Object.keys(back).forEach(k => (mapped[k] = back[k][0]));
        if (Object.keys(mapped).length) setErrs(mapped);
        else Swal.fire({ icon: "error", title: err.response?.data?.message || "Error al guardar.", confirmButtonColor: "#802907" });
    };

    const submit = async e => {
        e.preventDefault();
        if (!validar()) return;
        setSaving(true);
        try {
            onGuardar(await guardarModulo());
        } catch (err) {
            manejarError(err);
        } finally { setSaving(false); }
    };

    // Al editar un módulo existente el lienzo se abre directo; al crear uno
    // nuevo, primero se guardan sus datos básicos y luego se abre el lienzo.
    const irAlLienzo = async () => {
        if (tipo === "editar") {
            onAbrirLienzo(datos);
            return;
        }
        if (!validar()) return;
        setSaving(true);
        try {
            onAbrirLienzo(await guardarModulo());
        } catch (err) {
            manejarError(err);
        } finally { setSaving(false); }
    };

    return { form, preview, errs, saving, tienePresentacion, handle, quitarImagen, submit, irAlLienzo };
}
