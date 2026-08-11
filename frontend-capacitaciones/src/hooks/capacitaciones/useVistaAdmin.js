import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import { capacitacionesApi } from "../../api/capacitaciones.api";

// Datos y filtros del reporte de administrador: progreso de todos los
// operadores, agrupado por usuario y filtrable por sección/estado/búsqueda.
export function useVistaAdmin() {
    const [datos, setDatos] = useState({ progresos: [], resumen_modulos: [] });
    const [pieData, setPieData] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [buscarUser, setBuscarUser] = useState("");
    const [filtroSec, setFiltroSec] = useState("");
    const [filtroEstado, setFiltroEstado] = useState("");
    const [operadorSeleccionado, setOperadorSeleccionado] = useState(null);

    const cargar = useCallback(async () => {
        setCargando(true);
        try {
            const [rAdmin, rPie] = await Promise.all([
                capacitacionesApi.getProgresoAdmin(),
                capacitacionesApi.getProgresoPorSeccion(),
            ]);
            setDatos(rAdmin);
            console.log(rAdmin)
            setPieData(rPie);
        } catch {
            Swal.fire({ icon: "error", title: "Error al cargar el reporte.", confirmButtonColor: "#802907" });
        } finally { setCargando(false); }
    }, []);

    useEffect(() => { cargar(); }, [cargar]);

    // 1. Filtrar SOLO operadores (Por rol si existe, o buscando la palabra 'operador' en el nombre/usuario)
    const soloOperadores = datos.progresos.filter(p =>
        (p.rol && p.rol.toLowerCase().includes("operador")) ||
        p.usuario?.toLowerCase().includes("operador") ||
        p.usuario_login?.toLowerCase().includes("operador")
    );

    // 2. Aplicar filtros de la barra superior a los cursos
    const cursosFiltrados = datos.progresos.filter(p => {
        const okSec = filtroSec ? String(p.seccion_id) === filtroSec : true;
        const okEst = filtroEstado ? p.estado === filtroEstado : true;
        return okSec && okEst;
    });
    /*
     const cursosFiltrados = soloOperadores.filter(p => {
         const okSec = filtroSec ? String(p.seccion_id) === filtroSec : true;
         const okEst = filtroEstado ? p.estado === filtroEstado : true;
         return okSec && okEst;
     });
    */

    // 3. Agrupar los cursos filtrados por Usuario para mostrar en el DataTable
    const usuariosAgrupados = Object.values(cursosFiltrados.reduce((acc, p) => {
        const key = p.usuario_login;
        if (!acc[key]) {
            acc[key] = { usuario: p.usuario, usuario_login: p.usuario_login, user_id: p.user_id, socio: p.socio, cursos: [] };
        }
        acc[key].cursos.push(p);
        return acc;
    }, {}));

    // 4. Aplicar el buscador de texto libre sobre los usuarios ya agrupados
    const dataTableData = usuariosAgrupados.filter(u =>
        buscarUser === "" ||
        u.usuario.toLowerCase().includes(buscarUser.toLowerCase()) ||
        u.usuario_login.toLowerCase().includes(buscarUser.toLowerCase())
    );

    // Opciones del select de secciones
    const seccionesUnicas = [...new Map(
        datos.progresos.filter(p => p.seccion_id).map(p => [p.seccion_id, { id: p.seccion_id, nombre: p.seccion }])
    ).values()];

    return {
        pieData, cargando, cargar,
        buscarUser, setBuscarUser,
        filtroSec, setFiltroSec,
        filtroEstado, setFiltroEstado,
        operadorSeleccionado, setOperadorSeleccionado,
        dataTableData, seccionesUnicas,
    };
}
