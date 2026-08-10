import { useRef, useState } from "react";
import Swal from "sweetalert2";
import { contenidoApi } from "../../api/contenido.api";

// Subida rápida de la imagen de portada desde la tarjeta de módulo.
export function useTarjetaModulo(modulo, onImagenCambiada) {
    const inputRef = useRef(null);
    const [subiendo, setSubiendo] = useState(false);

    const subirImagen = async e => {
        const file = e.target.files?.[0];
        if (!file) return;
        // Resetear el input para que pueda re-seleccionarse el mismo archivo
        e.target.value = "";
        setSubiendo(true);
        const fd = new FormData();
        fd.append("nombre", modulo.nombre);
        fd.append("descripcion", modulo.descripcion);
        fd.append("estado", modulo.estado);
        fd.append("imagen", file);
        try {
            await contenidoApi.actualizarModulo(modulo.id, fd);
            onImagenCambiada();
        } catch (err) {
            const errores = err.response?.data?.errors || {};
            const msg = errores.imagen?.[0]
                || err.response?.data?.message
                || `Error ${err.response?.status || ""} al subir la imagen.`;
            Swal.fire({ icon: "error", title: msg, confirmButtonColor: "#802907" });
        } finally { setSubiendo(false); }
    };

    return { inputRef, subiendo, subirImagen };
}
