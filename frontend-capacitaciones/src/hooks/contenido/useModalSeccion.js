import { useState } from "react";
import Swal from "sweetalert2";
import { contenidoApi } from "../../api/contenido.api";

// Formulario de creación/edición de una sección.
export function useModalSeccion({ tipo, datos, onGuardar }) {
    const [form, setForm] = useState({
        nombre: datos?.nombre || "",
        descripcion: datos?.descripcion || "",
        estado: datos?.estado || "Activo",
        seccion_requerida_id: datos?.seccion_requerida_id || "",
    });
    const [errs, setErrs] = useState({});
    const [saving, setSaving] = useState(false);

    const handle = e => {
        const { name, value } = e.target;
        setForm(p => ({ ...p, [name]: value }));
        if (errs[name]) setErrs(p => ({ ...p, [name]: null }));
    };

    const submit = async e => {
        e.preventDefault();
        const v = {};
        if (!form.nombre || form.nombre.trim().length < 3) v.nombre = "Mínimo 3 caracteres.";
        if (form.nombre.length > 150) v.nombre = "Máximo 150 caracteres.";
        if (Object.keys(v).length) { setErrs(v); return; }
        setSaving(true);
        try {
            if (tipo === "crear") await contenidoApi.crearSeccion(form);
            else await contenidoApi.actualizarSeccion(datos.id, form);
            onGuardar();
        } catch (err) {
            const backErrs = err.response?.data?.errors || {};
            if (backErrs.nombre) setErrs(p => ({ ...p, nombre: backErrs.nombre[0] }));
            else Swal.fire({ icon: "error", title: err.response?.data?.message || "Error al guardar.", confirmButtonColor: "#802907" });
        } finally { setSaving(false); }
    };

    return { form, errs, saving, handle, submit };
}
